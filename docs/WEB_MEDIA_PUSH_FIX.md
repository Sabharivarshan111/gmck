# Web media and background reminders — 2026-10-05

The native-web branch now renders validated YouTube embeds directly, with the script and presentation permissions needed by YouTube. Arbitrary note HTML retains an empty sandbox. Inline, expanded and floating players use the same adapter. Uploaded video keeps audio controls and ignores normal interrupted-play AbortErrors rather than treating pauses as failures.

PDF attachments continue through the existing PDF.js reader and local IndexedDB file storage. Files are private to the browser; clearing site data removes them. The existing reader renders at most 60 pages, with the shared native reader controls and annotations.

## Background push

The browser adapter registers a Web Push subscription, authenticated by a Supabase session (anonymous local-study users are supported). Preferences and a restricted study digest are stored in a private RLS table with all browser-role privileges revoked. The Edge Function validates browser JWTs via auth.getUser; endpoint ownership is enforced on updates and concurrent inserts. Provider URLs are restricted to Apple, Google and Mozilla push hosts. Signing keys and the scheduler token are in Vault, never Git. The function has gateway verify_jwt=false because its scheduler uses custom Vault-token authentication; all browser mutations still validate Supabase JWTs. Config returns only the public VAPID key.

pg_cron calls the authenticated dispatcher every five minutes through pg_net. Claimed devices have a lease, one daily delivery per local date, timezone/DST scheduling, bounded retries, and expired subscriptions are removed. Devices inactive for 30 days are excluded. Push events display a notification without an open app; taps allow only local known app routes. Disable/sign-out unsubscribes locally and removes the owned server record. Signing in after anonymous study replaces a subscription owned by the previous account.

On iPhone/iPad, Web Push requires iOS/iPadOS 16.4+ and opening the Home Screen installed app. Internet connectivity, system permission and Focus settings affect delivery. This is server-scheduled delivery, different from Android's local native alarms.

## Verification at publication

- Web TypeScript and production build passed; simulator source unchanged.
- Four Deno tests passed: India epoch days, DST scheduling, opt-in/quiet reminder composition, provider endpoint validation.
- Live backend config returned HTTP 200; unauthorized scheduler request returned HTTP 401; browser database SELECT privileges are false.
- Edge Function deployed ACTIVE; five-minute cron installed. Signing secrets initialized in Vault.
- Cloud browser cannot access the local test server. Testing proceeds on the hosted build.
- Physical iPhone Home Screen notification receipt is not verified. Do not equate a push-provider accepted response with device receipt.
