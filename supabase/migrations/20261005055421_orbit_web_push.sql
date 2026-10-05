-- Push endpoints and study digests are private; only the verified Edge Function owns them.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create table if not exists public.orbit_web_push_subscriptions (
 endpoint text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 subscription jsonb not null,
 timezone text not null default 'UTC',
 reminder_hour integer not null default 19 check (reminder_hour between 6 and 23),
 digest jsonb not null default '{}',
 enabled boolean not null default true,
 next_delivery_at timestamptz not null,
 last_sent_date text,
 last_test_at timestamptz,
 updated_at timestamptz not null default now(),
 failures integer not null default 0
);
alter table public.orbit_web_push_subscriptions enable row level security;
revoke all on public.orbit_web_push_subscriptions from public, anon, authenticated;
grant all on public.orbit_web_push_subscriptions to service_role;
create index if not exists orbit_web_push_due on public.orbit_web_push_subscriptions(next_delivery_at) where enabled;
create index if not exists orbit_web_push_user on public.orbit_web_push_subscriptions(user_id);
-- Vault values are initialized separately. No private signing keys belong in Git.
create or replace function public.orbit_web_push_config()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
 if coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') <> 'service_role' then
   raise exception 'Forbidden';
 end if;
 return (select jsonb_object_agg(name, decrypted_secret) from vault.decrypted_secrets
 where name in ('orbit_push_public_key','orbit_push_private_key','orbit_push_cron_token'));
end;
$$;
revoke all on function public.orbit_web_push_config() from public, anon, authenticated;
grant execute on function public.orbit_web_push_config() to service_role;
-- SKIP LOCKED + a lease prevents overlapping cron calls from claiming the same device.
create or replace function public.orbit_web_push_claim()
returns setof public.orbit_web_push_subscriptions language sql security invoker set search_path = '' as $$
 update public.orbit_web_push_subscriptions s set next_delivery_at = now() + interval '5 minutes'
 where s.endpoint in (
  select endpoint from public.orbit_web_push_subscriptions
  where enabled and next_delivery_at <= now() and updated_at > now() - interval '30 days'
  order by next_delivery_at limit 100 for update skip locked
 ) returning s.*;
$$;
revoke all on function public.orbit_web_push_claim() from public, anon, authenticated;
grant execute on function public.orbit_web_push_claim() to service_role;
