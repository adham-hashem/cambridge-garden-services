export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  detail: string;
  heroImage: string;
  heroAlt: string;
}

export const services: ServiceItem[] = [
  {
    id: 'garden-design',
    title: 'Garden Design',
    description: 'Bespoke planting plans and layouts tailored to your space, light, and lifestyle.',
    image: 'https://images.pexels.com/photos/6615239/pexels-photo-6615239.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Architectural garden design sketches on a desk',
    detail: 'Every great garden begins on paper. We listen to how you want to use the space, study the light and soil, and craft a design that feels inevitable — as though it was always meant to be.',
    heroImage: 'https://images.pexels.com/photos/37266505/pexels-photo-37266505.jpeg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Vibrant garden pathway surrounded by blooming flowers and lush greenery',
  },
  {
    id: 'landscaping',
    title: 'Landscaping',
    description: 'Full structural transformations — from reshaping ground to building the bones of the garden.',
    image: 'https://images.pexels.com/photos/39045225/pexels-photo-39045225.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Stone walkway through green grass in a landscaped garden',
    detail: 'We move earth, lay stone, and shape the land so that every path, terrace, and border sits naturally in its place. The hard work that makes the garden look effortless.',
    heroImage: 'https://images.pexels.com/photos/32959283/pexels-photo-32959283.jpeg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Stone pathway surrounded by vibrant wildflowers in a landscaped garden',
  },
  {
    id: 'patios',
    title: 'Patios',
    description: 'Natural stone and brick patios that extend your living space into the open air.',
    image: 'https://images.pexels.com/photos/39009170/pexels-photo-39009170.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Beautiful stone patio with outdoor furniture and greenery',
    detail: 'A well-laid patio is a room without a ceiling. We choose stone that complements your home, lay it with precision, and create a space that asks to be lingered on.',
    heroImage: 'https://images.pexels.com/photos/38220910/pexels-photo-38220910.jpeg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Elegant circular patio with stone steps and lush greenery',
  },
  {
    id: 'fencing',
    title: 'Fencing',
    description: 'Quality timber fencing that frames the garden and provides shelter, privacy, and structure.',
    image: 'https://images.pexels.com/photos/48246/fence-wood-fence-wood-limit-48246.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Close-up of a wooden fence against a natural background',
    detail: 'A fence is more than a boundary — it is the garden\u2019s frame. We install durable, beautiful timber fencing that protects your space and enhances its character.',
    heroImage: 'https://images.pexels.com/photos/2912/fence.jpg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Rustic wooden fence with green leaves peeking through the gaps',
  },
  {
    id: 'turfing',
    title: 'Turfing',
    description: 'Lush, level lawns laid from premium-grade turf for an instant carpet of green.',
    image: 'https://images.pexels.com/photos/5231236/pexels-photo-5231236.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Farmer laying a roll of grass turf on the ground',
    detail: 'There is nothing quite like the feel of fresh turf underfoot. We prepare the ground thoroughly and lay premium turf so your lawn establishes deep, even roots.',
    heroImage: 'https://images.pexels.com/photos/186236/pexels-photo-186236.jpeg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Lush green grass lawn viewed close up',
  },
  {
    id: 'garden-clearance',
    title: 'Garden Clearance',
    description: 'Reclaiming overgrown spaces — clearing, cutting back, and revealing what lies beneath.',
    image: 'https://images.pexels.com/photos/26827231/pexels-photo-26827231.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Old wheelbarrow filled with garden waste and weeds',
    detail: 'Sometimes a garden just needs a fresh start. We clear brambles, waste, and overgrowth, leaving you with a clean canvas and a sense of possibility.',
    heroImage: 'https://images.pexels.com/photos/37441090/pexels-photo-37441090.jpeg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Garden archway leading to a brick English cottage',
  },
  {
    id: 'groundworks',
    title: 'Groundworks',
    description: 'Foundations, drainage, and ground preparation — the unseen work that holds the garden together.',
    image: 'https://images.pexels.com/photos/12164798/pexels-photo-12164798.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Excavator levelling ground at an outdoor site',
    detail: 'What you do not see matters most. We handle excavation, drainage, and ground levelling so your garden stands firm and drains freely for decades.',
    heroImage: 'https://images.pexels.com/photos/39045225/pexels-photo-39045225.jpeg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Stone walkway through green grass in a landscaped garden',
  },
  {
    id: 'tree-surgery',
    title: 'Tree Surgery',
    description: 'Expert crown reduction, felling, and pruning by qualified tree care specialists.',
    image: 'https://images.pexels.com/photos/6218318/pexels-photo-6218318.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Arborist cutting a tree with a chainsaw wearing safety gear',
    detail: 'Trees are the garden\u2019s elders and deserve expert care. Our qualified arborists handle pruning, crown reduction, and safe felling with precision and respect.',
    heroImage: 'https://images.pexels.com/photos/31296071/pexels-photo-31296071.jpeg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Heavily pruned tree branches silhouetted against a clear blue sky',
  },
  {
    id: 'garden-maintenance',
    title: 'Garden Maintenance',
    description: 'Regular, reliable care that keeps your garden looking its best through every season.',
    image: 'https://images.pexels.com/photos/38936351/pexels-photo-38936351.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Gardener trimming a hedge with shears on a sunny day',
    detail: 'A garden is a living thing that needs consistent attention. We offer scheduled maintenance — mowing, pruning, weeding, and feeding — so your garden never misses a beat.',
    heroImage: 'https://images.pexels.com/photos/26599272/pexels-photo-26599272.jpeg?auto=compress&cs=tinysrgb&w=1920',
    heroAlt: 'Elegant garden pathway lined with manicured bushes and classic pedestals',
  },
];

