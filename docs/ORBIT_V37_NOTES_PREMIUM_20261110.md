# ORBIT v37: handwritten notes trial and auscultation Premium

Prepared against gmck main 90b70e9cdfb1980fe8a16b599389d3fa482e5810 on 10 November 2026. Release must come from main, as explicitly requested by the owner.

- Two lifetime successful handwritten AI note generations per signed-in free account. Shared-cache first access also uses one trial; personal saved notes remain readable. A topic's sequential batches count once. Regenerations and AI edits are separate generations. Failed or empty model output releases an unused reservation. Retries reuse bound results; a generation ID cannot authorize different questions.
- Server-only reservation/completion RPCs serialize account access across devices. Table RLS is enabled and no anon/authenticated mutation or execution grants exist. Admin roles and active adfree_monthly subscriptions bypass the trial, preserving influencer grants. Existing daily/minute provider limits remain.
- Android Vault now shows Free preview/Pro/2 free AI generations total. Common labels survive the production web adapter. Pro heart/lung sound selection requests Premium; normal heart and vesicular breath sounds remain free.
- Native and Vercel checkout explain notes Premium and preserve prices/payment verification. VersionCode and versionName are 37 / 0.0.0.37. Application ID and signing/ads/billing flags are unchanged.

The generator was prepared from LIVE v77, including the exact deployed textbook.ts; do not deploy a stale repository generator. Source model remains gemini-3.1-flash-lite.

Validation so far: actual Edge-handler fixture tests pass for the two-note limit, third denial, cross-request binding, retry reuse, multiple batches, paid/admin access, saved/shared cache, guests, failed/empty output refund, edits and the real web Vault adapter. This is isolated handler testing, not live Gemini/payment/device proof. Full native/web types/build and signed-emulator smoke must pass the release workflow before release.

BLOCKER: Supabase apply_migration confirmation expired twice. No table/RPC was created, and no Edge Function was deployed. `supabase/notes-trial-access.sql` contains the exact proposed additive schema and server-only functions. Obtain connector confirmation and apply it; run rollback-only database regressions, deploy the reconciled generator with verify_jwt=true, then advance main and watch the signed release plus Vercel deployment. No main ref update, v37 release, or live third-note denial is claimed by this preparation receipt.

Lovable payment project 89df4dbc-89e6-4e44-a7b1-76b9de94066e has prepared equivalent marketing at commit 9d440c373df05ca9bc52ad697835249fa2aa4c52 (122 reported tests, type/build/mobile layout checks). Publish it after the shared quota is live; do not touch its independent current prices.
