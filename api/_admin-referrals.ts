import type { ApiRequest, ApiResponse } from './_lib/types.js';
import { assertMethod, assertSameOrigin, getBody, sendError, sendJson } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { assertSupabaseEnv, supabaseAdmin } from './_lib/supabase.js';

type ReferralCode = { id: string; code: string; referrer_name: string; referrer_email: string; active: boolean; created_at: string };
type ReferralClaim = { id: string; referral_code_id: string; referred_email: string; booking_id: string | null; status: string; created_at: string; completed_at: string | null; reward_issued_at: string | null };
type Credit = { claim_id: string; code: string; amount: number; issued_at: string; used_at: string | null; revoked_at: string | null };
type BookingSummary = { id: string; name: string; status: string };

async function allRows<T>(table: string, columns = '*', orderColumn = 'created_at'): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabaseAdmin.from(table).select(columns)
      .order(orderColumn, { ascending: false }).order('id', { ascending: false }).range(from, from + 499);
    if (error) throw error;
    rows.push(...((data || []) as T[]));
    if (!data || data.length < 500) break;
  }
  return rows;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['GET', 'PATCH']);
    if (req.method === 'PATCH') assertSameOrigin(req);
    requireAdmin(req);
    assertSupabaseEnv();
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'PATCH') {
      const body = getBody<{ discount_type?: unknown; discount_value?: unknown }>(req);
      const type = body.discount_type;
      const value = Number(body.discount_value);
      if ((type !== 'percentage' && type !== 'fixed') || !Number.isFinite(value)
          || value <= 0 || (type === 'percentage' && value > 100) || (type === 'fixed' && value > 10000)) {
        sendJson(res, 400, { error: 'Enter a valid referral discount' });
        return;
      }
      const { data, error } = await supabaseAdmin.from('referral_settings')
        .update({ friend_discount_type: type, friend_discount_value: value }).eq('id', 1)
        .select('friend_discount_type,friend_discount_value,reward_amount').single();
      if (error) throw error;
      sendJson(res, 200, { settings: data });
      return;
    }

    const [codes, claims, credits, bookings, settingsResult] = await Promise.all([
      allRows<ReferralCode>('referral_codes'),
      allRows<ReferralClaim>('referral_claims'),
      allRows<Credit>('referral_credits', '*', 'issued_at'),
      allRows<BookingSummary>('quote_requests', 'id,name,status,created_at'),
      supabaseAdmin.from('referral_settings').select('friend_discount_type,friend_discount_value,reward_amount').eq('id', 1).single(),
    ]);
    if (settingsResult.error) throw settingsResult.error;
    const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
    const creditByClaim = new Map(credits.map((credit) => [credit.claim_id, credit]));
    const claimsByCode = new Map<string, ReferralClaim[]>();
    for (const claim of claims) claimsByCode.set(claim.referral_code_id, [...(claimsByCode.get(claim.referral_code_id) || []), claim]);
    const rows = codes.flatMap((code) => {
      const entries = claimsByCode.get(code.id) || [null];
      return entries.map((claim) => {
        const credit = claim ? creditByClaim.get(claim.id) : undefined;
        const booking = claim?.booking_id ? bookingById.get(claim.booking_id) : undefined;
        return {
          id: claim?.id || code.id,
          referrer_name: code.referrer_name,
          referrer_email: code.referrer_email,
          referral_code: code.code,
          code_created_at: code.created_at,
          code_status: claim?.status || 'available',
          referred_email: claim?.referred_email || null,
          related_booking: claim?.booking_id || null,
          referred_name: booking?.name || null,
          booking_status: booking?.status || null,
          reward_status: credit?.revoked_at ? 'revoked' : credit?.used_at ? 'used' : credit ? 'issued' : 'pending',
          reward_amount: credit && !credit.revoked_at ? credit.amount : 0,
          reward_code: credit?.code || null,
          used_at: credit?.used_at || null,
          created_at: claim?.created_at || code.created_at,
        };
      });
    });
    const activeCredits = credits.filter((credit) => !credit.revoked_at);
    sendJson(res, 200, {
      rows,
      settings: settingsResult.data,
      stats: {
        total_referrals: claims.length,
        codes_used: claims.length,
        successful_referrals: claims.filter((claim) => !!claim.completed_at).length,
        rewards_issued: activeCredits.length,
        total_reward_value: activeCredits.reduce((sum, credit) => sum + Number(credit.amount), 0),
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}
