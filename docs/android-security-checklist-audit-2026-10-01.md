# Android security checklist audit — 2026-10-01

## Assessment and scope

**6/10, provisional, for Android plus the shared backend and repository it depends on.** The earlier 7/10 assessment covered a narrower repair pass and missed the account-merge and repository-token findings below. This revision reflects additional evidence, not a regression introduced by those repairs. The score is qualitative, not a weighted checklist calculation, certification, or promise that the app is safe against every attack.

Audited `Sabharivarshan111/gmck` main at **af2c8d501e28eed314bc6c55a865bddc5a08c274**. Product source is **b0557dee55ba197f7d371170b4d78dea3d2f586e**, which the release-550 tag points to. Examined the downloaded release-550 APK, native TypeScript/Kotlin/configuration, dependency lockfile, all 19 deployed Supabase function bundles, public RPC definitions, RLS policies, grants and storage configuration. Main was rechecked before publishing and remained at the audited commit.

This was an audit. No product source, deployment, purchase, real user record, app identity, version or Anki behavior was changed. Database demonstrations used synthetic accounts/data inside explicitly rolled-back transactions; follow-up queries found zero fixture profiles/notes. No real payment, paid AI generation or credential-use test was performed. Lovable remains paused.

## Every item in the supplied checklist

“Pass” means the inspected control worked within this scope; “Partial” includes outstanding verification or incomplete coverage. Item 21 is an instruction to request an audit rather than a technical control.

| # | Control | Result | Evidence / gap |
|---|---|---|---|
| 1 | Secure API keys | **Fail — repository** | Native config contains public anon/OAuth IDs, but a GitHub token is hardcoded in `list_releases.mjs`. Validity/permissions unknown. |
| 2 | Hide .env files | **Pass for privileged secrets inspected** | Tracked root `.env` contains only VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_URL. These are public client configuration. Ignore rules cover local env/signing files; tracked files are not removed by ignore rules. |
| 3 | Never hardcode secrets | **Fail** | Same GitHub token remains in current source/history. No privileged provider/service-role credential found in inspected native configuration or decoded APK strings. |
| 4 | Add authentication | **Pass for inspected private/admin paths** | Google ID token exchanged with Supabase; actual user tokens verified server-side. Intentional public AI/cache/leaderboard access is preserved. Auth provider/redirect/MFA settings are not exhaustively verified. |
| 5 | Verify permissions server-side | **Partial / confirmed failure** | Admin and Play checks work, but account-merge authorization and legacy Razorpay grant checks are weaker. |
| 6 | Do not trust frontend user IDs | **Fail** | Merge trusts mutable device ID; Razorpay order creation has a caller-supplied uid fallback. Play ownership repair remains in place. |
| 7 | Isolate user data | **Partial / confirmed bypass** | Direct RLS blocks another owner's rows. Privileged merge can transfer guest cloud data with a spoofed known device ID. Current native personal notes are local-only and were not shown remotely accessible. |
| 8 | Lock down database | **Partial** | All 26 inspected public ordinary tables have RLS; weekly_leaders view uses security_invoker. Privileged RPC and profile-column weaknesses remain. |
| 9 | Secure Supabase/storage | **Partial** | Textbooks bucket private; diagram writes admin/service-only; diagrams public intentionally. Bucket upload size/MIME restrictions absent. Leaked-password protection disabled. |
| 10 | Protect admin routes | **Pass for inspected controls** | Database roles, getUser and is_admin protect privileged functions; synthetic caller cannot self-grant admin or perform admin mutation. |
| 11 | Disable production debug | **Pass — APK checked** | Release merged manifest omits debuggable (Android default false); allowBackup=false and usesCleartextTraffic=false. |
| 12 | Hide detailed errors | **Partial** | Native logging wrapper suppresses production logging; several deployed functions still return exception/provider/database messages. |
| 13 | Validate inputs server-side | **Partial** | Schema/product validation present. Legacy payments trust selected plan; some JSON bodies lack explicit streamed byte limits, and profile reward fields are writable. |
| 14 | Sanitize user content | **Partial** | Native text rendering avoids general HTML execution; YouTube URLs use exact host/ID validation when created. Stored link objects are not fully revalidated, and three WebViews use wildcard originWhitelist without a navigation allowlist. No token-exfiltration/XSS exploit established. |
| 15 | Secure uploads/imported files | **Partial** | FileProvider nonexported with scoped directories/read grants; Anki destination path checks present. Attachment copies, PDF raster dimensions and Anki decompression lack comprehensive resource budgets. |
| 16 | Prevent SQL/NoSQL injection | **Pass for inspected query construction** | RPC SQL uses parameters/static statements; reviewed archive SQLite queries are static or use numeric IDs/bound inserts. No dynamic user-concatenated SQL found. This is not exhaustive fuzz testing. |
| 17 | Rate-limit login/signup | **Partial / configuration unverified** | Supabase Auth has platform rate limits, but connector does not expose the actual project Auth rate-limit/CAPTCHA configuration. AI server quotas are present; their proxy-IP trust and distributed-abuse resistance remain unverified. No login flood performed. |
| 18 | Check Git history for secrets | **Fail / broader scan incomplete** | GitHub token traced to commit 30ddb7ce9491e44ec9ebd16ad74ce3edd51b90a2. Current tracked-text scan completed. Broad historical pattern scan was not confirmed complete; historical provider-key revocation in the other mirror remains unverified. |
| 19 | Security headers/restrict CORS | **Partial / hardening** | Live Play OPTIONS permits * and lacked nosniff; REST returned nosniff and reflected tested Origin. CORS is a browser policy, not an Android identity/authorization boundary. No credentialed-cookie CORS exploit established. |
| 20 | Test as untrusted user | **Partial** | 60 existing regression cases and 12 live rejection/no-write cases pass. Eight rolled-back database checks expose three security failures; two legacy-payment mock demonstrations expose weaker grants. Physical-device/runtime/TLS tests remain unperformed. |
| 21 | Ask AI agent | **Performed** | This report records the requested audit and its limits. |

