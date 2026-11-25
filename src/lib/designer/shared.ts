/**
 * Shared (browser + server) AI Garden Designer definitions and plan maths.
 * Pure TypeScript with no imports so it can be used from both Vite and the
 * Vercel API. Everything here is derived from the customer's actual inputs.
 */

export type PackageId = 'preview' | 'plus' | 'complete';
export type ProjectKind = 'redesign' | 'scratch';
export type HouseSide = 'top' | 'right' | 'bottom' | 'left';
export type GardenStyle = 'modern' | 'traditional' | 'cottage' | 'low_maintenance' | 'family' | 'outdoor_living';
export type ElementType = 'lawn' | 'patio' | 'path' | 'seating' | 'flowerbed' | 'planting' | 'outdoor_living';
export type PlantCategory = 'flower' | 'shrub' | 'tree' | 'hedge';
export type FeatureCategory = 'fencing' | 'lighting' | 'seating' | 'decorative';

export interface Plot {
  width: number;
  depth: number;
  houseSide: HouseSide;
}

export interface LayoutElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ScratchPreferences {
  maintenance: 'low' | 'medium' | 'high';
  materials: string[];
  budget: number | null;
  instructions: string;
  special: string;
}

export interface ScratchInputs {
  plot: Plot;
  elements: LayoutElement[];
  style: GardenStyle;
  plants: string[];
  /** Number of each selected tree (default 1). */
  treeCounts: Record<string, number>;
  lawnType: string;
  features: string[];
  /** Quantity for countable selected features (lighting, seating, decorative). */
  featureQty: Record<string, number>;
  preferences: ScratchPreferences;
}

export interface RedesignInputs {
  style: GardenStyle;
  instructions: string;
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export const GARDEN_STYLES: {
  id: GardenStyle;
  label: string;
  description: string;
  prompt: string;
  plants: string[];
}[] = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean lines, structured planting and contemporary materials.',
    prompt: 'a contemporary modern garden with clean geometric lines, large-format paving, structured architectural planting and a restrained colour palette',
    plants: ['miscanthus', 'hebe', 'amelanchier', 'beech'],
  },
  {
    id: 'traditional',
    label: 'Traditional English',
    description: 'Formal lawns, clipped hedges and classic herbaceous borders.',
    prompt: 'a traditional English garden with a manicured lawn, clipped hedging, classic herbaceous borders and natural stone paving',
    plants: ['rose', 'lavender', 'yew', 'malus'],
  },
  {
    id: 'cottage',
    label: 'Cottage Garden',
    description: 'Informal, abundant planting with a romantic, relaxed feel.',
    prompt: 'an informal English cottage garden with abundant, overflowing mixed planting, winding paths, roses, foxgloves and delphiniums',
    plants: ['foxglove', 'delphinium', 'rose', 'alchemilla'],
  },
  {
    id: 'low_maintenance',
    label: 'Low Maintenance',
    description: 'Hard-working, tough planting that needs little upkeep.',
    prompt: 'a low-maintenance garden with tough evergreen shrubs, ground cover, generous hard landscaping and minimal lawn',
    plants: ['hebe', 'geranium', 'sedum', 'euonymus'],
  },
  {
    id: 'family',
    label: 'Family Garden',
    description: 'Durable lawn space, safe layouts and room to play and relax.',
    prompt: 'a practical family garden with a generous hard-wearing lawn for play, a social patio, durable planting and safe rounded layouts',
    plants: ['viburnum', 'buddleja', 'geranium', 'apple'],
  },
  {
    id: 'outdoor_living',
    label: 'Outdoor Living',
    description: 'An outdoor room for dining, entertaining and relaxing.',
    prompt: 'an outdoor-living garden designed as an extension of the home, with a large dining terrace, lounge seating, ambient lighting and screening planting',
    plants: ['lavender', 'hydrangea', 'amelanchier', 'privet'],
  },
];

export const ELEMENT_TYPES: {
  type: ElementType;
  label: string;
  fill: string;
  stroke: string;
  /** Default size as a fraction of plot width/depth. */
  defaultSize: [number, number];
  minSize: [number, number];
}[] = [
  { type: 'lawn', label: 'Lawn', fill: '#9bc27a', stroke: '#5f8f4a', defaultSize: [0.5, 0.35], minSize: [1, 1] },
  { type: 'patio', label: 'Patio', fill: '#d9cfc0', stroke: '#9c8f7c', defaultSize: [0.35, 0.25], minSize: [1.5, 1.5] },
  { type: 'path', label: 'Garden path', fill: '#c4b7a0', stroke: '#8f8168', defaultSize: [0.08, 0.45], minSize: [0.6, 0.6] },
  { type: 'seating', label: 'Seating area', fill: '#c9a37e', stroke: '#8f6a52', defaultSize: [0.22, 0.18], minSize: [1.2, 1.2] },
  { type: 'flowerbed', label: 'Flower bed', fill: '#e6a9c0', stroke: '#b5668a', defaultSize: [0.3, 0.12], minSize: [0.6, 0.6] },
  { type: 'planting', label: 'Planting zone', fill: '#6fa57d', stroke: '#2a5640', defaultSize: [0.3, 0.14], minSize: [0.8, 0.8] },
  { type: 'outdoor_living', label: 'Outdoor living area', fill: '#e2b872', stroke: '#a37a30', defaultSize: [0.32, 0.25], minSize: [2, 2] },
];

