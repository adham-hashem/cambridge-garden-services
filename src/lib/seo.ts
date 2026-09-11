import type { Article } from '@/types/article';
import type { ServiceItem } from '@/data/content';

export const SITE_URL = 'https://www.cambridgegardenservices.co.uk';
export const SITE_NAME = 'Cambridge Garden Services';
export const DEFAULT_IMAGE = `${SITE_URL}/WhatsApp_Image_2026-09-03_at_12.01.32_PM.jpeg`;
export const FACEBOOK_URL = 'https://www.facebook.com/share/1Hkr7t88s4/';
export const GOOGLE_BUSINESS_URL = 'https://share.google/qCR4oZsCSFSUlBd3a';
export const YELL_URL = 'https://www.yell.com/biz/cambridge-garden-services-cambridge-7093822/';

export const pageSeo = {
  home: {
    title: 'Cambridge Garden Services | Garden Design, Landscaping & Maintenance',
    description:
      'Cambridge Garden Services provides garden design, landscaping, patios, fencing, turfing, garden clearance, tree surgery and maintenance across Cambridge.',
  },
  about: {
    title: 'About Cambridge Garden Services | Local Gardeners in Cambridge',
    description:
      'Meet Cambridge Garden Services, a trusted local garden company serving Cambridge and surrounding villages with reliable, high-quality garden care.',
  },
  climate: {
    title: 'Climate-Ready Gardens in Cambridge | Cambridge Garden Services',
    description:
      'Plan a resilient Cambridge garden with drought-aware planting, better drainage, shade, biodiversity and practical climate-ready garden design.',
  },
  testimonials: {
    title: 'Client Testimonials | Cambridge Garden Services',
    description:
      'Read genuine reviews from homeowners across Cambridge. Discover our high-quality landscaping, paving, fencing, and garden transformations.',
  },
  inspiration: {
    title: 'Garden Inspiration & Materials | Cambridge Garden Services',
    description:
      'Explore standalone project features, paving, timber fencing, turfing, and landscaping materials crafted by Cambridge Garden Services.',
  },
  admin: {
    title: 'Admin Dashboard | Cambridge Garden Services',
    description: 'Private administration area for Cambridge Garden Services.',
  },
};

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function serviceSeo(service: ServiceItem) {
  return {
    title: `${service.title} Cambridge | Cambridge Garden Services`,
    description: `${service.description} Cambridge Garden Services provides ${service.title.toLowerCase()} across Cambridge and surrounding villages.`,
    image: service.heroImage,
    path: `/services/${service.id}`,
  };
}

export function articleSeo(article: Article) {
  return {
    title: `${article.title} | Cambridge Garden Services`,
    description: article.excerpt,
    image: article.cover_image,
    path: `/journal/${article.id}`,
  };
}

export function localBusinessStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    url: SITE_URL,
    image: DEFAULT_IMAGE,
    logo: DEFAULT_IMAGE,
    description: pageSeo.home.description,
    telephone: ['+441223864703', '+447814584119'],
    email: 'info@cambridgegardenservices.co.uk',
    priceRange: '$$',
    sameAs: [FACEBOOK_URL, GOOGLE_BUSINESS_URL, YELL_URL],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Cambridge',
      addressRegion: 'Cambridgeshire',
      addressCountry: 'GB',
    },
    areaServed: [
      { '@type': 'City', name: 'Cambridge' },
      { '@type': 'AdministrativeArea', name: 'Cambridgeshire' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '08:00',
        closes: '20:00',
      },
    ],
    makesOffer: [
      'Garden Design',
      'Landscaping',
      'Patios',
      'Fencing',
      'Turfing',
      'Garden Clearance',
      'Groundworks',
      'Tree Surgery',
      'Garden Maintenance',
    ].map((name) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name,
        areaServed: 'Cambridge',
        provider: { '@id': `${SITE_URL}/#localbusiness` },
      },
    })),
  };
}

export function websiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#localbusiness` },
    inLanguage: 'en-GB',
  };
}

export function serviceStructuredData(service: ServiceItem) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${absoluteUrl(`/services/${service.id}`)}#service`,
    name: `${service.title} in Cambridge`,
    description: service.description,
    image: service.heroImage,
    areaServed: 'Cambridge and surrounding villages',
    provider: { '@id': `${SITE_URL}/#localbusiness` },
    serviceType: service.title,
    url: absoluteUrl(`/services/${service.id}`),
  };
}

export function articleStructuredData(article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${absoluteUrl(`/journal/${article.id}`)}#article`,
    headline: article.title,
    description: article.excerpt,
    image: article.cover_image,
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: { '@id': `${SITE_URL}/#localbusiness` },
    mainEntityOfPage: absoluteUrl(`/journal/${article.id}`),
  };
}

export function breadcrumbStructuredData(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
