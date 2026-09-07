import type { ApiRequest, ApiResponse } from '../_lib/types';
import { assertMethod, assertSameOrigin, cleanSearch, getBody, getPagination, getQueryString, pick, sendError, sendJson } from '../_lib/http';
import { requireAdmin } from '../_lib/auth';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase';

type ProjectInput = {
  service_id: string;
  title: string;
  location: string;
  description: string;
  before_image: string;
  after_image: string;
  before_alt: string;
  after_alt: string;
  published: boolean;
  sort_order: number;
};

const fields: (keyof ProjectInput)[] = [
  'service_id',
  'title',
  'location',
  'description',
  'before_image',
  'after_image',
  'before_alt',
  'after_alt',
  'published',
  'sort_order',
];

function normalizeProject(input: Partial<ProjectInput>, partial = false) {
  const output = pick<ProjectInput>(input as Record<string, unknown>, fields);
  for (const field of ['service_id', 'title', 'location', 'description', 'before_image', 'after_image', 'before_alt', 'after_alt'] as const) {
    if (!partial && typeof output[field] !== 'string') throw new Error(`${field} is required`);
    if (typeof output[field] === 'string') output[field] = output[field].trim().slice(0, field.includes('image') ? 1200 : 1000);
  }
  if (typeof output.published !== 'boolean') {
    if (!partial) output.published = false;
    else delete output.published;
  }
  if (output.sort_order !== undefined) output.sort_order = Number(output.sort_order) || 0;
  return output;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['GET', 'POST', 'PATCH', 'DELETE']);
    if (req.method !== 'GET') assertSameOrigin(req);
    requireAdmin(req);
    assertSupabaseEnv();

    if (req.method === 'GET') {
      const { page, pageSize, from, to } = getPagination(req);
      const search = cleanSearch(getQueryString(req.query.search));
      const serviceId = getQueryString(req.query.serviceId);
      const published = getQueryString(req.query.published);

      let query = supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search) query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
      if (serviceId) query = query.eq('service_id', serviceId);
      if (published === 'true' || published === 'false') query = query.eq('published', published === 'true');

      const { data, error, count } = await query;
      if (error) throw error;
      sendJson(res, 200, { projects: data || [], total: count || 0, page, pageSize });
      return;
    }

    if (req.method === 'DELETE') {
      const id = getQueryString(req.query.id);
      if (!id) {
        sendJson(res, 400, { error: 'Project id is required' });
        return;
      }
      const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    const body = getBody<{ id?: unknown; input?: Partial<ProjectInput> }>(req);
    const input = normalizeProject((body.input || body) as Partial<ProjectInput>, req.method === 'PATCH');

    if (req.method === 'POST') {
      const { data, error } = await supabaseAdmin.from('projects').insert(input).select('*').single();
      if (error) throw error;
      sendJson(res, 201, { project: data });
      return;
    }

    if (typeof body.id !== 'string' || !body.id) {
      sendJson(res, 400, { error: 'Project id is required' });
      return;
    }
    const { data, error } = await supabaseAdmin.from('projects').update(input).eq('id', body.id).select('*').single();
    if (error) throw error;
    sendJson(res, 200, { project: data });
  } catch (error) {
    sendError(res, error);
  }
}
