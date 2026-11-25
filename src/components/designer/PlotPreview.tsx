import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { clampElement, elementMeta, plantById, round, type LayoutElement, type PlanResult, type Plot } from '@/lib/designer/shared';

type Props = {
  plot: Plot;
  elements?: LayoutElement[];
  plan?: PlanResult | null;
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (elements: LayoutElement[]) => void;
  className?: string;
};

type Drag = { id: string; mode: 'move' | 'resize'; startX: number; startY: number; original: LayoutElement };

const MARKER_COLOURS = { flower: '#d6336c', shrub: '#2f7d4f', tree: '#14532d', hedge: '#1b5e20' } as const;

export default function PlotPreview({ plot, elements = [], plan, editable, selectedId, onSelect, onChange, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const band = Math.max(1.2, Math.max(plot.width, plot.depth) * 0.12);
  const street = Math.max(0.7, band * 0.5);
  const side = plot.houseSide;
  const minX = side === 'left' ? -(band + street) : 0;
  const maxX = plot.width + (side === 'right' ? band + street : 0);
  const minY = side === 'top' ? -(band + street) : 0;
  const maxY = plot.depth + (side === 'bottom' ? band + street : 0);
  const pad = Math.max(plot.width, plot.depth) * 0.04 + 0.4;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  const houseRect = {
    top: { x: 0, y: -band, w: plot.width, h: band },
    bottom: { x: 0, y: plot.depth, w: plot.width, h: band },
    left: { x: -band, y: 0, w: band, h: plot.depth },
    right: { x: plot.width, y: 0, w: band, h: plot.depth },
  }[side];
  const streetRect = {
    top: { x: 0, y: -band - street, w: plot.width, h: street },
    bottom: { x: 0, y: plot.depth + band, w: plot.width, h: street },
    left: { x: -band - street, y: 0, w: street, h: plot.depth },
    right: { x: plot.width + band, y: 0, w: street, h: plot.depth },
  }[side];
  const rotated = side === 'left' || side === 'right';
  const fontSize = Math.max(plot.width, plot.depth) * 0.035 + 0.25;

  const toPlot = (event: ReactPointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  };

  const startDrag = (event: ReactPointerEvent, element: LayoutElement, mode: Drag['mode']) => {
    if (!editable) return;
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    const point = toPlot(event);
    onSelect?.(element.id);
    setDrag({ id: element.id, mode, startX: point.x, startY: point.y, original: element });
  };

  const moveDrag = (event: ReactPointerEvent) => {
    if (!drag || !onChange) return;
    const point = toPlot(event);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    const snap = (value: number) => Math.round(value * 10) / 10;
    onChange(
      elements.map((element) => {
        if (element.id !== drag.id) return element;
        const next =
          drag.mode === 'move'
            ? { ...drag.original, x: snap(drag.original.x + dx), y: snap(drag.original.y + dy) }
            : { ...drag.original, w: snap(drag.original.w + dx), h: snap(drag.original.h + dy) };
        return clampElement(next, plot);
      })
    );
  };

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className={`w-full select-none rounded-xl bg-cream-50 ${editable ? 'touch-none' : ''} ${className || ''}`}
      role="img"
      aria-label={`Top-down plan of a ${plot.width} metre by ${plot.depth} metre garden. The house is on the ${side} edge.`}
      onPointerMove={moveDrag}
      onPointerUp={() => setDrag(null)}
      onPointerCancel={() => setDrag(null)}
      onPointerDown={() => onSelect?.(null)}
    >
      <rect {...houseRect} fill="#cfc4b6" stroke="#80736a" strokeWidth={0.05} />
      <rect {...streetRect} fill="#9ea3a8" stroke="#666b70" strokeWidth={0.05} />
      <text
        x={houseRect.x + houseRect.w / 2}
        y={houseRect.y + houseRect.h / 2}
        fontSize={fontSize}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#3a3a3a"
        fontWeight={600}
        transform={rotated ? `rotate(90 ${houseRect.x + houseRect.w / 2} ${houseRect.y + houseRect.h / 2})` : undefined}
      >
        HOUSE
      </text>
      <text
        x={streetRect.x + streetRect.w / 2}
        y={streetRect.y + streetRect.h / 2}
        fontSize={fontSize * 0.8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#2b2d2f"
        fontWeight={600}
        transform={rotated ? `rotate(90 ${streetRect.x + streetRect.w / 2} ${streetRect.y + streetRect.h / 2})` : undefined}
      >
        STREET
      </text>

      <rect x={0} y={0} width={plot.width} height={plot.depth} fill="#f8faf4" />
      {Array.from({ length: Math.floor(plot.width) }, (_, i) => (
        <line key={`vx${i}`} x1={i + 1} y1={0} x2={i + 1} y2={plot.depth} stroke="#e1e8da" strokeWidth={0.03} />
      ))}
      {Array.from({ length: Math.floor(plot.depth) }, (_, i) => (
        <line key={`hy${i}`} x1={0} y1={i + 1} x2={plot.width} y2={i + 1} stroke="#e1e8da" strokeWidth={0.03} />
      ))}

      {elements.map((element) => {
        const meta = elementMeta(element.type);
        const selected = element.id === selectedId;
        const showLabel = element.w > meta.label.length * fontSize * 0.5 && element.h > fontSize * 1.8;
        return (
          <g key={element.id}>
            <rect
              x={element.x}
              y={element.y}
              width={element.w}
              height={element.h}
              fill={meta.fill}
              stroke={selected ? '#1a3c2e' : meta.stroke}
              strokeWidth={selected ? 0.12 : 0.06}
              opacity={0.92}
              style={{ cursor: editable ? 'move' : 'default' }}
              onPointerDown={(event) => startDrag(event, element, 'move')}
            />
            {showLabel && (
              <text x={element.x + 0.15} y={element.y + fontSize + 0.1} fontSize={fontSize * 0.85} fill="#26332b" pointerEvents="none">
                {meta.label}
              </text>
            )}
            {editable && selected && (
              <circle
                cx={element.x + element.w}
                cy={element.y + element.h}
                r={Math.max(0.35, fontSize * 0.6)}
                fill="#1a3c2e"
                stroke="#fff"
                strokeWidth={0.08}
                style={{ cursor: 'nwse-resize' }}
                onPointerDown={(event) => startDrag(event, element, 'resize')}
              />
            )}
          </g>
        );
      })}

      {plan?.hedgeRuns.map((run, i) => (
        <line key={`h${i}`} x1={run[0]} y1={run[1]} x2={run[2]} y2={run[3]} stroke="#1b6b2a" strokeOpacity={0.55} strokeWidth={0.28} />
      ))}
      {plan?.fenceRuns.map((run, i) => (
        <line key={`f${i}`} x1={run[0]} y1={run[1]} x2={run[2]} y2={run[3]} stroke="#73502e" strokeWidth={0.12} strokeDasharray="0.4 0.25" />
      ))}
      <rect x={0} y={0} width={plot.width} height={plot.depth} fill="none" stroke="#1a3c2e" strokeWidth={0.12} pointerEvents="none" />

      {plan?.markers.map((marker, i) => {
        const spread = plantById(marker.plantId)?.spread || 0.5;
        const r = marker.category === 'tree' ? Math.max(0.5, spread / 2) : marker.category === 'hedge' ? 0.14 : Math.max(0.1, spread * 0.32);
        return (
          <circle
            key={i}
            cx={marker.x}
            cy={marker.y}
            r={r}
            fill={MARKER_COLOURS[marker.category]}
            fillOpacity={marker.category === 'tree' ? 0.35 : 0.85}
            stroke={marker.category === 'tree' ? MARKER_COLOURS.tree : 'none'}
            strokeWidth={0.06}
            pointerEvents="none"
          />
        );
      })}

      <text x={plot.width / 2} y={plot.depth + pad * 0.7 + (side === 'bottom' ? band + street : 0)} fontSize={fontSize} textAnchor="middle" fill="#1a3c2e" fontWeight={600}>
        {round(plot.width, 1)} m
      </text>
      <text
        x={(side === 'left' ? plot.width : 0) + (side === 'left' ? pad * 0.8 : -pad * 0.35)}
        y={plot.depth / 2}
        fontSize={fontSize}
        textAnchor="middle"
        fill="#1a3c2e"
        fontWeight={600}
        transform={`rotate(-90 ${(side === 'left' ? plot.width : 0) + (side === 'left' ? pad * 0.8 : -pad * 0.35)} ${plot.depth / 2})`}
      >
        {round(plot.depth, 1)} m
      </text>
    </svg>
  );
}
