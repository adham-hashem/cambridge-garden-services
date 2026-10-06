import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchBookingOverview,
  updateBookingStatus,
  updateBookingPrice,
  updateBookingAppointment,
  deleteBooking,
  bookingStatuses,
  type BookingStatus,
} from '@/lib/bookings';
import type { Booking } from '@/types/admin';
import { fetchPublishedServices, type ServiceAdminItem } from '@/lib/services';
import { addDays, compareAppointments, dateKey, dateLabel, inPeriod, periodFor, timeLabel, weekStart, type DateFilter } from '@/lib/bookingInsights';
import { downloadBookingPdf, downloadBookingReport, downloadCustomerReport, downloadDailySchedule, downloadMonthlyReport, downloadServiceReport, downloadWeeklySchedule } from '@/lib/bookingPdf';
import BookingCalendar from '@/components/admin/BookingCalendar';
import {
  Search,
  Trash2,
  Loader2,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  PoundSterling,
  Image as ImageIcon,
  ChevronDown,
  Download,
} from 'lucide-react';

const PAGE_SIZE = 10;

const statusColors: Record<BookingStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-forest-100 text-forest-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function BookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Booking | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');
  const [priceSaving, setPriceSaving] = useState(false);
  const [services, setServices] = useState<ServiceAdminItem[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [reportWeek, setReportWeek] = useState(dateKey(new Date()));
  const [reportMonth, setReportMonth] = useState(dateKey(new Date()).slice(0, 7));
  const [appointmentInput, setAppointmentInput] = useState('');
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');
  const today = dateKey(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await fetchBookingOverview());
      setError('');
    } catch {
      setError('Bookings could not be loaded. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchPublishedServices().then(setServices);
  }, []);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    if (!await updateBookingStatus(id, status)) { setError('Status could not be saved.'); return; }
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  };

  const handleSavePrice = async (id: string) => {
    const price = parseFloat(priceInput);
    if (isNaN(price)) return;
    setPriceSaving(true);
    if (!await updateBookingPrice(id, price)) { setError('Price could not be saved.'); setPriceSaving(false); return; }
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, final_price: price } : b));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, final_price: price } : null);
    setPriceSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!await deleteBooking(id)) { setError('Booking could not be deleted.'); return; }
    setConfirmDelete(null);
    setSelected(null);
    load();
  };

  const openDetail = (booking: Booking) => {
    setSelected(booking);
    setPriceInput(booking.final_price?.toString() || '');
    setAppointmentInput(booking.appointment_at ? new Date(booking.appointment_at).toISOString().slice(0, 16) : '');
  };

  const getServiceTitle = (serviceId: string | null) => {
    if (!serviceId) return null;
    return services.find((s) => s.id === serviceId)?.title || serviceId;
  };
  const serviceName = (booking: Booking) => getServiceTitle(booking.service_id) || booking.project_type;
  const serviceNames = Object.fromEntries(services.map((service) => [service.id, service.title]));
  const period = useMemo(() => periodFor(dateFilter, today, customDate, rangeStart, rangeEnd), [dateFilter, today, customDate, rangeStart, rangeEnd]);
  const filtered = useMemo(() => bookings.filter((booking) => {
    if (!inPeriod(booking, period)) return false;
    if (statusFilter && booking.status !== statusFilter) return false;
    const term = search.trim().toLowerCase();
    return !term || [booking.name, booking.email, booking.phone, booking.address].some((value) => value?.toLowerCase().includes(term));
  }).sort((a, b) => compareAppointments(a, b)), [bookings, period, search, statusFilter]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const todayBookings = bookings.filter((booking) => booking.appointment_at && dateKey(booking.appointment_at) === today && booking.status === 'confirmed').sort((a, b) => new Date(a.appointment_at!).getTime() - new Date(b.appointment_at!).getTime());
  const summary = [
    ['New Bookings', bookings.filter((booking) => booking.status === 'new').length],
    ["Today's Bookings", bookings.filter((booking) => booking.appointment_at && dateKey(booking.appointment_at) === today && booking.status !== 'cancelled').length],
    ['Upcoming Bookings', bookings.filter((booking) => booking.appointment_at && new Date(booking.appointment_at).getTime() >= Date.now() && booking.status !== 'cancelled' && booking.status !== 'completed').length],
    ['Completed', bookings.filter((booking) => booking.status === 'completed').length],
    ['Cancelled', bookings.filter((booking) => booking.status === 'cancelled').length],
  ] as const;
  const runExport = async (name: string, action: () => Promise<void>) => {
    setExporting(name);
    setError('');
    try { await action(); } catch (cause) { console.error(cause); setError('PDF could not be generated. Please try again.'); }
    finally { setExporting(''); }
  };
  const saveAppointment = async () => {
    if (!selected) return;
    setAppointmentSaving(true);
    // The input is labelled in the admin's local time; the stored value is UTC.
    const iso = appointmentInput ? new Date(appointmentInput).toISOString() : null;
    if (!await updateBookingAppointment(selected.id, iso)) setError('Appointment could not be saved. Check that the database migration has been applied.');
    else {
      setBookings((previous) => previous.map((booking) => booking.id === selected.id ? { ...booking, appointment_at: iso } : booking));
      setSelected((previous) => previous ? { ...previous, appointment_at: iso } : null);
      setError('');
    }
    setAppointmentSaving(false);
  };

  return (
    <div>
      {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 font-sans text-sm text-red-700">{error} <button onClick={load} className="ml-2 underline">Retry</button></div>}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {summary.map(([label, count]) => <div key={label} className={`rounded-2xl bg-cream-50 p-4 shadow-sm ${label === 'New Bookings' && count ? 'ring-2 ring-blue-400' : ''}`}>
          <p className="font-sans text-xs text-forest-600">{label}</p>
          <p className={`mt-2 font-serif text-2xl ${label === 'New Bookings' && count ? 'text-blue-700' : 'text-forest-800'}`}>{count}</p>
        </div>)}
      </div>

      <section className="mb-7 rounded-2xl bg-cream-50 p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-serif text-xl text-forest-800">Today's Schedule</h2><p className="mt-1 font-sans text-xs text-forest-500">Confirmed appointments · {dateLabel(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
          <button onClick={() => runExport('daily', () => downloadDailySchedule(bookings.filter((b) => b.appointment_at && dateKey(b.appointment_at) === today), today, serviceNames))} disabled={!!exporting} className="flex items-center gap-2 rounded-full border border-sage-300 px-4 py-2 font-sans text-xs text-forest-700 hover:bg-sage-100 disabled:opacity-50"><Download size={14} />Download Today's Schedule</button>
        </div>
        <div className="mt-4 space-y-2">
          {todayBookings.map((booking) => <button key={booking.id} onClick={() => openDetail(booking)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-sage-50 px-4 py-3 text-left font-sans text-sm text-forest-700 hover:bg-sage-100"><strong>{timeLabel(booking.appointment_at!)}</strong><span>{booking.name}</span><span>{serviceName(booking)}</span><span className="rounded-full bg-forest-100 px-2 py-0.5 text-xs">{booking.status}</span><span className="ml-auto text-xs underline">View Booking</span></button>)}
          {!todayBookings.length && <p className="font-sans text-sm text-forest-500">No bookings scheduled for today.</p>}
        </div>
      </section>

      <BookingCalendar bookings={bookings} serviceName={serviceName} onOpen={openDetail} />

      <section className="mb-6 rounded-2xl bg-cream-50 p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-xl text-forest-800">Bookings</h2><p className="mt-1 font-sans text-xs text-forest-500">Dates use scheduled appointments. Unscheduled enquiries appear in All Bookings.</p></div><button onClick={() => runExport('bookings', () => downloadBookingReport(filtered, period, serviceNames))} disabled={!!exporting || !!(period && !period.start)} className="flex items-center gap-2 rounded-full bg-forest-700 px-4 py-2 font-sans text-xs text-white hover:bg-forest-800 disabled:opacity-50"><Download size={14} />Download Report PDF</button></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'This Week'], ['nextWeek', 'Next Week'], ['month', 'This Month'], ['custom', 'Custom Date'], ['range', 'Custom Date Range'], ['all', 'All Bookings'],
          ] as [DateFilter, string][]).map(([value, label]) => <button key={value} onClick={() => { setDateFilter(value); setPage(0); }} className={`rounded-full px-4 py-2 font-sans text-xs ${dateFilter === value ? 'bg-forest-700 text-white' : 'bg-sage-100 text-forest-700 hover:bg-sage-200'}`}>{label}</button>)}
        </div>
        {dateFilter === 'custom' && <label className="mt-4 block font-sans text-xs text-forest-600">Booking date<input type="date" value={customDate} onChange={(e) => { setCustomDate(e.target.value); setPage(0); }} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm text-forest-800" /></label>}
        {dateFilter === 'range' && <div className="mt-4 flex flex-wrap gap-3"><label className="font-sans text-xs text-forest-600">Start date<input type="date" value={rangeStart} max={rangeEnd || undefined} onChange={(e) => { setRangeStart(e.target.value); setPage(0); }} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm text-forest-800" /></label><label className="font-sans text-xs text-forest-600">End date<input type="date" value={rangeEnd} min={rangeStart || undefined} onChange={(e) => { setRangeEnd(e.target.value); setPage(0); }} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm text-forest-800" /></label></div>}
        <p className="mt-3 font-sans text-xs text-forest-500">{period?.label || 'All booking dates'} · {filtered.length} bookings</p>
      </section>

      <section className="mb-6 rounded-2xl bg-cream-50 p-4 shadow-sm sm:p-6">
        <h2 className="font-serif text-xl text-forest-800">PDF Reports</h2>
        <p className="mt-1 font-sans text-xs text-forest-500">Customer and service reports use the selected booking date filter above.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="font-sans text-xs text-forest-600">Week containing<input type="date" value={reportWeek} onChange={(e) => setReportWeek(e.target.value)} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm" /></label>
          <button onClick={() => { const start = weekStart(reportWeek); const days = Array.from({ length: 7 }, (_, index) => addDays(start, index)); runExport('weekly', () => downloadWeeklySchedule(bookings.filter((booking) => booking.appointment_at && dateKey(booking.appointment_at) >= days[0] && dateKey(booking.appointment_at) <= days[6]), days, serviceNames)); }} disabled={!!exporting || !reportWeek} className="rounded-full border border-sage-300 px-4 py-2 font-sans text-xs text-forest-700 disabled:opacity-50">Download Weekly Schedule</button>
          <label className="font-sans text-xs text-forest-600">Report month<input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm" /></label>
          <button onClick={() => runExport('monthly', () => downloadMonthlyReport(bookings.filter((booking) => booking.appointment_at && dateKey(booking.appointment_at).startsWith(reportMonth)), bookings, reportMonth, serviceNames))} disabled={!!exporting || !reportMonth} className="rounded-full border border-sage-300 px-4 py-2 font-sans text-xs text-forest-700 disabled:opacity-50">Download Monthly Report</button>
          <button onClick={() => runExport('customers', () => downloadCustomerReport(filtered, bookings, period, serviceNames))} disabled={!!exporting || !!(period && !period.start)} className="rounded-full border border-sage-300 px-4 py-2 font-sans text-xs text-forest-700 disabled:opacity-50">Download Customer Report</button>
          <button onClick={() => runExport('services', () => downloadServiceReport(filtered, bookings, period, serviceNames))} disabled={!!exporting || !!(period && !period.start)} className="rounded-full border border-sage-300 px-4 py-2 font-sans text-xs text-forest-700 disabled:opacity-50">Download Service Performance</button>
        </div>
      </section>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search name, email, phone..."
            className="w-full rounded-full border border-sage-300/40 bg-cream-50 py-2.5 pl-10 pr-4 font-sans text-sm text-forest-800 placeholder-forest-400 outline-none focus:border-forest-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as BookingStatus | ''); setPage(0); }}
          className="rounded-full border border-sage-300/40 bg-cream-50 px-4 py-2.5 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
        >
          <option value="">All Statuses</option>
          {bookingStatuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-forest-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-sans text-sm text-forest-500">No bookings found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-cream-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sage-200 bg-sage-50/50">
                    <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600">Customer</th>
                    <th className="hidden px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600 md:table-cell">Service</th>
                    <th className="hidden px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600 lg:table-cell">Date</th>
                    <th className="px-4 py-3 text-center font-sans text-xs uppercase tracking-widest-2 text-forest-600">Status</th>
                    <th className="hidden px-4 py-3 text-right font-sans text-xs uppercase tracking-widest-2 text-forest-600 sm:table-cell">Budget</th>
                    <th className="px-4 py-3 text-right font-sans text-xs uppercase tracking-widest-2 text-forest-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((booking) => (
                    <tr
                      key={booking.id}
                      className={`cursor-pointer border-b border-sage-100 last:border-0 hover:bg-sage-50/30 ${booking.status === 'new' ? 'bg-blue-50/70 border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => openDetail(booking)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-sans text-sm font-medium text-forest-800">{booking.name}</p>
                          {booking.status === 'new' && <span className="rounded-full bg-blue-600 px-2 py-0.5 font-sans text-[10px] font-bold uppercase text-white">NEW</span>}
                          <p className="font-sans text-xs text-forest-400">{booking.email}</p>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="rounded-full bg-sage-100 px-3 py-1 font-sans text-xs text-forest-600">
                          {getServiceTitle(booking.service_id) || booking.project_type}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="font-sans text-xs text-forest-600">
                          {booking.appointment_at ? `${dateLabel(dateKey(booking.appointment_at), { day: 'numeric', month: 'short', year: 'numeric' })} ${timeLabel(booking.appointment_at)}` : 'Unscheduled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block">
                          <select
                            value={booking.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value as BookingStatus)}
                            className={`cursor-pointer appearance-none rounded-full border-0 px-3 py-1 pr-7 font-sans text-xs font-medium outline-none ${statusColors[booking.status as BookingStatus] || 'bg-sage-100 text-sage-600'}`}
                          >
                            {bookingStatuses.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-50" />
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-right sm:table-cell">
                        <span className="font-sans text-sm text-forest-700">
                          {booking.budget || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setConfirmDelete(booking)}
                            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="font-sans text-sm text-forest-500">Page {page + 1} of {totalPages} ({filtered.length} bookings)</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-full border border-sage-300 px-4 py-2 font-sans text-sm text-forest-700 transition-all hover:bg-sage-100 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-full border border-sage-300 px-4 py-2 font-sans text-sm text-forest-700 transition-all hover:bg-sage-100 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream-50 shadow-2xl">
            <div className="sticky top-0 flex flex-wrap items-center justify-between gap-3 border-b border-sage-200 bg-cream-50 px-6 py-4">
              <h2 className="font-serif text-xl font-medium text-forest-800">Booking Details {selected.status === 'new' && <span className="ml-2 rounded-full bg-blue-600 px-2 py-1 align-middle font-sans text-xs text-white">NEW</span>}</h2>
              <div className="flex items-center gap-3"><button onClick={() => runExport('individual', () => downloadBookingPdf(selected, serviceNames))} disabled={!!exporting} className="flex items-center gap-2 rounded-full bg-forest-700 px-4 py-2 font-sans text-xs text-white disabled:opacity-50"><Download size={14} />Download PDF</button><button onClick={() => setSelected(null)} aria-label="Close booking details" className="text-forest-600 hover:text-forest-800"><X size={22} /></button></div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <p className="mb-3 font-sans text-xs uppercase tracking-widest-2 text-forest-600">Appointment</p>
                <div className="rounded-xl bg-sage-50/30 p-4">
                  <p className="font-sans text-sm text-forest-700">{selected.appointment_at ? `${dateLabel(dateKey(selected.appointment_at), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at ${timeLabel(selected.appointment_at)} (Cambridge time)` : 'Not scheduled'}</p>
                  <div className="mt-3 flex flex-wrap items-end gap-2"><label className="font-sans text-xs text-forest-600">Set appointment (your local time)<input type="datetime-local" value={appointmentInput} onChange={(e) => setAppointmentInput(e.target.value)} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 font-sans text-sm text-forest-800" /></label><button onClick={saveAppointment} disabled={appointmentSaving} className="rounded-lg bg-forest-700 px-4 py-2.5 font-sans text-xs text-white disabled:opacity-50">{appointmentSaving ? 'Saving...' : 'Save Appointment'}</button>{selected.appointment_at && <button onClick={() => setAppointmentInput('')} className="px-2 py-2 font-sans text-xs text-forest-600 underline">Clear date</button>}</div>
                </div>
              </div>
              {/* Customer Info */}
              <div>
                <p className="mb-3 font-sans text-xs uppercase tracking-widest-2 text-forest-600">Customer</p>
                <div className="space-y-2 rounded-xl bg-sage-50/30 p-4">
                  <p className="font-serif text-lg font-medium text-forest-800">{selected.name}</p>
                  <div className="flex items-center gap-2 font-sans text-sm text-forest-600">
                    <Mail size={14} /> <a href={`mailto:${selected.email}`} className="transition-colors hover:text-forest-800 hover:underline focus-visible:underline">{selected.email}</a>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2 font-sans text-sm text-forest-600">
                      <Phone size={14} /> <a href={`tel:${selected.phone}`} className="transition-colors hover:text-forest-800 hover:underline focus-visible:underline">{selected.phone}</a>
                    </div>
                  )}
                  {selected.address && (
                    <div className="flex items-center gap-2 font-sans text-sm text-forest-600">
                      <MapPin size={14} /> {selected.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Info */}
              <div>
                <p className="mb-3 font-sans text-xs uppercase tracking-widest-2 text-forest-600">Project</p>
                <div className="space-y-2 rounded-xl bg-sage-50/30 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-forest-100 px-3 py-1 font-sans text-xs text-forest-700">
                      {getServiceTitle(selected.service_id) || selected.project_type}
                    </span>
                    {selected.budget && (
                      <span className="rounded-full bg-sage-100 px-3 py-1 font-sans text-xs text-forest-600">
                        Budget: {selected.budget}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-sans text-xs text-forest-400">
                    <Calendar size={12} />
                    Submitted: {new Date(selected.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-forest-700">{selected.project_details}</p>
                </div>
              </div>

              {/* Uploaded Image */}
              {selected.attachment_url && (
                <div>
                  <p className="mb-3 flex items-center gap-1 font-sans text-xs uppercase tracking-widest-2 text-forest-600">
                    <ImageIcon size={12} /> Uploaded Image
                  </p>
                  <img
                    src={selected.attachment_url}
                    alt={selected.attachment_name || 'Customer upload'}
                    className="h-48 w-full rounded-xl object-cover"
                  />
                  {selected.attachment_name && (
                    <p className="mt-1 font-sans text-xs text-forest-400">{selected.attachment_name}</p>
                  )}
                </div>
              )}

              {/* Promo + Price */}
              <div>
                <p className="mb-3 font-sans text-xs uppercase tracking-widest-2 text-forest-600">Budget and Final Price</p>
                <div className="space-y-3 rounded-xl bg-sage-50/30 p-4">
                  {selected.budget && (
                    <div className="font-sans text-sm text-forest-600">
                      Customer budget: <span className="font-medium text-forest-800">{selected.budget}</span>
                    </div>
                  )}
                  {selected.promo_code && (
                    <div className="flex items-center gap-2 font-sans text-sm text-forest-600">
                      <Tag size={14} />
                      Promo: <span className="font-mono font-medium">{selected.promo_code}</span>
                      {selected.discount_amount != null && (
                        <span className="text-forest-500">(-£{selected.discount_amount})</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block font-sans text-xs text-forest-500">Final Price (£)</label>
                      <div className="flex items-center gap-2">
                        <PoundSterling size={16} className="text-forest-400" />
                        <input
                          type="number"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          placeholder="Set price..."
                          className="flex-1 rounded-lg border border-sage-300/40 bg-cream-50 px-3 py-2 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleSavePrice(selected.id)}
                      disabled={priceSaving}
                      className="rounded-lg bg-forest-700 px-4 py-2.5 font-sans text-sm text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-50"
                    >
                      {priceSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="mb-3 font-sans text-xs uppercase tracking-widest-2 text-forest-600">Status</p>
                <div className="flex flex-wrap gap-2">
                  {bookingStatuses.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(selected.id, s.value)}
                      className={`rounded-full px-4 py-2 font-sans text-xs font-medium transition-all ${
                        selected.status === s.value
                          ? statusColors[s.value]
                          : 'bg-sage-50 text-forest-400 hover:bg-sage-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-2xl">
            <h3 className="font-serif text-xl font-medium text-forest-800">Delete Booking?</h3>
            <p className="mt-3 font-sans text-sm text-forest-600">
              Delete the booking from "{confirmDelete.name}"? This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 rounded-full bg-red-600 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-white transition-all hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-full border border-sage-300 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-forest-700 transition-all hover:bg-sage-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
