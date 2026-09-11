import { supabase } from '@/lib/supabase';
import { apiGet, apiSend, uploadImage } from '@/lib/api';
import type { Testimonial, TestimonialInput } from '@/types/testimonial';

const LOCAL_STORAGE_KEY = 'cgs_testimonials_v1';

function getLocalTestimonials(): Testimonial[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTestimonials(items: Testimonial[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save testimonials to localStorage', err);
  }
}

export async function fetchPublishedTestimonials(): Promise<Testimonial[]> {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch testimonials error, checking local store:', error.message);
      return getLocalTestimonials().filter((t) => t.published);
    }

    const records = (data || []) as Testimonial[];
    // Merge any locally submitted items that haven't synced
    const localItems = getLocalTestimonials();
    const existingIds = new Set(records.map((r) => r.id));
    const merged = [...records];
    for (const item of localItems) {
      if (!existingIds.has(item.id) && item.published) {
        merged.unshift(item);
      }
    }
    saveLocalTestimonials(merged);
    return merged;
  } catch (err) {
    console.error('Error fetching published testimonials:', err);
    return getLocalTestimonials().filter((t) => t.published);
  }
}

export async function submitCustomerTestimonial(input: TestimonialInput): Promise<Testimonial> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `test-${Date.now()}`;
  const now = new Date().toISOString();

  const record: Testimonial = {
    id: newId,
    name: input.name.trim(),
    rating: Math.max(1, Math.min(5, Math.round(Number(input.rating) || 5))),
    comment: input.comment.trim(),
    customer_photo: input.customer_photo?.trim() || '',
    customer_photo_alt: input.customer_photo_alt?.trim() || `${input.name.trim()}'s garden review photo`,
    published: true,
    sort_order: input.sort_order || 0,
    created_at: now,
    updated_at: now,
  };

  // 1. Immediately save to persistent local storage so it appears instantly and survives reloads
  const currentLocal = getLocalTestimonials();
  const updatedLocal = [record, ...currentLocal.filter((t) => t.id !== record.id)];
  saveLocalTestimonials(updatedLocal);

  // 2. Insert into Supabase table
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        name: record.name,
        rating: record.rating,
        comment: record.comment,
        customer_photo: record.customer_photo,
        customer_photo_alt: record.customer_photo_alt,
        published: true,
        sort_order: record.sort_order,
      })
      .select('*')
      .single();

    if (error) {
      console.warn('Supabase insert failed (will rely on local persistence):', error.message);
      return record;
    }

    if (data) {
      // Replace temporary id if returned from DB
      const dbRecord = data as Testimonial;
      const synced = updatedLocal.map((t) => (t.id === record.id ? dbRecord : t));
      saveLocalTestimonials(synced);
      return dbRecord;
    }
  } catch (err) {
    console.warn('Supabase network error during testimonial submit:', err);
  }

  return record;
}

export async function fetchAllTestimonials(
  page: number = 0,
  pageSize: number = 20,
  filters?: { search?: string; rating?: number; published?: boolean }
): Promise<{ testimonials: Testimonial[]; total: number }> {
  const params = new URLSearchParams({
    resource: 'testimonials',
    page: String(page),
    pageSize: String(pageSize),
  });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.rating) params.set('rating', String(filters.rating));
  if (filters?.published !== undefined) params.set('published', String(filters.published));

  try {
    const data = await apiGet<{ testimonials: Testimonial[]; total: number }>(`/api/admin/projects?${params}`);
    return data;
  } catch {
    // Local fallback for offline/development
    let all = getLocalTestimonials();
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      all = all.filter((t) => t.name.toLowerCase().includes(q) || t.comment.toLowerCase().includes(q));
    }
    if (filters?.rating) {
      all = all.filter((t) => t.rating === filters.rating);
    }
    if (filters?.published !== undefined) {
      all = all.filter((t) => t.published === filters.published);
    }
    const from = page * pageSize;
    return {
      testimonials: all.slice(from, from + pageSize),
      total: all.length,
    };
  }
}

export async function createTestimonial(input: TestimonialInput): Promise<Testimonial | null> {
  try {
    const data = await apiSend<{ testimonial: Testimonial }>('/api/admin/projects?resource=testimonials', 'POST', { input });
    if (data.testimonial) {
      const local = getLocalTestimonials();
      saveLocalTestimonials([data.testimonial, ...local.filter((t) => t.id !== data.testimonial.id)]);
      return data.testimonial;
    }
    return null;
  } catch (err) {
    console.warn('Admin API createTestimonial failed, saving locally:', err);
    return submitCustomerTestimonial(input);
  }
}

export async function updateTestimonial(id: string, input: Partial<TestimonialInput>): Promise<Testimonial | null> {
  // Update local storage
  const local = getLocalTestimonials();
  const existing = local.find((t) => t.id === id);
  if (existing) {
    const updated: Testimonial = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    };
    saveLocalTestimonials(local.map((t) => (t.id === id ? updated : t)));
  }

  try {
    const data = await apiSend<{ testimonial: Testimonial }>('/api/admin/projects?resource=testimonials', 'PATCH', { id, input });
    if (data.testimonial) {
      saveLocalTestimonials(local.map((t) => (t.id === id ? data.testimonial : t)));
      return data.testimonial;
    }
  } catch (err) {
    console.warn('Admin API updateTestimonial failed:', err);
  }

  return existing ? ({ ...existing, ...input } as Testimonial) : null;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  // Delete from local storage
  const local = getLocalTestimonials();
  saveLocalTestimonials(local.filter((t) => t.id !== id));

  try {
    await apiSend(`/api/admin/projects?resource=testimonials&id=${encodeURIComponent(id)}`, 'DELETE');
    return true;
  } catch (err) {
    console.warn('Admin API deleteTestimonial failed:', err);
    return true;
  }
}

export async function uploadTestimonialPhoto(file: File): Promise<string> {
  return uploadImage(file, 'testimonials');
}
