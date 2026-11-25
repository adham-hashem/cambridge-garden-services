import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ImagePlus, Loader2 } from 'lucide-react';
import DesignerShell from '@/components/designer/DesignerShell';
import PackageCards, { usePackages } from '@/components/designer/PackageCards';
import { createProject, startCheckout, updateProject, uploadGardenPhoto } from '@/lib/designer/api';
import { GARDEN_STYLES, formatGbp, type GardenStyle, type PackageId } from '@/lib/designer/shared';

const field = 'w-full rounded-lg border border-sage-300 bg-white px-4 py-2.5 text-forest-800 focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600';
const card = 'rounded-2xl border border-sage-200 bg-white p-6 shadow-sm';

export default function RedesignPage() {
  const [params] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState<GardenStyle>('traditional');
  const [instructions, setInstructions] = useState('');
  const [packageId, setPackageId] = useState<PackageId | null>((params.get('package') as PackageId | null) || null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const created = useRef<{ projectId: string; photo: File } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { packages } = usePackages();
  const selectedPackage = packages?.find((item) => item.id === packageId) || null;

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pay = async () => {
    setError(null);
    if (!file) return setError('Please upload a photograph of your garden.');
    if (!packageId) return setError('Please choose a package.');
    try {
      let projectId = created.current && created.current.photo === file ? created.current.projectId : null;
      if (projectId) {
        setBusy('Saving your project...');
        await updateProject({ projectId, packageId, inputs: { style, instructions } });
      } else {
        setBusy('Uploading your photograph...');
        const originalPath = await uploadGardenPhoto(file);
        setBusy('Saving your project...');
        const project = await createProject({ kind: 'redesign', packageId, inputs: { style, instructions }, originalPath, title: 'Garden redesign' });
        projectId = project.id;
        created.current = { projectId, photo: file };
      }
      setBusy('Opening secure payment...');
      const url = await startCheckout(projectId, email.trim());
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setBusy(null);
    }
  };

  return (
    <DesignerShell
      title="Redesign My Garden With AI | Cambridge Garden Services"
      description="Upload a photo of your garden and see it redesigned in the style you choose with AI-powered garden design."
      path="/ai-garden-designer/redesign"
    >
      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <h1 className="font-serif text-4xl text-forest-800">Redesign my garden</h1>
        <p className="mt-2 max-w-2xl text-forest-600">Upload a photograph, choose a style and tell us what you would like. You pay first; your design is generated after payment is confirmed.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className={card}>
            <h2 className="font-serif text-2xl text-forest-800">1. Your garden photo</h2>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload your garden photo" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-sage-300 bg-cream-50 text-forest-600 hover:border-forest-500"
            >
              {preview ? (
                <img src={preview} alt="Your garden photograph" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm">
                  <ImagePlus size={32} /> Upload Your Garden Photo
                </span>
              )}
            </button>
            {preview && (
              <button type="button" className="mt-2 text-sm text-forest-600 underline" onClick={() => inputRef.current?.click()}>
                Choose a different photo
              </button>
            )}
            <p className="mt-3 text-xs text-forest-500">JPEG, PNG or WebP. Photos are resized in your browser and stored privately; only you can see them.</p>
          </div>

          <div className={`${card} space-y-6`}>
            <div>
              <h2 className="font-serif text-2xl text-forest-800">2. Style and instructions</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {GARDEN_STYLES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={style === option.id}
                    onClick={() => setStyle(option.id)}
                    className={`rounded-xl border p-3 text-left text-sm ${style === option.id ? 'border-forest-700 bg-forest-50 ring-1 ring-forest-700' : 'border-sage-200 hover:border-sage-400'}`}
                  >
                    <span className="font-medium text-forest-800">{option.label}</span>
                    <span className="block text-xs text-forest-600">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm font-medium text-forest-700">
              Design instructions (optional)
              <textarea rows={4} maxLength={1500} className={`${field} mt-1`} placeholder="For example: a patio for entertaining, a lawn for the children, plenty of colour..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 font-serif text-2xl text-forest-800">3. Choose your package</h2>
          <PackageCards selected={packageId} onSelect={setPackageId} actionLabel="Select" disabled={Boolean(busy)} />
        </div>

        <div className={`${card} mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between`}>
          <label className="block max-w-md flex-1 text-sm font-medium text-forest-700">
            Email (optional: receipt and restoring access on another device)
            <input type="email" autoComplete="email" className={`${field} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button
            type="button"
            onClick={pay}
            disabled={Boolean(busy)}
            className="flex items-center justify-center gap-2 rounded-full bg-forest-800 px-8 py-3.5 text-sm font-medium tracking-wide text-cream-100 transition hover:bg-forest-900 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {busy || (selectedPackage ? `Pay ${formatGbp(selectedPackage.pricePence)} and redesign my garden` : 'Choose a package')}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>
    </DesignerShell>
  );
}
