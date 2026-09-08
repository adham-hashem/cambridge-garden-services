/*
# Create services table for admin-managed service pages

Services used to live only in the frontend. This table lets the admin add,
edit, publish, and hide service pages without using the Supabase SQL editor.
Projects keep their existing text service_id and can point at any service slug.
*/

CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text NOT NULL,
  description text NOT NULL,
  image text NOT NULL,
  alt text NOT NULL DEFAULT '',
  detail text NOT NULL,
  hero_image text NOT NULL,
  hero_alt text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_published ON public.services(published);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON public.services(sort_order);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published services" ON public.services;
CREATE POLICY "Public can read published services"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (published = true);

GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;

CREATE OR REPLACE FUNCTION public.handle_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_updated_at ON public.services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_services_updated_at();

INSERT INTO public.services (
  id,
  title,
  description,
  image,
  alt,
  detail,
  hero_image,
  hero_alt,
  published,
  sort_order
) VALUES
  (
    'garden-design',
    'Garden Design',
    'Bespoke planting plans and layouts tailored to your space, light, and lifestyle.',
    'https://images.pexels.com/photos/6615239/pexels-photo-6615239.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Architectural garden design sketches on a desk',
    'Every great garden begins on paper. We listen to how you want to use the space, study the light and soil, and craft a design that feels inevitable - as though it was always meant to be.',
    'https://images.pexels.com/photos/37266505/pexels-photo-37266505.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'Vibrant garden pathway surrounded by blooming flowers and lush greenery',
    true,
    0
  ),
  (
    'landscaping',
    'Landscaping',
    'Full structural transformations - from reshaping ground to building the bones of the garden.',
    'https://images.pexels.com/photos/39045225/pexels-photo-39045225.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Stone walkway through green grass in a landscaped garden',
    'We move earth, lay stone, and shape the land so that every path, terrace, and border sits naturally in its place. The hard work that makes the garden look effortless.',
    'https://images.pexels.com/photos/32959283/pexels-photo-32959283.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'Stone pathway surrounded by vibrant wildflowers in a landscaped garden',
    true,
    10
  ),
  (
    'patios',
    'Patios',
    'Natural stone and brick patios that extend your living space into the open air.',
    'https://images.pexels.com/photos/39009170/pexels-photo-39009170.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Beautiful stone patio with outdoor furniture and greenery',
    'A well-laid patio is a room without a ceiling. We choose stone that complements your home, lay it with precision, and create a space that asks to be lingered on.',
    'https://images.pexels.com/photos/38220910/pexels-photo-38220910.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'Elegant circular patio with stone steps and lush greenery',
    true,
    20
  ),
  (
    'fencing',
    'Fencing',
    'Quality timber fencing that frames the garden and provides shelter, privacy, and structure.',
    'https://images.pexels.com/photos/48246/fence-wood-fence-wood-limit-48246.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Close-up of a wooden fence against a natural background',
    'A fence is more than a boundary - it is the garden''s frame. We install durable, beautiful timber fencing that protects your space and enhances its character.',
    'https://images.pexels.com/photos/2912/fence.jpg?auto=compress&cs=tinysrgb&w=1920',
    'Rustic wooden fence with green leaves peeking through the gaps',
    true,
    30
  ),
  (
    'turfing',
    'Turfing',
    'Lush, level lawns laid from premium-grade turf for an instant carpet of green.',
    'https://images.pexels.com/photos/5231236/pexels-photo-5231236.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Farmer laying a roll of grass turf on the ground',
    'There is nothing quite like the feel of fresh turf underfoot. We prepare the ground thoroughly and lay premium turf so your lawn establishes deep, even roots.',
    'https://images.pexels.com/photos/186236/pexels-photo-186236.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'Lush green grass lawn viewed close up',
    true,
    40
  ),
  (
    'garden-clearance',
    'Garden Clearance',
    'Reclaiming overgrown spaces - clearing, cutting back, and revealing what lies beneath.',
    'https://images.pexels.com/photos/26827231/pexels-photo-26827231.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Old wheelbarrow filled with garden waste and weeds',
    'Sometimes a garden just needs a fresh start. We clear brambles, waste, and overgrowth, leaving you with a clean canvas and a sense of possibility.',
    'https://images.pexels.com/photos/37441090/pexels-photo-37441090.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'Garden archway leading to a brick English cottage',
    true,
    50
  ),
  (
    'groundworks',
    'Groundworks',
    'Foundations, drainage, and ground preparation - the unseen work that holds the garden together.',
    'https://images.pexels.com/photos/12164798/pexels-photo-12164798.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Excavator levelling ground at an outdoor site',
    'What you do not see matters most. We handle excavation, drainage, and ground levelling so your garden stands firm and drains freely for decades.',
    'https://images.pexels.com/photos/39045225/pexels-photo-39045225.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'Stone walkway through green grass in a landscaped garden',
    true,
    60
  ),
  (
    'tree-surgery',
    'Tree Surgery',
    'Expert crown reduction, felling, and pruning by qualified tree care specialists.',
    'https://images.pexels.com/photos/6218318/pexels-photo-6218318.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Arborist cutting a tree with a chainsaw wearing safety gear',
    'Trees are the garden''s elders and deserve expert care. Our qualified arborists handle pruning, crown reduction, and safe felling with precision and respect.',
    'https://images.pexels.com/photos/31296071/pexels-photo-31296071.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'Heavily pruned tree branches silhouetted against a clear blue sky',
    true,
    70
  ),
  (
    'garden-maintenance',
    'Garden Maintenance',
    'Regular, reliable care that keeps your garden looking its best through every season.',
    'https://images.pexels.com/photos/38936351/pexels-photo-38936351.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Gardener trimming a hedge with shears on a sunny day',
    'A garden is a living thing that needs consistent attention. We offer scheduled maintenance - mowing, pruning, weeding, and feeding - so your garden never misses a beat.',
    'https://images.pexels.com/photos/26599272/pexels-photo-26599272.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'Elegant garden pathway lined with manicured bushes and classic pedestals',
    true,
    80
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  alt = EXCLUDED.alt,
  detail = EXCLUDED.detail,
  hero_image = EXCLUDED.hero_image,
  hero_alt = EXCLUDED.hero_alt,
  sort_order = EXCLUDED.sort_order;

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
  base_value numeric := 0;
  discount_amount numeric;
  final_price numeric;
  quote_id uuid;
BEGIN
  base_value := CASE p_budget
    WHEN 'Less than £500' THEN 400
    WHEN 'Under £1,000' THEN 750
    WHEN '£1,000 – £5,000' THEN 3000
    WHEN '£5,000 – £10,000' THEN 7500
    WHEN '£10,000 – £25,000' THEN 17500
    WHEN '£25,000+' THEN 30000
    ELSE COALESCE((substring(replace(COALESCE(p_budget, ''), ',', '') from '[0-9]+(?:\.[0-9]+)?'))::numeric, 0)
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
      WHEN 'percentage' THEN base_value * redeemed.discount_value / 100
      ELSE redeemed.discount_value
    END;
    discount_amount := round(least(greatest(discount_amount, 0), base_value), 2);
    final_price := round(base_value - discount_amount, 2);
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
