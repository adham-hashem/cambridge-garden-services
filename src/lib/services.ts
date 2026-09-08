import { services as defaultServices, type ServiceItem } from '@/data/content';
import { apiGet, apiSend, uploadImage } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type ServiceRecord = {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  detail: string;
  hero_image: string;
  hero_alt: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ServiceAdminItem = ServiceItem & {
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ServiceInput = {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  detail: string;
  heroImage: string;
  heroAlt: string;
  published: boolean;
  sort_order: number;
};

function fromRecord(row: ServiceRecord): ServiceAdminItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    alt: row.alt,
    detail: row.detail,
    heroImage: row.hero_image,
    heroAlt: row.hero_alt,
    published: row.published,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function defaultServiceItems(): ServiceAdminItem[] {
  return defaultServices.map((service, index) => ({
    ...service,
    published: true,
    sort_order: index * 10,
    created_at: '',
    updated_at: '',
  }));
}

function mergeWithDefaults(records: ServiceRecord[]): ServiceAdminItem[] {
  const byId = new Map(defaultServiceItems().map((service) => [service.id, service]));
  records.forEach((row) => byId.set(row.id, fromRecord(row)));
  return Array.from(byId.values())
    .filter((service) => service.published)
    .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
}

export function slugifyServiceId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function fetchPublishedServices(): Promise<ServiceAdminItem[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error.message);
    return defaultServiceItems();
  }

  return mergeWithDefaults((data || []) as ServiceRecord[]);
}

export async function fetchPublishedServiceById(id: string): Promise<ServiceAdminItem | null> {
  const services = await fetchPublishedServices();
  return services.find((service) => service.id === id) || null;
}

export async function fetchAllServices(
  page: number = 0,
  pageSize: number = 20,
  search?: string
): Promise<{ services: ServiceAdminItem[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);

  try {
    const data = await apiGet<{ services: ServiceAdminItem[]; total: number }>(`/api/admin/services?${params}`);
    return data;
  } catch (error) {
    console.error('Error fetching admin services:', error);
    return { services: [], total: 0 };
  }
}

export async function createService(input: ServiceInput): Promise<ServiceAdminItem | null> {
  try {
    const data = await apiSend<{ service: ServiceAdminItem }>('/api/admin/services', 'POST', { input });
    return data.service;
  } catch (error) {
    console.error('Error creating service:', error);
    return null;
  }
}

export async function updateService(id: string, input: Partial<ServiceInput>): Promise<ServiceAdminItem | null> {
  try {
    const data = await apiSend<{ service: ServiceAdminItem }>('/api/admin/services', 'PATCH', { id, input });
    return data.service;
  } catch (error) {
    console.error('Error updating service:', error);
    return null;
  }
}

export async function deleteService(id: string): Promise<boolean> {
  try {
    await apiSend(`/api/admin/services?id=${encodeURIComponent(id)}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    return false;
  }
}

export async function toggleServicePublished(id: string, published: boolean): Promise<boolean> {
  try {
    await apiSend('/api/admin/services', 'PATCH', { id, input: { published } });
    return true;
  } catch (error) {
    console.error('Error toggling service:', error);
    return false;
  }
}

export async function uploadServiceImage(file: File): Promise<string | null> {
  try {
    return await uploadImage(file, 'services');
  } catch (error) {
    console.error('Error uploading service image:', error);
    return null;
  }
}
