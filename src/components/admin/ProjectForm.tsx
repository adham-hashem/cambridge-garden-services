import { useState, useRef, type FormEvent } from 'react';
import { uploadProjectImage } from '@/lib/projects';
import type { ServiceAdminItem } from '@/lib/services';
import type { Project, ProjectInput } from '@/types/project';
import { X, Loader2, ImageIcon, Upload, Check } from 'lucide-react';

interface ProjectFormProps {
  project: Project | null;
  services: ServiceAdminItem[];
  onSave: (input: ProjectInput, id?: string) => Promise<void>;
  onClose: () => void;
}

const emptyForm: ProjectInput = {
  service_id: '',
  title: '',
  location: '',
  description: '',
  before_image: '',
  after_image: '',
  before_alt: '',
  after_alt: '',
  published: false,
  sort_order: 0,
};

export default function ProjectForm({ project, services, onSave, onClose }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectInput>(
    project
      ? {
          service_id: project.service_id,
          title: project.title,
          location: project.location,
          description: project.description,
          before_image: project.before_image,
          after_image: project.after_image,
          before_alt: project.before_alt,
          after_alt: project.after_alt,
          published: project.published,
          sort_order: project.sort_order,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const update = (field: keyof ProjectInput, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (
    file: File,
    slot: 'before' | 'after'
  ) => {
    if (slot === 'before') setUploadingBefore(true);
    else setUploadingAfter(true);

    const url = await uploadProjectImage(file, slot);

    if (slot === 'before') setUploadingBefore(false);
    else setUploadingAfter(false);

    if (!url) {
      setError(`Failed to upload ${slot} image. Please try again.`);
      return;
    }

    update(`${slot}_image` as keyof ProjectInput, url);
    // Auto-generate alt text from filename if empty
    const altField = `${slot}_alt` as keyof ProjectInput;
    if (!form[altField]) {
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      update(altField, `${slot === 'before' ? 'Before' : 'After'}: ${baseName}`);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form, project?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sage-200 bg-cream-50 px-6 py-4">
          <h2 className="font-serif text-xl font-medium text-forest-800">
            {project ? 'Edit Project' : 'Add New Project'}
          </h2>
          <button onClick={onClose} className="text-forest-600 hover:text-forest-800">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {/* Service */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              Service
            </label>
            <select
              value={form.service_id}
              onChange={(e) => update('service_id', e.target.value)}
              required
              className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
            >
              <option value="" disabled>Select a service...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          {/* Title + Location */}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Project Name" required value={form.title} onChange={(v) => update('title', v)} />
            <FormField label="Location" required value={form.location} onChange={(v) => update('location', v)} />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
              rows={3}
              className="w-full resize-none rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
            />
          </div>

          {/* Before & After Image Uploads */}
          <div className="grid gap-5 sm:grid-cols-2">
            <ImageUploadField
              label="Before Image"
              value={form.before_image}
              uploading={uploadingBefore}
              onUpload={(file) => handleImageUpload(file, 'before')}
            />
            <ImageUploadField
              label="After Image"
              value={form.after_image}
              uploading={uploadingAfter}
              onUpload={(file) => handleImageUpload(file, 'after')}
            />
          </div>

          {/* Alt Text */}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Before Alt Text" value={form.before_alt} onChange={(v) => update('before_alt', v)} />
            <FormField label="After Alt Text" value={form.after_alt} onChange={(v) => update('after_alt', v)} />
          </div>

          {/* Sort Order + Published */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
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

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploadingBefore || uploadingAfter}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest-700 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {project ? 'Save Changes' : 'Create Project'}
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
      <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
        {label}
      </label>
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
                {label.includes('Before') ? <ImageIcon size={20} className="text-forest-500" /> : <Upload size={20} className="text-forest-500" />}
              </div>
              <span>Click to upload {label.toLowerCase()}</span>
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 placeholder-forest-700/30 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
      />
    </div>
  );
}
