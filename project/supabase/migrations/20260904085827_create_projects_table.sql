/*
# Create projects table for scalable project management

1. New Tables
- `projects`
  - `id` (uuid, primary key): unique project identifier.
  - `service_id` (text, not null): links to a service slug (e.g. 'landscaping', 'patios').
  - `title` (text, not null): project name shown on the site.
  - `location` (text, not null): project location (e.g. 'Cambridge, England').
  - `description` (text, not null): project description shown alongside the slider.
  - `before_image` (text, not null): URL for the "before" image.
  - `after_image` (text, not null): URL for the "after" image.
  - `before_alt` (text, not null): alt text for the before image.
  - `after_alt` (text, not null): alt text for the after image.
  - `published` (boolean, default false): whether the project is visible on the public site.
  - `sort_order` (int, default 0): manual ordering priority (lower = earlier).
  - `created_at` (timestamptz, default now()).
  - `updated_at` (timestamptz, default now()).

2. Indexes
- `idx_projects_service_id` on `service_id` for filtering by service.
- `idx_projects_published` on `published` for filtering visible projects.
- `idx_projects_sort_order` on `sort_order` for ordering.

3. Security
- Enable row-level security on `projects`.
- Public (anon + authenticated) can SELECT only published projects.
- Authenticated users (admin) can SELECT, INSERT, UPDATE, DELETE all projects.
- This allows the admin dashboard to manage all projects while the public
  site only shows published ones.

4. Important Notes
- This is a single-tenant app; the admin dashboard uses Supabase auth.
- The public site reads via the anon key and only sees published projects.
- The admin dashboard reads via an authenticated session and sees all projects.
- Projects are linked to services via `service_id` (text slug), not a foreign key,
  because services are defined in the frontend code, not in the database.
*/

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL,
  title text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  before_image text NOT NULL,
  after_image text NOT NULL,
  before_alt text NOT NULL,
  after_alt text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_service_id ON public.projects(service_id);
CREATE INDEX IF NOT EXISTS idx_projects_published ON public.projects(published);
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON public.projects(sort_order);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Public can read only published projects
DROP POLICY IF EXISTS "Public can read published projects" ON public.projects;
CREATE POLICY "Public can read published projects"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Authenticated admin can read all projects (including unpublished)
DROP POLICY IF EXISTS "Admin can read all projects" ON public.projects;
CREATE POLICY "Admin can read all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated admin can insert projects
DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
CREATE POLICY "Admin can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated admin can update projects
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
CREATE POLICY "Admin can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated admin can delete projects
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
CREATE POLICY "Admin can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.handle_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_projects_updated_at();