## Findings requiring attention

### A. High: guest account merge accepts spoofed device identity — demonstrated

Live `merge_into_current_user(_old_user_id)` is SECURITY DEFINER and executable by authenticated callers. It compares the two profiles' device_id values; the caller can update its own device_id through the profile policy. `claim_or_merge_profile` also accepts a device ID supplied by the client.

In a transaction with two synthetic guest users, ordinary RLS hid the victim's cloud note. After assigning the known fixture victim device ID to the actor's profile, the merge completed, transferred the synthetic note and removed the victim profile. Both changes were rolled back.

**Prerequisite:** the attacker needs the guest profile's device ID. Public UUID/leaderboard access alone was not shown sufficient. Native profile and presence IDs use different storage keys; an aggregate check found zero current presence/profile ID matches. Nevertheless a device label the caller controls must not serve as proof of ownership. A signed-in victim was not shown mergeable.

Affected data includes guest cloud progress/calendar/revision data and legacy cloud notes; current native personal notes remain local-only. No purchase-token ownership bypass was demonstrated by this test.

Repair direction: verify possession of the previous guest session through a server-controlled migration flow, or retain the same auth identity through supported account linking. Remove mutable device ID as the authorization credential. Preserve legitimate guest progress; do not bulk-delete users.

### B. High, validity conditional: GitHub token committed in current helper source/history

`list_releases.mjs:3` contains a GitHub personal access token used in an Authorization header. Traced to **30ddb7ce9491e44ec9ebd16ad74ce3edd51b90a2**, dated 2026-09-03. No token value appears in this report. It was not used to query GitHub, so current validity/scopes are unknown.

This is a repository/supply-chain exposure; the helper is not evidence that the token is embedded in the Android APK. Native bundle inspection found no GitHub/OpenAI/Google provider-key pattern. A raw sb_secret_ pattern hit was resolved by decoding Hermes strings: it is the Supabase SDK's literal prefix check, not a secret value. The decoded client JWT role is anon.

Owner action: revoke/rotate the exposed GitHub credential and check its activity. Remove hardcoded credentials and sanitize history with coordination; deleting the current line alone does not revoke copies. Main branch was reported unprotected; enable appropriate branch/ruleset protection for the build repository. Prior reports of a provider key in the other mirror do not establish that it is still live; revocation remains unverified.

