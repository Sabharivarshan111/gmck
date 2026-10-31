# ORBIT session and welcome repair — 31 October 2026

Web PR: https://github.com/Sabharivarshan111/gmck/pull/152 (merged).
Production source: 9c99e8560bb274b6e1fb6eb7d74090d03cc32905.
Deployment: dpl_epZPQ3pxNYrRKSUGm9q7WhxYNojW — READY.
Aliases confirmed by Vercel: orbitmbbs.vercel.app, orbitmbbs.site, www.orbitmbbs.site.
Live browser verification: https://orbitmbbs.site redirects to https://www.orbitmbbs.site/; both that page and https://orbitmbbs.vercel.app/ visibly show Welcome to Orbit and Continue with Google for fresh setup. Install suggestion and walkthrough do not cover setup.

## Changes
- One current browser auth record in localStorage for homepage and legacy simulator. IDB-only sessions migrate; a migration marker prevents stale IDB tokens returning after logout. IDB remains a durable fallback when localStorage is unavailable.
- Actual session state decides the first-run Google action; historical authenticated flags do not substitute for a browser session.
- Blank legacy display names cannot bypass setup. Valid saved profiles remain intact.
- Tour waits for profile hydration/setup. Skip exits immediately; replay guidance is inline. Cards scroll in short windows, remain at content height and center in wide windows.
- Install banner waits for profile setup and tour completion. Flashcard target matches the current Vault label. PWA cache version refreshed.

## Evidence
- Locally: real Supabase SDK token rotation and reopen test; stale-copy precedence, both-bundle refresh, IDB-only migration, logout and denied-store tests; profile validation, durable save and cloud recovery.
- Native and web TypeScript, changed native-file quiet lint, production build, tour, keyboard, edge-to-edge, sync, Android storage/sign-out/security and repository-intact guards pass.
- Chromium and WebKit setup/attendance workflow41159030012 passes on final PR head22dd5f2; earlier workflow41158639441 also passed.
- Installation-video workflow41159030118 and payment/entitlement workflow41159030187 pass.
- Hosted Vercel-shaped build passes. The existing main-branch anatomy dossier-format gate remains red, unrelated to this change; no clinical content was changed.
- Preview manually driven through welcome, university/year/name, Premium, free continuation, one-tap Skip and reload retaining Final Year/setup/dismissal.
- Google authorization endpoint returns302 to accounts.google.com for vercel.app, site and www.site origins. This confirms initiation, not a real Google consent/callback roundtrip.
- Both public domain welcome actions verified after production READY. Runtime error scan for the preceding hour was empty.

## Native and limitations
Native shared source: c25b78c0e7cd2a613b0a730ec7dc74f38e101746 on claude/native-app-sync. Its distinct browser/payment source line was preserved. Signed internal/release/debug workflows are running; no new installed APK, physical Safari/iPhone Google login, physical Android test or Play upload is claimed by this receipt.
The friend uses Safari. WebKit setup/reopen and storage-fallback checks pass; the friend's private account/session cannot be inspected from this environment.
A browser origin has its own initial login: vercel.app and www.orbitmbbs.site do not share localStorage. No tokens are transferred between origins.
Question bank remains13,719; collection queue815 remains unchanged. No user progress, payment permissions or profile data was reset.
