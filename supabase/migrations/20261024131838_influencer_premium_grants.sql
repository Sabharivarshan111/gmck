-- Complimentary access is auditable and never impersonates a captured payment.
CREATE SCHEMA IF NOT EXISTS private_payments;
REVOKE ALL ON SCHEMA private_payments FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS private_payments.premium_promotions (
  email text PRIMARY KEY CHECK (email = lower(btrim(email))),
  days integer NOT NULL CHECK (days BETWEEN 1 AND 730),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_user_id uuid REFERENCES auth.users(id),
  claimed_at timestamptz,
  expires_at timestamptz
);
ALTER TABLE private_payments.premium_promotions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private_payments.premium_promotions FROM PUBLIC, anon, authenticated;
ALTER TABLE public.premium_subscriptions DROP CONSTRAINT premium_subscriptions_source_check;
ALTER TABLE public.premium_subscriptions ADD CONSTRAINT premium_subscriptions_source_check
  CHECK (source IN ('razorpay','play','promotion'));

CREATE OR REPLACE FUNCTION private_payments.activate_premium_promotion(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  _email text; _grant private_payments.premium_promotions%ROWTYPE; _until timestamptz;
BEGIN
  -- Only a verified Google identity can claim an email-specific promotion.
  SELECT lower(email) INTO _email FROM auth.users
    WHERE id=_user_id AND email_confirmed_at IS NOT NULL AND NOT coalesce(is_anonymous,false)
      AND (raw_app_meta_data->>'provider'='google' OR raw_app_meta_data->'providers' ? 'google');
  IF _email IS NULL THEN RETURN false; END IF;
  SELECT * INTO _grant FROM private_payments.premium_promotions WHERE email=_email FOR UPDATE;
  IF NOT FOUND OR _grant.claimed_user_id IS NOT NULL THEN RETURN false; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('razorpay-user:'||_user_id::text,0));
  SELECT greatest(now(),coalesce(max(expires_at),now())) + make_interval(days=>_grant.days)
    INTO _until FROM public.premium_subscriptions WHERE user_id=_user_id AND plan='adfree_monthly';
  INSERT INTO public.premium_subscriptions(user_id,email,plan,amount_paise,starts_at,expires_at,source)
    VALUES (_user_id,_email,'adfree_monthly',0,now(),_until,'promotion'),
           (_user_id,_email,'notes_fmspm',0,now(),_until,'promotion'),
           (_user_id,_email,'notes_pharmac',0,now(),_until,'promotion');
  UPDATE private_payments.premium_promotions SET claimed_user_id=_user_id,claimed_at=now(),expires_at=_until WHERE email=_email;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION private_payments.activate_premium_promotion(uuid) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private_payments TO service_role;
GRANT EXECUTE ON FUNCTION private_payments.activate_premium_promotion(uuid) TO service_role;

CREATE OR REPLACE FUNCTION private_payments.claim_premium_promotion_on_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM private_payments.activate_premium_promotion(NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private_payments.claim_premium_promotion_on_auth() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER claim_premium_promotion AFTER INSERT OR UPDATE OF email,email_confirmed_at,raw_app_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private_payments.claim_premium_promotion_on_auth();
