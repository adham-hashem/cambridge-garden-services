import type { ApiRequest, ApiResponse } from '../_lib/types';
import { assertMethod, assertSameOrigin, getBody, requireString, sendError, sendJson } from '../_lib/http';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase';

function publicPromoFields(promo: Record<string, unknown>) {
  return {
    id: promo.id,
    code: promo.code,
    description: promo.description,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    expires_at: promo.expires_at,
    usage_limit: promo.usage_limit,
    usage_count: promo.usage_count,
    active: promo.active,
    created_at: promo.created_at,
    updated_at: promo.updated_at,
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['POST']);
    assertSameOrigin(req);
    assertSupabaseEnv();

    const body = getBody<{ code?: unknown }>(req);
    const code = requireString(body.code, 'Promo code', 40).toUpperCase();
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      sendJson(res, 200, { valid: false, promoCode: null, error: 'Code not found' });
      return;
    }

    if (data.expires_at && new Date(data.expires_at) <= new Date()) {
      sendJson(res, 200, { valid: false, promoCode: null, error: 'This code has expired' });
      return;
    }

    if (data.usage_limit !== null && data.usage_count >= data.usage_limit) {
      sendJson(res, 200, { valid: false, promoCode: null, error: 'This code has reached its usage limit' });
      return;
    }

    sendJson(res, 200, { valid: true, promoCode: publicPromoFields(data) });
  } catch (error) {
    sendError(res, error);
  }
}
