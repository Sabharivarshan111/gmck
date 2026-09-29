-- Preserve anonymous sign-in heartbeats while preventing cross-device edits.
alter table public.study_presence add column if not exists user_id uuid default auth.uid();
drop policy if exists "Anyone can insert presence" on public.study_presence;
drop policy if exists "Anyone can update presence" on public.study_presence;
drop policy if exists "Anyone can delete presence" on public.study_presence;
drop policy if exists "presence_insert_own" on public.study_presence;
drop policy if exists "presence_update_own" on public.study_presence;
drop policy if exists "presence_delete_own" on public.study_presence;
create policy "presence_insert_own" on public.study_presence for insert to authenticated with check (user_id = (select auth.uid()));
create policy "presence_update_own" on public.study_presence for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "presence_delete_own" on public.study_presence for delete to authenticated using (user_id = (select auth.uid()));
