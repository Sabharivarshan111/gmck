# ORBIT website checkout and automatic ad-free sync — 23 October 2026

The canonical website is https://orbitmbbs.site (also served by orbitmbbs.vercel.app). `/unlock` now renders a dedicated production React checkout, without study-app overlays. Website plan links stay on their current origin; native Android retains the owner's existing Lovable checkout link.

Google sign-in uses the established same-origin root callback. The browser remembers a return to `/unlock`; no identity, email, token or grant is trusted from the checkout URL. Prices are ₹150/180 days and ₹300/365 days, paid once with no auto-renewal. The offer ends 30 November 2026 at 23:59:59 IST. New monthly and notes purchases are rejected by the order endpoint; historic paid purchases remain verifiable/restorable. Notes are not sold on the new checkout.

## Live backend repaired

Live Edge Functions had drifted to old implementations accepting link-supplied user IDs, client-selected plan verification, and email-only recovery of even authorized payments. Deployed the reviewed repository security model:

- `razorpay-create-order` v39: authenticated non-anonymous account, fixed server price, only current launch plans, expiry enforced server-side.
- `razorpay-verify-payment` v38: HMAC verification, signed-in buyer, Razorpay API checks of paid order/captured payment, matching amount/currency/order/purpose/owner, no refunds.
- `razorpay-restore-purchase` v21: same full provider verification; optional exact order ID with owner check for interrupted checkout, plus bounded older-payment lookup.
- Atomic `save_verified_razorpay_purchase` RPC already exists and remains service-role-only. It records proof once and writes the `adfree_monthly` entitlement with purchased duration; this common entitlement is what Android and browser `syncPremiumCache` read. Existing legacy note bonuses are preserved.

Normal flow: open checkout → same Google account → server creates order → Razorpay payment → verified callback writes access → browser refreshes its cache → reopening/foregrounding Android refreshes the same user's cache. The website saves pending order/receipt metadata scoped to the buyer for automatic reconciliation on returning to checkout and manual Restore. No webhook configuration was verified or changed, so server grant after a closed-before-callback payment depends on returning to checkout/Restore; do not claim unconditional background fulfillment.

## Evidence

- 27 transport/provider/auth cases pass, including captured-only payment, wrong owner, wrong currency/amount, refund rejection, server-selected plan, retirement of old sales and fixed launch prices.
- Synthetic **rollback-only** live database test: 180-day entitlement, exactly two legacy bundle rows, replay does not extend expiry, another user cannot take the payment, underpaying a yearly plan fails. No test users or grants persist.
- Native production entitlement reader with fixture API: payment, reopen/hydrate, account switch, expiry and sign-out pass.
- Actual assembled production browser at 360/390/412px: guest cannot pay, signed-in create→verify→access, persisted access after reload, verification failure→Restore, and interrupted checkout→exact-order recovery pass. No horizontal overflow or page runtime errors. Auth/provider responses were fixtures, not a real Google session or charge.
- Live endpoints from orbitmbbs.site Origin: OPTIONS204 with correct CORS; fake UID create401; unsigned restore401; fake HMAC verify400.
- Web TypeScript, targeted ESLint, production combined build and diff checks pass. Final Git/Vercel deployment receipt belongs in PR/runtime report.

## Remaining live acceptance

A real person still needs to sign in using the same Google account on website and Android, complete a real ₹150/₹300 Razorpay payment, and confirm that captured transaction saves an entitlement and stops ads after reopening Android. No money was charged in this session; no credential or payment instrument was collected. Razorpay domain approval, live checkout mode and Google consent cannot be conclusively proved by fixture tests.

Website follow-up (24 October): Premium membership now gates every Vault feature except free Notes. Browser-specific adapters protect PG Practice, Simulator & Anatomy, Case proformas, Anki and the other tool links inside Notes; direct /simulator navigation checks the same authenticated server entitlement. Website UI has no ad SDK, sponsored-ad prompt or ad-removal sales copy. Existing unexpired paid access is honored. These are application access checks, not DRM for already-public/static downloadable assets. Android still uses its existing ad-free cache; this website adapter does not add native Vault paywalls. Native LINK_OUT is the existing owner decision; this website checkout is not a claim of Play alternative-billing enrollment.


## 24 October website lock rollout

The user explicitly requested website feature locks, no ads, and free Vault Notes. Added browser membership context, server-row reader and direct simulator guard. Checkout sells Premium features; internal historic adfree_monthly rows remain the shared account entitlement so existing users need no migration. Native Android renderer is unchanged: it imports Simulator directly rather than the website App route. Verification/deployment receipts will be appended after final checks.

24 October final local checks: website/native TypeScript, targeted ESLint, combined production build, 27 transport/provider cases and seven real-browser scenarios pass. Scenarios include all four locked Vault cards, free Notes, locked direct simulator URL and paid direct simulator rendering. Paid content browser harnesses now use a test-only authenticated subscription provider fixture; no runtime entitlement bypass was added. Website access is refreshed from Supabase and fails closed when it cannot establish membership; static assets are not DRM-protected. No actual Google login, live payment or physical Android test was performed.
