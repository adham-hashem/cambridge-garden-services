import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllBookings,
  updateBookingStatus,
  updateBookingPrice,
  deleteBooking,
  bookingStatuses,
  type BookingStatus,
} from '@/lib/bookings';
import type { Booking } from '@/types/admin';
import { fetchPublishedServices, type ServiceAdminItem } from '@/lib/services';
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Booking | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');
  const [priceSaving, setPriceSaving] = useState(false);
  const [services, setServices] = useState<ServiceAdminItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { bookings: data, total: count } = await fetchAllBookings(page, PAGE_SIZE, {
      search: search || undefined,
      status: statusFilter || undefined,
    });
    setBookings(data);
    setTotal(count);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchPublishedServices().then(setServices);
  }, []);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    await updateBookingStatus(id, status);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  };

  const handleSavePrice = async (id: string) => {
    const price = parseFloat(priceInput);
    if (isNaN(price)) return;
    setPriceSaving(true);
    await updateBookingPrice(id, price);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, final_price: price } : b));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, final_price: price } : null);
    setPriceSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteBooking(id);
    setConfirmDelete(null);
    load();
  };

  const openDetail = (booking: Booking) => {
    setSelected(booking);
    setPriceInput(booking.final_price?.toString() || '');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getServiceTitle = (serviceId: string | null) => {
    if (!serviceId) return null;
    return services.find((s) => s.id === serviceId)?.title || serviceId;
  };

  return (
    <div>
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
      ) : bookings.length === 0 ? (
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
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="cursor-pointer border-b border-sage-100 last:border-0 hover:bg-sage-50/30"
                      onClick={() => openDetail(booking)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-sans text-sm font-medium text-forest-800">{booking.name}</p>
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
                          {new Date(booking.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
              <p className="font-sans text-sm text-forest-500">Page {page + 1} of {totalPages} ({total} bookings)</p>
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
            <div className="sticky top-0 flex items-center justify-between border-b border-sage-200 bg-cream-50 px-6 py-4">
              <h2 className="font-serif text-xl font-medium text-forest-800">Booking Details</h2>
              <button onClick={() => setSelected(null)} className="text-forest-600 hover:text-forest-800"><X size={22} /></button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {/* Customer Info */}
              <div>
                <p className="mb-3 font-sans text-xs uppercase tracking-widest-2 text-forest-600">Customer</p>
                <div className="space-y-2 rounded-xl bg-sage-50/30 p-4">
                  <p className="font-serif text-lg font-medium text-forest-800">{selected.name}</p>
                  <div className="flex items-center gap-2 font-sans text-sm text-forest-600">
                    <Mail size={14} /> {selected.email}
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2 font-sans text-sm text-forest-600">
                      <Phone size={14} /> {selected.phone}
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
