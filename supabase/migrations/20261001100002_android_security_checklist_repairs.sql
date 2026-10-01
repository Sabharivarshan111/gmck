-- Client device IDs are metadata, never account-ownership proof.
CREATE TABLE public.verified_guest_merges (
  old_user_id uuid PRIMARY KEY, new_user_id uuid NOT NULL, merged_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verified_guest_merges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.verified_guest_merges FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.verified_guest_merges TO service_role;
CREATE OR REPLACE FUNCTION public.merge_verified_guest(_old_user_id uuid, _new_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := _new_user_id;
  _my_device text;
  _old_device text;
  _old_is_anon boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _old_user_id IS NULL OR _old_user_id = _uid THEN RETURN; END IF;

  IF _uid IS NULL OR _old_user_id IS NULL OR _uid = _old_user_id THEN
    RAISE EXCEPTION 'Invalid account transfer' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('guest-merge:' || _old_user_id::text, 0));
  IF EXISTS (SELECT 1 FROM public.verified_guest_merges WHERE old_user_id = _old_user_id AND new_user_id = _uid) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.verified_guest_merges WHERE old_user_id = _old_user_id) THEN
    RAISE EXCEPTION 'Account transfer denied' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _old_user_id AND is_anonymous IS TRUE)
     OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _uid AND is_anonymous IS FALSE)
     OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid) THEN
    RAISE EXCEPTION 'Account transfer denied' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.verified_guest_merges VALUES (_old_user_id, _uid, now());
  INSERT INTO public.question_progress(user_id, question_id, completed_at, year)
  SELECT _uid, question_id, completed_at, year FROM public.question_progress WHERE user_id = _old_user_id
  ON CONFLICT (user_id, question_id) DO NOTHING;
  DELETE FROM public.question_progress WHERE user_id = _old_user_id;

  INSERT INTO public.weekly_xp(user_id, week_start, year, xp, updated_at)
  SELECT _uid, week_start, year, xp, updated_at FROM public.weekly_xp WHERE user_id = _old_user_id
  ON CONFLICT (user_id, week_start, year) DO UPDATE
    SET xp = public.weekly_xp.xp + EXCLUDED.xp, updated_at = now();
  DELETE FROM public.weekly_xp WHERE user_id = _old_user_id;

  INSERT INTO public.daily_activity(user_id, date, opens, questions_done, year)
  SELECT _uid, date, opens, questions_done, year FROM public.daily_activity WHERE user_id = _old_user_id
  ON CONFLICT (user_id, date) DO UPDATE
    SET opens = public.daily_activity.opens + EXCLUDED.opens,
        questions_done = public.daily_activity.questions_done + EXCLUDED.questions_done,
        year = COALESCE(public.daily_activity.year, EXCLUDED.year);
  DELETE FROM public.daily_activity WHERE user_id = _old_user_id;

  INSERT INTO public.screen_time(user_id, year, seconds, weekly_seconds, week_start, updated_at)
  SELECT _uid, year, seconds, weekly_seconds, week_start, updated_at FROM public.screen_time WHERE user_id = _old_user_id
  ON CONFLICT (user_id, year) DO UPDATE
    SET seconds = public.screen_time.seconds + EXCLUDED.seconds,
        weekly_seconds = public.screen_time.weekly_seconds + EXCLUDED.weekly_seconds,
        week_start = GREATEST(public.screen_time.week_start, EXCLUDED.week_start),
        updated_at = now();
  DELETE FROM public.screen_time WHERE user_id = _old_user_id;

  INSERT INTO public.revision_schedule(user_id, question_id, year, ease, interval_days, due_date, last_reviewed_at, created_at)
  SELECT _uid, question_id, year, ease, interval_days, due_date, last_reviewed_at, created_at
    FROM public.revision_schedule WHERE user_id = _old_user_id
  ON CONFLICT (user_id, question_id) DO NOTHING;
  DELETE FROM public.revision_schedule WHERE user_id = _old_user_id;

  INSERT INTO public.exam_targets(user_id, year, subject, exam_date, created_at, updated_at)
  SELECT _uid, year, subject, exam_date, created_at, updated_at
    FROM public.exam_targets WHERE user_id = _old_user_id;
  DELETE FROM public.exam_targets WHERE user_id = _old_user_id;

  UPDATE public.calendar_events SET user_id = _uid WHERE user_id = _old_user_id;
  UPDATE public.user_notes SET user_id = _uid WHERE user_id = _old_user_id;

  UPDATE public.profiles cur
     SET streak = GREATEST(cur.streak, old.streak),
         last_active_date = GREATEST(cur.last_active_date, old.last_active_date),
         streak_freezes_available = GREATEST(cur.streak_freezes_available, old.streak_freezes_available)
    FROM public.profiles old WHERE cur.id = _uid AND old.id = _old_user_id;

  DELETE FROM public.profiles WHERE id = _old_user_id;
  UPDATE public.profiles SET xp = (SELECT COUNT(*)::int FROM public.question_progress WHERE user_id = _uid) WHERE id = _uid;
