/*
# Create garden quote requests

1. New Tables
- `quote_requests`
- `id` (uuid, primary key): unique enquiry identifier.
- `name` (text): visitor name.
- `email` (text): visitor email.
- `phone` (text): optional phone number.
- `address` (text): optional project address.
- `project_type` (text): selected service or project category.
- `budget` (text): selected budget range.
- `project_details` (text): visitor's project description.
- `attachment_name` (text): optional uploaded image filename.
- `created_at` (timestamptz): submission time.

2. Security
- Enable row-level security on `quote_requests`.
- Allow anonymous visitors to submit new quote requests.
- Do not expose submitted requests to anonymous visitors.
- Keep authenticated read, update, and delete policies separate for future staff access.

3. Important Notes
- This is a single-tenant public enquiry form and does not require accounts.
- The browser only receives a generic success or failure message after submission.
*/

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  project_type text NOT NULL,
  budget text,
  project_details text NOT NULL,
  attachment_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;
CREATE POLICY "Anyone can submit quote requests"
  ON public.quote_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view quote requests" ON public.quote_requests;
CREATE POLICY "Staff can view quote requests"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can update quote requests" ON public.quote_requests;
CREATE POLICY "Staff can update quote requests"
  ON public.quote_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can delete quote requests" ON public.quote_requests;
CREATE POLICY "Staff can delete quote requests"
  ON public.quote_requests FOR DELETE
  TO authenticated
  USING (true);
