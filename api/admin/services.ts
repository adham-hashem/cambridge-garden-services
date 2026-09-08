import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { assertMethod, assertSameOrigin, cleanSearch, getBody, getPagination, getQueryString, pick, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase.js';

type ServiceInput = {
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

type ServiceRowInput = {
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
};

const fields: (keyof ServiceInput)[] = [
  'id',
  'title',
  'description',
  'image',
  'alt',
  'detail',
  'heroImage',
  'heroAlt',
  'published',
  'sort_order',
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toPublicShape(row: ServiceRowInput & { created_at?: string; updated_at?: string }) {
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
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
  };
}

function normalizeService(input: Partial<ServiceInput>, partial = false): Partial<ServiceRowInput> {
  const picked = pick<ServiceInput>(input as Record<string, unknown>, fields);
  const output: Partial<ServiceRowInput> = {};

  if (!partial) {
    const title = typeof picked.title === 'string' ? picked.title.trim() : '';
    const id = typeof picked.id === 'string' && picked.id.trim() ? picked.id.trim() : slugify(title);
    if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('A valid service slug is required');
    output.id = id;
  }

  for (const field of ['title', 'description', 'image', 'alt', 'detail', 'heroImage', 'heroAlt'] as const) {
    if (!partial && typeof picked[field] !== 'string') throw new Error(`${field} is required`);
    if (typeof picked[field] === 'string') {
      const value = picked[field].trim().slice(0, field === 'detail' ? 4000 : 1200);
      if (!partial && !value) throw new Error(`${field} is required`);
      if (field === 'heroImage') output.hero_image = value;
      else if (field === 'heroAlt') output.hero_alt = value;
      else output[field] = value;
    }
  }

  if (typeof picked.published !== 'boolean') {
    if (!partial) output.published = false;
  } else {
    output.published = picked.published;
  }

  if (picked.sort_order !== undefined) output.sort_order = Number(picked.sort_order) || 0;
  else if (!partial) output.sort_order = 0;

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
      let query = supabaseAdmin
        .from('services')
        .select('*', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true })
        .range(from, to);

      if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      sendJson(res, 200, { services: (data || []).map(toPublicShape), total: count || 0, page, pageSize });
      return;
    }

    if (req.method === 'DELETE') {
      const id = getQueryString(req.query.id);
      if (!id) {
        sendJson(res, 400, { error: 'Service id is required' });
        return;
      }

      const { count: projectCount, error: countError } = await supabaseAdmin
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', id);
      if (countError) throw countError;
      if ((projectCount || 0) > 0) {
        sendJson(res, 409, { error: 'Move or delete projects attached to this service first' });
        return;
      }

      const { error } = await supabaseAdmin.from('services').delete().eq('id', id);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    const body = getBody<{ id?: unknown; input?: Partial<ServiceInput> }>(req);
    const input = normalizeService((body.input || body) as Partial<ServiceInput>, req.method === 'PATCH');

    if (req.method === 'POST') {
      const { data, error } = await supabaseAdmin.from('services').insert(input).select('*').single();
      if (error) throw error;
      sendJson(res, 201, { service: toPublicShape(data) });
      return;
    }

    if (typeof body.id !== 'string' || !body.id) {
      sendJson(res, 400, { error: 'Service id is required' });
      return;
    }
    const { data, error } = await supabaseAdmin.from('services').update(input).eq('id', body.id).select('*').single();
    if (error) throw error;
    sendJson(res, 200, { service: toPublicShape(data) });
  } catch (error) {
    sendError(res, error);
  }
}
