import type { ApiRequest, ApiResponse } from './_lib/types.js';
import { assertMethod, assertSameOrigin, getBody, optionalString, requireString, sendError, sendJson } from './_lib/http.js';
import { assertSupabaseEnv, supabaseAdmin } from './_lib/supabase.js';
import { notifyBookingCreated } from './_lib/telegram.js';
import { notifyBookingEmail } from './_lib/resend.js';

const serviceIdMap: Record<string, string> = {
  'Garden Design': 'garden-design',
  Landscaping: 'landscaping',
  Patios: 'patios',
  Fencing: 'fencing',
  Turfing: 'turfing',
  'Garden Clearance': 'garden-clearance',
  Groundworks: 'groundworks',
  'Tree Surgery': 'tree-surgery',
  'Garden Maintenance': 'garden-maintenance',
};

async function resolveServiceId(projectType: string) {
  if (serviceIdMap[projectType]) return serviceIdMap[projectType];

  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('title', projectType)
      .maybeSingle();

    if (error) return null;
    return data?.id || null;
  } catch {
    return null;
  }
}

function emailIsValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    assertMethod(req, ['POST']);
    assertSameOrigin(req);
    assertSupabaseEnv();

    const body = getBody<Record<string, unknown>>(req);
    const name = requireString(body.name, 'Name', 120);
    const email = requireString(body.email, 'Email', 200).toLowerCase();
    if (!emailIsValid(email)) {
      sendJson(res, 400, { error: 'A valid email is required' });
      return;
    }

    const projectType = requireString(body.project_type, 'Project type', 120);
    const projectDetails = requireString(body.project_details, 'Project details', 4000);
    const budget = optionalString(body.budget, 80);
    const promoCode = optionalString(body.promo_code, 40)?.toUpperCase() || null;
    const serviceId = await resolveServiceId(projectType);

    const payload = {
      p_name: name,
      p_email: email,
      p_phone: optionalString(body.phone, 80),
      p_address: optionalString(body.address, 300),
      p_project_type: projectType,
      p_service_id: serviceId,
      p_budget: budget,
      p_project_details: projectDetails,
      p_attachment_name: optionalString(body.attachment_name, 255),
      p_attachment_url: optionalString(body.attachment_url, 1200),
      p_promo_code: promoCode,
    };

    const { data: quoteId, error } = await supabaseAdmin.rpc('submit_quote_request', payload);
    if (error) {
      if (error.message.includes('Promo code is not valid')) {
        sendJson(res, 400, { error: 'Promo code is not valid' });
        return;
      }
      throw error;
    }

    const bookingNotification = {
      id: typeof quoteId === 'string' ? quoteId : null,
      name,
      email,
      phone: payload.p_phone,
      address: payload.p_address,
      projectType,
      budget,
      projectDetails,
      attachmentUrl: payload.p_attachment_url,
      promoCode,
    };

    await Promise.all([
      notifyBookingCreated(bookingNotification),
      notifyBookingEmail(bookingNotification),
    ]);

    sendJson(res, 201, { ok: true });
  } catch (error) {
    sendError(res, error);
  }
}
