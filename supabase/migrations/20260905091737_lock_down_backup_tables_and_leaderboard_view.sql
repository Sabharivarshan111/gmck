-- Three tables and a view the anon key could read that nothing should read.
--
-- Found 2026-09-05 by running the Supabase security advisors after the
-- diagrams fix. Eighty-one findings; these are the three ERRORs. The other
-- seventy-eight are checked and left alone, and the reasoning for that is at
-- the bottom, because "we looked and decided no" is the part that gets lost.
--
-- WHAT WAS OPEN
--
--   public.handwritten_notes_pre_flowchart_backup   RLS DISABLED, 11 rows
--   public.question_diagrams_fix_20260904           RLS DISABLED,  4 rows
--   public.weekly_leaders (view)                    SECURITY DEFINER
--
-- The first two are working backups taken during migrations — one before the
-- flowchart rewrite, one during yesterday's diagram-row corrections. A table
-- in `public` with RLS disabled is readable by anyone holding the anon key,
-- and the anon key ships inside both apps by design. Neither table is
-- referenced anywhere in either app or in any edge function; they exist so a
-- migration could be undone.
--
-- WHY RLS WITH NO POLICY, RATHER THAN A POLICY
--
-- Enabling RLS and writing no policy denies everyone except `service_role`,
-- which bypasses RLS entirely. That is exactly the intent: these are recovery
-- data for whoever is holding the service key, and nobody else has any
-- business reading them. A policy would be inventing an audience.
--
-- Deleting them instead was the other option and is worse: the flowchart
-- backup is the only copy of eleven notes as they were before that rewrite.
--
-- THE VIEW
--
-- `weekly_leaders` joins `profiles` to `daily_activity`. A view without
-- `security_invoker` runs with its OWNER's rights, so it hands back rows the
-- caller's own RLS would have refused — it is a way around `profiles`'s
-- policies that happens to be shaped like a view. `security_invoker = on`
-- makes it obey the caller instead.
--
-- Safe because nothing reads it: the leaderboards go through
-- `get_weekly_leaderboard()` / `get_year_leaderboard()`, and the only
-- references anywhere are the generated `src/integrations/supabase/types.ts`
-- entry and the migration that created it. It is granted to `authenticated`
-- and `service_role` and never to `anon`.
--
-- THE TRIGGER FUNCTION THAT GRANTS ADMIN
--
-- `grant_admin_for_owner_email()` is what makes the owner's account an admin
-- when it confirms its email. It is a TRIGGER function — it reads `NEW` — so
-- calling it over RPC raises rather than doing anything, and it is not
-- exploitable today. But it is SECURITY DEFINER, it writes `user_roles`, and
-- PostgREST exposes it at `/rest/v1/rpc/grant_admin_for_owner_email` to
-- `anon`. A function that grants admin should not be reachable from the
-- internet at all, whatever it does when it gets there.
--
-- ROLLBACK
--
--   alter table public.handwritten_notes_pre_flowchart_backup disable row level security;
--   alter table public.question_diagrams_fix_20260904 disable row level security;
--   alter view public.weekly_leaders set (security_invoker = off);
--   grant execute on function public.grant_admin_for_owner_email() to anon, authenticated;
--   grant execute on function public.admin_list_subscribers() to anon;
--   -- (and the other admin_* grants below)

-- 1. The two backup tables: deny everyone but the service role.
alter table public.handwritten_notes_pre_flowchart_backup enable row level security;
alter table public.question_diagrams_fix_20260904 enable row level security;

-- 2. The view obeys the caller's RLS rather than its owner's.
alter view public.weekly_leaders set (security_invoker = on);

-- 3. `page_ref_quorum` pinned its search_path. A SECURITY DEFINER function with
--    a mutable search_path can be pointed at a different schema's `count` by a
--    caller who controls it; every other function on this project is already
--    pinned and this one was missed.
alter function public.page_ref_quorum() set search_path = public, pg_temp;

-- 4. Nothing that grants a role should be callable over HTTP.
revoke execute on function public.grant_admin_for_owner_email() from anon, authenticated;

-- 5. Defence in depth on the admin surface.
--
--    Every one of these already refuses a non-admin itself — each body opens
--    with `if not public.is_admin() then raise` or carries `where
--    public.is_admin()`, and that check is what actually protects the data.
--    This is the second lock: an ANONYMOUS session has no route to becoming an
--    admin, so it has no business reaching these endpoints even to be turned
--    away. `authenticated` keeps EXECUTE, because the admin is a signed-in
--    user and the in-app panel calls these directly.
revoke execute on function public.admin_list_subscribers() from anon;
revoke execute on function public.admin_list_subscriptions() from anon;
revoke execute on function public.admin_page_ref_stats() from anon;
revoke execute on function public.admin_list_page_refs(boolean) from anon;
revoke execute on function public.admin_revoke_subscription(uuid) from anon;
revoke execute on function public.admin_revoke_user_access(uuid) from anon;
revoke execute on function public.admin_delete_page_ref(text, uuid, integer) from anon;
revoke execute on function public.admin_delete_reference_book(uuid) from anon;

-- WHAT WAS DELIBERATELY LEFT ALONE
--
-- * 18 x `auth_allow_anonymous_sign_ins`. These are policies that admit an
--   anonymous session, and that is the app's design rather than an oversight:
--   anonymous sign-in is what carries XP, the streak and cloud progress, and
--   no reader is ever asked to sign in to get one. Closing them would take My
--   Progress down for everybody.
--
-- * ~55 x `*_security_definer_function_executable`. SECURITY DEFINER is how
--   `record_question_done`, `is_admin` and the leaderboards work at all — they
--   have to see rows the caller cannot. Each was read: the admin ones gate
--   themselves (and are now revoked from `anon` above), and the rest are
--   scoped to `auth.uid()`.
--
-- * `extension_in_public: http`. The http extension is the only route a
--   sandboxed agent has to this database. Moving it is a separate change with
--   its own blast radius, and it is not reachable by `anon`.
--
-- * `handwritten_notes_pre_textbook_backup` (INFO, "RLS enabled no policy").
--   That is the state this migration is putting the other two into. It is the
--   fix, reported as a finding.
--
-- * `auth_leaked_password_protection` is a dashboard toggle, not SQL, and the
--   app has no password sign-in today. It is the owner's to enable.
