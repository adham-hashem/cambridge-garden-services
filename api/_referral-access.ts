import { randomBytes } from 'node:crypto';
import type { ApiRequest, ApiResponse } from './_lib/types.js';
import { assertMethod, assertSameOrigin, getBody, requireString, sendError, sendJson } from './_lib/http.js';
import { assertSupabaseEnv, supabaseAdmin } from './_lib/supabase.js';

const referencePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['POST']);
    assertSameOrigin(req);
    assertSupabaseEnv();
    res.setHeader('Cache-Control', 'no-store');

    const body = getBody<{ email?: unknown; booking_reference?: unknown }>(req);
    const email = requireString(body.email, 'Email', 200).toLowerCase();
    const reference = requireString(body.booking_reference, 'Booking reference', 60);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !referencePattern.test(reference)) {
      sendJson(res, 400, { error: 'Enter a valid email and booking reference' });
      return;
    }

    const { data: booking, error: bookingError } = await supabaseAdmin.from('quote_requests')
      .select('id,name,email,status').eq('id', reference).maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking || booking.email.trim().toLowerCase() !== email || booking.status === 'cancelled') {
      sendJson(res, 404, { error: 'We could not verify that booking reference and email' });
      return;
    }

    const { data: existingCode, error: codeError } = await supabaseAdmin.from('referral_codes')
      .select('code').eq('referrer_email', email).maybeSingle();
    if (codeError) throw codeError;
    let code = existingCode;
    if (!code) {
      for (let attempt = 0; attempt < 4 && !code; attempt++) {
        const generated = `FR-${randomBytes(8).toString('hex').toUpperCase()}`;
        const { data: existingPromo, error: promoError } = await supabaseAdmin.from('promo_codes')
          .select('id').eq('code', generated).maybeSingle();
        if (promoError) throw promoError;
        if (existingPromo) continue;
        const inserted = await supabaseAdmin.from('referral_codes').insert({
          code: generated,
          referrer_name: booking.name,
          referrer_email: email,
          referrer_booking_id: booking.id,
        }).select('code').single();
        if (!inserted.error) code = inserted.data;
        else {
          const existing = await supabaseAdmin.from('referral_codes').select('code').eq('referrer_email', email).maybeSingle();
          if (existing.error) throw existing.error;
          code = existing.data;
          if (!code && attempt === 3) throw inserted.error;
        }
      }
    }
    if (!code) throw new Error('Could not create referral code');

    const { data: credits, error: creditError } = await supabaseAdmin.from('referral_credits')
      .select('code,amount,issued_at').eq('referrer_email', email)
      .is('used_booking_id', null).is('used_at', null).is('revoked_at', null)
      .order('issued_at', { ascending: false });
    if (creditError) throw creditError;
    sendJson(res, 200, { code: code.code, credits: credits || [] });
  } catch (error) {
    sendError(res, error);
  }
}
