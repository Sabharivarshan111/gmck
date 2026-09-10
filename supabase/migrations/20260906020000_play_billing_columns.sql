-- Google Play Billing lands in the SAME table Razorpay writes.
--
-- That is the single best thing about how this is currently built: every reader
-- of the entitlement -- premium.ts in the native app, the web app's own check,
-- the admin dashboard -- asks "is there an unexpired adfree_monthly row for this
-- user", and none of them has to change. Adding a parallel play_subscriptions
-- table would mean editing every one of them, and any one missed is somebody
-- who paid and still sees ads.
--
-- Columns rather than a new table, therefore. `source` says which system took
-- the money; the Razorpay columns stay exactly as they are, and the existing
-- rows are all Razorpay's, which is why the default is what it is.

alter table public.premium_subscriptions
  add column if not exists source text not null default 'razorpay',
  add column if not exists play_purchase_token text,
  add column if not exists play_product_id text,
  add column if not exists play_order_id text,
  -- Play's own subscription state, verbatim, so a row can be explained without
  -- guessing: SUBSCRIPTION_STATE_ACTIVE, _IN_GRACE_PERIOD, _ON_HOLD, _CANCELED,
  -- _EXPIRED, _PAUSED. Empty for a one-off product.
  add column if not exists play_state text,
  -- Whether Play will charge again. A cancelled-but-not-yet-expired
  -- subscription is still ad-free until expires_at, and this is the only thing
  -- that distinguishes it from one that will renew.
  add column if not exists auto_renewing boolean;

alter table public.premium_subscriptions
  drop constraint if exists premium_subscriptions_source_check;
alter table public.premium_subscriptions
  add constraint premium_subscriptions_source_check
  check (source in ('razorpay', 'play'));

-- The replay guard, and the reason it is a UNIQUE index rather than a check in
-- the edge function.
--
-- A purchase token is the only thing the client sends, and a client can send it
-- as many times as it likes -- `restore()` posts every token Play reports on
-- every launch, by design. If the grant were guarded only by code, one retry
-- during a slow network would be a second month for free. The database refuses
-- the second insert instead, which is a guarantee rather than an intention.
--
-- Partial, because every existing row and every future Razorpay row has NULL
-- here, and NULLs are not distinct enough for a plain unique constraint to be
-- safe to add to a live table.
create unique index if not exists premium_subscriptions_play_token_key
  on public.premium_subscriptions (play_purchase_token)
  where play_purchase_token is not null;

-- The lookup RTDN does: a notification names a purchase token and nothing else,
-- so finding the row it belongs to must not be a sequential scan of every
-- subscription ever sold.
create index if not exists premium_subscriptions_play_product_idx
  on public.premium_subscriptions (play_product_id)
  where play_product_id is not null;

comment on column public.premium_subscriptions.source is
  'Which payment system took the money: razorpay or play. Existing rows predate Play Billing and are all razorpay.';
comment on column public.premium_subscriptions.play_purchase_token is
  'Play purchase token. UNIQUE where present -- this is what stops one token being redeemed twice.';
