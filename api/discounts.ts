import type { ApiRequest, ApiResponse } from './_lib/types.js';
import { sendJson } from './_lib/http.js';
import adminPromos from './_admin-promos.js';
import adminReferrals from './_admin-referrals.js';
import promoValidate from './_promo-validate.js';
import referralAccess from './_referral-access.js';

const handlers = {
  'admin-promos': adminPromos,
  'admin-referrals': adminReferrals,
  'promo-validate': promoValidate,
  'referral-access': referralAccess,
};

export default function handler(req: ApiRequest, res: ApiResponse) {
  const route = req.query.__handler;
  if (typeof route !== 'string' || !Object.prototype.hasOwnProperty.call(handlers, route)) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }
  return handlers[route as keyof typeof handlers](req, res);
}
