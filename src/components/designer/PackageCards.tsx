import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { fetchPackages, type PackageView } from '@/lib/designer/api';
import { formatGbp, type PackageId } from '@/lib/designer/shared';

type Props = {
  selected: PackageId | null;
  onSelect: (id: PackageId) => void;
  actionLabel?: string;
  disabled?: boolean;
};

export function usePackages() {
  const [packages, setPackages] = useState<PackageView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPackages()
      .then((items) => !cancelled && setPackages(items))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return { packages, error };
}

export default function PackageCards({ selected, onSelect, actionLabel = 'Choose', disabled }: Props) {
  const { packages, error } = usePackages();

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Pricing could not be loaded: {error}
      </p>
    );
  }
  if (!packages) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3" role="radiogroup" aria-label="Choose your package">
      {packages.map((pack) => {
        const isSelected = selected === pack.id;
        const choose = () => {
          if (!disabled) onSelect(pack.id);
        };
        return (
          <div
            key={pack.id}
            role="radio"
            aria-checked={isSelected}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            onClick={choose}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                choose();
              }
            }}
            className={`relative flex cursor-pointer flex-col rounded-2xl border p-7 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 ${
              isSelected
                ? 'border-forest-700 bg-forest-50 ring-2 ring-forest-700'
                : `bg-white hover:border-forest-500 hover:shadow-md ${pack.recommended ? 'border-sage-400' : 'border-sage-200'}`
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            {pack.recommended && (
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-forest-800 px-4 py-1 text-xs font-medium uppercase tracking-wider text-cream-100">
                <Sparkles size={12} /> Recommended
              </span>
            )}
            {isSelected && (
              <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-forest-700 text-cream-100" aria-hidden="true">
                <Check size={16} />
              </span>
            )}
            <h3 className="font-serif text-2xl text-forest-800">{pack.name}</h3>
            <p className="mt-1 text-sm text-forest-600">{pack.description}</p>
            <p className="mt-5 font-serif text-5xl text-forest-800">{formatGbp(pack.pricePence)}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-forest-700">
              {pack.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-sage-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <span
              aria-hidden="true"
              className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-medium tracking-wide transition ${
                isSelected ? 'bg-forest-800 text-cream-100' : 'border border-forest-700 text-forest-800'
              }`}
            >
              {isSelected ? 'Selected' : actionLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
