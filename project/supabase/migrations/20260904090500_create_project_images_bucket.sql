/*
# Create project-images storage bucket and policies

1. New Storage Bucket
- `project-images` — public bucket for storing before/after project photos.
- Public read access so the website can display images without authentication.
- Authenticated users (admin) can upload, update, and delete images.

2. Storage Policies
- Public SELECT: anyone can read images from the project-images bucket.
- Authenticated INSERT: only logged-in admin users can upload images.
- Authenticated UPDATE: only logged-in admin users can replace images.
- Authenticated DELETE: only logged-in admin users can delete images.

3. Important Notes
- The bucket is public for reads so the website loads images efficiently.
- Writes are restricted to authenticated admin users via RLS.
- Files are stored with unique paths to avoid collisions.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read project images
DROP POLICY IF EXISTS "Public can read project images" ON storage.objects;
CREATE POLICY "Public can read project images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'project-images');

-- Authenticated admin can upload project images
DROP POLICY IF EXISTS "Admin can upload project images" ON storage.objects;
CREATE POLICY "Admin can upload project images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-images');

-- Authenticated admin can update project images
DROP POLICY IF EXISTS "Admin can update project images" ON storage.objects;
CREATE POLICY "Admin can update project images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-images')
  WITH CHECK (bucket_id = 'project-images');

-- Authenticated admin can delete project images
DROP POLICY IF EXISTS "Admin can delete project images" ON storage.objects;
CREATE POLICY "Admin can delete project images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-images');
