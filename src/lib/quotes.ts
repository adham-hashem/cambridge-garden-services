import { apiSend } from '@/lib/api';

export type QuoteRequestInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  project_type: string;
  budget: string | null;
  project_details: string;
  attachment_name: string | null;
  attachment_url: string | null;
  promo_code: string | null;
};

export async function submitQuoteRequest(input: QuoteRequestInput) {
  await apiSend('/api/quote', 'POST', input);
}
