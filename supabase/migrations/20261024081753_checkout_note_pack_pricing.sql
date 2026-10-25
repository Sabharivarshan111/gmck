-- Service-only grant: current ₹150 and provider-verified historical ₹50 notes.
-- Edge verification pins exact price to immutable provider order catalogue metadata.
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
    WHEN 'notes_fmspm' THEN _days := 30; _price := CASE WHEN _amount IN (5000,15000) THEN _amount ELSE -1 END;
    WHEN 'notes_pharmac' THEN _days := 30; _price := CASE WHEN _amount IN (5000,15000) THEN _amount ELSE -1 END;
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

