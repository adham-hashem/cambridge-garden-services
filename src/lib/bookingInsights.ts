import type { Booking } from '@/types/admin';

export type DateFilter = 'today' | 'tomorrow' | 'week' | 'nextWeek' | 'month' | 'custom' | 'range' | 'all';
export type DatePeriod = { start: string; end: string; label: string } | null;
const zone = 'Europe/London';

export function dateKey(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function timeLabel(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

export function dateLabel(key: string, options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options }).format(new Date(`${key}T12:00:00Z`));
}

export function addDays(key: string, count: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function weekStart(key: string): string {
  const weekday = new Date(`${key}T12:00:00Z`).getUTCDay();
  return addDays(key, -(weekday === 0 ? 6 : weekday - 1));
}

export function monthStart(key: string): string { return `${key.slice(0, 7)}-01`; }
export function monthEnd(key: string): string {
  return new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0)).toISOString().slice(0, 10);
}

export function periodFor(filter: DateFilter, today: string, customDate: string, startDate: string, endDate: string): DatePeriod {
  let start = '';
  let end = '';
  switch (filter) {
    case 'today': start = end = today; break;
    case 'tomorrow': start = end = addDays(today, 1); break;
    case 'week': start = weekStart(today); end = addDays(start, 6); break;
    case 'nextWeek': start = addDays(weekStart(today), 7); end = addDays(start, 6); break;
    case 'month': start = monthStart(today); end = monthEnd(today); break;
    case 'custom': start = end = customDate; break;
    case 'range': start = startDate; end = endDate; break;
    default: return null;
  }
  if (!start || !end || start > end) return { start: '', end: '', label: 'Select a valid date period' };
  return { start, end, label: start === end ? dateLabel(start, { day: 'numeric', month: 'long', year: 'numeric' }) : `${dateLabel(start, { day: 'numeric', month: 'short', year: 'numeric' })} – ${dateLabel(end, { day: 'numeric', month: 'short', year: 'numeric' })}` };
}

export function inPeriod(booking: Booking, period: DatePeriod): boolean {
  if (!period) return true;
  if (!period.start || !period.end || !booking.appointment_at) return false;
  const key = dateKey(booking.appointment_at);
  return key >= period.start && key <= period.end;
}

export function compareAppointments(a: Booking, b: Booking, now = Date.now()): number {
  if (!a.appointment_at && !b.appointment_at) return b.created_at.localeCompare(a.created_at);
  if (!a.appointment_at) return 1;
  if (!b.appointment_at) return -1;
  const aTime = new Date(a.appointment_at).getTime();
  const bTime = new Date(b.appointment_at).getTime();
  const aFuture = aTime >= now;
  const bFuture = bTime >= now;
  if (aFuture !== bFuture) return aFuture ? -1 : 1;
  return aFuture ? aTime - bTime : bTime - aTime;
}

export function chronological(a: Booking, b: Booking): number {
  return new Date(a.appointment_at || a.created_at).getTime() - new Date(b.appointment_at || b.created_at).getTime();
}

export function customerKey(booking: Booking): string {
  return booking.email.trim().toLowerCase() || booking.phone?.replace(/\D/g, '') || booking.id;
}
