# ORBIT security audit and repairs — 2026-09-30

## Status
Provisional security score: **6/10** (initial read-only assessment: 2/10).
This is an engineering assessment of inspected code, database policies and tested request paths, not a complete penetration test or a guarantee.

Repository: Sabharivarshan111/gmck. Supabase: pmtgeydtqypwrypshhsx.
Lovable: 89df4dbc-89e6-4e44-a7b1-76b9de94066e.

## Repairs deployed
- Retired ingest-textbook-sign and migrate-textbooks return 410 without privileged mutations.
- Removed public diagram upload/update and public textbook object-read policies.
- Presence writes now require auth.uid() ownership. Both client hooks silently establish/reuse anonymous sessions and scope device IDs by user, avoiding old null-owner row conflicts.
- Three diagram administration functions verify a user token and require is_admin() before privileged work.
- Paid AI requests use durable service-only PostgreSQL quotas. Public visitor access remains intentional: a public client key uses a guest/IP budget; actual user tokens are verified.
- Submitted, edited and newly generated notes from users are stored in service-only personal_handwritten_notes by verified uid. Existing shared notes remain readable; visitor submissions return saved:false and do not modify shared cache.
- Flashcard writes use a SHA-256 fingerprint of prompt inputs, retaining the stable deckKey returned to clients and legacy cache reads. Supplying another chapter key with different content cannot overwrite that chapter's shared row.
- Book-deletion RPC now has a fixed search_path. Notification administration RPCs are no longer callable by anon.
- http 1.6 was recreated in server_http, without CASCADE, after finding no application/cron dependencies. anon/authenticated have no schema usage; the public HTTP RPCs are gone. The preceding attempt to revoke extension function grants was ineffective because those grants were owned by supabase_admin; the schema isolation is the verified effective fix.
- Git ignores local env/signing files. The inspected tracked .env contains only public Supabase configuration. PEM-marker scan hits in Google Play helpers are parsing expressions, not embedded private keys. Git history and all external secret stores were not exhaustively scanned.
- Edge authorization modes are explicit in supabase/config.toml, including custom-auth payment/MCP endpoints.

## Verification
- 27 handler regression cases passed locally and in GitHub Actions. They mock authentication, storage and providers; they are not end-to-end paid model tests.
- 10 live HTTP validation/no-write cases passed on a GitHub runner, including admin rejection, retired endpoints and guest notes no-write. No paid content was requested.
- Actual database transaction tests: own presence insert allowed with correct owner default; another uid's update/delete affected zero rows. Quota test returned [true,true,false]. Test transactions were rolled back.
- The live guest-save fixture was absent from handwritten_notes afterward.
- Personal cache and quota tables: RLS enabled; anon/authenticated cannot read them; service_role can write.
- HTTP schema usage: anon=false, authenticated=false, service_role=true; public.http_get is absent.
- All 10 protected/retired live function sources were read back and compared exactly after restoring an automatic redeploy regression.
- Both web CI builds passed. Android CI typecheck and lint passed. A local production Android JS bundle passed; no physical-device behavior was tested.
- The Android release gate initially failed because production notes/flashcard textbook helpers had diverged. A single shared source now retains both original retrieval implementations; 69 comparisons against captured production implementations passed. The existing textbook gate passes. A rerun is required before claiming an APK release.

Initial passing CI:
https://github.com/Sabharivarshan111/gmck/actions/runs/36657962660
https://github.com/Sabharivarshan111/gmck/actions/runs/36657962686

## Lovable deployment risk and owner actions
Lovable successfully updated presence/env handling and synchronized notes/quiz source, then exhausted workspace credits. Its edits automatically redeployed other older functions: the live readback detected loss of quotas/admin checks, and those functions were immediately restored through the Supabase connector. Do not publish or edit Lovable until ALL remaining protected function sources and authorization settings have been synchronized from gmck/current Supabase. Its stale source can undo the protections again.
Add workspace credits: https://lovable.dev/settings/billing
Remaining Lovable sync includes ask-ai, ask-gemini, generate-flashcards, all three diagram admin endpoints and both retired endpoints, plus the latest shared textbook helper.

A prior handoff records an exposed OpenAI key in another repository's history; revocation is still unverified. The owner must revoke that historical key in its provider account. Removing a file/history does not establish revocation.
Leaked-password protection remains disabled; the available connector has no Auth configuration write operation.
https://supabase.com/dashboard/project/pmtgeydtqypwrypshhsx/auth/providers
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Remaining audit limits
- IP headers have not been proven unspoofable at the gateway. IP/guest quotas are a budget control, not bot protection; multiple accounts/IPs can bypass individual budgets. Anonymous signup CAPTCHA/device integrity and an overall provider spend ceiling need separate configuration/verification.
- nickname-suggest still has a public paid-provider path. Its abuse controls require a further pass.
- Profile account merging, purchase lifecycle, token revocation, Android device storage/network hardening and dependency advisories require deeper verification. No real purchase was performed.
- User-edited notes are tied to uid; restoring/linking accounts needs explicit review of personal cache migration. Old shared notes are unchanged.
- Some public/SECURITY DEFINER advisor notices are intentional (open leaderboard, anonymous own-data access and guarded RPCs). These are not individually proven exploits. Do not blanket revoke them.
- Public question_diagrams includes pending material. Removing it needs a content-publication decision to avoid hiding existing diagrams.
- An existing note-key check fails on the newer university-aware key builder; this repair did not change those keys.

## Preservation
No question-bank files, user profiles, study progress, purchase records or textbook objects were deleted. Android applicationId, version/signing configuration and ads mode were not changed. Old installed APKs need an update to receive the presence hook fix.
