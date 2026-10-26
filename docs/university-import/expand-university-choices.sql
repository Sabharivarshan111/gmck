-- Expand allowed bank identities only; no reader rows, permissions or RLS policies change.
-- Existing TNMGR/KUHS values remain valid. New questions remain bundled offline.
set local lock_timeout = '5s';
alter table public.profiles drop constraint profiles_university_check;
alter table public.profiles add constraint profiles_university_check
  check (university in ('tnmgr','kuhs','rguhs','knruhs','muhs','ntruhs','wbuhs'));
alter table public.daily_study_cards drop constraint daily_study_cards_university_check;
alter table public.daily_study_cards add constraint daily_study_cards_university_check
  check (university in ('tnmgr','kuhs','rguhs','knruhs','muhs','ntruhs','wbuhs'));
