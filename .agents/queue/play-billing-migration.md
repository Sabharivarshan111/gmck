---
description: Moving ad-free and the notes unlock from Razorpay to Google Play Billing — what is now built, what is still blocked on the owner, and the numbers as researched on 2026-09-06
status: BUILT AND SWITCHED OFF. Blocked on Play Console setup, which only the app owner can do.
written: 2026-09-05
revised: 2026-09-06
---

# Play Billing, and why Razorpay cannot stay

**This file was a proposal. It is now a status page.** The code exists, is
committed, and is behind `PLAY_BILLING_ENABLED = false`. The owner's half is
`mobile/PLAY-BILLING-SETUP.md` — eight steps, none of them doable from a
sandbox.

## Built, 2026-09-06

| Piece | Where |
|---|---|
| `OrbitBilling` TurboModule (spec, Kotlin, package, registration) | `mobile/src/native/NativeOrbitBilling.ts`, `.../BillingModule.kt`, `.../BillingPackage.kt`, `MainApplication.kt` |
| Billing Library 9.1.0 | `mobile/android/app/build.gradle` |
| JS client, flag off | `mobile/src/lib/playBilling.ts` |
| Preview shim, absent not fake | `mobile/preview/shims/orbit-billing.ts` |
| Verification function | `supabase/functions/play-verify-purchase/` — **deployed** |
| RTDN receiver | `supabase/functions/play-rtdn/` — **deployed**, `verify_jwt: false` |
| `source`, `play_*`, `auto_renewing` columns + unique token index | **applied to production** |
| `npm run check:billing` | green; verified by breaking it five ways |

## Still blocked, and on whom

**The app owner.** An agent cannot create a Play Console product, a Google Cloud
service account, a Pub/Sub topic or a payment. Steps 1–8 of
`mobile/PLAY-BILLING-SETUP.md`, in order. Until step 3,
`play-verify-purchase` returns 500 with "PLAY_SERVICE_ACCOUNT_JSON is not set on
this project" and grants nothing — which is the correct failure.

## Corrections to what this file used to say

Three of the "verify this" items at the bottom of the original have been
answered, and one of them changed the plan:

* **`react-native-iap` is archived** (26 April 2026), superseded by `expo-iap`,
  which is an Expo module — its JS calls `requireNativeModule` from `expo` and
  its Gradle applies `ExpoModulesCorePlugin.gradle`. This file previously called
  react-native-iap "the practical choice"; it is not a choice at all now, and
  the alternative it named — a hand-written TurboModule — is what was built.
* **The fee is 15%, and that part was right.** Subscriptions are 15% from day
  one; one-off products are 15% on the first $1M. On ₹50 that is ₹7.50 against
  Razorpay's ~₹1.20, so compliance costs about ₹6.30 a sale. The Epic-settlement
  change (10% service + 5% billing, ≈15% effective) rolls out by 30 June 2026 in
  the US, UK and EEA; India was not named.
* **Acknowledgement is still three days**, and it is still an automatic refund.

## Testing, which still cannot happen in a sandbox

Licence testers, the internal testing track, a real device. Test purchases are
free and subscriptions renew on an accelerated clock, which is the only
practical way to watch an RTDN arrive. Same bucket as `razorpay-untested`.

## The order that is left

1–7 are `PLAY-BILLING-SETUP.md`. Then:

8. Flip `PLAY_BILLING_ENABLED`, cut a build, buy each of the five things once.
9. Watch one accelerated renewal move `expires_at` **without the app open**.
10. Cancel one and confirm it stays ad-free until its expiry, then stops.
11. Promote to production. **Leave Razorpay in place for one full release** so no
    existing entitlement is orphaned, then remove it.

## Not doing yet: India's alternative billing

Permitted alongside Play's, with the service fee reduced by 4 points. It is the
one legitimate way Razorpay could stay in the picture, and it is strictly more
work than Play Billing *on top of* Play Billing: console onboarding and
approval, an external transaction token per transaction, a developer-generated
external transaction ID, and reporting every transaction back to Google. Four
points on ₹50 is ₹2, out of which Razorpay's own fee, the refunds, the
chargebacks and the tax invoicing are then yours. Revisit only if volume ever
justifies it.
