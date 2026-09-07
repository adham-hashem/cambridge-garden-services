/*
# Harden browser access for Vercel API backend

The production frontend now uses Vercel API routes for quote writes, promo
validation, admin CRUD, and signed uploads. This migration removes broad
authenticated policies so a random Supabase Auth user cannot become an admin.
Public read policies remain for published content only.
*/

-- quote_requests is written and managed only through the server-side service role.
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Staff can view quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Staff can update quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Staff can delete quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Admin can view bookings" ON public.quote_requests;
DROP POLICY IF EXISTS "Admin can update bookings" ON public.quote_requests;
DROP POLICY IF EXISTS "Admin can delete bookings" ON public.quote_requests;

-- Keep only published public project reads. Admin writes use the service role API.
DROP POLICY IF EXISTS "Public can read published projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can read all projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admin can delete projects" ON public.projects;
CREATE POLICY "Public can read published projects"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Keep only published public article reads. Admin writes use the service role API.
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can read all articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can update articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can delete articles" ON public.articles;
CREATE POLICY "Public can read published articles"
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Promo codes are no longer publicly selectable; validation happens via /api/promo/validate.
DROP POLICY IF EXISTS "Public can validate active promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admin can read all promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admin can insert promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admin can update promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admin can delete promo codes" ON public.promo_codes;

-- Climate content remains publicly readable where appropriate. Admin writes use the service role API.
DROP POLICY IF EXISTS "Public can read climate_section" ON public.climate_section;
DROP POLICY IF EXISTS "Admin can insert climate_section" ON public.climate_section;
DROP POLICY IF EXISTS "Admin can update climate_section" ON public.climate_section;
DROP POLICY IF EXISTS "Admin can delete climate_section" ON public.climate_section;
CREATE POLICY "Public can read climate_section"
  ON public.climate_section FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can read enabled climate_options" ON public.climate_options;
DROP POLICY IF EXISTS "Admin can read all climate_options" ON public.climate_options;
DROP POLICY IF EXISTS "Admin can insert climate_options" ON public.climate_options;
DROP POLICY IF EXISTS "Admin can update climate_options" ON public.climate_options;
DROP POLICY IF EXISTS "Admin can delete climate_options" ON public.climate_options;
CREATE POLICY "Public can read enabled climate_options"
  ON public.climate_options FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

-- Images are publicly readable, but uploads/deletes go through signed URLs and service role APIs.
DROP POLICY IF EXISTS "Public can read project images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update project images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete project images" ON storage.objects;
CREATE POLICY "Public can read project images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'project-images');

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'project-images';

CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code text)
RETURNS public.promo_codes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  redeemed public.promo_codes;
BEGIN
  UPDATE public.promo_codes
  SET usage_count = usage_count + 1
  WHERE code = upper(trim(p_code))
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR usage_count < usage_limit)
  RETURNING * INTO redeemed;

  RETURN redeemed;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO service_role;

CREATE OR REPLACE FUNCTION public.submit_quote_request(
  p_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_project_type text,
  p_service_id text,
  p_budget text,
  p_project_details text,
  p_attachment_name text,
  p_attachment_url text,
  p_promo_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  redeemed public.promo_codes;
  base_estimate numeric := 0;
  discount_amount numeric;
  final_price numeric;
  quote_id uuid;
BEGIN
  base_estimate := CASE p_budget
    WHEN 'Under £1,000' THEN 750
    WHEN '£1,000 – £5,000' THEN 3000
    WHEN '£5,000 – £10,000' THEN 7500
    WHEN '£10,000 – £25,000' THEN 17500
    WHEN '£25,000+' THEN 30000
    ELSE 0
  END;

  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    UPDATE public.promo_codes
    SET usage_count = usage_count + 1
    WHERE code = upper(trim(p_promo_code))
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (usage_limit IS NULL OR usage_count < usage_limit)
    RETURNING * INTO redeemed;

    IF redeemed.id IS NULL THEN
      RAISE EXCEPTION 'Promo code is not valid' USING ERRCODE = '22023';
    END IF;

    discount_amount := CASE redeemed.discount_type
      WHEN 'percentage' THEN base_estimate * redeemed.discount_value / 100
      ELSE redeemed.discount_value
    END;
    discount_amount := round(least(greatest(discount_amount, 0), base_estimate), 2);
    final_price := round(base_estimate - discount_amount, 2);
  END IF;

  INSERT INTO public.quote_requests (
    name,
    email,
    phone,
    address,
    project_type,
    service_id,
    budget,
    project_details,
    attachment_name,
    attachment_url,
    promo_code,
    discount_amount,
    final_price
  )
  VALUES (
    p_name,
    p_email,
    p_phone,
    p_address,
    p_project_type,
    p_service_id,
    p_budget,
    p_project_details,
    p_attachment_name,
    p_attachment_url,
    redeemed.code,
    discount_amount,
    final_price
  )
  RETURNING id INTO quote_id;

  RETURN quote_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quote_request(text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quote_request(text, text, text, text, text, text, text, text, text, text, text) TO service_role;
