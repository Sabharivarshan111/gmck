-- Synthetic records only; run inside BEGIN ... ROLLBACK.
CREATE TEMP TABLE security_fixture AS SELECT gen_random_uuid() old_id, gen_random_uuid() new_id, gen_random_uuid() other_id, 'pay_security' || replace(gen_random_uuid()::text,'-','') payment, NULL::uuid proof;
CREATE TEMP TABLE security_results(name text, passed boolean);
GRANT ALL ON security_fixture, security_results TO authenticated;
CREATE FUNCTION pg_temp.assert_true(_name text, _ok boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
  IF _ok IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'Failed security test: %', _name; END IF;
  INSERT INTO security_results VALUES (_name, true);
END $$;
INSERT INTO auth.users(id,email,is_anonymous,raw_app_meta_data)
  SELECT old_id,NULL,true,'{"provider":"anonymous"}'::jsonb FROM security_fixture
  UNION ALL SELECT new_id,'security-'||new_id::text||'@example.invalid',false,'{"provider":"google"}'::jsonb FROM security_fixture
  UNION ALL SELECT other_id,'security-'||other_id::text||'@example.invalid',false,'{"provider":"google"}'::jsonb FROM security_fixture;
INSERT INTO public.profiles(id,display_name,year,device_id)
  SELECT old_id,'Audit guest','first'::public.app_year,'known-security-device' FROM security_fixture
  UNION ALL SELECT new_id,'Audit signed-in','first'::public.app_year,'different-security-device' FROM security_fixture
  UNION ALL SELECT other_id,'Audit other','first'::public.app_year,'other-security-device' FROM security_fixture;
INSERT INTO public.user_notes(user_id,title,content) SELECT old_id,'Synthetic security note','fixture' FROM security_fixture;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',json_build_object('sub',old_id,'role','authenticated','is_anonymous',true)::text,true) FROM security_fixture;
UPDATE security_fixture SET proof=public.prepare_guest_merge();
SELECT pg_temp.assert_true('guest can authorize its own transfer', proof IS NOT NULL) FROM security_fixture;
SELECT set_config('request.jwt.claims',json_build_object('sub',new_id,'role','authenticated','is_anonymous',false)::text,true) FROM security_fixture;
SELECT pg_temp.assert_true('other guest note is hidden',NOT EXISTS(SELECT 1 FROM public.user_notes WHERE title='Synthetic security note'));
DO $$ BEGIN
  BEGIN UPDATE public.profiles SET xp=999999, streak=9999, streak_freezes_available=9999 WHERE id=auth.uid();
    RAISE EXCEPTION 'forged rewards accepted';
  EXCEPTION WHEN insufficient_privilege THEN INSERT INTO security_results VALUES ('direct reward forgery denied',true); END;
  BEGIN PERFORM public.merge_into_current_user((SELECT old_id FROM security_fixture));
    RAISE EXCEPTION 'unproved merge accepted';
  EXCEPTION WHEN insufficient_privilege THEN INSERT INTO security_results VALUES ('old merge RPC denied',true); END;
  BEGIN PERFORM public.merge_verified_guest((SELECT old_id FROM security_fixture),auth.uid());
    RAISE EXCEPTION 'privileged merge accepted';
  EXCEPTION WHEN insufficient_privilege THEN INSERT INTO security_results VALUES ('service merge RPC denied to client',true); END;
  BEGIN PERFORM public.award_quiz_xp(50); RAISE EXCEPTION 'arbitrary XP accepted';
  EXCEPTION WHEN insufficient_privilege THEN INSERT INTO security_results VALUES ('arbitrary reward RPC denied',true); END;
  BEGIN PERFORM public.prepare_guest_merge(); RAISE EXCEPTION 'signed-in guest proof accepted';
  EXCEPTION WHEN insufficient_privilege THEN INSERT INTO security_results VALUES ('signed-in identity cannot mint guest proof',true); END;
END $$;
UPDATE public.profiles SET device_id='known-security-device', display_name='Audit valid edit' WHERE id=auth.uid();
SELECT public.claim_or_merge_profile('known-security-device','Audit valid edit','first');
SELECT pg_temp.assert_true('device claim does not transfer victim note',NOT EXISTS(SELECT 1 FROM public.user_notes WHERE title='Synthetic security note'));
SELECT * FROM public.register_open();
SELECT * FROM public.register_open();
SELECT pg_temp.assert_true('repeat opens keep streak at one',(SELECT streak=1 FROM public.profiles WHERE id=auth.uid()));
RESET ROLE;
SELECT pg_temp.assert_true('guest retained before proof',EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT old_id FROM security_fixture)));
SELECT public.merge_guest_with_proof(proof::text,new_id) FROM security_fixture;
SELECT public.merge_guest_with_proof(proof::text,new_id) FROM security_fixture;
SELECT pg_temp.assert_true('verified transfer moves note once',(SELECT count(*)=1 FROM public.user_notes WHERE user_id=(SELECT new_id FROM security_fixture) AND title='Synthetic security note'));
DO $$ BEGIN
  BEGIN PERFORM public.merge_guest_with_proof((SELECT proof::text FROM security_fixture),(SELECT other_id FROM security_fixture)); RAISE EXCEPTION 'transfer replay to stranger accepted';
  EXCEPTION WHEN insufficient_privilege THEN INSERT INTO security_results VALUES ('proof cannot replay to another account',true); END;
