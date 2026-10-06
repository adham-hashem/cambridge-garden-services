import type { ApiRequest, ApiResponse } from '../_lib/types.js';
import { assertMethod, assertSameOrigin, getBody, requireString, sendError, sendJson } from '../_lib/http.js';
import { assertSupabaseEnv, supabaseAdmin } from '../_lib/supabase.js';

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

    const body = getBody<{ code?: unknown; email?: unknown }>(req);
    const code = requireString(body.code, 'Promo code', 40).toUpperCase();
    const { data: promo, error: promoError } = await supabaseAdmin.from('promo_codes')
      .select('*').eq('code', code).maybeSingle();
    if (promoError) throw promoError;
    // Existing promo codes take precedence, including codes with a reserved-looking prefix.
    if (promo) {
      if (!promo.active) {
        sendJson(res, 200, { valid: false, promoCode: null, error: 'Code not found' });
        return;
      }
      if (promo.expires_at && new Date(promo.expires_at) <= new Date()) {
        sendJson(res, 200, { valid: false, promoCode: null, error: 'This code has expired' });
        return;
      }
      if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
        sendJson(res, 200, { valid: false, promoCode: null, error: 'This code has reached its usage limit' });
        return;
      }
      sendJson(res, 200, { valid: true, kind: 'promo', promoCode: publicPromoFields(promo) });
      return;
    }
    if (code.startsWith('FR-') || code.startsWith('CR-')) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '';
      const { data, error } = await supabaseAdmin.rpc('validate_referral_or_credit', { p_code: code, p_email: email });
      if (error) throw error;
      const result = data as { valid: boolean; error?: string; kind?: 'referral' | 'credit'; discount_type?: 'fixed' | 'percentage'; discount_value?: number };
      if (!result.valid) {
        sendJson(res, 200, { valid: false, promoCode: null, error: result.error || 'Code not valid' });
        return;
      }
      sendJson(res, 200, {
        valid: true,
        kind: result.kind,
        promoCode: {
          id: code,
          code,
          description: result.kind === 'credit' ? 'Referral thank-you credit' : 'Recommend a Friend discount',
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          expires_at: null,
          usage_limit: null,
          usage_count: 0,
          active: true,
          created_at: '',
          updated_at: '',
        },
      });
      return;
    }
    sendJson(res, 200, { valid: false, promoCode: null, error: 'Code not found' });
  } catch (error) {
    sendError(res, error);
  }
}
