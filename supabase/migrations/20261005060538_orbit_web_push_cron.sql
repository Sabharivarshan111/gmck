-- The secret stays in Vault rather than in job text or source control.
select cron.schedule('orbit-web-push', '*/5 * * * *', $job$
 select net.http_post(
  url := 'https://pmtgeydtqypwrypshhsx.supabase.co/functions/v1/web-push',
  headers := jsonb_build_object('Content-Type','application/json','x-orbit-cron',
   (select decrypted_secret from vault.decrypted_secrets where name='orbit_push_cron_token')),
  body := '{"action":"dispatch"}'::jsonb,
  timeout_milliseconds := 20000
 );
$job$);
