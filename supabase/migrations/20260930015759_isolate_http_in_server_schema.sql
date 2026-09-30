-- No app, application-function or cron dependency on http was found.
-- http 1.6 is not relocatable; recreate only the extension, without CASCADE.
CREATE SCHEMA IF NOT EXISTS server_http;
DROP EXTENSION http;
CREATE EXTENSION http WITH SCHEMA server_http VERSION '1.6';
REVOKE ALL ON SCHEMA server_http FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA server_http TO service_role;
