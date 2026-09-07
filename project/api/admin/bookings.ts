import type { ApiRequest, ApiResponse } from '../_lib/types';
import {
  assertMethod,
  assertSameOrigin,
  cleanSearch,
  getBody,
  getPagination,
  getQueryString,
  optionalNumber,
  sendError,
  sendJson,
} from '../_lib/http';
import { requireAdmin } from '../_lib/auth';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase';

const statuses = new Set(['new', 'contacted', 'confirmed', 'completed', 'cancelled']);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['GET', 'PATCH', 'DELETE']);
    if (req.method !== 'GET') assertSameOrigin(req);
    requireAdmin(req);
    assertSupabaseEnv();

    if (req.method === 'GET') {
      const { page, pageSize, from, to } = getPagination(req);
      const search = cleanSearch(getQueryString(req.query.search));
      const status = getQueryString(req.query.status);

      let query = supabaseAdmin
        .from('quote_requests')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`);
      }
      if (status && statuses.has(status)) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      sendJson(res, 200, { bookings: data || [], total: count || 0, page, pageSize });
      return;
    }

    const body = getBody<{ id?: unknown; status?: unknown; final_price?: unknown }>(req);
    const id = req.method === 'DELETE' ? getQueryString(req.query.id) : body.id;
    if (typeof id !== 'string' || !id) {
      sendJson(res, 400, { error: 'Booking id is required' });
      return;
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin.from('quote_requests').delete().eq('id', id);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    const updates: Record<string, string | number | null> = {};
    if (typeof body.status === 'string' && statuses.has(body.status)) {
      updates.status = body.status;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'final_price')) {
      updates.final_price = optionalNumber(body.final_price);
    }

    if (Object.keys(updates).length === 0) {
      sendJson(res, 400, { error: 'No valid booking fields to update' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('quote_requests')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    sendJson(res, 200, { booking: data });
  } catch (error) {
    sendError(res, error);
  }
}
