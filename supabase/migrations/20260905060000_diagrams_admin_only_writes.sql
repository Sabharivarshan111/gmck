-- Anyone with the anon key could rewrite or delete every diagram. Not any more.
--
-- Found 2026-09-05, after the Lovable agent's publish step reported two
-- "critical" advisories on this project and they turned out to be real.
--
-- WHAT WAS OPEN
--
--   public.question_diagrams   POLICY "Public Update question_diagrams"
--                              UPDATE, role public, USING (true), no WITH CHECK
--
--   storage.objects            POLICY "Public Insert Diagrams"   (bucket diagrams)
--                              POLICY "Public Update Diagrams"   (bucket diagrams)
--                              POLICY "Public Delete Diagrams"   (bucket diagrams)
--                              all role public
--
-- The anon key is embedded in both apps and is public by design, so this was
-- not "logged-in users can edit" — it was ANYONE. A single PATCH could point
-- all 922 rows at one image, and a single DELETE could empty the bucket of
-- every medical plate. There is no undo for the bucket.
--
-- WHY IT IS SAFE TO CLOSE
--
-- Nothing writes these from a client. Every reference in both apps is a
-- `.select(...)`:
--   src/lib/questionDiagrams.ts, mobile/src/lib/handwrittenNotes.ts,
--   mobile/src/lib/admin.ts (a count)
-- and nothing anywhere calls `storage.from('diagrams')`. The uploads happen in
-- edge functions, which use the service role and bypass RLS entirely — their
-- "Service role can manage…" policies are untouched below.
--
-- WHY `is_admin()` AND NOT `authenticated`
--
-- Anonymous sign-in is enabled on this project (it is what carries XP, the
-- streak and cloud progress, and every reader gets a session without being
-- asked). So `to authenticated` would have been the same hole with an extra
-- step. `public.is_admin()` is the gate the admin dashboard already uses —
-- SECURITY DEFINER, STABLE, `has_role(auth.uid(), 'admin')` — so an admin
-- panel that uploads as a signed-in admin keeps working and nobody else can
-- write at all.
--
-- READS ARE UNCHANGED. Both apps and the Lovable copy read this table
-- anonymously and must keep doing so; the SELECT policies are not touched.
--
-- VERIFIED against production, not assumed:
--   read  — GET  /rest/v1/question_diagrams with the anon key -> 200, real rows
--   write — PATCH the same table with the anon key, writing a row's own text
--           back to it (a no-op even if it had succeeded) -> [] , nothing
--           updated. Blocked.
--
-- TO ROLL BACK, if an admin flow turns out to need the old behaviour, run:
--
--   drop policy "Admins can update question_diagrams" on public.question_diagrams;
--   create policy "Public Update question_diagrams" on public.question_diagrams
--     for update using (true);
--   drop policy "Admins can insert diagram files" on storage.objects;
--   drop policy "Admins can update diagram files" on storage.objects;
--   drop policy "Admins can delete diagram files" on storage.objects;
--   create policy "Public Insert Diagrams" on storage.objects
--     for insert with check (bucket_id = 'diagrams');
--   create policy "Public Update Diagrams" on storage.objects
--     for update using (bucket_id = 'diagrams');
--   create policy "Public Delete Diagrams" on storage.objects
--     for delete using (bucket_id = 'diagrams');
--
-- Prefer giving that flow an edge function over restoring these.

drop policy if exists "Public Update question_diagrams" on public.question_diagrams;
create policy "Admins can update question_diagrams"
  on public.question_diagrams for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public Insert Diagrams" on storage.objects;
drop policy if exists "Public Update Diagrams" on storage.objects;
drop policy if exists "Public Delete Diagrams" on storage.objects;

create policy "Admins can insert diagram files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'diagrams' and public.is_admin());

create policy "Admins can update diagram files"
  on storage.objects for update to authenticated
  using (bucket_id = 'diagrams' and public.is_admin())
  with check (bucket_id = 'diagrams' and public.is_admin());

create policy "Admins can delete diagram files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'diagrams' and public.is_admin());