export interface ProjectItem {
  id: string;
  serviceId: string;
  title: string;
  location: string;
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  description: string;
}

export const projects: ProjectItem[] = [
  // Garden Design
  {
    id: 'design-1',
    serviceId: 'garden-design',
    title: 'The Cottage Border',
    location: 'Grantchester, Cambridge',
    before: 'https://images.pexels.com/photos/26827231/pexels-photo-26827231.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/37266505/pexels-photo-37266505.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Overgrown garden with weeds and garden waste',
    afterAlt: 'Vibrant garden pathway surrounded by blooming flowers',
    description: 'A neglected patch was reimagined as a classic English cottage border, with drifts of perennials and a winding path that invites you to wander.',
  },
  {
    id: 'design-2',
    serviceId: 'garden-design',
    title: 'The Hidden Garden',
    location: 'Newnham, Cambridge',
    before: 'https://images.pexels.com/photos/11573631/pexels-photo-11573631.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/36338271/pexels-photo-36338271.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Abandoned pathway lined with dense green foliage and debris',
    afterAlt: 'Colourful hydrangeas in a serene garden with stone pathways',
    description: 'An abandoned corner was opened up and redesigned with hydrangeas, stone pathways, and natural wood borders to create a secret retreat.',
  },

  // Landscaping
  {
    id: 'landscape-1',
    serviceId: 'landscaping',
    title: 'The Stone Walkway',
    location: 'Cherry Hinton, Cambridge',
    before: 'https://images.pexels.com/photos/12164798/pexels-photo-12164798.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/32959283/pexels-photo-32959283.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Bare excavated ground before landscaping',
    afterAlt: 'Stone pathway surrounded by vibrant wildflowers',
    description: 'A bare, uneven plot was reshaped with a meandering stone path, new planting beds, and gentle contours that guide the eye through the garden.',
  },
  {
    id: 'landscape-2',
    serviceId: 'landscaping',
    title: 'The Terraced Garden',
    location: 'Trumpington, Cambridge',
    before: 'https://images.pexels.com/photos/11573631/pexels-photo-11573631.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/39117267/pexels-photo-39117267.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Abandoned overgrown pathway with debris',
    afterAlt: 'Stone pathway meandering through a lush green garden',
    description: 'A steep, unusable slope was transformed into a series of terraced levels with stone retaining walls, connected by steps and planting.',
  },

  // Patios
  {
    id: 'patio-1',
    serviceId: 'patios',
    title: 'The Sun Trap',
    location: 'Newnham, Cambridge',
    before: 'https://images.pexels.com/photos/12164798/pexels-photo-12164798.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/39009170/pexels-photo-39009170.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Bare excavated ground before patio construction',
    afterAlt: 'Finished stone patio with furniture and greenery',
    description: 'A bare, uneven plot became a sun-drenched patio — levelled, paved in natural stone, and framed with soft planting.',
  },
  {
    id: 'patio-2',
    serviceId: 'patios',
    title: 'The Circular Terrace',
    location: 'Madingley, Cambridge',
    before: 'https://images.pexels.com/photos/9690090/pexels-photo-9690090.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/38220910/pexels-photo-38220910.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Workers laying tiles on an outdoor patio',
    afterAlt: 'Elegant circular patio with stone steps and lush greenery',
    description: 'A dull rectangular slab was replaced with a circular stone terrace, its curves softened by surrounding planting and natural steps.',
  },

  // Fencing
  {
    id: 'fencing-1',
    serviceId: 'fencing',
    title: 'The Boundary Line',
    location: 'Arbury, Cambridge',
    before: 'https://images.pexels.com/photos/11849369/pexels-photo-11849369.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/48246/fence-wood-fence-wood-limit-48246.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Damaged fence showing signs of decay and wear',
    afterAlt: 'New wooden fence against a natural green background',
    description: 'A rotting, sagging fence was removed and replaced with durable timber panels that frame the garden and restore privacy.',
  },
  {
    id: 'fencing-2',
    serviceId: 'fencing',
    title: 'The Garden Room',
    location: 'Chesterton, Cambridge',
    before: 'https://images.pexels.com/photos/11846465/pexels-photo-11846465.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/2912/fence.jpg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Damaged brick wall and broken fence',
    afterAlt: 'Rustic wooden fence with green leaves peeking through',
    description: 'A crumbling boundary was rebuilt with close-boarded timber fencing, creating a warm, sheltered enclosure for a new seating area.',
  },

  // Turfing
  {
    id: 'turfing-1',
    serviceId: 'turfing',
    title: 'The Green Carpet',
    location: 'Histon, Cambridge',
    before: 'https://images.pexels.com/photos/7728053/pexels-photo-7728053.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/186236/pexels-photo-186236.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Gardener preparing bare soil for planting',
    afterAlt: 'Lush green grass lawn viewed close up',
    description: 'A patchy, compacted lawn was rotavated, levelled, and re-laid with premium turf for an instant, flawless carpet of green.',
  },
  {
    id: 'turfing-2',
    serviceId: 'turfing',
    title: 'The Family Lawn',
    location: 'Cambourne, Cambridge',
    before: 'https://images.pexels.com/photos/7658774/pexels-photo-7658774.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/11654274/pexels-photo-11654274.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Bare soil being prepared with a trowel',
    afterAlt: 'Fresh green grass with a bright natural texture',
    description: 'A bare builder\u2019s yard was transformed into a lush family lawn, with proper ground preparation and premium turf for years of use.',
  },

  // Garden Clearance
  {
    id: 'clearance-1',
    serviceId: 'garden-clearance',
    title: 'The Overgrown Orchard',
    location: 'Grantchester, Cambridge',
    before: 'https://images.pexels.com/photos/26827231/pexels-photo-26827231.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/37123675/pexels-photo-37123675.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Old wheelbarrow filled with garden waste and weeds',
    afterAlt: 'Beautiful cleared garden path leading to a cottage',
    description: 'Years of neglect had swallowed this orchard whole. We cleared the brambles, restored the path, and let the trees breathe again.',
  },
  {
    id: 'clearance-2',
    serviceId: 'garden-clearance',
    title: 'The Reclaimed Corner',
    location: 'Romsey, Cambridge',
    before: 'https://images.pexels.com/photos/11573631/pexels-photo-11573631.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/37441090/pexels-photo-37441090.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Abandoned pathway with dense foliage and debris',
    afterAlt: 'Garden archway leading to a brick cottage',
    description: 'A forgotten corner choked with ivy and debris was cleared, revealing a charming archway and a space ready for new life.',
  },

  // Groundworks
  {
    id: 'groundworks-1',
    serviceId: 'groundworks',
    title: 'The Drainage Solution',
    location: 'Trumpington, Cambridge',
    before: 'https://images.pexels.com/photos/12164798/pexels-photo-12164798.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/39045225/pexels-photo-39045225.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Excavator levelling ground at an outdoor site',
    afterAlt: 'Stone walkway through green grass in a landscaped garden',
    description: 'A waterlogged garden was excavated, drained, and re-levelled, creating a solid foundation for paths, planting, and a new patio.',
  },
  {
    id: 'groundworks-2',
    serviceId: 'groundworks',
    title: 'The Level Garden',
    location: 'Cherry Hinton, Cambridge',
    before: 'https://images.pexels.com/photos/11573631/pexels-photo-11573631.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/39117267/pexels-photo-39117267.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Uneven ground with debris before levelling',
    afterAlt: 'Level stone pathway through a lush green garden',
    description: 'An uneven, pitted plot was excavated and levelled, with new drainage and a compacted sub-base ready for landscaping.',
  },

  // Tree Surgery
  {
    id: 'tree-1',
    serviceId: 'tree-surgery',
    title: 'The Crown Reduction',
    location: 'Newnham, Cambridge',
    before: 'https://images.pexels.com/photos/5622822/pexels-photo-5622822.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/31296071/pexels-photo-31296071.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Dry tree with thin twigs under a foggy sky',
    afterAlt: 'Heavily pruned tree branches against a clear blue sky',
    description: 'An overgrown oak was crowning the entire garden. We carefully reduced the canopy, letting light flood back into the space below.',
  },
  {
    id: 'tree-2',
    serviceId: 'tree-surgery',
    title: 'The Shaped Hedge',
    location: 'Madingley, Cambridge',
    before: 'https://images.pexels.com/photos/32822371/pexels-photo-32822371.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/9204/nature-blue-park-green.jpg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Overgrown bush with tangled growth',
    afterAlt: 'Well-maintained sphere-shaped hedge under a blue sky',
    description: 'A tangled, overgrown hedge was reshaped into a clean, architectural form that frames the garden entrance.',
  },

  // Garden Maintenance
  {
    id: 'maintenance-1',
    serviceId: 'garden-maintenance',
    title: 'The Tangled Border',
    location: 'Cherry Hinton, Cambridge',
    before: 'https://images.pexels.com/photos/32822371/pexels-photo-32822371.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/25972319/pexels-photo-25972319.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Overgrown bush with tangled growth',
    afterAlt: 'Manicured garden with vibrant flowers and tidy borders',
    description: 'A tangled mass of overgrowth was cut back, restructured, and replanted with a seasonal border that flowers from spring to frost.',
  },
  {
    id: 'maintenance-2',
    serviceId: 'garden-maintenance',
    title: 'The Seasonal Refresh',
    location: 'Arbury, Cambridge',
    before: 'https://images.pexels.com/photos/12093840/pexels-photo-12093840.jpeg?auto=compress&cs=tinysrgb&w=1200',
    after: 'https://images.pexels.com/photos/26599272/pexels-photo-26599272.jpeg?auto=compress&cs=tinysrgb&w=1200',
    beforeAlt: 'Garden floor with brown leaves and debris',
    afterAlt: 'Elegant garden pathway with manicured bushes and pedestals',
    description: 'A garden buried under autumn debris was cleared, pruned, and mulched, ready to burst back into life for the new season.',
  },
];