export function elementMeta(type: ElementType) {
  return ELEMENT_TYPES.find((item) => item.type === type) as (typeof ELEMENT_TYPES)[number];
}

export const PLOT_PRESETS: { id: string; label: string; width: number; depth: number }[] = [
  { id: 'courtyard', label: 'Courtyard', width: 4, depth: 6 },
  { id: 'terrace', label: 'Terraced house', width: 5, depth: 12 },
  { id: 'semi', label: 'Semi-detached', width: 8, depth: 15 },
  { id: 'detached', label: 'Detached', width: 12, depth: 22 },
  { id: 'large', label: 'Large garden', width: 18, depth: 30 },
];

export interface PlantDef {
  id: string;
  name: string;
  latin: string;
  category: PlantCategory;
  description: string;
  /** Typical mature height in metres (approximate). */
  height: number;
  /** Typical mature spread in metres (approximate); used as planting spacing. */
  spread: number;
  /** Hedge plants only: typical plants per linear metre for a single row. */
  perMetre?: number;
  sun: string;
  interest: string;
}

export const PLANTS: PlantDef[] = [
  // Flowers
  { id: 'lavender', name: 'English lavender', latin: "Lavandula angustifolia 'Hidcote'", category: 'flower', description: 'Compact silver-green evergreen with fragrant purple flower spikes loved by bees.', height: 0.6, spread: 0.5, sun: 'Full sun, well-drained soil', interest: 'Summer flowers, fragrance' },
  { id: 'geranium', name: "Hardy geranium 'Rozanne'", latin: "Geranium 'Rozanne'", category: 'flower', description: 'Long-flowering ground-cover perennial with violet-blue blooms.', height: 0.5, spread: 0.7, sun: 'Sun or part shade', interest: 'Flowers June to October' },
  { id: 'echinacea', name: 'Purple coneflower', latin: 'Echinacea purpurea', category: 'flower', description: 'Sturdy perennial with daisy-like pink flowers and seedheads for winter structure.', height: 0.9, spread: 0.5, sun: 'Full sun', interest: 'Late-summer flowers, seedheads' },
  { id: 'salvia', name: "Perennial sage 'Caradonna'", latin: "Salvia nemorosa 'Caradonna'", category: 'flower', description: 'Upright violet-blue flower spikes on dark stems; drought tolerant.', height: 0.6, spread: 0.4, sun: 'Full sun', interest: 'Summer flowers, pollinators' },
  { id: 'foxglove', name: 'Foxglove', latin: 'Digitalis purpurea', category: 'flower', description: 'Tall cottage-garden spires that thrive in dappled shade.', height: 1.5, spread: 0.4, sun: 'Part shade or sun', interest: 'Early-summer spires' },
  { id: 'delphinium', name: 'Delphinium', latin: 'Delphinium elatum hybrids', category: 'flower', description: 'Classic herbaceous-border spires in blue, white and purple; needs staking.', height: 1.6, spread: 0.6, sun: 'Full sun', interest: 'Early-summer spires' },
  { id: 'alchemilla', name: "Lady's mantle", latin: 'Alchemilla mollis', category: 'flower', description: 'Soft scalloped foliage with frothy lime-green flowers; edges paths beautifully.', height: 0.5, spread: 0.5, sun: 'Sun or part shade', interest: 'Foliage and early-summer flowers' },
  { id: 'sedum', name: "Ice plant 'Herbstfreude'", latin: "Hylotelephium 'Herbstfreude'", category: 'flower', description: 'Succulent perennial with pink autumn flowerheads popular with butterflies.', height: 0.6, spread: 0.5, sun: 'Full sun', interest: 'Autumn flowers, low maintenance' },
  { id: 'miscanthus', name: 'Maiden grass', latin: "Miscanthus sinensis 'Gracillimus'", category: 'flower', description: 'Elegant ornamental grass that adds movement and winter structure.', height: 1.5, spread: 0.9, sun: 'Full sun', interest: 'Foliage, autumn plumes' },
  { id: 'allium', name: 'Ornamental allium', latin: "Allium 'Purple Sensation'", category: 'flower', description: 'Bulb with globe-shaped purple flowerheads rising above border plants.', height: 0.9, spread: 0.15, sun: 'Full sun', interest: 'Late-spring flowers' },
  // Shrubs
  { id: 'hydrangea', name: "Panicle hydrangea 'Limelight'", latin: "Hydrangea paniculata 'Limelight'", category: 'shrub', description: 'Robust shrub with large lime-to-pink flower cones from late summer.', height: 2, spread: 1.5, sun: 'Sun or part shade', interest: 'Late-summer flowers' },
  { id: 'hebe', name: "Hebe 'Great Orme'", latin: "Hebe 'Great Orme'", category: 'shrub', description: 'Neat evergreen with pink flower spikes; tolerant of exposed positions.', height: 1.2, spread: 1.2, sun: 'Full sun', interest: 'Evergreen, summer flowers' },
  { id: 'viburnum', name: 'Laurustinus', latin: 'Viburnum tinus', category: 'shrub', description: 'Dense evergreen shrub with winter flowers; good for screening.', height: 2.5, spread: 2, sun: 'Sun or shade', interest: 'Winter flowers, evergreen' },
  { id: 'buddleja', name: 'Butterfly bush', latin: 'Buddleja davidii', category: 'shrub', description: 'Fast-growing shrub with fragrant flower panicles that attract butterflies.', height: 3, spread: 2.5, sun: 'Full sun', interest: 'Summer flowers, wildlife' },
  { id: 'rose', name: "Shrub rose 'Gertrude Jekyll'", latin: "Rosa 'Gertrude Jekyll'", category: 'shrub', description: 'Strongly fragrant old-fashioned English rose with rich pink rosettes.', height: 1.5, spread: 1.2, sun: 'Full sun', interest: 'Fragrant summer flowers' },
  { id: 'choisya', name: 'Mexican orange blossom', latin: 'Choisya ternata', category: 'shrub', description: 'Glossy evergreen with scented white spring flowers.', height: 2, spread: 2, sun: 'Sun or part shade', interest: 'Evergreen, fragrant flowers' },
  { id: 'cornus', name: 'Red-stemmed dogwood', latin: "Cornus alba 'Sibirica'", category: 'shrub', description: 'Brilliant red winter stems for colour when the garden is bare.', height: 2, spread: 2, sun: 'Sun or part shade', interest: 'Winter stem colour' },
  { id: 'euonymus', name: "Euonymus 'Emerald Gaiety'", latin: "Euonymus fortunei 'Emerald Gaiety'", category: 'shrub', description: 'Compact variegated evergreen that brightens shade; very low maintenance.', height: 1, spread: 1.2, sun: 'Sun or shade', interest: 'Year-round foliage' },
  { id: 'skimmia', name: 'Skimmia', latin: 'Skimmia japonica', category: 'shrub', description: 'Compact evergreen for shade with red winter buds and fragrant spring flowers.', height: 1, spread: 1, sun: 'Part to full shade', interest: 'Winter buds, evergreen' },
  // Trees
  { id: 'birch', name: 'Silver birch', latin: 'Betula pendula', category: 'tree', description: 'Graceful tree with white bark and light, dappled canopy; best in larger gardens.', height: 12, spread: 5, sun: 'Full sun', interest: 'Bark, autumn colour' },
  { id: 'amelanchier', name: 'Snowy mespilus', latin: 'Amelanchier lamarckii', category: 'tree', description: 'Small multi-season tree: spring blossom, summer berries, brilliant autumn colour.', height: 6, spread: 4, sun: 'Sun or part shade', interest: 'Blossom, berries, autumn colour' },
  { id: 'malus', name: "Crab apple 'Evereste'", latin: "Malus 'Evereste'", category: 'tree', description: 'Compact blossom tree with long-lasting orange-red crab apples.', height: 5, spread: 4, sun: 'Full sun', interest: 'Blossom, fruit' },
  { id: 'acer', name: 'Japanese maple', latin: 'Acer palmatum', category: 'tree', description: 'Slow-growing small tree with delicate foliage and fiery autumn colour.', height: 4, spread: 3, sun: 'Part shade, sheltered', interest: 'Foliage, autumn colour' },
  { id: 'magnolia', name: 'Star magnolia', latin: 'Magnolia stellata', category: 'tree', description: 'Compact tree with starry white flowers in early spring.', height: 3, spread: 3, sun: 'Sun or part shade', interest: 'Spring flowers' },
  { id: 'rowan', name: 'Rowan', latin: 'Sorbus aucuparia', category: 'tree', description: 'Native tree with spring blossom and bright red berries for birds.', height: 10, spread: 5, sun: 'Sun or part shade', interest: 'Berries, wildlife' },
  { id: 'apple', name: 'Apple tree (dwarfing rootstock)', latin: 'Malus domestica', category: 'tree', description: 'A productive family fruit tree; choose a variety suited to East Anglia.', height: 4, spread: 4, sun: 'Full sun', interest: 'Blossom, edible fruit' },
  // Hedges
  { id: 'beech', name: 'Beech hedge', latin: 'Fagus sylvatica', category: 'hedge', description: 'Classic hedge that holds copper leaves through winter.', height: 2, spread: 0.6, perMetre: 3, sun: 'Sun or part shade', interest: 'Foliage, winter leaf retention' },
  { id: 'hornbeam', name: 'Hornbeam hedge', latin: 'Carpinus betulus', category: 'hedge', description: 'Hardy hedge similar to beech; copes with heavier, wetter soils.', height: 2, spread: 0.6, perMetre: 3, sun: 'Sun or shade', interest: 'Foliage, autumn colour' },
  { id: 'yew', name: 'Yew hedge', latin: 'Taxus baccata', category: 'hedge', description: 'Dense evergreen for formal clipped hedges; slow but long-lived.', height: 2, spread: 0.7, perMetre: 2, sun: 'Sun or shade', interest: 'Evergreen structure' },
  { id: 'privet', name: 'Privet hedge', latin: 'Ligustrum ovalifolium', category: 'hedge', description: 'Fast-growing, dense hedge that gives quick screening.', height: 2, spread: 0.6, perMetre: 3, sun: 'Sun or shade', interest: 'Quick screening' },
  { id: 'laurel', name: 'Cherry laurel hedge', latin: "Prunus laurocerasus 'Rotundifolia'", category: 'hedge', description: 'Vigorous, large-leaved evergreen for tall year-round screening.', height: 3, spread: 1.2, perMetre: 1.5, sun: 'Sun or shade', interest: 'Evergreen screening' },
];

