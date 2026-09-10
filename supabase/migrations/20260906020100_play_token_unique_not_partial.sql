-- The replay guard has to be inferrable by ON CONFLICT, and a partial index is not.
--
-- 20260906020000 created the unique index WITH a `where play_purchase_token is
-- not null`, on the reasoning that most rows have none. That reasoning was
-- unnecessary: Postgres already treats NULLs as distinct in a unique index, so
-- a plain one permits every Razorpay row to carry a NULL here exactly as the
-- partial one did.
--
-- It was also actively wrong. `ON CONFLICT (play_purchase_token) DO UPDATE`
-- cannot infer a partial index without repeating its WHERE clause, and
-- PostgREST's `on_conflict` parameter has nowhere to put one -- so an upsert
-- through supabase-js would have failed at run time with "no unique or
-- exclusion constraint matching the ON CONFLICT specification".
--
-- That upsert is not an optimisation. A SUBSCRIPTION KEEPS THE SAME PURCHASE
-- TOKEN ACROSS EVERY RENEWAL, so the row for a monthly ad-free plan is written
-- once and then updated twelve times a year with the expiry Play reports. If
-- the second write were an insert it would collide; if it were skipped, a
-- renewed subscription would silently expire on the month it was bought.
drop index if exists public.premium_subscriptions_play_token_key;

create unique index if not exists premium_subscriptions_play_token_key
  on public.premium_subscriptions (play_purchase_token);
