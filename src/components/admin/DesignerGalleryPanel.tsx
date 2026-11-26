import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, ImagePlus, Loader2, Replace, Trash2 } from 'lucide-react';
import {
  addGalleryImage,
  deleteGalleryImage,
  fetchAdminGallery,
  reorderGallery,
  replaceGalleryImage,
  setGalleryAlt,
  setGalleryEnabled,
  uploadGalleryFile,
  type AdminGalleryImage,
} from '@/lib/designer/gallery';

type UploadStatus = { name: string; state: 'uploading' | 'done' | 'error'; message?: string };

export default function DesignerGalleryPanel() {
  const [images, setImages] = useState<AdminGalleryImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      setImages(await fetchAdminGallery());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the gallery');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const handleAdd = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    setUploads(list.map((file) => ({ name: file.name, state: 'uploading' })));
    // Upload one at a time so the order of the selection is the order in the gallery.
    for (const [index, file] of list.entries()) {
      try {
        const path = await uploadGalleryFile(file);
        await addGalleryImage(path, file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
        setUploads((current) => current.map((item, i) => (i === index ? { ...item, state: 'done' } : item)));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setUploads((current) => current.map((item, i) => (i === index ? { ...item, state: 'error', message } : item)));
      }
    }
    await load();
    flash('Upload finished. The public gallery is updated.');
  };

  const handleReplace = async (files: FileList | null) => {
    const id = replaceTarget.current;
    const file = files?.[0];
    if (!id || !file) return;
    setBusyId(id);
    try {
      const path = await uploadGalleryFile(file);
      await replaceGalleryImage(id, path);
      await load();
      flash('Image replaced.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not replace the image');
    } finally {
      setBusyId(null);
      replaceTarget.current = null;
    }
  };

  const persistOrder = async (next: AdminGalleryImage[]) => {
    const previous = images;
    setImages(next);
    try {
      await reorderGallery(next.map((image) => image.id));
      flash('Order saved. The public gallery is updated.');
    } catch (err) {
      setImages(previous);
      setError(err instanceof Error ? err.message : 'Could not save the order');
    }
  };

  const move = (from: number, to: number) => {
    if (!images || to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void persistOrder(next);
  };

  const toggle = async (image: AdminGalleryImage) => {
    setBusyId(image.id);
    try {
      await setGalleryEnabled(image.id, !image.enabled);
      setImages((current) => current && current.map((item) => (item.id === image.id ? { ...item, enabled: !image.enabled } : item)));
      flash(image.enabled ? 'Image hidden from the public gallery.' : 'Image is now shown in the public gallery.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the image');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (image: AdminGalleryImage) => {
    if (!window.confirm('Delete this image permanently? It will be removed from the public gallery and cannot be recovered.')) return;
    setBusyId(image.id);
    try {
      await deleteGalleryImage(image.id);
      setImages((current) => current && current.filter((item) => item.id !== image.id));
      flash('Image deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the image');
    } finally {
      setBusyId(null);
    }
  };

  const saveAlt = async (image: AdminGalleryImage, alt: string) => {
    if (alt === image.alt) return;
    try {
      await setGalleryAlt(image.id, alt);
      setImages((current) => current && current.map((item) => (item.id === image.id ? { ...item, alt } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the description');
    }
  };

  const enabledCount = images?.filter((image) => image.enabled).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="font-serif text-2xl text-forest-800">AI Garden Designer gallery</h2>
          <p className="mt-1 text-sm text-forest-600">
            These images appear in the two moving strips on the AI Garden Designer page. They are separate from Projects and Inspiration: changing those never changes this gallery. Drag images, or use the arrows, to change the order. Changes go live immediately.
          </p>
        </div>
        <button type="button" onClick={() => addInput.current?.click()} className="flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 text-sm text-cream-100 hover:bg-forest-900">
          <ImagePlus size={16} /> Upload images
        </button>
        <input ref={addInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload gallery images" onChange={(e) => { void handleAdd(e.target.files); e.target.value = ''; }} />
        <input ref={replaceInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Replace gallery image" onChange={(e) => { void handleReplace(e.target.files); e.target.value = ''; }} />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-forest-50 p-3 text-sm text-forest-700">
          {notice}
        </p>
      )}

      {uploads.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-sage-200 bg-white p-4 text-sm">
          {uploads.map((upload, index) => (
            <li key={`${upload.name}-${index}`} className="flex items-center gap-2 text-forest-700">
              {upload.state === 'uploading' && <Loader2 size={14} className="animate-spin" />}
              <span>{upload.name}</span>
              <span className={upload.state === 'error' ? 'text-red-700' : 'text-forest-500'}>
                {upload.state === 'uploading' ? 'Optimising and uploading...' : upload.state === 'done' ? 'Uploaded' : upload.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!images ? (
        !error && <Loader2 className="animate-spin text-forest-600" />
      ) : images.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-300 bg-white p-12 text-center text-forest-600">
          No gallery images yet. The gallery strips stay hidden on the public page until you upload and enable images.
        </div>
      ) : (
        <>
          <p className="text-sm text-forest-600">
            {images.length} image{images.length > 1 ? 's' : ''}, {enabledCount} shown publicly.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((image, index) => (
              <li
                key={image.id}
                draggable
                onDragStart={() => setDragId(image.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const from = images.findIndex((item) => item.id === dragId);
                  setDragId(null);
                  move(from, index);
                }}
                onDragEnd={() => setDragId(null)}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${dragId === image.id ? 'opacity-40' : ''} ${image.enabled ? 'border-sage-200' : 'border-amber-300'}`}
              >
                <div className="relative aspect-[4/3] bg-sage-100">
                  <img src={image.url} alt={image.alt} className={`h-full w-full object-cover ${image.enabled ? '' : 'opacity-40 grayscale'}`} loading="lazy" />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-forest-900/75 px-2 py-0.5 text-xs text-cream-100">
                    <GripVertical size={12} /> {index + 1}
                  </span>
                  {!image.enabled && <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">Hidden</span>}
                  {busyId === image.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <Loader2 className="animate-spin text-forest-700" />
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-3">
                  <input
                    defaultValue={image.alt}
                    onBlur={(e) => void saveAlt(image, e.target.value.trim())}
                    aria-label="Image description"
                    placeholder="Describe the image"
                    className="w-full rounded-lg border border-sage-300 px-3 py-1.5 text-sm text-forest-800"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" aria-label="Move earlier" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded-full border border-sage-300 p-1.5 text-forest-700 disabled:opacity-30">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" aria-label="Move later" disabled={index === images.length - 1} onClick={() => move(index, index + 1)} className="rounded-full border border-sage-300 p-1.5 text-forest-700 disabled:opacity-30">
                      <ArrowDown size={14} />
                    </button>
                    <button type="button" onClick={() => void toggle(image)} className="flex items-center gap-1 rounded-full border border-sage-300 px-3 py-1.5 text-xs text-forest-700">
                      {image.enabled ? <EyeOff size={14} /> : <Eye size={14} />} {image.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        replaceTarget.current = image.id;
                        replaceInput.current?.click();
                      }}
                      className="flex items-center gap-1 rounded-full border border-sage-300 px-3 py-1.5 text-xs text-forest-700"
                    >
                      <Replace size={14} /> Replace
                    </button>
                    <button type="button" aria-label="Delete image" onClick={() => void remove(image)} className="ml-auto rounded-full border border-red-200 p-1.5 text-red-700 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