export function plantById(id: string) {
  return PLANTS.find((plant) => plant.id === id);
}

export const PLANT_CATEGORIES: { id: PlantCategory; label: string; plural: string }[] = [
  { id: 'flower', label: 'Flower', plural: 'Flowers' },
  { id: 'shrub', label: 'Shrub', plural: 'Shrubs' },
  { id: 'tree', label: 'Tree', plural: 'Trees' },
  { id: 'hedge', label: 'Hedge', plural: 'Hedges' },
];

export const LAWN_TYPES: { id: string; label: string; description: string }[] = [
  { id: 'turf', label: 'Turf (ornamental)', description: 'Fine-leaved turf for a smooth, formal finish.' },
  { id: 'hardwearing', label: 'Hard-wearing turf', description: 'Tougher turf for children, pets and regular use.' },
  { id: 'seed', label: 'Seeded lawn', description: 'Lawn grown from seed; lower cost, slower to establish.' },
  { id: 'wildflower', label: 'Wildflower meadow', description: 'Native wildflowers and grasses for wildlife.' },
  { id: 'artificial', label: 'Artificial lawn', description: 'No-mow, year-round green surface.' },
];

export interface FeatureDef {
  id: string;
  label: string;
  category: FeatureCategory;
  /** True when the customer can choose a quantity (each). */
  countable: boolean;
}

