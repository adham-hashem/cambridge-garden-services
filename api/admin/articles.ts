import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { assertMethod, assertSameOrigin, cleanSearch, getBody, getPagination, getQueryString, pick, sendError, sendJson } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase.js';

type ArticleInput = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
  cover_image: string;
  cover_alt: string;
  published: boolean;
  sort_order: number;
};

const fields: (keyof ArticleInput)[] = [
  'title',
  'excerpt',
  'content',
  'category',
  'tags',
  'date',
  'cover_image',
  'cover_alt',
  'published',
  'sort_order',
];

function normalizeArticle(input: Partial<ArticleInput>, partial = false) {
  const output = pick<ArticleInput>(input as Record<string, unknown>, fields);
  for (const field of ['title', 'excerpt', 'content', 'category', 'date', 'cover_image', 'cover_alt'] as const) {
    if (!partial && typeof output[field] !== 'string') throw new Error(`${field} is required`);
    if (typeof output[field] === 'string') output[field] = output[field].trim().slice(0, field === 'content' ? 20000 : 1200);
  }
  if (output.tags !== undefined) {
    output.tags = Array.isArray(output.tags) ? output.tags.map((tag) => String(tag).trim().slice(0, 60)).filter(Boolean) : [];
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
      let query = supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (search) query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
      const { data, error, count } = await query;
      if (error) throw error;
      sendJson(res, 200, { articles: data || [], total: count || 0, page, pageSize });
      return;
    }

    if (req.method === 'DELETE') {
      const id = getQueryString(req.query.id);
      if (!id) {
        sendJson(res, 400, { error: 'Article id is required' });
        return;
      }
      const { error } = await supabaseAdmin.from('articles').delete().eq('id', id);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    const body = getBody<{ id?: unknown; input?: Partial<ArticleInput> }>(req);
    const input = normalizeArticle((body.input || body) as Partial<ArticleInput>, req.method === 'PATCH');

    if (req.method === 'POST') {
      const { data, error } = await supabaseAdmin.from('articles').insert(input).select('*').single();
      if (error) throw error;
      sendJson(res, 201, { article: data });
      return;
    }

    if (typeof body.id !== 'string' || !body.id) {
      sendJson(res, 400, { error: 'Article id is required' });
      return;
    }
    const { data, error } = await supabaseAdmin.from('articles').update(input).eq('id', body.id).select('*').single();
    if (error) throw error;
    sendJson(res, 200, { article: data });
  } catch (error) {
    sendError(res, error);
  }
}
