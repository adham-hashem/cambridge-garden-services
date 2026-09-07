/*
# Create Climate-Ready Garden section

1. New Tables
- `climate_section`
  - `id` (uuid, primary key): single row, fixed UUID.
  - `title` (text, not null): section heading, e.g. "Is Your Garden Ready for the Future?"
  - `description` (text, not null): intro paragraph.
  - `final_message` (text, not null): closing message.
  - `cta_label` (text, not null): button text, e.g. "Make My Garden Climate-Ready → Get a Quote".
  - `updated_at` (timestamptz, default now()).

- `climate_options`
  - `id` (uuid, primary key).
  - `climate_id` (uuid, foreign key to climate_section, cascade delete).
  - `label` (text, not null): e.g. "Hot & Dry".
  - `icon` (text, not null): emoji or icon identifier.
  - `image` (text, not null): URL of the garden image in storage.
  - `image_alt` (text, not null): alt text for accessibility.
  - `solution_title` (text, not null): e.g. "Climate-Resilient Planting".
  - `solution_text` (text, not null): description of the solution.
  - `sort_order` (integer, not null, default 0): display ordering.
  - `enabled` (boolean, not null, default true): whether the option appears on the site.
  - `created_at` (timestamptz, default now()).
  - `updated_at` (timestamptz, default now()).

2. Indexes
- `idx_climate_options_climate_id` on `climate_id`.
- `idx_climate_options_sort_order` on `sort_order`.

3. Security
- Enable RLS on both tables.
- Public (anon, authenticated) can SELECT enabled climate data.
- Authenticated admin can SELECT, INSERT, UPDATE, DELETE all climate data.
- Auto-update `updated_at` via triggers.

4. Seed Data
- One `climate_section` row with default content.
- Four `climate_options` rows with default labels, icons, images, solutions.
*/

CREATE TABLE IF NOT EXISTS public.climate_section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  final_message text NOT NULL,
  cta_label text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.climate_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  climate_id uuid NOT NULL REFERENCES public.climate_section(id) ON DELETE CASCADE,
  label text NOT NULL,
  icon text NOT NULL,
  image text NOT NULL,
  image_alt text NOT NULL,
  solution_title text NOT NULL,
  solution_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_climate_options_climate_id ON public.climate_options(climate_id);
CREATE INDEX IF NOT EXISTS idx_climate_options_sort_order ON public.climate_options(sort_order);

ALTER TABLE public.climate_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_options ENABLE ROW LEVEL SECURITY;

-- climate_section policies
DROP POLICY IF EXISTS "Public can read climate_section" ON public.climate_section;
CREATE POLICY "Public can read climate_section"
  ON public.climate_section FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can insert climate_section" ON public.climate_section;
CREATE POLICY "Admin can insert climate_section"
  ON public.climate_section FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update climate_section" ON public.climate_section;
CREATE POLICY "Admin can update climate_section"
  ON public.climate_section FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete climate_section" ON public.climate_section;
CREATE POLICY "Admin can delete climate_section"
  ON public.climate_section FOR DELETE
  TO authenticated
  USING (true);

-- climate_options policies
DROP POLICY IF EXISTS "Public can read enabled climate_options" ON public.climate_options;
CREATE POLICY "Public can read enabled climate_options"
  ON public.climate_options FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

DROP POLICY IF EXISTS "Admin can read all climate_options" ON public.climate_options;
CREATE POLICY "Admin can read all climate_options"
  ON public.climate_options FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can insert climate_options" ON public.climate_options;
CREATE POLICY "Admin can insert climate_options"
  ON public.climate_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update climate_options" ON public.climate_options;
CREATE POLICY "Admin can update climate_options"
  ON public.climate_options FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete climate_options" ON public.climate_options;
CREATE POLICY "Admin can delete climate_options"
  ON public.climate_options FOR DELETE
  TO authenticated
  USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_climate_section_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS climate_section_updated_at ON public.climate_section;
CREATE TRIGGER climate_section_updated_at
  BEFORE UPDATE ON public.climate_section
  FOR EACH ROW EXECUTE FUNCTION public.handle_climate_section_updated_at();

