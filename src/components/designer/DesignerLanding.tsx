import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, LayoutGrid } from 'lucide-react';
import DesignerShell from '@/components/designer/DesignerShell';
import GardenGallery from '@/components/designer/GardenGallery';
import PackageCards, { usePackages } from '@/components/designer/PackageCards';
import { formatGbp, type PackageId } from '@/lib/designer/shared';

export default function DesignerLanding() {
  const [packageId, setPackageId] = useState<PackageId | null>(null);
  const query = packageId ? `?package=${packageId}` : '';
  const { packages } = usePackages();
  const chosen = packages?.find((pack) => pack.id === packageId);
  const optionsRef = useRef<HTMLElement>(null);
  const selectPackage = (id: PackageId) => {
    setPackageId(id);
    // Continue to the next step: choosing how to design the garden.
    window.setTimeout(() => optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
  };

  return (
    <DesignerShell
      title="AI Garden Designer | Cambridge Garden Services"
      description="Transform your outdoor space with AI-powered garden design. Upload a photo of your garden or plan a new garden from scratch."
      path="/ai-garden-designer"
    >
      <section className="bg-forest-900 pb-10 pt-16 text-center text-cream-100">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-serif text-5xl font-light leading-tight text-balance sm:text-6xl lg:text-7xl">Imagine Your Dream Garden</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-cream-200/90">
            Transform your outdoor space with AI-powered garden design. Upload a photo of your garden or create a completely new garden from scratch.
          </p>
        </div>
        <div className="mt-12">
          <GardenGallery />
        </div>
      </section>

      <div className="cgs-designer-bg">
      <section ref={optionsRef} className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 lg:px-10">
        {chosen && (
          <p role="status" className="mb-8 rounded-xl border border-forest-200 bg-forest-50 px-5 py-3 text-center text-forest-800">
            Package selected: <strong>{chosen.name}</strong> ({formatGbp(chosen.pricePence)}). Now choose how you would like to design your garden.
          </p>
        )}
        <div className="grid gap-8 md:grid-cols-2">
          <article className="flex flex-col rounded-3xl border border-sage-200 bg-white p-8 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <Camera size={22} />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-sage-600">Option 1</p>
            <h2 className="mt-1 font-serif text-3xl text-forest-800">Redesign My Garden</h2>
            <p className="mt-3 flex-1 text-forest-600">Upload an existing garden photo and transform it using AI.</p>
            <Link to={`/ai-garden-designer/redesign${query}`} className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-forest-800 px-6 py-3.5 text-sm font-medium tracking-wide text-cream-100 transition hover:bg-forest-900">
              Upload Your Garden Photo <ArrowRight size={16} />
            </Link>
          </article>

          <article className="flex flex-col rounded-3xl border border-sage-200 bg-white p-8 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <LayoutGrid size={22} />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-sage-600">Option 2</p>
            <h2 className="mt-1 font-serif text-3xl text-forest-800">Plan My Garden From Scratch</h2>
            <p className="mt-3 flex-1 text-forest-600">Create a completely new garden layout using plot dimensions and an interactive six-step planning system.</p>
            <Link to={`/ai-garden-designer/plan${query}`} className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-forest-800 px-6 py-3.5 text-sm font-medium tracking-wide text-cream-100 transition hover:bg-forest-900">
              Start Planning <ArrowRight size={16} />
            </Link>
          </article>
        </div>
      </section>

      <section className="py-16" id="pricing">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <h2 className="text-center font-serif text-4xl text-forest-800">Choose your package</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-forest-600">Pick a package now, or choose one at the final step. You only pay once your project is ready to generate.</p>
          <div className="mt-12">
            <PackageCards selected={packageId} onSelect={selectPackage} actionLabel="Choose this package" />
          </div>
          <p className="mt-8 text-center text-xs text-forest-500">Prices in GBP. Secure card payment. Cost figures in plans are estimates and not a quotation.</p>
        </div>
      </section>
      </div>
    </DesignerShell>
  );
}
