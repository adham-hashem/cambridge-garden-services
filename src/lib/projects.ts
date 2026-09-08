import { supabase } from '@/lib/supabase';
import { apiGet, apiSend, deleteImageByPath, uploadImage } from '@/lib/api';
import type { Project, ProjectInput } from '@/types/project';

const PAGE_SIZE = 6;

export async function fetchPublishedProjects(
  page: number = 0,
  serviceId?: string,
  pageSize: number = PAGE_SIZE
): Promise<{ projects: Project[]; hasMore: boolean }> {
  const from = page * pageSize;
  const to = from + pageSize;

  let query = supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (serviceId) {
    query = query.eq('service_id', serviceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error.message);
    return { projects: [], hasMore: false };
  }

  const projects = (data || []) as Project[];
  const hasMore = projects.length > pageSize;
  return { projects: projects.slice(0, pageSize), hasMore };
}

export async function fetchPublishedProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching project:', error.message);
    return null;
  }

  return data as Project | null;
}

export async function fetchAllProjects(
  page: number = 0,
  pageSize: number = 10,
  filters?: { search?: string; serviceId?: string; published?: boolean }
): Promise<{ projects: Project[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.serviceId) params.set('serviceId', filters.serviceId);
  if (filters?.published !== undefined) params.set('published', String(filters.published));

  try {
    const data = await apiGet<{ projects: Project[]; total: number }>(`/api/admin/projects?${params}`);
    return data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { projects: [], total: 0 };
  }
}

export async function createProject(input: ProjectInput): Promise<Project | null> {
  try {
    const data = await apiSend<{ project: Project }>('/api/admin/projects', 'POST', { input });
    return data.project;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project | null> {
  try {
    const data = await apiSend<{ project: Project }>('/api/admin/projects', 'PATCH', { id, input });
    return data.project;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await apiSend(`/api/admin/projects?id=${encodeURIComponent(id)}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

export async function uploadProjectImage(file: File, slot: 'before' | 'after'): Promise<string | null> {
  try {
    return await uploadImage(file, slot);
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

export async function deleteProjectImage(url: string): Promise<void> {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/project-images\/(.+)$/);
    if (!pathMatch) return;
    const filePath = pathMatch[1];
    await deleteImageByPath(filePath);
  } catch {
    // ignore — URL may be external
  }
}

export async function toggleProjectPublished(id: string, published: boolean): Promise<boolean> {
  try {
    await apiSend('/api/admin/projects', 'PATCH', { id, input: { published } });
    return true;
  } catch (error) {
    console.error('Error toggling published:', error);
    return false;
  }
}
