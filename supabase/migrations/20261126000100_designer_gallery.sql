/*
# AI Garden Designer gallery

Independent image library for the animated gallery on the AI Garden Designer
page. It has its own table and its own storage bucket and is NOT connected to
the Projects, Inspiration or any other website gallery.

Access goes through the Vercel API (service role). RLS is enabled with no
policies. The bucket is public-read so the images load quickly from the CDN.
*/

CREATE TABLE IF NOT EXISTS public.designer_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_designer_gallery_order ON public.designer_gallery(enabled, sort_order);

ALTER TABLE public.designer_gallery ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('designer-gallery', 'designer-gallery', true, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
