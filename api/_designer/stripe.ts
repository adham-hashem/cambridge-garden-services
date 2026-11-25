import { HttpError } from '../_lib/http.js';

const STRIPE_API = 'https://api.stripe.com/v1';

function key() {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) throw new HttpError(503, 'Payments are not configured yet (STRIPE_SECRET_KEY is missing)');
  return value;
}

export interface StripeSession {
  id: string;
  url?: string | null;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
  customer_details?: { email?: string | null } | null;
}

async function stripeRequest<T>(path: string, init: { method: 'GET' | 'POST'; body?: URLSearchParams; idempotencyKey?: string }): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${key()}` };
  if (init.body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (init.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey;
  const response = await fetch(`${STRIPE_API}${path}`, { method: init.method, headers, body: init.body });
  const json = (await response.json().catch(() => ({}))) as { error?: { message?: string } } & Record<string, unknown>;
  if (!response.ok) {
    console.error('Stripe error', response.status, json.error?.message);
    throw new HttpError(502, 'The payment provider rejected the request. Please try again.');
  }
  return json as T;
}

export async function createCheckoutSession(input: {
  projectId: string;
  reference: string;
  packageName: string;
  amountPence: number;
  successUrl: string;
  cancelUrl: string;
  email?: string | null;
  idempotencyKey: string;
}) {
  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('line_items[0][quantity]', '1');
  body.set('line_items[0][price_data][currency]', 'gbp');
  body.set('line_items[0][price_data][unit_amount]', String(input.amountPence));
  body.set('line_items[0][price_data][product_data][name]', `AI Garden Designer - ${input.packageName}`);
  body.set('line_items[0][price_data][product_data][description]', `Project ${input.reference}`);
  body.set('success_url', input.successUrl);
  body.set('cancel_url', input.cancelUrl);
  body.set('client_reference_id', input.projectId);
  body.set('metadata[project_id]', input.projectId);
  body.set('metadata[reference]', input.reference);
  body.set('payment_intent_data[metadata][project_id]', input.projectId);
  if (input.email) body.set('customer_email', input.email);
  return stripeRequest<StripeSession>('/checkout/sessions', { method: 'POST', body, idempotencyKey: input.idempotencyKey });
}

export function retrieveCheckoutSession(sessionId: string) {
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) throw new HttpError(400, 'Invalid checkout session');
  return stripeRequest<StripeSession>(`/checkout/sessions/${sessionId}`, { method: 'GET' });
}
