import { useRef, useState, useCallback, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

export default function BeforeAfterSlider({
  before,
  after,
  beforeAlt,
  afterAlt,
  rounded = true,
}: {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  rounded?: boolean;
}) {
  const [position, setPosition] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) updatePosition(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current && e.touches[0]) updatePosition(e.touches[0].clientX);
    };
    const stop = () => { isDragging.current = false; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stop);
    };
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[16/10] w-full cursor-ew-resize select-none overflow-hidden ${rounded ? 'rounded-2xl' : ''}`}
      onMouseDown={(e) => { isDragging.current = true; updatePosition(e.clientX); }}
      onTouchStart={(e) => { isDragging.current = true; if (e.touches[0]) updatePosition(e.touches[0].clientX); }}
    >
      <img src={after} alt={afterAlt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={before}
          alt={beforeAlt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${containerWidth}px`, maxWidth: 'none' }}
          loading="lazy"
        />
      </div>

      <div className="absolute top-4 left-4 rounded-full bg-forest-950/60 px-3 py-1 font-sans text-[10px] uppercase tracking-widest-2 text-cream-100">
        Before
      </div>
      <div className="absolute top-4 right-4 rounded-full bg-forest-700/60 px-3 py-1 font-sans text-[10px] uppercase tracking-widest-2 text-cream-100">
        After
      </div>

      <div
        className="absolute top-0 bottom-0 w-px bg-cream-100 pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-cream-100 text-forest-800 shadow-lg">
          <MoveHorizontal size={18} />
        </div>
      </div>
    </div>
  );
}
