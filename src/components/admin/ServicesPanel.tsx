import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  createService,
  deleteService,
  fetchAllServices,
  slugifyServiceId,
  toggleServicePublished,
  updateService,
  uploadServiceImage,
  type ServiceAdminItem,
  type ServiceInput,
} from '@/lib/services';
import {
  Check,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

const PAGE_SIZE = 10;

const emptyForm: ServiceInput = {
  id: '',
  title: '',
  description: '',
  image: '',
  alt: '',
  detail: '',
  heroImage: '',
  heroAlt: '',
  published: true,
  sort_order: 0,
};

export default function ServicesPanel() {
  const [services, setServices] = useState<ServiceAdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceAdminItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ServiceAdminItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { services: data, total: count } = await fetchAllServices(page, PAGE_SIZE, search || undefined);
    setServices(data);
    setTotal(count);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (input: ServiceInput, id?: string) => {
    const saved = id ? await updateService(id, input) : await createService(input);
    if (!saved) throw new Error('Failed to save service');
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (service: ServiceAdminItem) => {
    setDeleteError(null);
    const deleted = await deleteService(service.id);
    if (!deleted) {
      setDeleteError('This service may still have projects attached. Move or delete those projects first.');
      return;
    }
    setConfirmDelete(null);
    load();
  };

  const handleTogglePublished = async (service: ServiceAdminItem) => {
    await toggleServicePublished(service.id, !service.published);
    load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search services..."
            className="w-full rounded-full border border-sage-300/40 bg-cream-50 py-2.5 pl-10 pr-4 font-sans text-sm text-forest-800 placeholder-forest-400 outline-none focus:border-forest-500"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-2.5 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800"
        >
          <Plus size={16} />
          Add Service
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-forest-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-sans text-sm text-forest-500">No services found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-cream-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sage-200 bg-sage-50/50">
                    <th className="px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600">Service</th>
                    <th className="hidden px-4 py-3 text-left font-sans text-xs uppercase tracking-widest-2 text-forest-600 md:table-cell">Slug</th>
                    <th className="px-4 py-3 text-center font-sans text-xs uppercase tracking-widest-2 text-forest-600">Status</th>
                    <th className="px-4 py-3 text-right font-sans text-xs uppercase tracking-widest-2 text-forest-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-sage-100 last:border-0 hover:bg-sage-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={service.image} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
                          <div>
                            <p className="font-sans text-sm font-medium text-forest-800">{service.title}</p>
                            <p className="max-w-md truncate font-sans text-xs text-forest-400">{service.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-xs text-forest-500 md:table-cell">{service.id}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePublished(service)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs transition-colors ${
                            service.published
                              ? 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                              : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                          }`}
                        >
                          {service.published ? <Eye size={12} /> : <EyeOff size={12} />}
                          {service.published ? 'Published' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditing(service); setShowForm(true); }}
                            className="rounded-lg p-2 text-forest-600 transition-colors hover:bg-sage-100"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => { setDeleteError(null); setConfirmDelete(service); }}
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
              <p className="font-sans text-sm text-forest-500">Page {page + 1} of {totalPages} ({total} services)</p>
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
        <ServiceForm
          service={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-2xl">
            <h3 className="font-serif text-xl font-medium text-forest-800">Delete Service?</h3>
            <p className="mt-3 font-sans text-sm text-forest-600">
              Delete "{confirmDelete.title}"? Projects must be moved away from this service first.
            </p>
            {deleteError && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</div>}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
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

function ServiceForm({
  service,
  onSave,
  onClose,
}: {
  service: ServiceAdminItem | null;
  onSave: (input: ServiceInput, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ServiceInput>(
    service
      ? {
          id: service.id,
          title: service.title,
          description: service.description,
          image: service.image,
          alt: service.alt,
          detail: service.detail,
          heroImage: service.heroImage,
          heroAlt: service.heroAlt,
          published: service.published,
          sort_order: service.sort_order,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCard, setUploadingCard] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const update = (field: keyof ServiceInput, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateTitle = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      id: service ? prev.id : slugifyServiceId(value),
    }));
  };

  const handleImageUpload = async (file: File, slot: 'card' | 'hero') => {
    if (slot === 'card') setUploadingCard(true);
    else setUploadingHero(true);

    const url = await uploadServiceImage(file);

    if (slot === 'card') setUploadingCard(false);
    else setUploadingHero(false);

    if (!url) {
      setError('Failed to upload image. Please try again.');
      return;
    }

    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    if (slot === 'card') {
      update('image', url);
      if (!form.alt) update('alt', baseName);
    } else {
      update('heroImage', url);
      if (!form.heroAlt) update('heroAlt', baseName);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.title || !form.description || !form.detail || !form.image || !form.heroImage) {
      setError('Service title, text, and both images are required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(form, service?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-200 bg-cream-50 px-6 py-4">
          <h2 className="font-serif text-xl font-medium text-forest-800">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button onClick={onClose} className="text-forest-600 hover:text-forest-800"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Service Title" required value={form.title} onChange={updateTitle} />
            <FormField label="URL Slug" required value={form.id} onChange={(v) => update('id', slugifyServiceId(v))} disabled={Boolean(service)} />
          </div>

          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Short Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
              rows={2}
              className="w-full resize-none rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Detail Text</label>
            <textarea
              value={form.detail}
              onChange={(e) => update('detail', e.target.value)}
              required
              rows={5}
              className="w-full resize-y rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <ImageUploadField
              label="Service Card Image"
              value={form.image}
              uploading={uploadingCard}
              onUpload={(file) => handleImageUpload(file, 'card')}
            />
            <ImageUploadField
              label="Service Hero Image"
              value={form.heroImage}
              uploading={uploadingHero}
              onUpload={(file) => handleImageUpload(file, 'hero')}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Card Image Alt" value={form.alt} onChange={(v) => update('alt', v)} />
            <FormField label="Hero Image Alt" value={form.heroAlt} onChange={(v) => update('heroAlt', v)} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 pb-3">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => update('published', e.target.checked)}
                  className="h-5 w-5 rounded accent-forest-600"
                />
                <span className="font-sans text-sm text-forest-700">Published</span>
              </label>
            </div>
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploadingCard || uploadingHero}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {service ? 'Save Changes' : 'Create Service'}
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

function ImageUploadField({
  label,
  value,
  uploading,
  onUpload,
}: {
  label: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-sage-200">
          <img src={value} alt="" className="h-36 w-full object-cover" />
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-cream-50">
            <Check size={14} />
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 left-0 right-0 bg-forest-950/70 py-2 font-sans text-xs text-cream-100 transition-colors hover:bg-forest-950/90 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Replace Image'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sage-400/50 bg-cream-100/30 py-8 font-sans text-sm text-forest-600 transition-colors hover:border-forest-500 hover:bg-cream-100 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-forest-500" />
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100">
                {label.includes('Hero') ? <Upload size={20} className="text-forest-500" /> : <ImageIcon size={20} className="text-forest-500" />}
              </div>
              <span>Click to upload</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500 focus:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