export const FEATURES: FeatureDef[] = [
  { id: 'fence_closeboard', label: 'Closeboard timber fencing', category: 'fencing', countable: false },
  { id: 'fence_slat', label: 'Horizontal slat fencing', category: 'fencing', countable: false },
  { id: 'fence_picket', label: 'Picket fencing', category: 'fencing', countable: false },
  { id: 'fence_trellis', label: 'Fence with trellis topper', category: 'fencing', countable: false },
  { id: 'light_solar', label: 'Solar path lights', category: 'lighting', countable: true },
  { id: 'light_spike', label: 'Low-voltage spike lights', category: 'lighting', countable: true },
  { id: 'light_wall', label: 'Wall lights', category: 'lighting', countable: true },
  { id: 'light_festoon', label: 'Festoon / string lighting', category: 'lighting', countable: true },
  { id: 'seat_bench', label: 'Garden bench', category: 'seating', countable: true },
  { id: 'seat_dining', label: 'Outdoor dining set', category: 'seating', countable: true },
  { id: 'seat_lounge', label: 'Lounge seating set', category: 'seating', countable: true },
  { id: 'seat_firepit', label: 'Fire pit with seating', category: 'seating', countable: true },
  { id: 'deco_water', label: 'Water feature', category: 'decorative', countable: true },
  { id: 'deco_pergola', label: 'Pergola', category: 'decorative', countable: true },
  { id: 'deco_planters', label: 'Planters / containers', category: 'decorative', countable: true },
  { id: 'deco_arch', label: 'Rose arch / obelisk', category: 'decorative', countable: true },
  { id: 'deco_birdbath', label: 'Bird bath', category: 'decorative', countable: true },
];

export function featureById(id: string) {
  return FEATURES.find((feature) => feature.id === id);
}

export const MATERIAL_OPTIONS = [
  'Natural sandstone paving',
  'Porcelain paving',
  'Block paving',
  'Brick paving',
  'Resin-bound gravel',
  'Loose gravel',
  'Timber decking',
  'Composite decking',
];

export const MAINTENANCE_OPTIONS: { id: ScratchPreferences['maintenance']; label: string; description: string }[] = [
  { id: 'low', label: 'Low', description: 'Minimal upkeep, a few visits a year.' },
  { id: 'medium', label: 'Medium', description: 'Regular seasonal care.' },
  { id: 'high', label: 'High', description: 'Happy to garden often.' },
];

export function styleById(id: string) {
  return GARDEN_STYLES.find((style) => style.id === id) || GARDEN_STYLES[0];
}

/* ------------------------------------------------------------------ */
/* Plan maths                                                          */
/* ------------------------------------------------------------------ */

export type RateMap = Record<string, { label: string; unit: string; ratePence: number | null }>;

export interface Marker {
  x: number;
  y: number;
  plantId: string;
  category: PlantCategory;
}

export interface QuantityLine {
  key: string;
  label: string;
  quantity: number;
  unit: string;
  /** Pence, null when no configured rate exists. */
  unitRatePence: number | null;
  totalPence: number | null;
  note?: string;
}

