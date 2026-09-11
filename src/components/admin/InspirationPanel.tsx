import { useState, useEffect, useRef, useCallback, type FormEvent, type ChangeEvent } from 'react';
import {
  fetchAllInspirations,
  createInspiration,
  updateInspiration,
  deleteInspiration,
  uploadInspirationImage,
} from '@/lib/inspirations';
import { fetchPublishedServices, type ServiceAdminItem } from '@/lib/services';
import type { GardenInspiration, GardenInspirationInput } from '@/types/inspiration';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  Upload,
  X,
  AlertCircle,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function InspirationPanel() {
  const [inspirations, setInspirations] = useState<GardenInspiration[]>([]);
  const [services, setServices] = useState<ServiceAdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GardenInspiration | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GardenInspiration | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPublishedServices().then((svcList) => {
      setServices(svcList);
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllInspirations(page, 24, {
        search: search.trim() || undefined,
        serviceId: serviceFilter !== 'all' ? serviceFilter : undefined,
      });
      setInspirations(data.inspirations);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching admin inspirations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, serviceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setFormServiceId(services.length > 0 ? services[0].id : '');
    setFormPublished(true);
    setFormImageUrl('');
    setFormImageFile(null);
    setFormImagePreview(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: GardenInspiration) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormServiceId(item.service_id);
    setFormPublished(item.published);
    setFormImageUrl(item.image);
    setFormImageFile(null);
    setFormImagePreview(item.image);
    setFormError(null);
    setModalOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFormError('Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError('Image must be smaller than 10 MB.');
      return;
    }

    setFormError(null);
    setFormImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFormImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormImageFile(null);
    setFormImagePreview(null);
    setFormImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Short description is required.');
      return;
    }
    if (!formServiceId) {
      setFormError('Please select an existing Service from the dropdown.');
      return;
    }
    if (!formImagePreview && !formImageUrl && !formImageFile) {
      setFormError('Please upload an image from your device.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      let finalImageUrl = formImageUrl;
      if (formImageFile) {
        finalImageUrl = await uploadInspirationImage(formImageFile);
      }

      const input: GardenInspirationInput = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        image: finalImageUrl,
        alt: formTitle.trim(),
        service_id: formServiceId,
        published: formPublished,
      };

      if (editingItem) {
        await updateInspiration(editingItem.id, input);
      } else {
        await createInspiration(input);
      }

      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to save inspiration item:', err);
      const msg = err instanceof Error ? err.message : 'Error saving inspiration item.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteInspiration(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete inspiration item:', err);
    }
  };

  const togglePublished = async (item: GardenInspiration) => {
    try {
      await updateInspiration(item.id, { published: !item.published });
      setInspirations((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, published: !i.published } : i))
      );
    } catch (err) {
      console.error('Failed to toggle published:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light text-forest-900">
            Garden Inspiration Management
          </h2>
          <p className="font-sans text-xs text-forest-600/70 mt-1">
            Manage standalone project and material photos linked to existing services. {total} total items.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 font-sans text-xs uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-900 shadow-sm"
        >
          <Plus size={14} /> Add Inspiration Item
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-cream-50 p-4 rounded-2xl border border-sage-200">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by item name or description..."
            className="w-full rounded-xl border border-sage-200 bg-cream-100/60 pl-10 pr-4 py-2 font-sans text-xs text-forest-900 placeholder-forest-400 outline-none focus:border-forest-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-sans text-forest-600 whitespace-nowrap">Filter Service:</span>
          <select
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setPage(0);
            }}
            className="rounded-xl border border-sage-200 bg-cream-100/60 px-3 py-2 font-sans text-xs text-forest-900 outline-none focus:border-forest-600 max-w-[200px]"
          >
            <option value="all">All Services</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="animate-spin text-forest-600 mx-auto mb-3" />
          <p className="text-xs text-forest-600 font-sans">Loading inspiration gallery...</p>
        </div>
      ) : inspirations.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {inspirations.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-sage-200 bg-cream-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] w-full bg-forest-950 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-forest-900/80 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-cream-50 shadow">
                      <Tag size={10} className="text-sage-300" />
                      {item.service_title || item.service_id}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-serif text-lg font-light text-forest-900 leading-snug">
                    {item.title}
                  </h4>
                  <p className="mt-1 font-sans text-xs text-forest-700/80 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-sage-200/60 flex items-center justify-between">
                <button
                  onClick={() => togglePublished(item)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    item.published
                      ? 'bg-forest-100 text-forest-800'
                      : 'bg-earth-100 text-earth-800'
                  }`}
                >
                  {item.published ? <Eye size={10} /> : <EyeOff size={10} />}
                  {item.published ? 'Live' : 'Hidden'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="rounded-lg p-1 text-forest-700 hover:bg-cream-200 hover:text-forest-900 transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setItemToDelete(item);
                      setDeleteModalOpen(true);
                    }}
                    className="rounded-lg p-1 text-earth-700 hover:bg-earth-100 hover:text-earth-900 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-sage-200 bg-cream-50 p-12 text-center">
          <p className="text-sm font-sans text-forest-600 font-light">
            No inspiration items found. Click "+ Add Inspiration Item" to create one.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-3xl bg-cream-50 p-6 sm:p-8 shadow-2xl border border-sage-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-forest-600 hover:text-forest-900 rounded-full hover:bg-cream-200 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif text-2xl font-light text-forest-900 mb-1">
              {editingItem ? 'Edit Inspiration Item' : 'Add Garden Inspiration'}
            </h3>
            <p className="text-xs font-sans text-forest-600 mb-6">
              Upload an image from your device and link it to an existing service category.
            </p>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-earth-100 p-3 text-xs text-earth-800">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-forest-700 mb-1.5">
                  Item Name <span className="text-earth-600">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Natural Sandstone Paving or Feather Edge Fencing"
                  required
                  className="w-full rounded-xl border border-sage-300 bg-cream-100/60 px-3.5 py-2.5 font-sans text-xs text-forest-900 outline-none focus:border-forest-600"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-forest-700 mb-1.5">
                  Short Description <span className="text-earth-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Precision-laid grey sandstone patio with durable pointing..."
                  required
                  className="w-full rounded-xl border border-sage-300 bg-cream-100/60 px-3.5 py-2.5 font-sans text-xs text-forest-900 outline-none focus:border-forest-600 resize-none"
                />
              </div>

              {/* Required Existing Service Dropdown */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-forest-700 mb-1.5">
                  Assigned Service <span className="text-earth-600">*</span>
                </label>
                <select
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-sage-300 bg-cream-100/60 px-3.5 py-2.5 font-sans text-xs text-forest-900 outline-none focus:border-forest-600"
                >
                  <option value="" disabled>
                    Select an existing service...
                  </option>
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-forest-500 font-sans">
                  Uses existing website services. Matches bookings directly.
                </p>
              </div>

              {/* Direct File Upload from Device (NO URLs) */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-forest-700 mb-1.5">
                  Upload Image from Device <span className="text-earth-600">*</span>
                </label>

                {formImagePreview ? (
                  <div className="relative inline-block rounded-xl overflow-hidden border border-sage-300 mb-2">
                    <img
                      src={formImagePreview}
                      alt="Selected preview"
                      className="h-32 w-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1.5 right-1.5 rounded-full bg-forest-900/80 p-1 text-cream-50 hover:bg-forest-900"
                      title="Replace Image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-sage-300 bg-cream-100/40 p-5 text-center cursor-pointer hover:border-forest-600 transition-colors"
                  >
                    <Upload size={22} className="text-forest-600 mb-1" />
                    <p className="text-xs font-sans text-forest-800 font-medium">
                      Select photo from device (Direct File Upload Only)
                    </p>
                    <p className="text-[10px] text-forest-500 font-sans mt-0.5">
                      JPEG, PNG, WebP or GIF up to 10MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="insp_published"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded border-sage-300 text-forest-800 focus:ring-forest-600"
                />
                <label htmlFor="insp_published" className="text-xs font-sans text-forest-800 cursor-pointer">
                  Publish immediately to public Inspiration gallery
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sage-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full px-5 py-2 font-sans text-xs text-forest-700 hover:bg-cream-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-6 py-2 font-sans text-xs uppercase tracking-widest text-cream-50 font-medium hover:bg-forest-900 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Publish Inspiration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-cream-50 p-6 shadow-2xl border border-sage-200 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-earth-100 text-earth-700 mb-4">
              <Trash2 size={24} />
            </div>
            <h4 className="font-serif text-xl font-light text-forest-900 mb-2">
              Delete Inspiration Item?
            </h4>
            <p className="text-xs font-sans text-forest-600 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="font-medium text-forest-900">"{itemToDelete.title}"</strong>? It will be removed from the gallery immediately.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="rounded-full px-5 py-2 font-sans text-xs text-forest-700 hover:bg-cream-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-full bg-earth-700 px-6 py-2 font-sans text-xs uppercase tracking-widest text-cream-50 font-medium hover:bg-earth-800 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