### C. High, deployed legacy flow: Razorpay grants do not consistently bind plan, payment state and buyer

Inspected live functions: razorpay-create-order v35, razorpay-verify-payment v35, razorpay-restore-purchase v18.

- Order creation falls back to body.uid and merely checks that the account exists. Existence is not caller ownership.
- Verification validates a genuine HMAC for order/payment IDs, but takes plan from body.plan. With a verified session, it uses that session's user rather than always matching authoritative order ownership. It does not always fetch/validate paid amount, purpose, currency and captured status.
- Restore selects by checkout email/amount and accepts status authorized as well as captured, without proving the authoritative order's buyer and purpose.
- Bundled inserts are sequential rather than atomic; one row can save while another fails.

Two isolated mocks exercised the actual downloaded TypeScript with dummy credentials and fake provider/database responses. Verification accepted adfree_1y, recorded 30000 paise and granted 365 days without making an order/payment lookup. Restore accepted an authorized, not captured, mock payment and granted the bundle. These show the validation gaps; no real payment or token was exploited. A caller still needs a valid HMAC tuple for verification; this is not a demonstrated “buy without any payment proof” attack.

Current native Google Play verification v2 has separate ownership/atomic-save repairs. These Razorpay findings concern deployed shared legacy services and their entitlement records, not evidence that the repaired Play verifier is broken. Real production provider-key setup and active purchase UI paths were not comprehensively tested.

Repair direction: derive buyer, product, price, currency and capture state from verified provider records; enforce global payment ownership/idempotency and save bundled grants atomically.

### D. Medium: profile columns allow leaderboard/reward forgery — demonstrated

Owner RLS restricts which profile a caller can update, but does not restrict writable columns. A synthetic authenticated guest directly changed its own xp, streak and streak_freezes_available. The transaction was rolled back. Self-granting a user_roles admin row and non-admin privileged mutations were denied.

Repair direction: column-level grants/validated RPCs for profile presentation fields; server-controlled reward counters. This affects ranking/reward integrity; no paid cloud entitlement was forged.

### E. Medium availability: imported attachment/PDF resource bounds incomplete

`FilesModule.kt` copies selected/adopted streams with unbounded copyTo and no comprehensive byte-budget/failure cleanup. PDF rendering allocates page.width*2 by page.height*2 ARGB bitmaps without a pixel budget. The UI requests 60 pages; that caps count, not individual page size. A hostile/oversized document or content provider could consume storage, stall copying or exhaust memory. Source finding; no physical-device crash demonstration.

`ApkgModule.kt` also retains unbounded staging, readBytes/decompression and media copying. **Anki remains unchanged at the owner's request.** Safe resource bounds can preserve import/export, but must accommodate legitimate large decks and clean up partial files.

### F. Medium/low hardening: errors, logging, body limits and WebView navigation

Several legacy/AI/admin functions return raw exception/provider/database messages; AI functions log prompt prefixes, and Razorpay restore logs buyer email/payment IDs. No actual credential disclosure through those errors was demonstrated. Use controlled public messages and redact sensitive diagnostics.

Schemas validate many request fields after JSON parsing; explicit request byte limits remain incomplete. Diagram bucket upload file_size_limit/allowed_mime_types are null; writes are admin/service-only, so this is not an open anonymous-upload finding.

NoteLinkCard's three YouTube WebViews use originWhitelist=['*'], JavaScript and DOM storage, with no explicit navigation restriction. Created IDs are validated and no session-bearing bridge is present in the inspected component. Harden stored-link validation/navigation while preserving YouTube playback. No demonstrated WebView account takeover.

### G. Dependencies: advisories found, Android reachability differs

Using the committed mobile lockfile, full npm audit reported **11 affected package entries: 3 high and 8 moderate**. omit=dev reported **10: 2 high and 8 moderate**. These are package/effect counts, not 11 unique exploitable Android vulnerabilities.

- decode-uri-component 0.2.2 via query-string/@react-navigation/core has a malformed-input CPU denial-of-service advisory. Native navigation includes it; externally supplied path reachability is not proven because this NavigationContainer has no linking configuration.
- image-size 1.2.1 and Joi findings are primarily in Metro/CLI tooling, despite appearing in omit=dev through React Native dependency graphs.
- Jimp/file-type/phin/qs paths originate in node-vibrant, used by react-native-image-colors' web implementation. Android uses the native module; do not describe these as demonstrated phone exploits.
- Full audit adds a high brace-expansion finding in the tooling dependency tree.

