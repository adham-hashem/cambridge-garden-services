-- Referrals extend the existing quote and discount transaction. No customer
-- information or codes are readable through the public Supabase API.
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  friend_discount_type text NOT NULL DEFAULT 'percentage' CHECK (friend_discount_type IN ('percentage', 'fixed')),
  friend_discount_value numeric NOT NULL DEFAULT 10 CHECK (
    friend_discount_value > 0 AND
    ((friend_discount_type = 'percentage' AND friend_discount_value <= 100)
      OR (friend_discount_type = 'fixed' AND friend_discount_value <= 10000))
  ),
  reward_amount numeric NOT NULL DEFAULT 10 CHECK (reward_amount = 10)
);
INSERT INTO public.referral_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^FR-[A-F0-9]{16}$'),
  referrer_name text NOT NULL,
  referrer_email text NOT NULL UNIQUE CHECK (referrer_email = lower(referrer_email)),
  referrer_booking_id uuid REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE RESTRICT,
  referred_email text NOT NULL UNIQUE CHECK (referred_email = lower(referred_email)),
  booking_id uuid UNIQUE REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'code_used' CHECK (status IN ('code_used', 'completed', 'reward_issued')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  reward_issued_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL UNIQUE REFERENCES public.referral_claims(id) ON DELETE RESTRICT,
  referrer_email text NOT NULL CHECK (referrer_email = lower(referrer_email)),
  code text NOT NULL UNIQUE CHECK (code ~ '^CR-[A-F0-9]{16}$'),
  amount numeric NOT NULL DEFAULT 10 CHECK (amount = 10),
  issued_at timestamptz NOT NULL DEFAULT now(),
  used_booking_id uuid REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  used_at timestamptz,
  revoked_at timestamptz
);

