import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { fetchPublicGallery, type PublicGalleryImage } from '@/lib/designer/gallery';

const SPEED_PX_PER_SECOND = 28;
const RESUME_AFTER_TOUCH_MS = 4000;

function Lightbox({ images, index, onClose, onChange }: { images: PublicGalleryImage[]; index: number; onClose: () => void; onChange: (index: number) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const image = images[index];
  const step = useCallback((direction: 1 | -1) => onChange((index + direction + images.length) % images.length), [index, images.length, onChange]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, step]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Garden image" className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-950/90 p-4 sm:p-10" onClick={onClose}>
      <button ref={closeRef} type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 sm:right-6 sm:top-6">
        <X size={22} />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:left-6">
            <ChevronLeft size={24} />
          </button>
          <button type="button" aria-label="Next image" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:right-6">
            <ChevronRight size={24} />
          </button>
        </>
      )}
      <img src={image.url} alt={image.alt} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
      {image.alt && <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-sm text-cream-100/80">{image.alt}</p>}
    </div>
  );
}

export default function GardenGallery() {
  const [images, setImages] = useState<PublicGalleryImage[] | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [scrollable, setScrollable] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const touchPauseUntil = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublicGallery()
      .then((result) => !cancelled && setImages(result))
      .catch(() => !cancelled && setImages([]));
    return () => {
      cancelled = true;
    };
  }, []);

  pausedRef.current = lightbox !== null;

  // Measure whether the images overflow the viewport; if they all fit there is nothing to scroll.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setScrollable(el.scrollWidth > el.clientWidth + 4);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [images]);

  // Slow continuous scroll. Each image appears once; at the end the carousel eases back to the start.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !scrollable) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let last = performance.now();
    let carry = 0;
    let holdUntil = 0;
    let returning = false;

    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const blocked = hoverRef.current || pausedRef.current || now < touchPauseUntil.current || document.hidden;
      if (!blocked && !returning) {
        const max = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= max - 1) {
          if (!holdUntil) holdUntil = now + 1800;
          if (now >= holdUntil) {
            returning = true;
            holdUntil = 0;
            el.scrollTo({ left: 0, behavior: 'smooth' });
            window.setTimeout(() => {
              returning = false;
              carry = 0;
            }, 1400);
          }
        } else {
          holdUntil = 0;
          carry += (SPEED_PX_PER_SECOND * dt) / 1000;
          if (carry >= 1) {
            const whole = Math.floor(carry);
            el.scrollLeft += whole;
            carry -= whole;
          }
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [scrollable, images]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('figure');
    const amount = (card?.getBoundingClientRect().width || el.clientWidth / 3) + 16;
    touchPauseUntil.current = performance.now() + RESUME_AFTER_TOUCH_MS;
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  if (!images) return <div className="h-56 animate-pulse bg-sage-100/10 sm:h-64 lg:h-80" aria-hidden="true" />;
  if (!images.length) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Garden design inspiration"
      className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
      onFocus={() => (hoverRef.current = true)}
      onBlur={() => (hoverRef.current = false)}
    >
      <div
        ref={trackRef}
        onPointerDown={() => (touchPauseUntil.current = performance.now() + RESUME_AFTER_TOUCH_MS)}
        onTouchStart={() => (touchPauseUntil.current = performance.now() + RESUME_AFTER_TOUCH_MS)}
        className="no-scrollbar flex gap-4 overflow-x-auto overscroll-x-contain"
      >
        {images.map((image, index) => (
          <figure key={image.id} className="h-56 shrink-0 basis-[82%] overflow-hidden rounded-xl bg-sage-100/20 sm:h-64 sm:basis-[46%] lg:h-80 lg:basis-[30.5%]" aria-label={`Image ${index + 1} of ${images.length}`}>
            <button type="button" onClick={() => setLightbox(index)} aria-label={`View larger: ${image.alt || `garden image ${index + 1}`}`} className="block h-full w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300">
              <img
                src={image.url}
                alt={image.alt}
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            </button>
          </figure>
        ))}
      </div>

      {scrollable && (
        <>
          <button type="button" aria-label="Previous images" onClick={() => scrollByCard(-1)} className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-forest-800 shadow-md backdrop-blur transition hover:bg-white sm:left-3 sm:block lg:left-5">
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Next images" onClick={() => scrollByCard(1)} className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-forest-800 shadow-md backdrop-blur transition hover:bg-white sm:right-3 sm:block lg:right-5">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {lightbox !== null && <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} onChange={setLightbox} />}
    </section>
  );
}
