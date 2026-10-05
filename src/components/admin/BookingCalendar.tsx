import { useMemo, useState } from 'react';
import { addDays, chronological, dateKey, dateLabel, monthEnd, monthStart, timeLabel, weekStart } from '@/lib/bookingInsights';
import type { Booking } from '@/types/admin';

type View = 'month' | 'week' | 'day';

export default function BookingCalendar({ bookings, serviceName, onOpen }: {
  bookings: Booking[];
  serviceName: (booking: Booking) => string;
  onOpen: (booking: Booking) => void;
}) {
  const today = dateKey(new Date());
  const [view, setView] = useState<View>('month');
  const [focus, setFocus] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today);
  const byDay = useMemo(() => {
    const result = new Map<string, Booking[]>();
    for (const booking of bookings) {
      if (!booking.appointment_at) continue;
      const day = dateKey(booking.appointment_at);
      result.set(day, [...(result.get(day) || []), booking]);
    }
    for (const entries of result.values()) entries.sort(chronological);
    return result;
  }, [bookings]);
  const monthFirst = monthStart(focus);
  const monthLast = monthEnd(focus);
  const monthDays: string[] = [];
  for (let day = monthFirst; day <= monthLast; day = addDays(day, 1)) monthDays.push(day);
  const days = view === 'month'
    ? monthDays
    : view === 'week'
      ? Array.from({ length: 7 }, (_, index) => addDays(weekStart(focus), index))
      : [focus];
  const activeCount = (day: string) => (byDay.get(day) || []).filter((booking) => booking.status !== 'cancelled').length;
  const peak = Math.max(0, ...monthDays.map(activeCount));
  const busiest = [...monthDays].sort((a, b) => activeCount(b) - activeCount(a))[0];
  const quietest = [...monthDays].sort((a, b) => activeCount(a) - activeCount(b))[0];
  const availability = (day: string) => {
    const count = activeCount(day);
    if (!count) return { label: 'No bookings', className: 'border-sage-200 bg-cream-50 text-forest-500' };
    const ratio = count / peak;
    if (peak > 1 && ratio >= 0.75) return { label: 'Busy', className: 'border-red-200 bg-red-50 text-red-800' };
    if (peak > 2 && ratio >= 0.4) return { label: 'Moderate', className: 'border-amber-200 bg-amber-50 text-amber-800' };
    return { label: 'Available', className: 'border-green-200 bg-green-50 text-green-800' };
  };
  const shift = (direction: number) => {
    if (view === 'day') setFocus(addDays(focus, direction));
    else if (view === 'week') setFocus(addDays(focus, 7 * direction));
    else {
      const date = new Date(`${monthFirst}T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + direction);
      setFocus(date.toISOString().slice(0, 10));
    }
  };
  const selected = byDay.get(selectedDay) || [];

  return (
    <section className="mb-8 rounded-2xl bg-cream-50 p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-forest-800">Availability &amp; busy days</h2>
          <p className="mt-1 font-sans text-xs text-forest-500">Based on scheduled bookings in Cambridge time</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['month', 'week', 'day'] as const).map((option) => <button key={option} onClick={() => setView(option)} className={`rounded-full px-3 py-2 font-sans text-xs capitalize ${view === option ? 'bg-forest-700 text-white' : 'bg-sage-100 text-forest-700'}`}>{option} view</button>)}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button onClick={() => shift(-1)} className="rounded-full border border-sage-300 px-4 py-2 font-sans text-sm text-forest-700">Previous {view}</button>
        <button onClick={() => { setFocus(today); setSelectedDay(today); }} className="rounded-full bg-sage-100 px-4 py-2 font-sans text-sm text-forest-700">Today</button>
        <button onClick={() => shift(1)} className="rounded-full border border-sage-300 px-4 py-2 font-sans text-sm text-forest-700">Next {view}</button>
        <strong className="ml-auto font-sans text-sm text-forest-700">{view === 'month' ? dateLabel(monthFirst, { month: 'long', year: 'numeric' }) : view === 'week' ? `${dateLabel(days[0], { day: 'numeric', month: 'short' })} – ${dateLabel(days[6], { day: 'numeric', month: 'short', year: 'numeric' })}` : dateLabel(focus)}</strong>
      </div>
      <div className={`mt-4 grid gap-2 ${view === 'day' ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'}`}>
        {days.map((day) => {
          const state = availability(day);
          return <button key={day} onClick={() => { setSelectedDay(day); if (view === 'day') setFocus(day); }} className={`min-h-20 rounded-xl border p-3 text-left transition-shadow hover:shadow-md ${state.className} ${selectedDay === day ? 'ring-2 ring-forest-600' : ''}`} aria-label={`${dateLabel(day)}: ${(byDay.get(day) || []).length} bookings, ${state.label}`}>
            <span className="block font-sans text-xs font-medium">{dateLabel(day, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className="mt-2 block font-serif text-lg">{(byDay.get(day) || []).length} <span className="font-sans text-xs">bookings</span></span>
            <span className="block font-sans text-xs">{state.label}</span>
          </button>;
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-sans text-xs text-forest-600">
        <span>🟢 Available / low</span><span>🟡 Moderate</span><span>🔴 Busy / high</span><span>⚪ No bookings</span>
      </div>
      <div className="mt-5 grid gap-5 border-t border-sage-200 pt-5 lg:grid-cols-[2fr_1fr]">
        <div>
          <h3 className="font-serif text-lg text-forest-800">{dateLabel(selectedDay, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          <p className="mt-1 font-sans text-xs text-forest-600">Total bookings: {selected.length} · Confirmed: {selected.filter((b) => b.status === 'confirmed').length} · Pending: {selected.filter((b) => b.status === 'new' || b.status === 'contacted').length} · Completed: {selected.filter((b) => b.status === 'completed').length} · Cancelled: {selected.filter((b) => b.status === 'cancelled').length}</p>
          <div className="mt-3 space-y-2">
            {selected.map((booking) => <button key={booking.id} onClick={() => onOpen(booking)} className="block w-full rounded-lg bg-sage-50 px-3 py-2 text-left font-sans text-sm text-forest-700 hover:bg-sage-100">{timeLabel(booking.appointment_at!)} — {booking.name} — {serviceName(booking)} — {booking.status} <span className="text-forest-500">· View Booking</span></button>)}
            {!selected.length && <p className="font-sans text-sm text-forest-500">No bookings scheduled for this day.</p>}
          </div>
        </div>
        <div className="rounded-xl bg-sage-50 p-4 font-sans text-sm text-forest-700">
          <p className="mb-2 font-medium">This Month</p>
          <p>Busiest Day: {dateLabel(busiest)} — {activeCount(busiest)} bookings</p>
          <p className="mt-2">Quietest Day: {dateLabel(quietest)} — {activeCount(quietest)} bookings</p>
        </div>
      </div>
    </section>
  );
}