export interface PlanResult {
  areas: Record<ElementType, number>;
  plotArea: number;
  gardenCoveragePct: number;
  markers: Marker[];
  fenceRuns: [number, number, number, number][];
  hedgeRuns: [number, number, number, number][];
  fenceLength: number;
  hedgeLength: number;
  plantLines: { plantId: string; name: string; category: PlantCategory; quantity: number; where: string }[];
  lines: QuantityLine[];
  pricedTotalPence: number;
  unpricedCount: number;
  warnings: string[];
  onSiteChecks: string[];
}

const EMPTY_AREAS: Record<ElementType, number> = {
  lawn: 0,
  patio: 0,
  path: 0,
  seating: 0,
  flowerbed: 0,
  planting: 0,
  outdoor_living: 0,
};

export function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function clampElement(element: LayoutElement, plot: Plot): LayoutElement {
  const meta = elementMeta(element.type);
  const w = Math.min(plot.width, Math.max(meta.minSize[0], element.w));
  const h = Math.min(plot.depth, Math.max(meta.minSize[1], element.h));
  const x = Math.min(plot.width - w, Math.max(0, element.x));
  const y = Math.min(plot.depth - h, Math.max(0, element.y));
  return { ...element, x: round(x, 2), y: round(y, 2), w: round(w, 2), h: round(h, 2) };
}

export function defaultElement(type: ElementType, plot: Plot, id: string, offset = 0): LayoutElement {
  const meta = elementMeta(type);
  const w = Math.max(meta.minSize[0], round(plot.width * meta.defaultSize[0], 1));
  const h = Math.max(meta.minSize[1], round(plot.depth * meta.defaultSize[1], 1));
  return clampElement({ id, type, x: (plot.width - w) / 2 + offset, y: (plot.depth - h) / 2 + offset, w, h }, plot);
}


/** Places a new element in the first free spot, near the house for hard surfaces and away from it for planting and lawn. */
export function placeElement(type: ElementType, plot: Plot, id: string, existing: LayoutElement[]): LayoutElement {
  const base = defaultElement(type, plot, id);
  const nearHouse = type === 'patio' || type === 'seating' || type === 'outdoor_living' || type === 'path';
  const step = 0.5;
  const candidates: { x: number; y: number; d: number }[] = [];
  for (let y = 0; y <= plot.depth - base.h + 1e-6; y += step) {
    for (let x = 0; x <= plot.width - base.w + 1e-6; x += step) {
      const distance =
        plot.houseSide === 'top' ? y : plot.houseSide === 'bottom' ? plot.depth - (y + base.h) : plot.houseSide === 'left' ? x : plot.width - (x + base.w);
      candidates.push({ x, y, d: nearHouse ? distance : -distance });
    }
  }
  candidates.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
  const free = candidates.find((spot) =>
    existing.every((other) => spot.x + base.w <= other.x || other.x + other.w <= spot.x || spot.y + base.h <= other.y || other.y + other.h <= spot.y)
  );
  if (free) return clampElement({ ...base, x: free.x, y: free.y }, plot);
  const nudge = (existing.length % 5) * 0.5;
  return clampElement({ ...base, x: base.x + nudge, y: base.y + nudge }, plot);
}

/** Owner (topmost element index) for every raster cell; later elements draw on top. */
function rasterise(plot: Plot, elements: LayoutElement[]) {
  const step = Math.max(0.1, Math.max(plot.width, plot.depth) / 500);
  const cols = Math.max(1, Math.ceil(plot.width / step));
  const rows = Math.max(1, Math.ceil(plot.depth / step));
  const owner = new Int16Array(cols * rows).fill(-1);
  elements.forEach((element, index) => {
    const c0 = Math.max(0, Math.floor(element.x / step));
    const c1 = Math.min(cols - 1, Math.ceil((element.x + element.w) / step) - 1);
    const r0 = Math.max(0, Math.floor(element.y / step));
    const r1 = Math.min(rows - 1, Math.ceil((element.y + element.h) / step) - 1);
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) owner[r * cols + c] = index;
    }
  });
  const ownerAt = (x: number, y: number) => {
    const c = Math.floor(x / step);
    const r = Math.floor(y / step);
    if (c < 0 || r < 0 || c >= cols || r >= rows) return -1;
    return owner[r * cols + c];
  };
  return { step, cols, rows, owner, ownerAt };
}

function perimeterRuns(plot: Plot) {
  // Boundary segments excluding the house side, as [x1,y1,x2,y2].
  const { width: w, depth: d, houseSide } = plot;
  const sides: Record<HouseSide, [number, number, number, number]> = {
    top: [0, 0, w, 0],
    right: [w, 0, w, d],
    bottom: [w, d, 0, d],
    left: [0, d, 0, 0],
  };
  const opposite: Record<HouseSide, HouseSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const far = opposite[houseSide];
  const others = (Object.keys(sides) as HouseSide[]).filter((side) => side !== houseSide);
  return { sides, far, others };
}

function lengthOf(run: [number, number, number, number]) {
  return Math.hypot(run[2] - run[0], run[3] - run[1]);
}