export function getProjectsByService(serviceId: string): ProjectItem[] {
  return projects.filter((p) => p.serviceId === serviceId);
}

export function getServiceById(id: string): ServiceItem | undefined {
  return services.find((s) => s.id === id);
}

export interface JournalEntry {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  alt: string;
}

export const journalEntries: JournalEntry[] = [
  {
    id: 'journal-1',
    title: 'Autumn: The Garden\u2019s Second Spring',
    category: 'Seasonal Care',
    date: 'September 2026',
    excerpt: 'Why autumn is the true planting season — and how to set your garden up for a spectacular show the following year.',
    image: 'https://images.pexels.com/photos/213023/pexels-photo-213023.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Colourful autumn leaves on branches in England',
  },
  {
    id: 'journal-2',
    title: 'Designing for Light',
    category: 'Design Ideas',
    date: 'August 2026',
    excerpt: 'How the angle of the sun shapes every great garden — and the simple techniques we use to work with it, not against it.',
    image: 'https://images.pexels.com/photos/7505369/pexels-photo-7505369.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Close-up of a green leaf highlighted by sunlight',
  },
  {
    id: 'journal-3',
    title: 'The Outdoor Room',
    category: 'Outdoor Living',
    date: 'July 2026',
    excerpt: 'A patio is not just a hard surface. It is an extension of your home — a place to eat, gather, and watch the evening settle in.',
    image: 'https://images.pexels.com/photos/4112237/pexels-photo-4112237.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Inviting outdoor patio with warm string lights at night',
  },
  {
    id: 'journal-4',
    title: 'From Ground to Garden',
    category: 'Transformations',
    date: 'June 2026',
    excerpt: 'Behind every transformation is a story of earth, stone, and patience. We walk through one of our favourite Cambridge projects.',
    image: 'https://images.pexels.com/photos/37441090/pexels-photo-37441090.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Garden archway leading to a brick cottage',
  },
];
