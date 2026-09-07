import { apiGet, apiSend } from '@/lib/api';
import type { PromoCode, PromoCodeInput } from '@/types/admin';

export async function fetchAllPromoCodes(
  page: number = 0,
  pageSize: number = 10,
  search?: string
): Promise<{ codes: PromoCode[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);

  try {
    const data = await apiGet<{ codes: PromoCode[]; total: number }>(`/api/admin/promos?${params}`);
    return data;
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return { codes: [], total: 0 };
  }
}

export async function createPromoCode(input: PromoCodeInput): Promise<PromoCode | null> {
  try {
    const data = await apiSend<{ code: PromoCode }>('/api/admin/promos', 'POST', {
      input: { ...input, code: input.code.toUpperCase() },
    });
    return data.code;
  } catch (error) {
    console.error('Error creating promo code:', error);
    return null;
  }
}

export async function updatePromoCode(id: string, input: Partial<PromoCodeInput>): Promise<PromoCode | null> {
  const updateData = { ...input };
  if (updateData.code) updateData.code = updateData.code.toUpperCase();

  try {
    const data = await apiSend<{ code: PromoCode }>('/api/admin/promos', 'PATCH', { id, input: updateData });
    return data.code;
  } catch (error) {
    console.error('Error updating promo code:', error);
    return null;
  }
}

export async function deletePromoCode(id: string): Promise<boolean> {
  try {
    await apiSend(`/api/admin/promos?id=${encodeURIComponent(id)}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return false;
  }
}

export async function togglePromoCodeActive(id: string, active: boolean): Promise<boolean> {
  try {
    await apiSend('/api/admin/promos', 'PATCH', { id, input: { active } });
    return true;
  } catch (error) {
    console.error('Error toggling promo code:', error);
    return false;
  }
}

export async function validatePromoCode(
  code: string
): Promise<{ valid: boolean; promoCode: PromoCode | null; error?: string }> {
  try {
    return await apiSend<{ valid: boolean; promoCode: PromoCode | null; error?: string }>('/api/promo/validate', 'POST', {
      code: code.toUpperCase(),
    });
  } catch {
    return { valid: false, promoCode: null, error: 'Failed to validate code' };
  }
}

export function generateRandomCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function calculateDiscount(
  promo: PromoCode,
  basePrice: number
): { discountAmount: number; finalPrice: number } {
  let discountAmount = 0;
  if (promo.discount_type === 'percentage') {
    discountAmount = (basePrice * promo.discount_value) / 100;
  } else {
    discountAmount = promo.discount_value;
  }
  discountAmount = Math.min(discountAmount, basePrice);
  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round((basePrice - discountAmount) * 100) / 100,
  };
}