function pointAlong(run: [number, number, number, number], distance: number): [number, number] {
  const length = lengthOf(run) || 1;
  const t = Math.min(1, Math.max(0, distance / length));
  return [run[0] + (run[2] - run[0]) * t, run[1] + (run[3] - run[1]) * t];
}

/** Inset a boundary point towards the garden so markers are not on the line. */
function insetPoint(point: [number, number], plot: Plot, inset: number): [number, number] {
  const x = Math.min(plot.width - inset, Math.max(inset, point[0]));
  const y = Math.min(plot.depth - inset, Math.max(inset, point[1]));
  return [x, y];
}

export function computePlan(inputs: ScratchInputs, rates: RateMap): PlanResult {
  const { plot, elements } = inputs;
  const warnings: string[] = [];
  const raster = rasterise(plot, elements);
  const cellArea = raster.step * raster.step;

  const areas = { ...EMPTY_AREAS };
  const ownedByIndex = new Array<number>(elements.length).fill(0);
  for (let i = 0; i < raster.owner.length; i += 1) {
    const idx = raster.owner[i];
    if (idx >= 0) ownedByIndex[idx] += cellArea;
  }
  elements.forEach((element, index) => {
    areas[element.type] += ownedByIndex[index];
  });
  (Object.keys(areas) as ElementType[]).forEach((type) => {
    areas[type] = round(areas[type], 1);
  });
  const plotArea = round(plot.width * plot.depth, 1);
  const covered = Object.values(areas).reduce((sum, value) => sum + value, 0);

  const selectedPlants = inputs.plants.map(plantById).filter((plant): plant is PlantDef => Boolean(plant));
  const markers: Marker[] = [];
  const plantLines: PlanResult['plantLines'] = [];

  const hosts = (type: ElementType) => elements.map((element, index) => ({ element, index })).filter((item) => item.element.type === type);
  const flowerHosts = hosts('flowerbed');
  const shrubHosts = hosts('planting');

  const categoryHosts = (category: PlantCategory) => {
    if (category === 'flower') return flowerHosts.length ? flowerHosts : shrubHosts;
    if (category === 'shrub') return shrubHosts.length ? shrubHosts : flowerHosts;
    return [];
  };

  const hasFlowers = selectedPlants.some((plant) => plant.category === 'flower');
  const hasShrubs = selectedPlants.some((plant) => plant.category === 'shrub');
  const sharedHostOnly = (flowerHosts.length === 0) !== (shrubHosts.length === 0);

  // Flowers and shrubs placed inside beds / planting zones at their typical spacing.
  (['flower', 'shrub'] as const).forEach((category) => {
    const plants = selectedPlants.filter((plant) => plant.category === category);
    if (!plants.length) return;
    const hostList = categoryHosts(category);
    if (!hostList.length) {
      warnings.push(
        `${category === 'flower' ? 'Flowers' : 'Shrubs'} were selected but the layout has no flower bed or planting zone, so they could not be placed. Add one in the layout step.`
      );
      plants.forEach((plant) => plantLines.push({ plantId: plant.id, name: plant.name, category, quantity: 0, where: 'No planting area in layout' }));
      return;
    }
    const spacing = plants.reduce((sum, plant) => sum + plant.spread, 0) / plants.length;
    // Candidate grid positions inside host elements that the host actually owns.
    const candidates: [number, number][] = [];
    hostList.forEach(({ element, index }) => {
      const inset = Math.min(0.3, Math.min(element.w, element.h) / 4);
      const x0 = element.x + inset;
      const y0 = element.y + inset;
      const x1 = element.x + element.w - inset;
      const y1 = element.y + element.h - inset;
      const cols = Math.max(1, Math.floor((x1 - x0) / spacing) + 1);
      const rows = Math.max(1, Math.floor((y1 - y0) / spacing) + 1);
      const gx = cols > 1 ? (x1 - x0) / (cols - 1) : 0;
      const gy = rows > 1 ? (y1 - y0) / (rows - 1) : 0;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const px = cols > 1 ? x0 + c * gx : (x0 + x1) / 2;
          const py = rows > 1 ? y0 + r * gy : (y0 + y1) / 2;
          if (raster.ownerAt(px, py) === index) candidates.push([px, py]);
        }
      }
    });
    // When flowers and shrubs share one host type, shrubs take the larger plants first.
    let pool = candidates;
    if (sharedHostOnly && hasFlowers && hasShrubs) {
      pool = candidates.filter((_, i) => (category === 'shrub' ? i % 2 === 0 : i % 2 === 1));
    }
    const counts = new Array<number>(plants.length).fill(0);
    pool.forEach(([px, py], i) => {
      const plantIndex = i % plants.length;
      counts[plantIndex] += 1;
      markers.push({ x: round(px, 2), y: round(py, 2), plantId: plants[plantIndex].id, category });
    });
    plants.forEach((plant, i) => {
      plantLines.push({
        plantId: plant.id,
        name: plant.name,
        category,
        quantity: counts[i],
        where: category === 'flower' ? 'Flower beds' : 'Planting zones',
      });
    });
  });

  // Trees: customer-chosen counts, placed in planting zones / beds, then along the far boundary.
  const { sides, far, others } = perimeterRuns(plot);
  const treePlants = selectedPlants.filter((plant) => plant.category === 'tree');
  if (treePlants.length) {
    const spots: [number, number][] = [];
    [...shrubHosts, ...flowerHosts].forEach(({ element }) => spots.push([element.x + element.w / 2, element.y + element.h / 2]));
    const farRun = sides[far];
    const farLength = lengthOf(farRun);
    const slots = Math.max(2, Math.floor(farLength / 3));
    for (let i = 0; i < slots; i += 1) spots.push(insetPoint(pointAlong(farRun, ((i + 0.5) / slots) * farLength), plot, 1));
    const hardscape = new Set<ElementType>(['patio', 'path', 'seating', 'outdoor_living']);
    const usable = spots.filter(([x, y]) => {
      const idx = raster.ownerAt(x, y);
      return idx < 0 || !hardscape.has(elements[idx].type);
    });
    let spotIndex = 0;
    treePlants.forEach((plant) => {
      const count = Math.max(1, Math.min(10, Math.round(inputs.treeCounts[plant.id] || 1)));
      let placed = 0;
      for (let n = 0; n < count && usable.length; n += 1) {
        const [x, y] = usable[spotIndex % usable.length];
        spotIndex += 1;
        markers.push({ x: round(x, 2), y: round(y, 2), plantId: plant.id, category: 'tree' });
        placed += 1;
      }
      plantLines.push({ plantId: plant.id, name: plant.name, category: 'tree', quantity: placed, where: 'Planting zones / rear boundary' });
    });
    const smallest = Math.min(plot.width, plot.depth);
    treePlants.forEach((plant) => {
      if (plant.spread * 2 > smallest) {
        warnings.push(`${plant.name} (mature spread about ${plant.spread} m) may be too large for a plot this narrow. Check on site before planting.`);
      }
    });
  }

  // Boundaries: hedges and fencing share the non-house sides.
  const hedgePlants = selectedPlants.filter((plant) => plant.category === 'hedge');
  const fenceFeatures = inputs.features.map(featureById).filter((feature): feature is FeatureDef => feature?.category === 'fencing');
  const wantsHedge = hedgePlants.length > 0;
  const wantsFence = fenceFeatures.length > 0;
  let hedgeRuns: [number, number, number, number][] = [];
  let fenceRuns: [number, number, number, number][] = [];
  if (wantsHedge && wantsFence) {
    hedgeRuns = [sides[far]];
    fenceRuns = others.filter((side) => side !== far).map((side) => sides[side]);
  } else if (wantsHedge) {
    hedgeRuns = others.map((side) => sides[side]);
  } else if (wantsFence) {
    fenceRuns = others.map((side) => sides[side]);
  }
  const hedgeLength = round(hedgeRuns.reduce((sum, run) => sum + lengthOf(run), 0), 1);
  const fenceLength = round(fenceRuns.reduce((sum, run) => sum + lengthOf(run), 0), 1);

  if (wantsHedge) {
    const total = hedgeRuns.reduce((sum, run) => sum + lengthOf(run), 0);
    hedgePlants.forEach((plant, plantIndex) => {
      const from = (plantIndex / hedgePlants.length) * total;
      const to = ((plantIndex + 1) / hedgePlants.length) * total;
      const perMetre = plant.perMetre || 3;
      const count = Math.max(0, Math.round((to - from) * perMetre));
      for (let n = 0; n < count; n += 1) {
        let distance = from + ((n + 0.5) / count) * (to - from);
        let point: [number, number] = [0, 0];
        for (const run of hedgeRuns) {
          const length = lengthOf(run);
          if (distance <= length + 1e-6) {
            point = pointAlong(run, distance);
            break;
          }
          distance -= length;
        }
        const [x, y] = insetPoint(point, plot, 0.15);
        markers.push({ x: round(x, 2), y: round(y, 2), plantId: plant.id, category: 'hedge' });
      }
      plantLines.push({ plantId: plant.id, name: plant.name, category: 'hedge', quantity: count, where: `Boundary hedge (${round(to - from, 1)} m)` });
    });
  }

  // Quantities and cost lines. Rates come only from administrator configuration.
  const lines: QuantityLine[] = [];
  const addLine = (key: string, label: string, quantity: number, unit: string, note?: string) => {
    if (quantity <= 0) return;
    const rate = rates[key];
    const unitRatePence = rate && rate.ratePence !== null ? rate.ratePence : null;
    lines.push({
      key,
      label,
      quantity: round(quantity, 1),
      unit,
      unitRatePence,
      totalPence: unitRatePence === null ? null : Math.round(unitRatePence * quantity),
      note,
    });
  };

  const lawnLabel = LAWN_TYPES.find((item) => item.id === inputs.lawnType)?.label || 'Lawn';
  const lawnPriced = inputs.lawnType === 'turf' || inputs.lawnType === 'hardwearing';
  if (areas.lawn > 0) {
    addLine(lawnPriced ? 'turf_m2' : `lawn_${inputs.lawnType}`, `Lawn: ${lawnLabel}`, areas.lawn, 'm2', lawnPriced ? undefined : 'No configured rate for this lawn type');
  }
  addLine('paving_m2', 'Patio paving', areas.patio, 'm2', 'Excludes sub-base and excavation, which depend on ground conditions');
  addLine('path_m2', 'Garden paths', areas.path, 'm2');
  addLine('seating_m2', 'Seating area surfacing', areas.seating, 'm2');
  addLine('living_m2', 'Outdoor living area surfacing', areas.outdoor_living, 'm2');
  addLine('bed_prep_m2', 'Planting bed preparation and mulch', areas.flowerbed + areas.planting, 'm2');

  const countOf = (category: PlantCategory) => plantLines.filter((line) => line.category === category).reduce((sum, line) => sum + line.quantity, 0);
  addLine('plant_flower', 'Flowering plants', countOf('flower'), 'each', 'Indicative, from typical spacing');
  addLine('plant_shrub', 'Shrubs', countOf('shrub'), 'each', 'Indicative, from typical spacing');
  addLine('plant_hedge', 'Hedge plants', countOf('hedge'), 'each', 'Indicative, from typical planting density');
  addLine('plant_tree', 'Trees', countOf('tree'), 'each');
  if (fenceLength > 0) {
    addLine('fencing_m', `Fencing (${fenceFeatures.map((feature) => feature.label).join(', ')})`, fenceLength, 'm', 'Excludes gates; boundary length excludes the house side');
  }

  const featureTotal = (category: FeatureCategory) =>
    inputs.features
      .map(featureById)
      .filter((feature): feature is FeatureDef => feature?.category === category)
      .reduce((sum, feature) => sum + (feature.countable ? Math.max(1, Math.round(inputs.featureQty[feature.id] || 1)) : 1), 0);
  addLine('lighting_each', 'Garden lighting', featureTotal('lighting'), 'each', 'Electrical supply to be assessed on site');
  addLine('seating_each', 'Garden seating', featureTotal('seating'), 'each');
  addLine('feature_each', 'Decorative features', featureTotal('decorative'), 'each');

  const bedArea = areas.flowerbed + areas.planting;
  if (bedArea > 0) {
    lines.push({
      key: 'mulch_m3',
      label: 'Bark mulch (at an indicative 50 mm depth)',
      quantity: round(bedArea * 0.05, 2),
      unit: 'm3',
      unitRatePence: null,
      totalPence: null,
      note: 'Quantity only; priced within bed preparation',
    });
  }

  const priced = lines.filter((line) => line.totalPence !== null && line.key !== 'mulch_m3');
  const pricedTotalPence = priced.reduce((sum, line) => sum + (line.totalPence || 0), 0);
  const unpricedCount = lines.filter((line) => line.totalPence === null && line.key !== 'mulch_m3').length;

  const onSiteChecks = [
    'Ground conditions, drainage and soil type',
    'Excavation, sub-base depth and waste removal for hard surfaces',
    'Levels, slopes and access for materials and machinery',
    'Underground services, boundaries and any planning or tree preservation restrictions',
    'Final plant selection against soil and aspect',
  ];
  if (inputs.lawnType === 'artificial' || inputs.lawnType === 'wildflower' || inputs.lawnType === 'seed') {
    onSiteChecks.push('Lawn preparation for the chosen lawn type');
  }
  if (inputs.features.some((id) => featureById(id)?.category === 'lighting')) onSiteChecks.push('Electrical supply and cable routes for lighting');

  return {
    areas,
    plotArea,
    gardenCoveragePct: plotArea > 0 ? round((Math.min(covered, plotArea) / plotArea) * 100, 0) : 0,
    markers,
    fenceRuns,
    hedgeRuns,
    fenceLength,
    hedgeLength,
    plantLines,
    lines,
    pricedTotalPence,
    unpricedCount,
    warnings,
    onSiteChecks,
  };
}

