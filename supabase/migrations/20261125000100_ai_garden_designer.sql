/*
# AI Garden Designer

Tables for the paid AI Garden Designer platform. All access goes through the
Vercel API (service role). RLS is enabled with no public policies, so the anon
key can never read or write any of these tables.

- designer_packages   : editable packages / prices (pence, GBP)
- designer_rates      : editable unit rates used for PDF cost estimates.
                        rate_pence is NULL until an administrator configures it;
                        un-configured items are shown as "to be quoted", never invented.
- designer_owners     : anonymous customer identity (cookie) used to scope access
- designer_projects   : one row per customer project (redesign | scratch)
- designer_orders     : Stripe checkout sessions + verified payment state
- designer_images     : generated concepts (private storage paths)
*/

CREATE TABLE IF NOT EXISTS public.designer_packages (
  id text PRIMARY KEY CHECK (id IN ('preview', 'plus', 'complete')),
  name text NOT NULL,
  price_pence integer NOT NULL CHECK (price_pence >= 0),
  description text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  concepts integer NOT NULL DEFAULT 1 CHECK (concepts BETWEEN 1 AND 6),
  pdf_level integer NOT NULL DEFAULT 0 CHECK (pdf_level BETWEEN 0 AND 2),
  recommended boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.designer_packages (id, name, price_pence, description, features, concepts, pdf_level, recommended, sort_order)
VALUES
  ('preview', 'Garden Preview', 999,
   'A single AI garden design in your chosen style.',
   '["One AI garden design","Choose a garden style","High-quality design preview","Download the generated design","Scratch planning: basic downloadable PDF summary with plot dimensions, selected options, garden style and the generated design"]'::jsonb,
   1, 1, false, 1),
  ('plus', 'Garden Plus', 2499,
   'Three design concepts, more customisation and a PDF design report.',
   '["Three different design concepts","More customisation options","Plant and material suggestions","Download generated designs","PDF design report with the selected design, alternative concepts, garden preferences and recommendations","Scratch planning: PDF summary with garden layout, dimensions, selected zones and plant suggestions"]'::jsonb,
   3, 1, true, 2),
  ('complete', 'Complete Garden Plan', 4999,
   'Everything you need to plan and price your real garden.',
   '["Three professional design concepts","Scaled garden layout","Plant placement and garden zones","Detailed plant recommendations","Suggested materials and estimated quantities","Estimated project budget","Professional, printable PDF garden implementation plan"]'::jsonb,
   3, 2, false, 3)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.designer_rates (
  key text PRIMARY KEY,
  label text NOT NULL,
  unit text NOT NULL,
  rate_pence integer CHECK (rate_pence IS NULL OR rate_pence >= 0),
  note text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Rate rows are created WITHOUT prices. An administrator sets the real rates.
INSERT INTO public.designer_rates (key, label, unit, sort_order) VALUES
  ('turf_m2',        'Turfing / lawn (supply and lay)',       'm2',   1),
  ('paving_m2',      'Patio paving (supply and lay)',         'm2',   2),
  ('path_m2',        'Garden path surfacing',                 'm2',   3),
  ('seating_m2',     'Seating area surfacing',                'm2',   4),
  ('living_m2',      'Outdoor living area surfacing',         'm2',   5),
  ('bed_prep_m2',    'Planting bed preparation and mulch',    'm2',   6),
  ('plant_flower',   'Flowering plant (each)',                'each', 7),
  ('plant_shrub',    'Shrub (each)',                          'each', 8),
  ('plant_hedge',    'Hedge plant (each)',                    'each', 9),
  ('plant_tree',     'Tree (each)',                           'each', 10),
  ('fencing_m',      'Fencing (per linear metre)',            'm',    11),
  ('lighting_each',  'Garden light (each)',                   'each', 12),
  ('seating_each',   'Garden seating item (each)',            'each', 13),
  ('feature_each',   'Decorative feature (each)',             'each', 14)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.designer_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.designer_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  owner_id uuid NOT NULL REFERENCES public.designer_owners(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('redesign', 'scratch')),
  package_id text NOT NULL REFERENCES public.designer_packages(id),
  package_snapshot jsonb NOT NULL,
  title text NOT NULL DEFAULT '',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  original_path text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'awaiting_payment', 'paid', 'complete')),
  customer_email text,
  paid_at timestamptz,
  pdf_path text,
  pdf_level integer,
  pdf_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_designer_projects_owner ON public.designer_projects(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designer_projects_email ON public.designer_projects(lower(customer_email));

CREATE TABLE IF NOT EXISTS public.designer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.designer_projects(id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL UNIQUE,
  payment_intent text,
  amount_pence integer NOT NULL,
  currency text NOT NULL DEFAULT 'gbp',
  package_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  customer_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_designer_orders_project ON public.designer_orders(project_id);
-- At most one paid order per project: blocks duplicate payment processing.
CREATE UNIQUE INDEX IF NOT EXISTS uq_designer_orders_one_paid
  ON public.designer_orders(project_id) WHERE status = 'paid';

CREATE TABLE IF NOT EXISTS public.designer_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.designer_projects(id) ON DELETE CASCADE,
  concept_index integer NOT NULL CHECK (concept_index BETWEEN 1 AND 6),
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  path text,
  prompt text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, concept_index)
);

ALTER TABLE public.designer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_images ENABLE ROW LEVEL SECURITY;

-- Private bucket: customer photos, generated designs and PDFs.
-- No storage.objects policies are created, so only the service role can read
-- objects; customers receive short-lived signed URLs after an ownership check.
-- Signed *upload* URLs are issued by the API for the customer's own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('designer-files', 'designer-files', false, 15728640,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