CREATE OR REPLACE FUNCTION public.handle_climate_options_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS climate_options_updated_at ON public.climate_options;
CREATE TRIGGER climate_options_updated_at
  BEFORE UPDATE ON public.climate_options
  FOR EACH ROW EXECUTE FUNCTION public.handle_climate_options_updated_at();

-- Seed default data
INSERT INTO public.climate_section (id, title, description, final_message, cta_label)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Is Your Garden Ready for the Future?',
  'As our climate shifts, our gardens face new challenges — longer dry spells, sudden downpours, and changing wildlife. But with the right approach, your garden can adapt and thrive. Explore how we help Cambridge gardens become resilient, beautiful, and ready for whatever comes next.',
  'Your garden can be beautiful today — and resilient for tomorrow.',
  'Make My Garden Climate-Ready → Get a Quote'
WHERE NOT EXISTS (SELECT 1 FROM public.climate_section);

INSERT INTO public.climate_options (climate_id, label, icon, image, image_alt, solution_title, solution_text, sort_order, enabled)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Hot & Dry',
  '☀️',
  'https://images.pexels.com/photos/8189147/pexels-photo-8189147.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'Drought-tolerant garden with succulents and pink flowers in pebbled ground',
  'Climate-Resilient Planting',
  'We choose drought-tolerant species — lavenders, ornamental grasses, salvias, and silver-leaved plants — that thrive in hot, dry spells without constant watering. Well-prepared soil with added organic matter holds moisture longer, and a good mulch keeps roots cool and reduces evaporation. The result is a garden that looks lush even in a heatwave, with less maintenance and less water.',
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.climate_options WHERE label = 'Hot & Dry');

INSERT INTO public.climate_options (climate_id, label, icon, image, image_alt, solution_title, solution_text, sort_order, enabled)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Heavy Rain',
  '🌧️',
  'https://images.pexels.com/photos/17401395/pexels-photo-17401395.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'Lush green grassland with fresh rain puddles in the English countryside',
  'Smarter Water & Rainwater Solutions',
  'We design gardens that work with water, not against it. Rain gardens and permeable paving absorb excess rainfall, preventing waterlogging and runoff. Smart drainage channels guide water where it is needed, while rainwater harvesting systems collect and store it for dry spells. Your garden becomes a natural sponge — managing heavy rain beautifully, without a muddy lawn in sight.',
  2,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.climate_options WHERE label = 'Heavy Rain');

INSERT INTO public.climate_options (climate_id, label, icon, image, image_alt, solution_title, solution_text, sort_order, enabled)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Wildlife & Biodiversity',
  '🦋',
  'https://images.pexels.com/photos/30595866/pexels-photo-30595866.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'Butterfly perched on vibrant yellow coneflowers in a summer garden',
  'Wildlife-Friendly Planting',
  'A garden alive with bees, butterflies, and birds is a healthy garden. We plant native wildflowers, nectar-rich perennials, and berrying shrubs that feed pollinators from spring to autumn. Log piles, insect hotels, and water features create habitats for beneficial creatures. The result is a living ecosystem — beautiful, buzzing with life, and naturally resilient to pests and disease.',
  3,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.climate_options WHERE label = 'Wildlife & Biodiversity');

INSERT INTO public.climate_options (climate_id, label, icon, image, image_alt, solution_title, solution_text, sort_order, enabled)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Shade & Cooling',
  '🌳',
  'https://images.pexels.com/photos/34316565/pexels-photo-34316565.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'Peaceful park scene with green grass and large trees under sunlight',
  'Trees, Shade & Cooler Green Spaces',
  'Strategic tree planting transforms a sunbaked garden into a cool, shaded retreat. We select the right trees for your space — ornamental varieties for structure, native species for canopy — and underplant with shade-loving ferns, hostas, and hellebores. Trees cool the air, absorb carbon, and create microclimates that protect more delicate plants beneath. Your garden becomes a green sanctuary, even on the hottest days.',
  4,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.climate_options WHERE label = 'Shade & Cooling');