END $$;
SELECT * FROM public.save_verified_razorpay_purchase((SELECT new_id FROM security_fixture),NULL,'order_securityfixture',(SELECT payment FROM security_fixture),'notes_fmspm',5000,now()-interval '80 days');
CREATE TEMP TABLE security_expiry AS SELECT max(expires_at) expiry FROM public.premium_subscriptions WHERE razorpay_payment_id=(SELECT payment||':adfree' FROM security_fixture);
SELECT * FROM public.save_verified_razorpay_purchase((SELECT new_id FROM security_fixture),NULL,'order_securityfixture',(SELECT payment FROM security_fixture),'notes_fmspm',5000,now());
SELECT pg_temp.assert_true('bundle saved atomically and once',(SELECT count(*)=2 FROM public.premium_subscriptions WHERE razorpay_payment_id IN ((SELECT payment FROM security_fixture),(SELECT payment||':adfree' FROM security_fixture))));
SELECT pg_temp.assert_true('restore does not refresh original expiry',(SELECT max(expires_at) FROM public.premium_subscriptions WHERE razorpay_payment_id=(SELECT payment||':adfree' FROM security_fixture))=(SELECT expiry FROM security_expiry));
SELECT pg_temp.assert_true('old bonus uses original purchase date',(SELECT expiry < now() FROM security_expiry));
DO $$ BEGIN
  BEGIN PERFORM public.save_verified_razorpay_purchase((SELECT other_id FROM security_fixture),NULL,'order_securityfixture',(SELECT payment FROM security_fixture),'notes_fmspm',5000,now()); RAISE EXCEPTION 'payment takeover accepted';
  EXCEPTION WHEN insufficient_privilege THEN INSERT INTO security_results VALUES ('payment ownership takeover denied',true); END;
  BEGIN PERFORM public.save_verified_razorpay_purchase((SELECT new_id FROM security_fixture),NULL,'order_securityfixture',(SELECT payment||'x' FROM security_fixture),'adfree_1y',5000,now()); RAISE EXCEPTION 'plan amount escalation accepted';
  EXCEPTION WHEN invalid_parameter_value THEN INSERT INTO security_results VALUES ('plan amount escalation denied',true); END;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM public.save_verified_razorpay_purchase(auth.uid(),NULL,'order_securityfixture','pay_securityfixture','notes_fmspm',5000,now()); RAISE EXCEPTION 'client entitlement write accepted';
  EXCEPTION WHEN insufficient_privilege THEN INSERT INTO security_results VALUES ('client cannot call payment grant RPC',true); END;
END $$;
RESET ROLE;
SELECT name,passed FROM security_results ORDER BY name;