-- Give each existing customer with a non-cancelled booking one real code.
INSERT INTO public.referral_codes (code, referrer_name, referrer_email, referrer_booking_id)
SELECT 'FR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  existing.name, lower(trim(existing.email)), existing.id
FROM (
  SELECT DISTINCT ON (lower(trim(email))) id, name, email
  FROM public.quote_requests
  WHERE status <> 'cancelled' AND trim(email) <> ''
  ORDER BY lower(trim(email)), created_at ASC, id ASC
) AS existing
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_referral_claims_code ON public.referral_claims(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_email ON public.referral_credits(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referral_claims_created ON public.referral_claims(created_at);

ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.referral_settings, public.referral_codes, public.referral_claims, public.referral_credits FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_settings, public.referral_codes, public.referral_claims, public.referral_credits TO service_role;

-- The existing RPC signature stays unchanged for all existing callers.
CREATE OR REPLACE FUNCTION public.submit_quote_request(
  p_name text, p_email text, p_phone text, p_address text,
  p_project_type text, p_service_id text, p_budget text,
  p_project_details text, p_attachment_name text, p_attachment_url text,
  p_promo_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  redeemed public.promo_codes;
  referral public.referral_codes;
  credit public.referral_credits;
  settings public.referral_settings;
  normalized_email text := lower(trim(p_email));
  normalized_code text := upper(trim(coalesce(p_promo_code, '')));
  base_value numeric := 0;
  discount_amount numeric;
  final_price numeric;
  quote_id uuid;
BEGIN
  -- Serialise first-booking checks and redemptions for this customer.
  PERFORM pg_advisory_xact_lock(hashtextextended(normalized_email, 0));
  base_value := CASE p_budget
    WHEN 'Less than £500' THEN 400
    WHEN 'Under £1,000' THEN 750
    WHEN '£1,000 – £5,000' THEN 3000
    WHEN '£5,000 – £10,000' THEN 7500
    WHEN '£10,000 – £25,000' THEN 17500
    WHEN '£25,000+' THEN 30000
    ELSE coalesce((substring(replace(coalesce(p_budget, ''), ',', '') from '[0-9]+(?:\.[0-9]+)?'))::numeric, 0)
  END;

  IF normalized_code LIKE 'FR-%'
     AND NOT EXISTS (SELECT 1 FROM public.promo_codes WHERE code = normalized_code) THEN
    IF base_value <= 0 THEN
      RAISE EXCEPTION 'Referral code requires a budget estimate' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO referral FROM public.referral_codes WHERE code = normalized_code AND active = true FOR UPDATE;
    IF referral.id IS NULL OR referral.referrer_email = normalized_email
       OR EXISTS (SELECT 1 FROM public.quote_requests WHERE lower(trim(email)) = normalized_email)
       OR EXISTS (SELECT 1 FROM public.referral_claims WHERE referred_email = normalized_email) THEN
      RAISE EXCEPTION 'Referral code is not valid for this customer' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO settings FROM public.referral_settings WHERE id = 1;
    discount_amount := CASE settings.friend_discount_type
      WHEN 'percentage' THEN base_value * settings.friend_discount_value / 100
      ELSE settings.friend_discount_value
    END;
  ELSIF normalized_code LIKE 'CR-%'
     AND NOT EXISTS (SELECT 1 FROM public.promo_codes WHERE code = normalized_code) THEN
    IF base_value <= 0 THEN
      RAISE EXCEPTION 'Credit code requires a budget estimate' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO credit FROM public.referral_credits
      WHERE code = normalized_code AND referrer_email = normalized_email
        AND used_booking_id IS NULL AND used_at IS NULL AND revoked_at IS NULL FOR UPDATE;
    IF credit.id IS NULL THEN
      RAISE EXCEPTION 'Credit code is not valid for this customer' USING ERRCODE = '22023';
    END IF;
    discount_amount := credit.amount;
  ELSIF normalized_code <> '' THEN
    UPDATE public.promo_codes SET usage_count = usage_count + 1
      WHERE code = normalized_code AND active = true
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
  END IF;

  IF normalized_code <> '' THEN
    discount_amount := round(least(greatest(coalesce(discount_amount, 0), 0), base_value), 2);
    final_price := round(base_value - discount_amount, 2);
  END IF;

  INSERT INTO public.quote_requests (
    name, email, phone, address, project_type, service_id, budget,
    project_details, attachment_name, attachment_url, promo_code,
    discount_amount, final_price
  ) VALUES (
    p_name, p_email, p_phone, p_address, p_project_type, p_service_id, p_budget,
    p_project_details, p_attachment_name, p_attachment_url,
    nullif(normalized_code, ''), discount_amount, final_price
  ) RETURNING id INTO quote_id;

  INSERT INTO public.referral_codes (code, referrer_name, referrer_email, referrer_booking_id)
  VALUES ('FR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
    p_name, normalized_email, quote_id)
  ON CONFLICT (referrer_email) DO NOTHING;

  IF referral.id IS NOT NULL THEN
    INSERT INTO public.referral_claims (referral_code_id, referred_email, booking_id)
      VALUES (referral.id, normalized_email, quote_id);
  END IF;
  IF credit.id IS NOT NULL THEN
    UPDATE public.referral_credits SET used_booking_id = quote_id, used_at = now() WHERE id = credit.id;
  END IF;
  RETURN quote_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quote_request(text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quote_request(text, text, text, text, text, text, text, text, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_referral_booking_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claim public.referral_claims;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT * INTO claim FROM public.referral_claims WHERE booking_id = NEW.id FOR UPDATE;
    IF claim.id IS NOT NULL THEN
      INSERT INTO public.referral_credits (claim_id, referrer_email, code)
      SELECT claim.id, code.referrer_email,
        'CR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
      FROM public.referral_codes AS code WHERE code.id = claim.referral_code_id
      ON CONFLICT (claim_id) DO UPDATE SET revoked_at = NULL;
      UPDATE public.referral_claims
        SET status = 'reward_issued', completed_at = coalesce(completed_at, now()), reward_issued_at = now()
        WHERE id = claim.id;
    END IF;
  ELSIF OLD.status = 'completed' AND NEW.status IS DISTINCT FROM 'completed' THEN
    UPDATE public.referral_claims
      SET status = 'code_used', completed_at = NULL, reward_issued_at = NULL
      WHERE booking_id = NEW.id RETURNING * INTO claim;
    IF claim.id IS NOT NULL THEN
      UPDATE public.referral_credits SET revoked_at = now() WHERE claim_id = claim.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_booking_status ON public.quote_requests;
CREATE TRIGGER referral_booking_status
  AFTER UPDATE OF status ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_booking_status();

REVOKE ALL ON FUNCTION public.handle_referral_booking_status() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.validate_referral_or_credit(p_code text, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text := lower(trim(p_email));
  normalized_code text := upper(trim(p_code));
  referral public.referral_codes;
  credit public.referral_credits;
  settings public.referral_settings;
BEGIN
  IF normalized_email = '' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Enter your email before applying this code');
  END IF;
  IF normalized_code LIKE 'FR-%' THEN
    SELECT * INTO referral FROM public.referral_codes WHERE code = normalized_code AND active = true;
    IF referral.id IS NULL OR referral.referrer_email = normalized_email
       OR EXISTS (SELECT 1 FROM public.quote_requests WHERE lower(trim(email)) = normalized_email)
       OR EXISTS (SELECT 1 FROM public.referral_claims WHERE referred_email = normalized_email) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Referral code is not valid for this customer');
    END IF;
    SELECT * INTO settings FROM public.referral_settings WHERE id = 1;
    RETURN jsonb_build_object('valid', true, 'kind', 'referral', 'code', referral.code,
      'discount_type', settings.friend_discount_type, 'discount_value', settings.friend_discount_value);
  ELSIF normalized_code LIKE 'CR-%' THEN
    SELECT * INTO credit FROM public.referral_credits WHERE code = normalized_code
      AND referrer_email = normalized_email AND used_booking_id IS NULL
      AND used_at IS NULL AND revoked_at IS NULL;
    IF credit.id IS NULL THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Credit code is not valid for this customer');
    END IF;
    RETURN jsonb_build_object('valid', true, 'kind', 'credit', 'code', credit.code,
      'discount_type', 'fixed', 'discount_value', credit.amount);
  END IF;
  RETURN jsonb_build_object('valid', false, 'error', 'Code not found');
END;
$$;
REVOKE ALL ON FUNCTION public.validate_referral_or_credit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_referral_or_credit(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_referral_booking_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim_id uuid;
BEGIN
  SELECT id INTO v_claim_id FROM public.referral_claims WHERE booking_id = OLD.id FOR UPDATE;
  IF v_claim_id IS NOT NULL THEN
    UPDATE public.referral_credits SET revoked_at = now() WHERE referral_credits.claim_id = v_claim_id;
    UPDATE public.referral_claims SET status = 'code_used', completed_at = NULL,
      reward_issued_at = NULL WHERE id = v_claim_id;
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS referral_booking_delete ON public.quote_requests;
CREATE TRIGGER referral_booking_delete
  BEFORE DELETE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_booking_delete();
REVOKE ALL ON FUNCTION public.handle_referral_booking_delete() FROM PUBLIC;
