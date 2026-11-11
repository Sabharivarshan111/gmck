# ORBIT account deletion requests

Created 11 November 2026. Public page source `10bb812e183ec3aaec199a775058a1a4150eb8d7`; native navigation helper fix on main `ec5eac7c59113df12553524aa981783d2561cf32`.

## Public entry

https://www.orbitmbbs.site/delete-account

Public static page, no sign-in, app installation, third-party script or automatic deletion. Both /delete-account and /delete-account/ rewrite to the dedicated HTML before the legacy SPA fallback.

The request CTA is a mailto draft addressed to Sabharivarshan111@gmail.com, the support email in the public Play Store listing for com.aistudio.mbbsqbank.aycxvd. Subject: ORBIT MBBS account deletion request. The visible fallback address works independently of whether a mail app is configured. The page says explicitly that the user must SEND the email.

## User flow

- Send from the Google address used for ORBIT and identify the account.
- Support verifies ownership; never request passwords, OTPs or payment-card data.
- Support confirms expected completion time and completion. Any legitimate records retained must be identified with reason and applicable period.
- The public page covers account-linked personal data and cloud study records; device-only copies are cleared by the device owner. Google-account deletion is outside this request.

## Operational responsibility

This is a manual support channel, not an automated account eraser. The owner must monitor the listed inbox, verify each requester, fulfill deletion across the relevant account-associated records and authentication account, and confirm the outcome. Do not assume deleting an Auth row automatically removes all data: verify actual cascade rules and remaining personal rows. Do not delete any account without a verified request.

The page makes no automatic 90-day deletion claim. No real request, user email or account deletion was performed during QA.

## App and website links

Home menu → Delete account calls the dedicated lib/accountDeletion.ts helper, which opens the HTTPS page with Linking.openURL and an error fallback showing the URL. This keeps deletion navigation separate from the purchase-link guard. Shared component serves Android and the native web shell. Existing privacy page links to the request page. The current Android source is still version37, preserving the owner's pin; the installed app needs the new build before that menu item appears.

## Verification receipt

- Vercel dpl_DahZDWfVHRhXnPP4EC4cESeWJ2G5 READY, production main helper-fix source ec5eac7c59113df12553524aa981783d2561cf32. Original public page deployment dpl_GhesGnZpwrqPgPLekaKe1vq6VWPR was also verified live.
- Static validation: email address and decoded subject/body, no form/backend auto-submit, rewrite priority, app link target.
- Live Chrome: anonymous page renders full instructions, CTA href correctly addressed, visible email fallback, privacy-page link navigates back to request page; final URL verified https://www.orbitmbbs.site/delete-account. Page screenshot visually checked. No email sent.
- The app home is behind its normal first-run sign-in overlay; no Google sign-in bypassed or real account created. Native source checks and build receipts are recorded when complete.
- Vercel-style build run42974195680 passed. Separate legacy dossier job still has the prior digestive atlas coverage failure; unrelated to this page.
- Android attempt42974195657 (1052) passed native types/lint then hit the menu direct-Linking payment guard; no check weakened. Fixed by centralizing deletion navigation in its own helper.
- Signed release run42975227388 (1053), job130372644985 completed SUCCESS: native types/lint, all release feature/content/payment guards, notes handler fixtures, website types, signed packaging and embedded-bank integrity passed. Exact signed APK stayed open on Android API35 (PID3138), startup screenshot/error-log evidence retained.
- Published 2026-11-11T07:10:39Z: https://github.com/Sabharivarshan111/gmck/releases/tag/release-1053, non-draft/non-prerelease from main source ec5eac7c59113df12553524aa981783d2561cf32; versionCode37/versionName0.0.0.37. This is a GitHub signed release, not a claimed Google Play submission.
- app-release.aab: 116480663 bytes; sha256:a182370cbe1f75c10fd483367c09148bfb100fb3afae070468450cfc5249fb16; https://github.com/Sabharivarshan111/gmck/releases/download/release-1053/app-release.aab
- app-release.apk: 147535295 bytes; sha256:f14be91edef2b4edd27d477102502eac56a3ab523ebf34df945a8a81318b0135; https://github.com/Sabharivarshan111/gmck/releases/download/release-1053/app-release.apk

## Play Console

Account method OAuth. Delete account URL above. Optional data deletion WITHOUT account deletion remains No unless a separate working method is actually offered. Submit the Data safety form in Play Console; publishing this page does not submit that form.
