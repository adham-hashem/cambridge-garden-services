import { apiGet, apiSend } from '@/lib/api';
import type { Booking } from '@/types/admin';

export type BookingStatus = 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';

export const bookingStatuses: { value: BookingStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export async function fetchAllBookings(
  page: number = 0,
  pageSize: number = 10,
  filters?: { search?: string; status?: BookingStatus | '' }
): Promise<{ bookings: Booking[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.status) params.set('status', filters.status);

  try {
    const data = await apiGet<{ bookings: Booking[]; total: number }>(`/api/admin/bookings?${params}`);
    return data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { bookings: [], total: 0 };
  }
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<boolean> {
  try {
    await apiSend('/api/admin/bookings', 'PATCH', { id, status });
    return true;
  } catch (error) {
    console.error('Error updating booking status:', error);
    return false;
  }
}

export async function updateBookingPrice(id: string, finalPrice: number): Promise<boolean> {
  try {
    await apiSend('/api/admin/bookings', 'PATCH', { id, final_price: finalPrice });
    return true;
  } catch (error) {
    console.error('Error updating booking price:', error);
    return false;
  }
}

export async function deleteBooking(id: string): Promise<boolean> {
  try {
    await apiSend(`/api/admin/bookings?id=${encodeURIComponent(id)}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting booking:', error);
    return false;
  }
}
