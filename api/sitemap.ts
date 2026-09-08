import type { ApiRequest, ApiResponse } from './_lib/types.js';
import { supabaseAdmin } from './_lib/supabase.js';

const SITE_URL = 'https://www.cambridgegardenservices.co.uk';
const TODAY = '2026-09-08';

const serviceIds = [
  'garden-design',
  'landscaping',
  'patios',
  'fencing',
  'turfing',
  'garden-clearance',
  'groundworks',
  'tree-surgery',
  'garden-maintenance',
];

type SitemapUrl = {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, changefreq, priority }: SitemapUrl) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

async function getPublishedArticleUrls(): Promise<SitemapUrl[]> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return [];

  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('id, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((article) => ({
      loc: `${SITE_URL}/journal/${article.id}`,
      lastmod: String(article.updated_at || TODAY).slice(0, 10),
      changefreq: 'monthly',
      priority: '0.6',
    }));
  } catch (error) {
    console.error('Sitemap article fetch failed', error);
    return [];
  }
}

async function getPublishedServiceUrls(): Promise<SitemapUrl[]> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return [];

  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('id, updated_at')
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((service) => ({
      loc: `${SITE_URL}/services/${service.id}`,
      lastmod: String(service.updated_at || TODAY).slice(0, 10),
      changefreq: 'monthly',
      priority: '0.8',
    }));
  } catch (error) {
    console.error('Sitemap service fetch failed', error);
    return [];
  }
}

async function getPublishedProjectUrls(): Promise<SitemapUrl[]> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return [];

  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('id, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((project) => ({
      loc: `${SITE_URL}/projects/${project.id}`,
      lastmod: String(project.updated_at || TODAY).slice(0, 10),
      changefreq: 'monthly',
      priority: '0.7',
    }));
  } catch (error) {
    console.error('Sitemap project fetch failed', error);
    return [];
  }
}

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  const baseUrls: SitemapUrl[] = [
    { loc: `${SITE_URL}/`, lastmod: TODAY, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/services`, lastmod: TODAY, changefreq: 'monthly', priority: '0.9' },
    { loc: `${SITE_URL}/about`, lastmod: TODAY, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE_URL}/climate-ready`, lastmod: TODAY, changefreq: 'monthly', priority: '0.7' },
  ];
  const fallbackServiceUrls: SitemapUrl[] = [
    ...serviceIds.map((id) => ({
      loc: `${SITE_URL}/services/${id}`,
      lastmod: TODAY,
      changefreq: 'monthly' as const,
      priority: '0.8',
    })),
  ];
  const [serviceUrls, projectUrls, articleUrls] = await Promise.all([
    getPublishedServiceUrls(),
    getPublishedProjectUrls(),
    getPublishedArticleUrls(),
  ]);
  const urls = [...baseUrls, ...(serviceUrls.length > 0 ? serviceUrls : fallbackServiceUrls), ...projectUrls, ...articleUrls];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls.map(urlEntry).join('\n'),
    '</urlset>',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).end(xml);
}
