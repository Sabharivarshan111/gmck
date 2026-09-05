-- The previous migration revoked EXECUTE from `anon` and it changed nothing.
--
-- This is the part worth remembering. Postgres grants EXECUTE on a new
-- function to PUBLIC by default, and the ACL says so plainly once you look:
--
--   admin_revoke_user_access  {=X/postgres,postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
--                              ^^^ that leading `=X` is PUBLIC
--
-- `anon` was never reaching these through a grant of its own. It was
-- inheriting PUBLIC's. So `revoke ... from anon` removed a grant that was not
-- doing the work, left PUBLIC's in place, and the endpoint stayed exactly as
-- open as before — while the migration reported success.
--
-- The only reason this was caught is that the change was verified by asking
-- `has_function_privilege('anon', ...)` afterwards instead of trusting that
-- the statement had done what it said. It still answered true.
--
-- So: revoke from PUBLIC, then grant back explicitly to the roles that need
-- it. `authenticated` keeps the admin RPCs, because the admin is a signed-in
-- user and the in-app panel calls them directly. Each of them still opens with
-- `if not public.is_admin() then raise` or carries `where public.is_admin()`,
-- and that remains the check that actually protects the data; this is the
-- outer lock, so an anonymous session has no route to the endpoint at all.
--
-- `grant_admin_for_owner_email()` gets NO grant back. It is a TRIGGER function
-- and Postgres checks EXECUTE when a trigger is CREATED rather than each time
-- it fires, so the owner's account still becomes an admin on email
-- confirmation exactly as before. It simply stops being reachable at
-- `/rest/v1/rpc/grant_admin_for_owner_email`. Nothing that writes `user_roles`
-- should be an HTTP endpoint, whatever it does when it gets there.
--
-- VERIFIED AFTER APPLYING, per function:
--   admin_*                        anon false, authenticated true
--   grant_admin_for_owner_email    anon false, authenticated false
--   is_admin, record_questions_done  anon true  (unchanged — the app needs them)
--
-- ROLLBACK
--   grant execute on function public.grant_admin_for_owner_email() to public;
--   grant execute on function public.admin_list_subscribers() to public;
--   grant execute on function public.admin_list_subscriptions() to public;
--   grant execute on function public.admin_page_ref_stats() to public;
--   grant execute on function public.admin_list_page_refs(boolean) to public;
--   grant execute on function public.admin_revoke_subscription(uuid) to public;
--   grant execute on function public.admin_revoke_user_access(uuid) to public;
--   grant execute on function public.admin_delete_page_ref(text, uuid, integer) to public;
--   grant execute on function public.admin_delete_reference_book(uuid) to public;

revoke execute on function public.grant_admin_for_owner_email() from public;

revoke execute on function public.admin_list_subscribers() from public;
revoke execute on function public.admin_list_subscriptions() from public;
revoke execute on function public.admin_page_ref_stats() from public;
revoke execute on function public.admin_list_page_refs(boolean) from public;
revoke execute on function public.admin_revoke_subscription(uuid) from public;
revoke execute on function public.admin_revoke_user_access(uuid) from public;
revoke execute on function public.admin_delete_page_ref(text, uuid, integer) from public;
revoke execute on function public.admin_delete_reference_book(uuid) from public;

grant execute on function public.admin_list_subscribers() to authenticated;
grant execute on function public.admin_list_subscriptions() to authenticated;
grant execute on function public.admin_page_ref_stats() to authenticated;
grant execute on function public.admin_list_page_refs(boolean) to authenticated;
grant execute on function public.admin_revoke_subscription(uuid) to authenticated;
grant execute on function public.admin_revoke_user_access(uuid) to authenticated;
grant execute on function public.admin_delete_page_ref(text, uuid, integer) to authenticated;
grant execute on function public.admin_delete_reference_book(uuid) to authenticated;
