/*
# Create testimonials and garden_inspirations tables

1. Testimonials Table
- `id` (uuid, primary key)
- `name` (text, not null)
- `rating` (int, check between 1 and 5)
- `comment` (text, not null)
- `customer_photo` (text, not null default '')
- `customer_photo_alt` (text, not null default '')
- `published` (boolean, default true)
- `sort_order` (int, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

2. Garden Inspirations Table
- `id` (uuid, primary key)
- `title` (text, not null)
- `description` (text, not null)
- `image` (text, not null)
- `alt` (text, not null default '')
- `service_id` (text, not null)
- `published` (boolean, default true)
- `sort_order` (int, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

3. Security & Policies
- Enable RLS on both tables.
- Public can read published testimonials immediately.
- Public can insert testimonials (immediate appearance, no admin approval required).
- Public can read published garden inspirations.
- Service role has full access for admin management.
*/

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL CHECK (length(trim(comment)) > 0),
  customer_photo text NOT NULL DEFAULT '',
  customer_photo_alt text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_published ON public.testimonials(published);
CREATE INDEX IF NOT EXISTS idx_testimonials_sort_order ON public.testimonials(sort_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at DESC);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published testimonials" ON public.testimonials;
CREATE POLICY "Public can read published testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Public can insert testimonials" ON public.testimonials;
CREATE POLICY "Public can insert testimonials"
  ON public.testimonials FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(name)) > 0 AND
    rating >= 1 AND rating <= 5 AND
    length(trim(comment)) > 0
  );

GRANT SELECT, INSERT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;

CREATE OR REPLACE FUNCTION public.handle_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS testimonials_updated_at ON public.testimonials;
CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_testimonials_updated_at();

CREATE TABLE IF NOT EXISTS public.garden_inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  image text NOT NULL CHECK (length(trim(image)) > 0),
  alt text NOT NULL DEFAULT '',
  service_id text NOT NULL CHECK (length(trim(service_id)) > 0),
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garden_inspirations_published ON public.garden_inspirations(published);
CREATE INDEX IF NOT EXISTS idx_garden_inspirations_service_id ON public.garden_inspirations(service_id);
CREATE INDEX IF NOT EXISTS idx_garden_inspirations_sort_order ON public.garden_inspirations(sort_order);
CREATE INDEX IF NOT EXISTS idx_garden_inspirations_created_at ON public.garden_inspirations(created_at DESC);

ALTER TABLE public.garden_inspirations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published garden inspirations" ON public.garden_inspirations;
CREATE POLICY "Public can read published garden inspirations"
  ON public.garden_inspirations FOR SELECT
  TO anon, authenticated
  USING (published = true);

GRANT SELECT ON public.garden_inspirations TO anon, authenticated;
GRANT ALL ON public.garden_inspirations TO service_role;

CREATE OR REPLACE FUNCTION public.handle_garden_inspirations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS garden_inspirations_updated_at ON public.garden_inspirations;
CREATE TRIGGER garden_inspirations_updated_at
  BEFORE UPDATE ON public.garden_inspirations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_garden_inspirations_updated_at();