export function formatGbp(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}

export const PACKAGE_LIMITS: Record<PackageId, { concepts: number; pdfLevel: 0 | 1 | 2 }> = {
  preview: { concepts: 1, pdfLevel: 1 },
  plus: { concepts: 3, pdfLevel: 1 },
  complete: { concepts: 3, pdfLevel: 2 },
};

export function describeLayout(inputs: ScratchInputs) {
  const { plot, elements } = inputs;
  const sideWord: Record<HouseSide, string> = { top: 'top', right: 'right', bottom: 'bottom', left: 'left' };
  const position = (element: LayoutElement) => {
    const cx = (element.x + element.w / 2) / plot.width;
    const cy = (element.y + element.h / 2) / plot.depth;
    const horizontal = cx < 0.34 ? 'left' : cx > 0.66 ? 'right' : 'centre';
    const vertical = cy < 0.34 ? 'top' : cy > 0.66 ? 'bottom' : 'middle';
    return `${vertical}-${horizontal} of the plan`;
  };
  const parts = elements.map(
    (element) => `${elementMeta(element.type).label.toLowerCase()} about ${round(element.w, 1)} m by ${round(element.h, 1)} m in the ${position(element)}`
  );
  return `The plot is ${plot.width} m wide and ${plot.depth} m deep; the house is on the ${sideWord[plot.houseSide]} edge of the plan. Layout: ${parts.join('; ') || 'no zones placed'}.`;
}
