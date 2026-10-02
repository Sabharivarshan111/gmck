DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_depend d ON d.objid=p.oid AND d.classid='pg_proc'::regclass
    JOIN pg_extension e ON e.oid=d.refobjid AND d.refclassid='pg_extension'::regclass
    WHERE e.extname='http'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_mark_notifications_read() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_recent_notifications(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_unread_notification_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mark_notifications_read(), public.admin_recent_notifications(integer), public.admin_unread_notification_count() TO authenticated;
