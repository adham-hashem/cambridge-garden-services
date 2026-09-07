type BookingNotification = {
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

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

function compact(value: string | null | undefined, fallback = 'Not provided') {
  return value?.trim() || fallback;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function adminBookingsUrl() {
  const origin = process.env.SITE_ORIGIN?.replace(/\/+$/, '');
  return origin ? `${origin}/admin/bookings` : null;
}

export async function notifyBookingCreated(booking: BookingNotification) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured');
    return;
  }

  const adminUrl = adminBookingsUrl();
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
    truncate(booking.projectDetails, 1200),
    '',
    `Attachment: ${compact(booking.attachmentUrl)}`,
  ];

  if (adminUrl) {
    lines.push('', `Admin dashboard: ${adminUrl}`);
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n').slice(0, TELEGRAM_MAX_MESSAGE_LENGTH),
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error('Telegram notification failed', response.status, truncate(errorBody, 300));
    }
  } catch (error) {
    console.error('Telegram notification failed', error);
  }
}
