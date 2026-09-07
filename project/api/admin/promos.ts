import type { ApiRequest, ApiResponse } from '../_lib/types';
import { assertMethod, assertSameOrigin, cleanSearch, getBody, getPagination, getQueryString, optionalNumber, optionalString, sendError, sendJson } from '../_lib/http';
import { requireAdmin } from '../_lib/auth';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase';

const discountTypes = new Set(['percentage', 'fixed']);

function normalizePromo(input: Record<string, unknown>, partial = false) {
  const output: Record<string, unknown> = {};
  if (input.code !== undefined) output.code = String(input.code).trim().toUpperCase().slice(0, 40);
  if (input.description !== undefined) output.description = optionalString(input.description, 500);
  if (input.discount_type !== undefined && discountTypes.has(String(input.discount_type))) output.discount_type = input.discount_type;
  if (input.discount_value !== undefined) {
    const value = optionalNumber(input.discount_value);
    output.discount_value = value === null ? 0 : Math.max(0, value);
  }
  if (input.expires_at !== undefined) output.expires_at = optionalString(input.expires_at, 80);
  if (input.usage_limit !== undefined) output.usage_limit = optionalNumber(input.usage_limit);
  if (input.active !== undefined) output.active = Boolean(input.active);

  if (!partial) {
    for (const required of ['code', 'discount_type', 'discount_value']) {
      if (output[required] === undefined || output[required] === '') throw new Error(`${required} is required`);
    }
  }

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
        .from('promo_codes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (search) query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
      const { data, error, count } = await query;
      if (error) throw error;
      sendJson(res, 200, { codes: data || [], total: count || 0, page, pageSize });
      return;
    }

    if (req.method === 'DELETE') {
      const id = getQueryString(req.query.id);
      if (!id) {
        sendJson(res, 400, { error: 'Promo code id is required' });
        return;
      }
      const { error } = await supabaseAdmin.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    const body = getBody<{ id?: unknown; input?: Record<string, unknown> }>(req);
    const input = normalizePromo((body.input || body) as Record<string, unknown>, req.method === 'PATCH');

    if (req.method === 'POST') {
      const { data, error } = await supabaseAdmin.from('promo_codes').insert(input).select('*').single();
      if (error) throw error;
      sendJson(res, 201, { code: data });
      return;
    }

    if (typeof body.id !== 'string' || !body.id) {
      sendJson(res, 400, { error: 'Promo code id is required' });
      return;
    }
    const { data, error } = await supabaseAdmin.from('promo_codes').update(input).eq('id', body.id).select('*').single();
    if (error) throw error;
    sendJson(res, 200, { code: data });
  } catch (error) {
    sendError(res, error);
  }
}
