import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type GalleryImage = { src: string; alt: string; tag?: string };

const FALLBACK: GalleryImage[] = [
  { src: '/quality_image.webp', alt: 'Garden project by Cambridge Garden Services' },
  { src: '/booking.webp', alt: 'Garden project by Cambridge Garden Services' },
];

async function loadImages() {
  const [projects, inspirations] = await Promise.all([
    supabase
      .from('projects')
      .select('title, before_image, after_image, before_alt, after_alt')
      .eq('published', true)
      .order('sort_order')
      .limit(14),
    supabase.from('garden_inspirations').select('title, image, alt').eq('published', true).order('sort_order').limit(14),
  ]);
  const transformations: GalleryImage[] = [];
  (projects.data || []).forEach((row) => {
    if (row.before_image) transformations.push({ src: row.before_image, alt: row.before_alt || `${row.title} before`, tag: 'Before' });
    if (row.after_image) transformations.push({ src: row.after_image, alt: row.after_alt || `${row.title} after`, tag: 'After' });
  });
  const gardens: GalleryImage[] = (inspirations.data || [])
    .filter((row) => row.image)
    .map((row) => ({ src: row.image as string, alt: (row.alt as string) || (row.title as string) }));
  return { transformations, gardens };
}

function Row({ images, direction, seconds }: { images: GalleryImage[]; direction: 'left' | 'right'; seconds: number }) {
  // The track holds the list twice so translating by -50% loops seamlessly.
  const doubled = [...images, ...images];
  return (
    <div className="cgs-marquee overflow-hidden" role="group" aria-label="Garden gallery">
      <div className={`cgs-marquee-track ${direction === 'right' ? 'cgs-marquee-right' : 'cgs-marquee-left'}`} style={{ animationDuration: `${seconds}s` }}>
        {doubled.map((image, index) => (
          <figure
            key={`${image.src}-${index}`}
            className="relative mr-3 h-44 shrink-0 overflow-hidden rounded-xl bg-sage-100 sm:h-56 lg:h-64"
            aria-hidden={index >= images.length ? true : undefined}
          >
            <img
              src={image.src}
              alt={index >= images.length ? '' : image.alt}
              loading={index < 4 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              className="h-full w-auto max-w-none object-cover"
            />
            {image.tag && (
              <figcaption className="absolute left-2 top-2 rounded-full bg-forest-900/75 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cream-100">
                {image.tag}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

function pad(images: GalleryImage[], minimum: number) {
  if (!images.length) return images;
  const out = [...images];
  while (out.length < minimum) out.push(...images);
  return out;
}

export default function GardenGallery() {
  const [data, setData] = useState<{ transformations: GalleryImage[]; gardens: GalleryImage[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadImages()
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setData({ transformations: [], gardens: [] }));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const gardens = data?.gardens || [];
    const transformations = data?.transformations || [];
    const all = [...gardens, ...transformations];
    const source = all.length ? all : FALLBACK;
    const half = Math.ceil(source.length / 2);
    // Top row favours finished gardens, bottom row favours before / after pairs.
    const top = gardens.length >= 3 ? gardens : source.slice(0, half);
    const rest = source.slice(half);
    const bottom = transformations.length >= 3 ? transformations : rest.length ? rest : source;
    return { top: pad(top, 8), bottom: pad(bottom, 8) };
  }, [data]);

  if (!data) {
    return <div className="h-[420px] animate-pulse bg-sage-100/60" aria-hidden="true" />;
  }

  return (
    <div className="space-y-3 py-2" aria-label="Examples of garden designs and transformations">
      <Row images={rows.top} direction="right" seconds={Math.max(40, rows.top.length * 6)} />
      <Row images={rows.bottom} direction="left" seconds={Math.max(46, rows.bottom.length * 7)} />
    </div>
  );
}
