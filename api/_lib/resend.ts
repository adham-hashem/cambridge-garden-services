type BookingEmail = {
  id: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  projectType: string;
  budget: string | null;
  projectDetails: string;
  attachmentUrl: string | null;
  promoCode: string | null;
};

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const RESEND_TIMEOUT_MS = 5000;

function compact(value: string | null | undefined, fallback = 'Not provided') {
  return value?.trim() || fallback;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseRecipients(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function adminBookingsUrl() {
  const origin = process.env.SITE_ORIGIN?.replace(/\/+$/, '');
  return origin ? `${origin}/admin/bookings` : null;
}

function plainTextEmail(booking: BookingEmail) {
  const lines = [
    'New booking request',
    '',
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${compact(booking.phone)}`,
    `Address: ${compact(booking.address)}`,
    `Project type: ${booking.projectType}`,
    `Budget: ${compact(booking.budget)}`,
    `Promo code: ${compact(booking.promoCode)}`,
    '',
    'Project details:',
    truncate(booking.projectDetails, 2000),
    '',
    `Attachment: ${compact(booking.attachmentUrl)}`,
  ];

  const adminUrl = adminBookingsUrl();
  if (adminUrl) lines.push('', `Admin dashboard: ${adminUrl}`);

  return lines.join('\n');
}

function detailRow(label: string, value: string | null | undefined) {
  return `
    <tr>
      <td style="padding:10px 0;color:#66756f;font-size:13px;width:130px;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#1a3c2e;font-size:14px;font-weight:600;">${escapeHtml(compact(value))}</td>
    </tr>
  `;
}

function htmlEmail(booking: BookingEmail) {
  const adminUrl = adminBookingsUrl();
  return `
    <div style="margin:0;padding:0;background:#f7f2e8;font-family:Inter,Arial,sans-serif;color:#1a3c2e;">
      <div style="max-width:680px;margin:0 auto;padding:32px 18px;">
        <div style="background:#fffaf0;border:1px solid #d8dcc7;border-radius:18px;overflow:hidden;">
          <div style="background:#1a3c2e;padding:26px 28px;color:#fffaf0;">
            <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#b7c6a4;">New Booking Request</p>
            <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.15;">${escapeHtml(booking.name)}</h1>
          </div>
          <div style="padding:24px 28px;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              ${detailRow('Email', booking.email)}
              ${detailRow('Phone', booking.phone)}
              ${detailRow('Address', booking.address)}
              ${detailRow('Project type', booking.projectType)}
              ${detailRow('Budget', booking.budget)}
              ${detailRow('Promo code', booking.promoCode)}
            </table>
            <div style="margin-top:22px;padding-top:22px;border-top:1px solid #d8dcc7;">
              <p style="margin:0 0 10px;color:#66756f;font-size:13px;text-transform:uppercase;letter-spacing:1.6px;">Project details</p>
              <p style="margin:0;color:#1a3c2e;font-size:15px;line-height:1.65;white-space:pre-wrap;">${escapeHtml(truncate(booking.projectDetails, 3000))}</p>
            </div>
            ${booking.attachmentUrl ? `
              <div style="margin-top:22px;padding-top:22px;border-top:1px solid #d8dcc7;">
                <a href="${escapeHtml(booking.attachmentUrl)}" style="display:inline-block;border-radius:999px;background:#b7c6a4;color:#1a3c2e;padding:12px 18px;text-decoration:none;font-size:13px;font-weight:700;">View uploaded image</a>
              </div>
            ` : ''}
            ${adminUrl ? `
              <div style="margin-top:22px;padding-top:22px;border-top:1px solid #d8dcc7;">
                <a href="${escapeHtml(adminUrl)}" style="display:inline-block;border-radius:999px;background:#1a3c2e;color:#fffaf0;padding:12px 18px;text-decoration:none;font-size:13px;font-weight:700;">Open admin dashboard</a>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function notifyBookingEmail(booking: BookingEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = parseRecipients(process.env.BOOKING_EMAIL_TO);

  if (!apiKey || !from || to.length === 0) {
    console.warn('Resend email skipped: RESEND_API_KEY, RESEND_FROM_EMAIL, or BOOKING_EMAIL_TO is not configured');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'cambridge-garden-services/1.0',
        ...(booking.id ? { 'Idempotency-Key': `booking-${booking.id}` } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify({
        from,
        to,
        reply_to: booking.email,
        subject: `New garden booking from ${booking.name}`,
        text: plainTextEmail(booking),
        html: htmlEmail(booking),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error('Resend email failed', response.status, truncate(errorBody, 500));
    }
  } catch (error) {
    console.error('Resend email failed', error);
  } finally {
    clearTimeout(timeout);
  }
}
