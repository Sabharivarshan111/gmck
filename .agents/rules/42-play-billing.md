---
description: Google Play Billing — why Razorpay cannot stay, what is already built, and the rules a payment path has to keep (nothing granted, nothing priced, nothing acknowledged on the client)
---

# Play Billing, and the rules that keep a payment path honest

Play's Payments policy requires **Google Play Billing for digital content or
features consumed inside the app**. Ad-free and the two notes unlocks are both
exactly that. Razorpay is fine for physical goods and for services consumed
outside the app; it is not fine for either of the two things this app sells,
and the enforcement outcome is removal of the app.

**It is built and it is switched off.** `PLAY_BILLING_ENABLED = false` in
`mobile/src/lib/playBilling.ts`, and Razorpay is still what ships — because this
path has never taken a real payment. `check:billing` fails while that flag is
true, on purpose: flipping it is a deliberate act after a licence tester has
bought something on a phone, not a tidy-up.

`mobile/PLAY-BILLING-SETUP.md` is the owner's half — Play Console products, the
service account, Pub/Sub, licence testers. Not one of those steps is doable from
a sandbox, and none of the code below can take a rupee until they are done.

## Four rules, each a way to lose real money

1. **The client grants nothing.** `buy()` returns a purchase token and stops;
   the entitlement exists because `play-verify-purchase` wrote a row after
   asking the Play Developer API what that token really is. A client cannot
   verify a purchase, and treating a returned token as proof is the same
   mistake `razorpay-verify-payment` already refuses to make with an amount.
2. **The client prices nothing.** Every amount shown comes from Play's own
   `ProductDetails` — localised, tax-inclusive, and correct in a currency
   nobody here thought about. A hardcoded "₹50" is what `check:payments` exists
   to police on the Razorpay side; on this side it is simply forbidden.
3. **The client acknowledges nothing.** Play **auto-refunds an unacknowledged
   purchase after three days** and revokes the entitlement with it, so
   acknowledgement is a receipt for a grant that has actually happened.
   `BillingModule.kt` has no acknowledge call at all, and the order in
   `play-verify-purchase` is load-bearing: grant, *then* acknowledge. Reversed,
   a failed grant leaves a reader who has paid, cannot be auto-refunded, and has
   nothing.
4. **A PENDING purchase grants nothing.** India's deferred methods (UPI
   mandates, cash) settle later. Play reports them again through `restore()`.

## A subscription keeps ONE purchase token for its whole life

Every renewal reports the same token. That is why the row is **upserted** on
`play_purchase_token` (UNIQUE) rather than inserted — written once, then updated
with whatever expiry Play currently reports. It is also what makes the function
safe to call as often as the client likes, and `restore()` posts every token
Play knows about on every launch by design.

The unique index started life partial (`where … is not null`) and had to be
replaced: `ON CONFLICT` cannot infer a partial index without repeating its
WHERE, and PostgREST has nowhere to put one. Postgres already treats NULLs as
distinct, so the partial clause bought nothing and broke the upsert.

## The entitlement table does not change, and that is the point

Play rows go into `premium_subscriptions` beside Razorpay's, with `source`
saying which took the money. Every reader — `premium.ts` here, the web app's own
check, the admin dashboard — asks "is there an unexpired `adfree_monthly` row",
and none of them needed editing. A parallel table would have meant editing all
of them, and any one missed is somebody who paid and still sees ads.

## RTDN has to exist before the first real subscription does

A subscription renews, lapses, is refunded, is put on hold or is cancelled with
the app closed. `play-rtdn` receives those from Pub/Sub and re-asks Play about
the token — it never trusts the notification's contents, so a replayed one
cannot move an expiry anywhere Play would not also move it.

**CANCELED does not end the entitlement.** Cancelling stops the next charge; it
does not end the month already paid for. ON_HOLD, PAUSED and EXPIRED do.

Retrofitting RTDN later means reconciling rows that have already drifted, one at
a time, against Play.

## Why it is hand-written rather than a library

`react-native-iap` was archived on 26 April 2026 and points at `expo-iap`, an
Expo module — adopting it means adding the whole Expo module system to a bare-RN
Play app for one feature, the same trade already refused for
`@uginy/react-native-liquid-glass`. And under the New Architecture a module
registered the old way is *silently* absent, which for a payments module is a
Buy button that does nothing. So it is the same four pieces every native module
here has, and `npm run check:billing` asserts all four.

Billing Library is pinned at **8+** (9.1.0 today): Google made 8 mandatory for
new apps and updates from 31 August 2026, and `enableAutoServiceReconnection`
arrived there.

## Nothing here can be tested from a sandbox

No Play account, no card, no emulator with Play services. Billing answers
nothing for a build Play did not install — every APK this repo's CI produces —
so an empty catalogue and a hidden Buy button are the *correct* behaviour there,
and indistinguishable from total breakage. That is the sound module's failure
shape, which is why `check:billing` exists and why the preview shim exports
`null` rather than a fake purchase.
