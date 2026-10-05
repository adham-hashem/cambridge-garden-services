import type { ApiRequest, ApiResponse } from '../_lib/types.js';
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
} from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase.js';

const statuses = new Set(['new', 'contacted', 'confirmed', 'completed', 'cancelled']);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['GET', 'PATCH', 'DELETE']);
    if (req.method !== 'GET') assertSameOrigin(req);
    requireAdmin(req);
    assertSupabaseEnv();

    if (req.method === 'GET') {
      // The admin overview needs every real booking for accurate counts, calendar and exports.
      // Page through Supabase to avoid its per-request row limit.
      if (getQueryString(req.query.view) === 'overview') {
        const bookings: Record<string, unknown>[] = [];
        for (let from = 0; ; from += 500) {
          const { data, error } = await supabaseAdmin.from('quote_requests')
            .select('*').order('created_at', { ascending: false }).range(from, from + 499);
          if (error) throw error;
          bookings.push(...(data || []));
          if (!data || data.length < 500) break;
        }
        sendJson(res, 200, { bookings });
        return;
      }
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

    const body = getBody<{ id?: unknown; status?: unknown; final_price?: unknown; appointment_at?: unknown }>(req);
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
    if (Object.prototype.hasOwnProperty.call(body, 'appointment_at')) {
      if (body.appointment_at === null || body.appointment_at === '') {
        updates.appointment_at = null;
      } else if (typeof body.appointment_at === 'string' && !Number.isNaN(Date.parse(body.appointment_at))) {
        updates.appointment_at = new Date(body.appointment_at).toISOString();
      } else {
        sendJson(res, 400, { error: 'A valid appointment date and time is required' });
        return;
      }
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
