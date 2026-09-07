import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  fetchAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeActive,
  generateRandomCode,
} from '@/lib/promoCodes';
import type { PromoCode, PromoCodeInput } from '@/types/admin';
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Tag,
  X,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function PromoCodesPanel() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PromoCode | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { codes: data, total: count } = await fetchAllPromoCodes(page, PAGE_SIZE, search || undefined);
    setCodes(data);
    setTotal(count);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (input: PromoCodeInput, id?: string) => {
    if (id) {
      await updatePromoCode(id, input);
    } else {
      await createPromoCode(input);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await deletePromoCode(id);
    setConfirmDelete(null);
    load();
  };

  const handleToggle = async (code: PromoCode) => {
    await togglePromoCodeActive(code.id, !code.active);
    load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search codes..."
              className="w-full rounded-full border border-sage-300/40 bg-cream-50 py-2.5 pl-10 pr-4 font-sans text-sm text-forest-800 placeholder-forest-400 outline-none transition-colors focus:border-forest-500"
            />
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-2.5 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800"
        >
          <Plus size={16} />
          Add Code
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-forest-600" />
        </div>
      ) : codes.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-sans text-sm text-forest-500">No promo codes found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-cream-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sage-200 bg-sage-50/50">
                    <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600">Code</th>
                    <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600">Discount</th>
                    <th className="hidden px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600 sm:table-cell">Expires</th>
                    <th className="px-4 py-3 text-center font-sans text-xs uppercase tracking-widest-2 text-forest-600">Usage</th>
                    <th className="px-4 py-3 text-center font-sans text-xs uppercase tracking-widest-2 text-forest-600">Status</th>
                    <th className="px-4 py-3 text-right font-sans text-xs uppercase tracking-widest-2 text-forest-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code.id} className="border-b border-sage-100 last:border-0 hover:bg-sage-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-forest-500" />
                          <span className="font-mono text-sm font-medium text-forest-800">{code.code}</span>
                        </div>
                        {code.description && (
                          <p className="mt-1 ml-6 font-sans text-xs text-forest-400">{code.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-sans text-sm text-forest-700">
                          {code.discount_type === 'percentage'
                            ? `${code.discount_value}%`
                            : `£${code.discount_value}`}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        {code.expires_at ? (
                          <span className="flex items-center gap-1 font-sans text-xs text-forest-600">
                            <Calendar size={12} />
                            {new Date(code.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="font-sans text-xs text-forest-400">No expiry</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="flex items-center justify-center gap-1 font-sans text-xs text-forest-600">
                          <TrendingUp size={12} />
                          {code.usage_count}
                          {code.usage_limit !== null && ` / ${code.usage_limit}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(code)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs transition-colors ${
                            code.active
                              ? 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                              : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                          }`}
                        >
                          {code.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {code.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditing(code); setShowForm(true); }}
                            className="rounded-lg p-2 text-forest-600 transition-colors hover:bg-sage-100"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(code)}
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
              <p className="font-sans text-sm text-forest-500">Page {page + 1} of {totalPages} ({total} codes)</p>
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

      {showForm && (
        <PromoCodeForm
          code={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-2xl">
            <h3 className="font-serif text-xl font-medium text-forest-800">Delete Promo Code?</h3>
            <p className="mt-3 font-sans text-sm text-forest-600">
              Delete "{confirmDelete.code}"? This cannot be undone.
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

function PromoCodeForm({
  code,
  onSave,
  onClose,
}: {
  code: PromoCode | null;
  onSave: (input: PromoCodeInput, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PromoCodeInput>(
    code
      ? {
          code: code.code,
          description: code.description,
          discount_type: code.discount_type,
          discount_value: code.discount_value,
          expires_at: code.expires_at ? code.expires_at.slice(0, 10) : null,
          usage_limit: code.usage_limit,
          active: code.active,
        }
      : {
          code: '',
          description: null,
          discount_type: 'percentage',
          discount_value: 10,
          expires_at: null,
          usage_limit: null,
          active: true,
        }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof PromoCodeInput, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    update('code', generateRandomCode(8));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError('Code is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form, code?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream-50 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-sage-200 bg-cream-50 px-6 py-4">
          <h2 className="font-serif text-xl font-medium text-forest-800">
            {code ? 'Edit Code' : 'Add Promo Code'}
          </h2>
          <button onClick={onClose} className="text-forest-600 hover:text-forest-800"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {/* Code */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.code}
                onChange={(e) => update('code', e.target.value.toUpperCase())}
                required
                placeholder="e.g. SPRING25"
                className="flex-1 rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-mono text-sm text-forest-800 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
              />
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-1.5 rounded-xl bg-sage-100 px-4 py-3 font-sans text-sm text-forest-600 transition-colors hover:bg-sage-200"
                title="Generate random code"
              >
                <RefreshCw size={16} />
                Generate
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Description (optional)</label>
            <input
              type="text"
              value={form.description || ''}
              onChange={(e) => update('description', e.target.value || null)}
              placeholder="e.g. Spring sale 25% off"
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          {/* Discount Type + Value */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => update('discount_type', e.target.value)}
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (£)</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
                {form.discount_type === 'percentage' ? 'Percentage (0-100)' : 'Amount (£)'}
              </label>
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) => update('discount_value', parseFloat(e.target.value) || 0)}
                min={0}
                max={form.discount_type === 'percentage' ? 100 : undefined}
                required
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
              />
            </div>
          </div>

          {/* Expiry + Usage Limit */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Expiration Date (optional)</label>
              <input
                type="date"
                value={form.expires_at || ''}
                onChange={(e) => update('expires_at', e.target.value || null)}
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
              />
            </div>
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Usage Limit (optional)</label>
              <input
                type="number"
                value={form.usage_limit ?? ''}
                onChange={(e) => update('usage_limit', e.target.value ? parseInt(e.target.value) : null)}
                min={0}
                placeholder="Unlimited"
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 placeholder-forest-400 outline-none focus:border-forest-500"
              />
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => update('active', e.target.checked)}
              className="h-5 w-5 rounded accent-forest-600"
            />
            <span className="font-sans text-sm text-forest-700">Active</span>
          </label>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {code ? 'Save Changes' : 'Create Code'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-sage-300 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-forest-700 transition-all hover:bg-sage-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
