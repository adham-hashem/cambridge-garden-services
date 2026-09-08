import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { absoluteUrl, DEFAULT_IMAGE, SITE_NAME } from '@/lib/seo';

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = url;
}

export default function SEO({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
  structuredData,
}: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    const canonicalUrl = absoluteUrl(path || `${location.pathname}${location.search}`);
    const robots = noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    document.title = title;
    upsertCanonical(canonicalUrl);
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });

    document.head.querySelectorAll('script[data-seo-json-ld="true"]').forEach((element) => element.remove());
    const entries = Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [];
    entries.forEach((entry) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoJsonLd = 'true';
      script.textContent = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }, [description, image, location.pathname, location.search, noIndex, path, structuredData, title, type]);

  return null;
}
