/*
# Create promo_codes table and alter quote_requests for bookings

1. New Tables
- `promo_codes`
  - `id` (uuid, primary key)
  - `code` (text, unique, not null): the promo code string (uppercase).
  - `description` (text, nullable): admin-facing description of the promo.
  - `discount_type` (text, not null): 'percentage' or 'fixed'.
  - `discount_value` (numeric, not null): percentage (0-100) or fixed amount in GBP.
  - `expires_at` (timestamptz, nullable): expiration date/time.
  - `usage_limit` (integer, nullable): max number of uses (NULL = unlimited).
  - `usage_count` (integer, not null, default 0): current number of uses.
  - `active` (boolean, not null, default true): whether the code is active.
  - `created_at` (timestamptz, default now()).
  - `updated_at` (timestamptz, default now()).

2. Modified Tables
- `quote_requests` — add columns to support full booking management:
  - `status` (text, not null, default 'new'): one of 'new', 'contacted', 'confirmed', 'completed', 'cancelled'.
  - `promo_code` (text, nullable): the promo code applied to this booking.
  - `discount_amount` (numeric, nullable): the discount amount in GBP.
  - `final_price` (numeric, nullable): the final price after discount.
  - `attachment_url` (text, nullable): URL of uploaded image in storage.
  - `service_id` (text, nullable): the service slug if matched to a known service.

3. Indexes
- `idx_promo_codes_code` on `promo_codes.code` for fast lookups.
- `idx_quote_requests_status` on `quote_requests.status` for filtering.
- `idx_quote_requests_created_at` on `quote_requests.created_at` for sorting.

4. Security
- `promo_codes`: Enable RLS.
  - Public (anon) can SELECT active, non-expired codes for validation.
  - Authenticated admin can SELECT, INSERT, UPDATE, DELETE all promo codes.
- `quote_requests`: Keep existing policies but add UPDATE for authenticated admin.
  - Public can INSERT (submit bookings).
  - Authenticated admin can SELECT, UPDATE, DELETE all bookings.

5. Important Notes
- The promo_codes table allows the public to validate codes via the anon key,
  but only active, non-expired, under-limit codes are visible to anon.
- The admin (authenticated) can see and manage all codes regardless of status.
- The quote_requests table gains status tracking and price/discount fields.
- A trigger updates `updated_at` on promo_codes automatically.
*/

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  expires_at timestamptz,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Public can validate active, non-expired, under-limit codes
DROP POLICY IF EXISTS "Public can validate active promo codes" ON public.promo_codes;
CREATE POLICY "Public can validate active promo codes"
  ON public.promo_codes FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR usage_count < usage_limit)
  );

-- Authenticated admin can read all promo codes
DROP POLICY IF EXISTS "Admin can read all promo codes" ON public.promo_codes;
CREATE POLICY "Admin can read all promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated admin can insert promo codes
DROP POLICY IF EXISTS "Admin can insert promo codes" ON public.promo_codes;
CREATE POLICY "Admin can insert promo codes"
  ON public.promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated admin can update promo codes
DROP POLICY IF EXISTS "Admin can update promo codes" ON public.promo_codes;
CREATE POLICY "Admin can update promo codes"
  ON public.promo_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated admin can delete promo codes
DROP POLICY IF EXISTS "Admin can delete promo codes" ON public.promo_codes;
CREATE POLICY "Admin can delete promo codes"
  ON public.promo_codes FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at on promo_codes
CREATE OR REPLACE FUNCTION public.handle_promo_codes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_promo_codes_updated_at();

-- Alter quote_requests table: add booking management columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'status') THEN
    ALTER TABLE public.quote_requests ADD COLUMN status text NOT NULL DEFAULT 'new';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'promo_code') THEN
    ALTER TABLE public.quote_requests ADD COLUMN promo_code text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'discount_amount') THEN
    ALTER TABLE public.quote_requests ADD COLUMN discount_amount numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'final_price') THEN
    ALTER TABLE public.quote_requests ADD COLUMN final_price numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'attachment_url') THEN
    ALTER TABLE public.quote_requests ADD COLUMN attachment_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_requests' AND column_name = 'service_id') THEN
    ALTER TABLE public.quote_requests ADD COLUMN service_id text;
  END IF;
END $$;

-- Add UPDATE policy for authenticated admin on quote_requests
DROP POLICY IF EXISTS "Admin can update bookings" ON public.quote_requests;
CREATE POLICY "Admin can update bookings"
  ON public.quote_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for authenticated admin on quote_requests
DROP POLICY IF EXISTS "Admin can delete bookings" ON public.quote_requests;
CREATE POLICY "Admin can delete bookings"
  ON public.quote_requests FOR DELETE
  TO authenticated
  USING (true);

-- Add SELECT policy for authenticated admin on quote_requests
DROP POLICY IF EXISTS "Admin can view bookings" ON public.quote_requests;
CREATE POLICY "Admin can view bookings"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for quote_requests
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests(created_at);
