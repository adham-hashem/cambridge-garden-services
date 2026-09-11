import { useState, useEffect, useRef, useCallback, type FormEvent, type ChangeEvent } from 'react';
import {
  fetchAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  uploadTestimonialPhoto,
} from '@/lib/testimonials';
import type { Testimonial, TestimonialInput } from '@/types/testimonial';
import {
  Star,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Upload,
  X,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function TestimonialsPanel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Testimonial | null>(null);

  // Form states for add/edit
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllTestimonials(page, 20, {
        search: search.trim() || undefined,
        rating: ratingFilter,
      });
      setTestimonials(data.testimonials);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching admin testimonials:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, ratingFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormRating(5);
    setFormComment('');
    setFormPublished(true);
    setFormPhotoUrl('');
    setFormPhotoFile(null);
    setFormPhotoPreview(null);
    setFormError(null);
    setEditModalOpen(true);
  };

  const openEditModal = (item: Testimonial) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormRating(item.rating);
    setFormComment(item.comment);
    setFormPublished(item.published);
    setFormPhotoUrl(item.customer_photo || '');
    setFormPhotoFile(null);
    setFormPhotoPreview(item.customer_photo || null);
    setFormError(null);
    setEditModalOpen(true);
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
    setFormPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFormPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormPhotoFile(null);
    setFormPhotoPreview(null);
    setFormPhotoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    if (!formComment.trim()) {
      setFormError('Comment / review text is required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      let finalPhotoUrl = formPhotoUrl;
      if (formPhotoFile) {
        finalPhotoUrl = await uploadTestimonialPhoto(formPhotoFile);
      }

      const input: TestimonialInput = {
        name: formName.trim(),
        rating: formRating,
        comment: formComment.trim(),
        customer_photo: finalPhotoUrl,
        customer_photo_alt: `${formName.trim()}'s review photo`,
        published: formPublished,
      };

      if (editingItem) {
        await updateTestimonial(editingItem.id, input);
      } else {
        await createTestimonial(input);
      }

      setEditModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to save testimonial:', err);
      const msg = err instanceof Error ? err.message : 'Error saving testimonial.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteTestimonial(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete testimonial:', err);
    }
  };

  const togglePublished = async (item: Testimonial) => {
    try {
      await updateTestimonial(item.id, { published: !item.published });
      setTestimonials((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, published: !t.published } : t))
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
            Testimonials Management
          </h2>
          <p className="font-sans text-xs text-forest-600/70 mt-1">
            View, moderate, edit, and delete customer reviews. {total} total testimonials.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 font-sans text-xs uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-900 shadow-sm"
        >
          <Plus size={14} /> Add Testimonial
        </button>
      </div>

      {/* Filter Bar */}
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
            placeholder="Search by customer name or comment..."
            className="w-full rounded-xl border border-sage-200 bg-cream-100/60 pl-10 pr-4 py-2 font-sans text-xs text-forest-900 placeholder-forest-400 outline-none focus:border-forest-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-sans text-forest-600 whitespace-nowrap">Filter Rating:</span>
          <select
            value={ratingFilter ?? ''}
            onChange={(e) => {
              setRatingFilter(e.target.value ? Number(e.target.value) : undefined);
              setPage(0);
            }}
            className="rounded-xl border border-sage-200 bg-cream-100/60 px-3 py-2 font-sans text-xs text-forest-900 outline-none focus:border-forest-600"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Table / List View */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="animate-spin text-forest-600 mx-auto mb-3" />
          <p className="text-xs text-forest-600 font-sans">Loading testimonials...</p>
        </div>
      ) : testimonials.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-sage-200 bg-cream-50 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-sage-200 bg-cream-100/80 text-forest-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Review Comment</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-200/60">
                {testimonials.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-100/50 transition-colors">
                    {/* Customer */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {item.customer_photo ? (
                          <img
                            src={item.customer_photo}
                            alt={item.name}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-sage-300"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-800 text-cream-50 font-serif text-sm font-medium">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-forest-900 text-sm">{item.name}</p>
                          {item.customer_photo && (
                            <span className="text-[10px] text-sage-600">Photo attached</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-sage-200'}
                          />
                        ))}
                        <span className="text-xs font-semibold text-forest-800 ml-1">
                          {item.rating}.0
                        </span>
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="px-5 py-4 max-w-xs">
                      <p className="line-clamp-2 text-forest-800/80 font-serif italic text-sm">
                        "{item.comment}"
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-forest-600">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePublished(item)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          item.published
                            ? 'bg-forest-100 text-forest-800 hover:bg-forest-200'
                            : 'bg-earth-100 text-earth-800 hover:bg-earth-200'
                        }`}
                      >
                        {item.published ? (
                          <>
                            <Eye size={11} /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff size={11} /> Hidden
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="rounded-lg p-1.5 text-forest-700 hover:bg-cream-200 hover:text-forest-900 transition-colors"
                          title="Edit Testimonial"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-earth-700 hover:bg-earth-100 hover:text-earth-900 transition-colors"
                          title="Delete Testimonial"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-sage-200 bg-cream-50 p-12 text-center">
          <p className="text-sm font-sans text-forest-600 font-light">
            No testimonials found. Click "+ Add Testimonial" to create one.
          </p>
        </div>
      )}

      {/* Edit / Add Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-3xl bg-cream-50 p-6 sm:p-8 shadow-2xl border border-sage-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-forest-600 hover:text-forest-900 rounded-full hover:bg-cream-200 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif text-2xl font-light text-forest-900 mb-2">
              {editingItem ? 'Edit Testimonial' : 'Add Testimonial'}
            </h3>
            <p className="text-xs font-sans text-forest-600 mb-6">
              {editingItem ? 'Modify customer details, star rating, or photo.' : 'Manually enter a customer review.'}
            </p>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-earth-100 p-3 text-xs text-earth-800">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-forest-700 mb-1.5">
                  Customer Name <span className="text-earth-600">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. John Davis"
                  required
                  className="w-full rounded-xl border border-sage-300 bg-cream-100/60 px-3.5 py-2.5 font-sans text-xs text-forest-900 outline-none focus:border-forest-600"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-forest-700 mb-1.5">
                  Star Rating (1 - 5)
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 rounded focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={star <= formRating ? 'fill-amber-400 text-amber-400' : 'text-sage-200'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-sans text-forest-800 font-medium ml-2">
                    {formRating} out of 5
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-forest-700 mb-1.5">
                  Review Text <span className="text-earth-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Customer's comments..."
                  required
                  className="w-full rounded-xl border border-sage-300 bg-cream-100/60 px-3.5 py-2.5 font-sans text-xs text-forest-900 outline-none focus:border-forest-600 resize-none"
                />
              </div>

              {/* Direct File Upload for Customer Photo (NO URLs) */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-widest text-forest-700 mb-1.5">
                  Customer Photo (File upload from device only)
                </label>

                {formPhotoPreview ? (
                  <div className="relative inline-block rounded-xl overflow-hidden border border-sage-300 mb-2">
                    <img
                      src={formPhotoPreview}
                      alt="Preview"
                      className="h-24 w-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-1 right-1 rounded-full bg-forest-900/80 p-1 text-cream-50 hover:bg-forest-900"
                      title="Remove Photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-sage-300 bg-cream-100/40 p-4 text-center cursor-pointer hover:border-forest-600 transition-colors"
                  >
                    <Upload size={20} className="text-forest-600 mb-1" />
                    <p className="text-xs font-sans text-forest-800 font-medium">
                      Select photo from device
                    </p>
                    <p className="text-[10px] text-forest-500 font-sans">
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
                  id="form_published"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded border-sage-300 text-forest-800 focus:ring-forest-600"
                />
                <label htmlFor="form_published" className="text-xs font-sans text-forest-800 cursor-pointer">
                  Publish immediately to public website
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sage-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
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
                  {editingItem ? 'Save Changes' : 'Create Testimonial'}
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
              Delete Testimonial?
            </h4>
            <p className="text-xs font-sans text-forest-600 mb-6 leading-relaxed">
              Are you sure you want to delete the testimonial from <strong className="font-medium text-forest-900">"{itemToDelete.name}"</strong>? This action cannot be undone.
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
