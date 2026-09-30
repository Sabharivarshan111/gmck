# Native Android security audit — 2026-09-30

## Assessment
**5/10, provisional.** This score covers the native app and the purchase backend it relies on, independently of Lovable. It is a qualitative engineering score, not certification or a complete device penetration test. Inspected gmck source at c253bcd382d1bd098d25a6f88b824898643320d2. No application code, user data or Lovable deployment changed during this audit.

## Findings
| Priority | Finding and evidence | Impact / next repair |
|---|---|---|
| High, conditional | play-verify-purchase allows an empty Play accountId, then upserts user_id on play_purchase_token without checking the row's previous owner. Deployed source exactly matches repository. | A valid legacy/unbound token obtained by another signed-in account can reassign its existing entitlement. Bind token ownership atomically; reject owner changes, with an explicit legitimate recovery path. Existing UNIQUE token constraint prevents duplicate rows, not ownership replacement. No real-token exploit performed. |
| Medium | One-time notes purchases calculate the bundled ad-free expiry as now + 30 days on every verification; restore calls verification repeatedly. | A valid purchaser can keep refreshing the bonus month. Persist its initial grant date/expiry and make restores idempotent. No real purchase tested. |
| Medium | mobile/src/lib/supabase.ts persists the whole Supabase session through AsyncStorage. | Refresh/access tokens are unencrypted within the app sandbox. Ordinary other apps cannot simply read them; rooted/compromised devices or exposed app data increase risk. Migrate sessions safely to Keystore-backed encrypted storage without losing existing anonymous progress. |
| Medium | ApkgModule.kt stage copyTo, readEntry readBytes, collection decompression copyTo and extractMedia copyTo have no byte budget. The 50,000 card limit in importedDecks.ts does not bound decompression or media size. | Malicious/oversized .apkg files can consume memory/storage and crash imports. Add bounded streaming reads, per-entry/total bytes, entry-count limits, cancellation and failure cleanup; retain support for legitimate large decks. Media destination has a canonical-parent check, which is a positive path-traversal defense. |
| Low / privacy | signOutGoogle clears Supabase/Google sessions but leaves GOOGLE_AUTH_EMAIL_KEY and GOOGLE_AUTH_FLAG_KEY. getSignedInEmail falls back to stored email; hasAuthenticatedGoogleOnce trusts the flag. | Old identity can remain displayed after sign-out. Clear identity caches; do not treat this local UI flag as server authorization. Server getUser remains the authorization boundary. |
| Low / build hardening | Local release build falls back to debug signing when KEYSTORE_PATH is absent. | Risk of producing a misleading release artifact locally. Fail closed for release tasks. Current CI explicitly fails without the real keystore; successful signed CI builds are not evidence of an exposed signing secret. |
| Local tampering limit | premium.ts trusts cached orbit:premium-until and device time while offline. | Someone controlling their device/app data can suppress their own ads. This does not prove cloud purchase records can be forged. Consider account-bound, signed offline entitlements if business needs justify it. |

## Positive controls observed
- allowBackup=false in the application manifest.
- Internal and preview variants explicitly set usesCleartextTraffic=false and debuggable=false. Release cleartext placeholder comes from the React Native plugin; the final merged APK manifest was not inspected here.
- No service-role/provider secret in the inspected native Supabase/auth configuration; anon key and OAuth client ID are intentionally public.
- Google SDK ID token is exchanged with Supabase signInWithIdToken.
- Purchase entitlement is granted by server after Google Play API verification, not by a client success flag; nonempty account IDs are checked against verified user.
- FileProvider is nonexported with URI grants and named directories. Its XML permits apkg-share, note-media and pdf-pages; comment claiming only one directory is outdated.
- Notification/boot receivers are nonexported.
- APK updates use the Google Play update API.
- Release minification enabled and signing credentials supplied by CI secrets.
- log.ts suppresses its warning/error wrapper output outside development; this was not an exhaustive logcat audit.
- Earlier repaired shared Supabase access controls apply to Android too. Native release/internal/debug CI passed. Builds are compile/regression evidence, not device-security evidence.
- The inspected PdfViewerModal renders native PDF page images; it is not a PDF WebView. package.json includes react-native-webview, but all other rendering surfaces were not exhaustively audited.

## Not yet verified
Physical-device penetration testing, installed production APK merged manifest/signature inspection, TLS interception tests, all WebView surfaces and intent consumers, full dependency CVE/SDK inventory, device integrity, account/profile merge authorization, session revocation, actual Play/Razorpay purchases, refunds and account restore. No certificate-pinning absence is treated as a standalone proven vulnerability. Lockfile exists, but version ranges alone do not establish vulnerable dependencies.

## References
- React Native security / token storage: https://reactnative.dev/docs/security
- Android path traversal guidance: https://developer.android.com/privacy-and-security/risks/zip-path-traversal
- Prior shared backend audit: docs/security-audit-2026-09-30.md

## Safe repair order
1. Add regression coverage and atomically bind purchase-token ownership; preserve legitimate existing restores.
2. Make bundled bonus grants idempotent.
3. Migrate session storage with an existing-session fallback and verified migration.
4. Bound hostile archive input without dropping legitimate deck support.
5. Clear signed-out identity caches and fail closed for local release signing.
Then test an actual Android device and Play licence-test purchase/restore/refund before rescoring. Lovable is paused at the owner's request.
