-- Applied to project pmtgeydtqypwrypshhsx on 2026-09-28.
-- NULL means an existing reader has not chosen a university yet.
alter table public.profiles
  add column if not exists university text null
  constraint profiles_university_check check (university in ('tnmgr', 'kuhs'));

comment on column public.profiles.university is
  'Selected exam question bank. NULL means an older account has not chosen yet.';
