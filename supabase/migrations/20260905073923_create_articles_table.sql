/*
# Create articles table for Journal/Blog

1. New Tables
- `articles`
  - `id` (uuid, primary key)
  - `title` (text, not null): article title.
  - `excerpt` (text, not null): short summary shown in the journal grid.
  - `content` (text, not null): full article body (markdown/plain text).
  - `category` (text, not null): e.g. "Seasonal Care", "Design Ideas".
  - `tags` (text[], nullable): array of tag strings.
  - `date` (text, not null): display date string, e.g. "September 2026".
  - `cover_image` (text, not null): URL of the cover image in storage.
  - `cover_alt` (text, not null): alt text for the cover image.
  - `published` (boolean, not null, default false): published vs draft.
  - `sort_order` (integer, not null, default 0): display ordering.
  - `created_at` (timestamptz, default now()).
  - `updated_at` (timestamptz, default now()).

2. Indexes
- `idx_articles_published` on `published` for filtering.
- `idx_articles_sort_order` on `sort_order` for ordering.

3. Security
- Enable RLS on `articles`.
- Public (anon) can SELECT published articles only.
- Authenticated admin can SELECT, INSERT, UPDATE, DELETE all articles.
- Auto-update `updated_at` via trigger.

4. Important Notes
- Existing static journal entries will be migrated into this table via INSERT.
- The Journal component on the website will fetch from this table instead of static data.
- Each article gets its own dedicated page at /journal/:id.
*/

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  date text NOT NULL,
  cover_image text NOT NULL,
  cover_alt text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_sort_order ON public.articles(sort_order);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles only
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
CREATE POLICY "Public can read published articles"
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Authenticated admin can read all articles
DROP POLICY IF EXISTS "Admin can read all articles" ON public.articles;
CREATE POLICY "Admin can read all articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated admin can insert articles
DROP POLICY IF EXISTS "Admin can insert articles" ON public.articles;
CREATE POLICY "Admin can insert articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated admin can update articles
DROP POLICY IF EXISTS "Admin can update articles" ON public.articles;
CREATE POLICY "Admin can update articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated admin can delete articles
DROP POLICY IF EXISTS "Admin can delete articles" ON public.articles;
CREATE POLICY "Admin can delete articles"
  ON public.articles FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at on articles
CREATE OR REPLACE FUNCTION public.handle_articles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS articles_updated_at ON public.articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_articles_updated_at();

-- Migrate existing static journal entries into the articles table
-- Only insert if they don't already exist (check by title)
INSERT INTO public.articles (title, excerpt, content, category, tags, date, cover_image, cover_alt, published, sort_order)
SELECT
  'Autumn: The Garden''s Second Spring',
  'Why autumn is the true planting season — and how to set your garden up for a spectacular show the following year.',
  'Why autumn is the true planting season — and how to set your garden up for a spectacular show the following year. Autumn is not the end of the gardening year but the beginning of the next one. The soil is still warm from summer, the rains have begun, and plants can establish roots before the cold sets in. This is the time to plant trees, shrubs, and perennials — they will reward you with a spectacular show come spring.',
  'Seasonal Care',
  ARRAY['autumn', 'planting', 'seasonal']::text[],
  'September 2026',
  'https://images.pexels.com/photos/213023/pexels-photo-213023.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Colourful autumn leaves on branches in England',
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.articles WHERE title = 'Autumn: The Garden''s Second Spring');

INSERT INTO public.articles (title, excerpt, content, category, tags, date, cover_image, cover_alt, published, sort_order)
SELECT
  'Designing for Light',
  'How the angle of the sun shapes every great garden — and the simple techniques we use to work with it, not against it.',
  'How the angle of the sun shapes every great garden — and the simple techniques we use to work with it, not against it. Every great garden is designed around light. The way the sun moves across your garden through the day and through the seasons determines where you plant, where you sit, and where you place your paths. Understanding the arc of the sun — how it climbs low in winter and arcs high in summer — is the single most important skill in garden design.',
  'Design Ideas',
  ARRAY['light', 'design', 'sun']::text[],
  'August 2026',
  'https://images.pexels.com/photos/7505369/pexels-photo-7505369.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Close-up of a green leaf highlighted by sunlight',
  true,
  2
WHERE NOT EXISTS (SELECT 1 FROM public.articles WHERE title = 'Designing for Light');

INSERT INTO public.articles (title, excerpt, content, category, tags, date, cover_image, cover_alt, published, sort_order)
SELECT
  'The Outdoor Room',
  'A patio is not just a hard surface. It is an extension of your home — a place to eat, gather, and watch the evening settle in.',
  'A patio is not just a hard surface. It is an extension of your home — a place to eat, gather, and watch the evening settle in. The best patios feel like rooms without ceilings. They have boundaries — a wall, a hedge, a pergola — that give them shape. They have a sense of arrival, a reason to step outside. And they are oriented to catch the right light at the right time of day.',
  'Outdoor Living',
  ARRAY['patio', 'outdoor', 'living']::text[],
  'July 2026',
  'https://images.pexels.com/photos/4112237/pexels-photo-4112237.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Inviting outdoor patio with warm string lights at night',
  true,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.articles WHERE title = 'The Outdoor Room');

INSERT INTO public.articles (title, excerpt, content, category, tags, date, cover_image, cover_alt, published, sort_order)
SELECT
  'From Ground to Garden',
  'Behind every transformation is a story of earth, stone, and patience. We walk through one of our favourite Cambridge projects.',
  'Behind every transformation is a story of earth, stone, and patience. We walk through one of our favourite Cambridge projects. The most dramatic garden transformations do not start with planting — they start with the ground itself. Before a single flower goes in, we shape the earth: levelling, draining, building the bones of the garden that everything else will grow from.',
  'Transformations',
  ARRAY['transformation', 'cambridge', 'groundworks']::text[],
  'June 2026',
  'https://images.pexels.com/photos/37441090/pexels-photo-37441090.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'Garden archway leading to a brick cottage',
  true,
  4
WHERE NOT EXISTS (SELECT 1 FROM public.articles WHERE title = 'From Ground to Garden');
