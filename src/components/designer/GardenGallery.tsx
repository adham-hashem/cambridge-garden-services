import { useEffect, useMemo, useState } from 'react';
import { fetchPublicGallery, type PublicGalleryImage } from '@/lib/designer/gallery';

function Row({ images, direction, seconds }: { images: PublicGalleryImage[]; direction: 'left' | 'right'; seconds: number }) {
  // The track holds the list twice so translating by -50% loops seamlessly.
  const doubled = [...images, ...images];
  return (
    <div className="cgs-marquee overflow-hidden" role="group" aria-label="Garden gallery">
      <div className={`cgs-marquee-track ${direction === 'right' ? 'cgs-marquee-right' : 'cgs-marquee-left'}`} style={{ animationDuration: `${seconds}s` }}>
        {doubled.map((image, index) => (
          <figure key={`${image.id}-${index}`} className="relative mr-3 h-44 shrink-0 overflow-hidden rounded-xl bg-sage-100 sm:h-56 lg:h-64" aria-hidden={index >= images.length ? true : undefined}>
            <img
              src={image.url}
              alt={index >= images.length ? '' : image.alt}
              loading={index < 4 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              className="h-full w-auto max-w-none object-cover"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Repeats a short list so one half of the track is always wider than the screen. */
function pad(images: PublicGalleryImage[], minimum: number) {
  if (!images.length) return images;
  const out = [...images];
  while (out.length < minimum) out.push(...images);
  return out;
}

export default function GardenGallery() {
  const [images, setImages] = useState<PublicGalleryImage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicGallery()
      .then((result) => !cancelled && setImages(result))
      .catch(() => !cancelled && setImages([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const list = images || [];
    // Alternate images between the rows so both rows show a mix; tiny galleries share every image.
    const top = list.length >= 4 ? list.filter((_, index) => index % 2 === 0) : list;
    const bottom = list.length >= 4 ? list.filter((_, index) => index % 2 === 1) : list;
    return { top: pad(top, 8), bottom: pad(bottom, 8) };
  }, [images]);

  if (!images) {
    return <div className="h-[420px] animate-pulse bg-sage-100/20" aria-hidden="true" />;
  }
  if (!images.length) return null;

  return (
    <div className="space-y-3 py-2" aria-label="Examples of garden designs">
      <Row images={rows.top} direction="right" seconds={Math.max(40, rows.top.length * 6)} />
      <Row images={rows.bottom} direction="left" seconds={Math.max(46, rows.bottom.length * 7)} />
    </div>
  );
}
