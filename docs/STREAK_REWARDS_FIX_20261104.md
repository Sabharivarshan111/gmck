# Earned streak rewards — 4 November 2026

A 29-day streak displayed 0/11 Rewards because only XP milestones were counted in the numerator. Shared native/web ProgressScreen now uses a combined summary from the same XP and streak definitions as its tiles, with a separate streak subtotal and accessible unlocked states. Thresholds and user progress are unchanged: 29 days earns Spark, Blaze and Inferno (3/5 streak rewards), not all five.

Verified: native TypeScript, changed-file quiet lint, XP/streak regression checks; Android production JS bundle; actual React Native Web ProgressScreen at29/30/100 days shows3/4/5 of11 and matching unlocked tiles, including after reload. Screenshots inspected. New browser check: mobile/preview/rewards-check.mjs. Preview does not prove physical-device rendering. At1XP/29days expected3/11; at10XP/29days4/11;1000XP/100days11/11.

Explicit boolean authentication state also fixes TypeScript when development workflows disable Google sign-in. iOS source includes the same fix in draftPR175. Website selectivePR176 preserves main's separate authentication and payment logic. Signed Android package, website deployment and Xcode results must be read from their actual run receipts before claiming delivered.
