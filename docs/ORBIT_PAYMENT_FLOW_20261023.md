# ORBIT website checkout and automatic ad-free sync — 23 October 2026

The canonical website is https://orbitmbbs.site (also served by orbitmbbs.vercel.app). `/unlock` now renders a dedicated production React checkout, without study-app overlays. Website plan links stay on their current origin; native Android retains the owner's existing Lovable checkout link.

Google sign-in uses the established same-origin root callback. The browser remembers a return to `/unlock`; no identity, email, token or grant is trusted from the checkout URL. Prices are ₹150/180 days and ₹300/365 days, paid once with no auto-renewal. The offer ends 30 November 2026 at 23:59:59 IST. New monthly and notes purchases are rejected by the order endpoint; historic paid purchases remain verifiable/restorable. Notes are not sold on the new checkout.

## Live backend repaired

Live Edge Functions had drifted to old implementations accepting link-supplied user IDs, client-selected plan verification, and email-only recovery of even authorized payments. Deployed the reviewed repository security model:

- `razorpay-create-order` v38: authenticated non-anonymous account, fixed server price, only current launch plans, expiry enforced server-side.
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

This change provides **ad-free access**. Vault tools are still not controlled by a paid-bundle entitlement, and the new checkout does not advertise otherwise. The broader paid Vault rollout is separate work. Native LINK_OUT is the existing owner decision; this website checkout is not a claim of Play alternative-billing enrollment.
