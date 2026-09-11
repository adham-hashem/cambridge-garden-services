import { supabase } from '@/lib/supabase';
import { apiGet, apiSend, uploadImage } from '@/lib/api';
import { fetchPublishedServices } from '@/lib/services';
import type { GardenInspiration, GardenInspirationInput } from '@/types/inspiration';

const LOCAL_STORAGE_KEY = 'cgs_inspirations_v1';

function getLocalInspirations(): GardenInspiration[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInspirations(items: GardenInspiration[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save inspirations to localStorage', err);
  }
}

export async function fetchPublishedInspirations(serviceId?: string): Promise<GardenInspiration[]> {
  const services = await fetchPublishedServices();
  const serviceTitleMap = new Map(services.map((s) => [s.id, s.title]));

  let records: GardenInspiration[] = [];

  try {
    let query = supabase
      .from('garden_inspirations')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (serviceId && serviceId !== 'all') {
      query = query.eq('service_id', serviceId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase fetch inspirations error, using local fallback:', error.message);
      records = getLocalInspirations().filter((item) => item.published);
      if (serviceId && serviceId !== 'all') {
        records = records.filter((item) => item.service_id === serviceId);
      }
    } else {
      records = (data || []) as GardenInspiration[];
      // Merge any local items that haven't synced
      const local = getLocalInspirations();
      const existingIds = new Set(records.map((r) => r.id));
      for (const item of local) {
        if (!existingIds.has(item.id) && item.published) {
          if (!serviceId || serviceId === 'all' || item.service_id === serviceId) {
            records.unshift(item);
          }
        }
      }
      saveLocalInspirations(records);
    }
  } catch (err) {
    console.error('Error fetching inspirations:', err);
    records = getLocalInspirations().filter((item) => item.published);
    if (serviceId && serviceId !== 'all') {
      records = records.filter((item) => item.service_id === serviceId);
    }
  }

  // Enrich with service titles
  return records.map((item) => ({
    ...item,
    service_title: serviceTitleMap.get(item.service_id) || item.service_id,
  }));
}

export async function fetchAllInspirations(
  page: number = 0,
  pageSize: number = 20,
  filters?: { search?: string; serviceId?: string; published?: boolean }
): Promise<{ inspirations: GardenInspiration[]; total: number }> {
  const services = await fetchPublishedServices();
  const serviceTitleMap = new Map(services.map((s) => [s.id, s.title]));

  const params = new URLSearchParams({
    resource: 'inspiration',
    page: String(page),
    pageSize: String(pageSize),
  });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.serviceId && filters.serviceId !== 'all') params.set('serviceId', filters.serviceId);
  if (filters?.published !== undefined) params.set('published', String(filters.published));

  try {
    const data = await apiGet<{ inspirations: GardenInspiration[]; total: number }>(`/api/admin/projects?${params}`);
    return {
      inspirations: (data.inspirations || []).map((item) => ({
        ...item,
        service_title: serviceTitleMap.get(item.service_id) || item.service_id,
      })),
      total: data.total || 0,
    };
  } catch {
    // Local fallback
    let all = getLocalInspirations();
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      all = all.filter((item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
    }
    if (filters?.serviceId && filters.serviceId !== 'all') {
      all = all.filter((item) => item.service_id === filters.serviceId);
    }
    if (filters?.published !== undefined) {
      all = all.filter((item) => item.published === filters.published);
    }

    const from = page * pageSize;
    return {
      inspirations: all.slice(from, from + pageSize).map((item) => ({
        ...item,
        service_title: serviceTitleMap.get(item.service_id) || item.service_id,
      })),
      total: all.length,
    };
  }
}

export async function createInspiration(input: GardenInspirationInput): Promise<GardenInspiration | null> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `insp-${Date.now()}`;
  const now = new Date().toISOString();

  const record: GardenInspiration = {
    id: newId,
    title: input.title.trim(),
    description: input.description.trim(),
    image: input.image.trim(),
    alt: input.alt?.trim() || input.title.trim(),
    service_id: input.service_id.trim(),
    published: input.published ?? true,
    sort_order: input.sort_order || 0,
    created_at: now,
    updated_at: now,
  };

  // 1. Immediately save to persistent local storage
  const currentLocal = getLocalInspirations();
  const updatedLocal = [record, ...currentLocal.filter((i) => i.id !== record.id)];
  saveLocalInspirations(updatedLocal);

  try {
    const data = await apiSend<{ inspiration: GardenInspiration }>('/api/admin/projects?resource=inspiration', 'POST', { input });
    if (data.inspiration) {
      const synced = updatedLocal.map((i) => (i.id === record.id ? data.inspiration : i));
      saveLocalInspirations(synced);
      return data.inspiration;
    }
  } catch (err) {
    console.warn('Admin API createInspiration failed, using local persistence:', err);
  }

  // Also try direct Supabase insert if backend route is unavailable
  try {
    const { data } = await supabase
      .from('garden_inspirations')
      .insert({
        title: record.title,
        description: record.description,
        image: record.image,
        alt: record.alt,
        service_id: record.service_id,
        published: record.published,
        sort_order: record.sort_order,
      })
      .select('*')
      .single();
    if (data) {
      const dbItem = data as GardenInspiration;
      const synced = updatedLocal.map((i) => (i.id === record.id ? dbItem : i));
      saveLocalInspirations(synced);
      return dbItem;
    }
  } catch {
    // Ignore, local persistence is already established
  }

  return record;
}

export async function updateInspiration(id: string, input: Partial<GardenInspirationInput>): Promise<GardenInspiration | null> {
  const local = getLocalInspirations();
  const existing = local.find((i) => i.id === id);
  if (existing) {
    const updated: GardenInspiration = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    };
    saveLocalInspirations(local.map((i) => (i.id === id ? updated : i)));
  }

  try {
    const data = await apiSend<{ inspiration: GardenInspiration }>('/api/admin/projects?resource=inspiration', 'PATCH', { id, input });
    if (data.inspiration) {
      saveLocalInspirations(local.map((i) => (i.id === id ? data.inspiration : i)));
      return data.inspiration;
    }
  } catch (err) {
    console.warn('Admin API updateInspiration failed:', err);
  }

  return existing ? ({ ...existing, ...input } as GardenInspiration) : null;
}

export async function deleteInspiration(id: string): Promise<boolean> {
  const local = getLocalInspirations();
  saveLocalInspirations(local.filter((i) => i.id !== id));

  try {
    await apiSend(`/api/admin/projects?resource=inspiration&id=${encodeURIComponent(id)}`, 'DELETE');
    return true;
  } catch (err) {
    console.warn('Admin API deleteInspiration failed:', err);
    return true;
  }
}

export async function uploadInspirationImage(file: File): Promise<string> {
  return uploadImage(file, 'inspiration');
}