Review compatible upgrades and lockfile changes with native/browser builds; no npm audit fix --force was run. Maven/AAR/native .so CVE inventory and SDK runtime behavior remain unverified.

## Release APK evidence

Downloaded [release-550 APK](https://github.com/Sabharivarshan111/gmck/releases/download/release-550/app-release.apk). Its SHA-256 matches the release asset's GitHub digest:
`9720e8c9446b52dbd7e2aff5eabeab53adcff4a0693430685c616f8d2f861dbc`.

- Package com.aistudio.mbbsqbank.aycxvd; versionCode 24.
- Merged allowBackup=false; usesCleartextTraffic=false; debuggable absent/default false.
- APK v2 signing block parsed; certificate SHA-1 CEEA8A41BB0778C47826D88FCCE02CC9EB294068 matches the documented upload key. This was certificate/signing-block inspection, not independent apksigner cryptographic verification and not the Play-installed signing certificate.
- MainActivity intentionally exported for launcher/file intents. Other exported SDK services/receivers observed require REVOCATION_NOTIFICATION, BIND_JOB_SERVICE or DUMP permissions.
- FileProvider/own notification receivers are nonexported; no broad external-storage permission in inspected merged manifest. SDK ad-services/foreground/network permissions are present.
- Hermes bundle inspected; decoded anon JWT and public SDK prefixes are not privileged credentials.

## Verification and limits

Completed: 60 existing regression cases (12 edge guards, 8 notes isolation, 7 flashcard security, 6 presence, 5 nickname, 9 Play purchase, 13 Android storage/signout); 12 live rejection/no-write cases; TypeScript; note-link, admin and version checks. Eight synthetic rolled-back database checks produced five protective passes and three failures: spoofed merge allowed, victim profile removed, own reward counters writable. Two mocked legacy payment demonstrations confirmed validation weaknesses.

Live metadata: 26 public ordinary tables have RLS; one inspected public view has security_invoker; purchase-save/quota RPC execution denied to ordinary roles. Advisors still report disabled leaked-password protection and intentional/conditional definer/anonymous policies. RLS-with-no-policy on server-only tables is default-deny, not proof of public exposure.

Current tracked-text pattern scan covered 1,932 text files (up to 5 MB per file), plus native bundle strings and targeted token history. Broad Git historical scanning was not confirmed complete before the temporary workspace was reclaimed; it cannot support an “all history clean” claim. No secret validity probe was made.

Not performed: physical-device penetration testing, real login migration/signout on hardware, TLS interception/session-revocation tests, real Play/Razorpay purchase/restore/refund, full dependency native-library inventory or exhaustive hostile-file/WebView fuzzing. Actual Auth rate-limit/CAPTCHA configuration unavailable through this connector. No Play upload, new build, Lovable publish or product fix was made during this audit.

## Prioritized repair order

1. Revoke the exposed repository credential and review its activity; replace hardcoded token usage.
2. Replace guest merge authorization with proof of the old session while preserving existing progress.
3. Harden deployed legacy payment binding/state/amount checks and atomic/idempotent grants.
4. Protect server-owned profile reward columns.
5. Add attachment/PDF byte/pixel budgets and controlled cleanup; keep Anki changes excluded until scope is explicitly changed.
6. Review compatible dependency upgrades; control errors/logging/body sizes and YouTube navigation.
7. Verify owner Auth settings and real-device/purchase behavior before increasing the score.

## References

- [Supabase product security](https://supabase.com/docs/guides/security/product-security)
- [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits) — platform behavior is not evidence of this project's chosen settings.
- [Leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [Database security-definer advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_anon_security_definer_function_executable) — assess function authorization, not the definer flag alone.
- [decode-uri-component advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr)
- [image-size advisory](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)
- [Joi advisory](https://github.com/advisories/GHSA-6h2x-m376-mqjq)
- Earlier narrower audit: [android-security-audit-2026-09-30.md](android-security-audit-2026-09-30.md)
