-- Shared, finite daily question pool. The Edge Function is the only reader/writer.
create table if not exists public.daily_study_cards (
  year text not null check (year in ('first-year','second-year','third-year','final-year')),
  kind text not null check (kind in ('mcq','picture')),
  slot integer not null check (slot between 0 and 41),
  status text not null default 'generating' check (status in ('generating','ready')),
  card jsonb,
  image_url text,
  claimed_at timestamptz not null default now(),
  claim_token uuid not null,
  primary key (year, kind, slot),
  constraint ready_has_card check (status <> 'ready' or card is not null)
);
alter table public.daily_study_cards enable row level security;
revoke all on public.daily_study_cards from anon, authenticated;
