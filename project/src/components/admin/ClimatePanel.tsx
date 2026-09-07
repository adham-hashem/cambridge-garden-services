import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import {
  fetchClimateSectionAdmin,
  updateClimateSection,
  createClimateOption,
  updateClimateOption,
  deleteClimateOption,
  uploadClimateImage,
} from '@/lib/climate';
import type { ClimateSectionData, ClimateOption, ClimateSectionInput, ClimateOptionInput } from '@/types/climate';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  ImageIcon,
} from 'lucide-react';

export default function ClimatePanel() {
  const [data, setData] = useState<ClimateSectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [sectionForm, setSectionForm] = useState<ClimateSectionInput>({
    title: '',
    description: '',
    final_message: '',
    cta_label: '',
  });
  const [editingOption, setEditingOption] = useState<ClimateOption | null>(null);
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ClimateOption | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetchClimateSectionAdmin();
    setData(d);
    if (d) {
      setSectionForm({
        title: d.title,
        description: d.description,
        final_message: d.final_message,
        cta_label: d.cta_label,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveSection = async () => {
    setSavingSection(true);
    await updateClimateSection(sectionForm);
    setSavingSection(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    load();
  };

  const handleSaveOption = async (input: ClimateOptionInput, id?: string) => {
    if (id) {
      await updateClimateOption(id, input);
    } else {
      await createClimateOption(input);
    }
    setShowOptionForm(false);
    setEditingOption(null);
    load();
  };

  const handleDeleteOption = async (id: string) => {
    await deleteClimateOption(id);
    setConfirmDelete(null);
    load();
  };

  const handleToggleEnabled = async (option: ClimateOption) => {
    await updateClimateOption(option.id, { enabled: !option.enabled });
    load();
  };

  const handleReorder = async (option: ClimateOption, direction: 'up' | 'down') => {
    if (!data) return;
    const options = [...data.options];
    const idx = options.findIndex((o) => o.id === option.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= options.length) return;

    const currentOrder = options[idx].sort_order;
    const swapOrder = options[swapIdx].sort_order;

    await updateClimateOption(options[idx].id, { sort_order: swapOrder });
    await updateClimateOption(options[swapIdx].id, { sort_order: currentOrder });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-forest-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="font-sans text-sm text-forest-500">Failed to load climate section data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section Content Editor */}
      <div className="rounded-2xl bg-cream-50 p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-serif text-lg font-medium text-forest-800">Section Content</h3>
          {savedFlash && (
            <span className="flex items-center gap-1.5 font-sans text-xs text-forest-600">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block font-sans text-xs uppercase tracking-widest-2 text-forest-600">Title</label>
            <input
              type="text"
              value={sectionForm.title}
              onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-2.5 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-xs uppercase tracking-widest-2 text-forest-600">Description</label>
            <textarea
              value={sectionForm.description}
              onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-2.5 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-xs uppercase tracking-widest-2 text-forest-600">Final Message</label>
            <input
              type="text"
              value={sectionForm.final_message}
              onChange={(e) => setSectionForm({ ...sectionForm, final_message: e.target.value })}
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-2.5 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-xs uppercase tracking-widest-2 text-forest-600">CTA Button Label</label>
            <input
              type="text"
              value={sectionForm.cta_label}
              onChange={(e) => setSectionForm({ ...sectionForm, cta_label: e.target.value })}
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-2.5 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
            />
          </div>
          <button
            onClick={handleSaveSection}
            disabled={savingSection}
            className="flex items-center gap-2 rounded-full bg-forest-700 px-6 py-2.5 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-60"
          >
            {savingSection ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Section
          </button>
        </div>
      </div>

      {/* Options Management */}
      <div className="rounded-2xl bg-cream-50 p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-serif text-lg font-medium text-forest-800">Climate Options</h3>
          <button
            onClick={() => { setEditingOption(null); setShowOptionForm(true); }}
            className="flex items-center gap-2 rounded-full bg-forest-700 px-5 py-2 font-sans text-sm text-cream-50 transition-all hover:bg-forest-800"
          >
            <Plus size={16} />
            Add Option
          </button>
        </div>

        <div className="space-y-3">
          {data.options.map((option, i) => (
            <div
              key={option.id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                option.enabled
                  ? 'border-sage-200 bg-cream-100/30'
                  : 'border-sage-200/50 bg-cream-100/10 opacity-60'
              }`}
            >
              {/* Image thumbnail */}
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                <img src={option.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{option.icon}</span>
                  <p className="truncate font-sans text-sm font-medium text-forest-800">{option.label}</p>
                </div>
                <p className="mt-0.5 truncate font-sans text-xs text-forest-500">{option.solution_title}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleReorder(option, 'up')}
                  disabled={i === 0}
                  className="rounded-lg p-2 text-forest-600 transition-colors hover:bg-sage-100 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => handleReorder(option, 'down')}
                  disabled={i === data.options.length - 1}
                  className="rounded-lg p-2 text-forest-600 transition-colors hover:bg-sage-100 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  onClick={() => handleToggleEnabled(option)}
                  className="rounded-lg p-2 text-forest-600 transition-colors hover:bg-sage-100"
                  title={option.enabled ? 'Disable' : 'Enable'}
                >
                  {option.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => { setEditingOption(option); setShowOptionForm(true); }}
                  className="rounded-lg p-2 text-forest-600 transition-colors hover:bg-sage-100"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirmDelete(option)}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Option Form Modal */}
      {showOptionForm && (
        <OptionForm
          option={editingOption}
          onSave={handleSaveOption}
          onClose={() => { setShowOptionForm(false); setEditingOption(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-cream-50 p-8 shadow-2xl">
            <h3 className="font-serif text-xl font-medium text-forest-800">Delete Option?</h3>
            <p className="mt-3 font-sans text-sm text-forest-600">
              Delete "{confirmDelete.label}"? This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleDeleteOption(confirmDelete.id)}
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

function OptionForm({
  option,
  onSave,
  onClose,
}: {
  option: ClimateOption | null;
  onSave: (input: ClimateOptionInput, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ClimateOptionInput>({
    label: option?.label || '',
    icon: option?.icon || '',
    image: option?.image || '',
    image_alt: option?.image_alt || '',
    solution_title: option?.solution_title || '',
    solution_text: option?.solution_text || '',
    sort_order: option?.sort_order || 0,
    enabled: option?.enabled ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof ClimateOptionInput, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadClimateImage(file);
    setUploading(false);
    if (!url) {
      setError('Failed to upload image. Please try again.');
      return;
    }
    update('image', url);
    if (!form.image_alt) {
      update('image_alt', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.icon.trim() || !form.image.trim() || !form.solution_title.trim() || !form.solution_text.trim()) {
      setError('All fields are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form, option?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-200 bg-cream-50 px-6 py-4">
          <h2 className="font-serif text-xl font-medium text-forest-800">
            {option ? 'Edit Option' : 'Add New Option'}
          </h2>
          <button onClick={onClose} className="text-forest-600 hover:text-forest-800"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {/* Image Upload */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Garden Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
            {form.image ? (
              <div className="relative overflow-hidden rounded-xl border border-sage-200">
                <img src={form.image} alt="" className="h-40 w-full object-cover" />
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-cream-50">
                  <Check size={14} />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 left-0 right-0 bg-forest-950/70 py-2 font-sans text-xs text-cream-100 transition-colors hover:bg-forest-950/90 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Replace Image'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sage-400/50 bg-cream-100/30 py-8 font-sans text-sm text-forest-600 transition-colors hover:border-forest-500 hover:bg-cream-100 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-forest-500" />
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100">
                      <ImageIcon size={20} className="text-forest-500" />
                    </div>
                    <span>Click to upload garden image</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Label + Icon */}
          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => update('label', e.target.value)}
                required
                placeholder="e.g. Hot & Dry"
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
              />
            </div>
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Icon</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => update('icon', e.target.value)}
                required
                placeholder="☀️"
                className="w-20 rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 text-center text-2xl outline-none focus:border-forest-500"
              />
            </div>
          </div>

          {/* Image Alt */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Image Alt Text</label>
            <input
              type="text"
              value={form.image_alt}
              onChange={(e) => update('image_alt', e.target.value)}
              required
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
            />
          </div>

          {/* Solution Title */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Solution Title</label>
            <input
              type="text"
              value={form.solution_title}
              onChange={(e) => update('solution_title', e.target.value)}
              required
              placeholder="e.g. Climate-Resilient Planting"
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
            />
          </div>

          {/* Solution Text */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">Solution Text</label>
            <textarea
              value={form.solution_text}
              onChange={(e) => update('solution_text', e.target.value)}
              required
              rows={5}
              className="w-full resize-y rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none focus:border-forest-500"
            />
          </div>

          {/* Sort Order + Enabled */}
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
            <div className="flex items-end pb-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => update('enabled', e.target.checked)}
                  className="h-5 w-5 rounded accent-forest-600"
                />
                <span className="font-sans text-sm text-forest-700">Enabled (visible on site)</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {option ? 'Save Changes' : 'Create Option'}
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
