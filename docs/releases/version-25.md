# Version 25 — prepared, not published

Release name: `25 (0.0.0.25)`

```text
<en-US>
New
• Choose TNMGR or KUHS and browse questions offline with recorded exam repeat counts.

Fixed
• Repeated headings and duplicate text in saved and newly generated notes.
• Large imported Anki decks open and respond faster while preserving study progress.
</en-US>
```

Native and preview TypeScript, mobile lint (0 errors), regression with 50,000 cards, Anki scheduler, APKG round trip, notes schema, version consistency, security and KUHS TXT/repeat checks pass. Android production JavaScript bundle and assets built locally. Preview AF regression headings appear once and retain distinct descriptions.

Latest main security changes through af2c8d50 are included. Supabase app_releases row25 saved and verified. No signed APK/AAB or Play upload exists for these changes. Prior automatic approval review rejected GitHub push as unverified external egress; publishing was not retried or routed around that rejection.

Latest main security audit ea1dc5ca is preserved. Live notes v69 retains security transport guards and adds essay supplementation. A fresh AF generation passed with16 sections/1427 words; separate clinical review sample has17 sections. Full84-question cardiology regeneration remains unverified. Browser previews do not establish installed-device behavior.

Continuation verification: recovered patch38 tree equals saved114a19b2; merged newer local security repairs, including guest proof and payment binding. All55 combined local checks pass after repairing auth/depth CI harnesses. Native production JS bundle copies432 assets; offline browser previews pass.20 live functions/46 files agree with local sources ignoring whitespace, with notes69 exact. Signed v25 build remains blocked by prior egress review; no write/build dispatch or Play upload occurred.
