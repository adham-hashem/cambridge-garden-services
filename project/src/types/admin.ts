export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeInput {
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expires_at: string | null;
  usage_limit: number | null;
  active: boolean;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  project_type: string;
  budget: string | null;
  project_details: string;
  attachment_name: string | null;
  attachment_url: string | null;
  service_id: string | null;
  status: 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';
  promo_code: string | null;
  discount_amount: number | null;
  final_price: number | null;
  created_at: string;
}