END; $function$;

REVOKE ALL ON FUNCTION public.merge_verified_guest(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_verified_guest(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.merge_into_current_user(uuid) FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.claim_or_merge_profile(_device_id text, _display_name text, _year app_year)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _old_uid UUID;
  _result public.profiles;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _display_name IS NULL OR length(btrim(_display_name)) NOT BETWEEN 1 AND 80
     OR length(COALESCE(_device_id, '')) > 200 OR _year IS NULL THEN
    RAISE EXCEPTION 'Invalid profile' USING ERRCODE = '22023';
  END IF;

  -- Upsert current profile first (records this device against the caller)
  INSERT INTO public.profiles(id, display_name, year, device_id)
  VALUES (_uid, _display_name, _year, _device_id)
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        year         = EXCLUDED.year,
        device_id    = COALESCE(EXCLUDED.device_id, public.profiles.device_id);

  UPDATE public.profiles
     SET xp = (SELECT COUNT(*)::int FROM public.question_progress WHERE user_id = _uid)
   WHERE id = _uid;

  SELECT * INTO _result FROM public.profiles WHERE id = _uid;
  RETURN _result;
END; $function$;

REVOKE ALL ON FUNCTION public.claim_or_merge_profile(text,text,public.app_year) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_or_merge_profile(text,text,public.app_year) TO authenticated;
-- Keep profile editing/upsert compatible, while preventing arbitrary reward writes.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT INSERT (id, display_name, year, device_id, custom_theme_1, custom_theme_2, university)
 ON public.profiles TO authenticated;
GRANT UPDATE (id, display_name, year, device_id, custom_theme_1, custom_theme_2, university)
 ON public.profiles TO authenticated;
-- Native completion/open RPCs calculate rewards from server events.
REVOKE ALL ON FUNCTION public.award_quiz_xp(integer) FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.daily_activity, public.weekly_xp FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.register_open()
 RETURNS TABLE(streak integer, last_active_date date, freeze_used boolean, freezes_available integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _last DATE; _streak INTEGER; _gap INTEGER;
  _year public.app_year;
  _today DATE := public.app_today();
  _wk DATE := public.app_week_start();
  _freezes INT; _granted_wk DATE;
  _used BOOLEAN := false;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('register-open:' || _uid::text, 0));
  SELECT p.last_active_date, p.streak, p.year, p.streak_freezes_available, p.streak_freezes_granted_week
    INTO _last, _streak, _year, _freezes, _granted_wk
    FROM public.profiles p WHERE p.id = _uid FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF _granted_wk IS NULL OR _granted_wk < _wk THEN
    _freezes := LEAST(COALESCE(_freezes, 0) + 1, 2);
    _granted_wk := _wk;
  END IF;
  IF _last IS NULL THEN
    _streak := 1;
  ELSE
    _gap := _today - _last;
    IF _gap > 1 THEN
      IF _gap = 2 AND COALESCE(_freezes, 0) > 0 THEN
        _freezes := _freezes - 1;
        _streak := COALESCE(_streak, 0) + 1;
        _used := true;
      ELSE
        _streak := 1;
      END IF;
    ELSIF _gap = 1 THEN
      _streak := COALESCE(_streak, 0) + 1;
    ELSE
      _streak := GREATEST(COALESCE(_streak, 0), 1);
    END IF;
  END IF;
  UPDATE public.profiles
     SET streak = _streak, last_active_date = _today,
         streak_freezes_available = COALESCE(_freezes, 0),
         streak_freezes_granted_week = _granted_wk
   WHERE id = _uid;
  INSERT INTO public.daily_activity(user_id, date, opens, year)
  VALUES (_uid, _today, 1, _year)
  ON CONFLICT (user_id, date) DO UPDATE
    SET opens = public.daily_activity.opens + 1,
        year  = COALESCE(public.daily_activity.year, EXCLUDED.year);
  RETURN QUERY SELECT _streak, _today, _used, COALESCE(_freezes, 0);
END;
$function$;

-- Immutable payment ownership and atomic, idempotent bundle grants.
CREATE TABLE public.verified_razorpay_purchases (
  payment_id text PRIMARY KEY, user_id uuid NOT NULL, order_id text NOT NULL,
  plan text NOT NULL, purchased_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verified_razorpay_purchases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.verified_razorpay_purchases FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.verified_razorpay_purchases TO service_role;
CREATE OR REPLACE FUNCTION public.save_verified_razorpay_purchase(
  _user_id uuid, _email text, _order_id text, _payment_id text,
  _plan text, _amount integer, _purchased_at timestamptz
) RETURNS SETOF public.premium_subscriptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  _days integer; _price integer; _adfree_at timestamptz; _notes_at timestamptz;
  _notes_plan text; _adfree_id text; _notes_id text; _existing boolean;
BEGIN
  IF _user_id IS NULL OR _order_id !~ '^order_[A-Za-z0-9]{1,100}$'
     OR _payment_id !~ '^pay_[A-Za-z0-9]{1,100}$' OR _purchased_at IS NULL
     OR _purchased_at > now() + interval '5 minutes' THEN
    RAISE EXCEPTION 'Invalid purchase' USING ERRCODE = '22023';
  END IF;
  CASE _plan
    WHEN 'adfree_monthly' THEN _days := 30; _price := 5000;
    WHEN 'adfree_6m' THEN _days := 180; _price := 15000;
    WHEN 'adfree_1y' THEN _days := 365; _price := 30000;
    WHEN 'notes_fmspm' THEN _days := 30; _price := 5000;
    WHEN 'notes_pharmac' THEN _days := 30; _price := 5000;
    ELSE RAISE EXCEPTION 'Invalid plan' USING ERRCODE = '22023';
  END CASE;
  IF _amount IS DISTINCT FROM _price THEN RAISE EXCEPTION 'Invalid amount' USING ERRCODE = '22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('razorpay-payment:' || _payment_id, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('razorpay-user:' || _user_id::text, 0));
  IF EXISTS (SELECT 1 FROM public.verified_razorpay_purchases
       WHERE payment_id = _payment_id AND (user_id <> _user_id OR order_id <> _order_id OR plan <> _plan))
     OR EXISTS (SELECT 1 FROM public.premium_subscriptions
       WHERE razorpay_payment_id IN (_payment_id, _payment_id || ':adfree', _payment_id || ':notes') AND user_id <> _user_id) THEN
    RAISE EXCEPTION 'Purchase belongs to another account' USING ERRCODE = '42501';
  END IF;
  _existing := EXISTS (SELECT 1 FROM public.verified_razorpay_purchases WHERE payment_id = _payment_id);
  _notes_plan := CASE WHEN _plan = 'notes_pharmac' THEN 'notes_pharmac' ELSE 'notes_fmspm' END;
  _adfree_id := CASE WHEN _plan LIKE 'notes_%' THEN _payment_id || ':adfree' ELSE _payment_id END;
  _notes_id := CASE WHEN _plan LIKE 'notes_%' THEN _payment_id ELSE _payment_id || ':notes' END;
  IF NOT _existing THEN
    -- Recover partial legacy grants without refreshing their original expiry.
    SELECT expires_at INTO _adfree_at FROM public.premium_subscriptions
      WHERE user_id = _user_id AND razorpay_payment_id = _adfree_id AND plan = 'adfree_monthly';
    IF _adfree_at IS NULL THEN
      _adfree_at := _purchased_at + make_interval(days => _days);
      -- A fresh checkout stacks on already-paid time. Old restores never restart a bonus.
      IF _purchased_at >= now() - interval '1 day' THEN
        SELECT GREATEST(_purchased_at, COALESCE(max(expires_at), _purchased_at)) + make_interval(days => _days)
          INTO _adfree_at FROM public.premium_subscriptions
          WHERE user_id = _user_id AND plan = 'adfree_monthly';
      END IF;
    END IF;
    _notes_at := _purchased_at + interval '100 years';
    INSERT INTO public.premium_subscriptions(user_id,email,plan,amount_paise,razorpay_order_id,razorpay_payment_id,starts_at,expires_at,source)
      VALUES (_user_id,_email,'adfree_monthly',CASE WHEN _plan LIKE 'notes_%' THEN 0 ELSE _amount END,_order_id,_adfree_id,_purchased_at,_adfree_at,'razorpay')
      ON CONFLICT (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL DO NOTHING;
    INSERT INTO public.premium_subscriptions(user_id,email,plan,amount_paise,razorpay_order_id,razorpay_payment_id,starts_at,expires_at,source)
      VALUES (_user_id,_email,_notes_plan,CASE WHEN _plan LIKE 'notes_%' THEN _amount ELSE 0 END,_order_id,_notes_id,_purchased_at,_notes_at,'razorpay')
      ON CONFLICT (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL DO NOTHING;
    INSERT INTO public.verified_razorpay_purchases(payment_id,user_id,order_id,plan,purchased_at)
      VALUES (_payment_id,_user_id,_order_id,_plan,_purchased_at);
  END IF;
  RETURN QUERY SELECT * FROM public.premium_subscriptions
    WHERE user_id = _user_id AND razorpay_payment_id IN (_adfree_id, _notes_id);
END;
$$;
REVOKE ALL ON FUNCTION public.save_verified_razorpay_purchase(uuid,text,text,text,text,integer,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_verified_razorpay_purchase(uuid,text,text,text,text,integer,timestamptz) TO service_role;

-- Guest-authorized proof survives the login token refresh, without trusting a device ID.
CREATE TABLE public.guest_merge_proofs (
  proof_hash text PRIMARY KEY, old_user_id uuid NOT NULL, expires_at timestamptz NOT NULL
);
ALTER TABLE public.guest_merge_proofs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guest_merge_proofs FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.guest_merge_proofs TO service_role;
CREATE OR REPLACE FUNCTION public.prepare_guest_merge() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _uid uuid := auth.uid(); _proof uuid := gen_random_uuid();
BEGIN
  IF _uid IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _uid AND is_anonymous IS TRUE) THEN
    RAISE EXCEPTION 'Guest session required' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.guest_merge_proofs WHERE old_user_id = _uid AND expires_at < now();
  IF (SELECT count(*) FROM public.guest_merge_proofs WHERE old_user_id = _uid) >= 5 THEN
    RAISE EXCEPTION 'Too many pending transfers' USING ERRCODE = '54000';
  END IF;
  INSERT INTO public.guest_merge_proofs VALUES (encode(sha256(convert_to(_proof::text, 'UTF8')), 'hex'), _uid, now() + interval '30 days');
  RETURN _proof;
END;
$$;
REVOKE ALL ON FUNCTION public.prepare_guest_merge() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prepare_guest_merge() TO authenticated;
CREATE OR REPLACE FUNCTION public.merge_guest_with_proof(_proof text, _new_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE _old uuid;
BEGIN
  SELECT old_user_id INTO _old FROM public.guest_merge_proofs
    WHERE proof_hash = encode(sha256(convert_to(_proof, 'UTF8')), 'hex') AND expires_at > now();
  IF _old IS NULL THEN RAISE EXCEPTION 'Invalid transfer proof' USING ERRCODE = '42501'; END IF;
  PERFORM public.merge_verified_guest(_old, _new_user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.merge_guest_with_proof(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_guest_with_proof(text,uuid) TO service_role;
