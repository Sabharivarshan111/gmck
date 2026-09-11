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

## Ad-free is bought on the website, and the app is consumption-only

`mobile/src/lib/unlock.ts` and `mobile/src/components/UnlockCard.tsx`. No payment happens in this
app, no card is collected, no price is shown, and **there is no button that
leaves for a checkout page**. The card names the site in words.

That last clause is the whole rule, and it was researched rather than guessed
because the owner's friend pointed out that Netflix has a link. They had seen
an iPhone. Apple gave reader apps an entitlement in 2022 for exactly one
external account link and Netflix uses it; that is a different store.

**On Android Netflix is a consumption-only app** — sign in, watch what you
already pay for, no purchase and no checkout link anywhere in it. Google's own
wording is that *any* app may be consumption-only: "any products or services,
whether digital or physical, cannot be purchased from within the app." So the
route is open to a question bank exactly as much as to a video service, and it
is the route Netflix is actually on.

Leading a user out to pay is a **separate programme**, and
`developer.android.com/google/play/billing/externalpaymentlinks` sets four
conditions this app fails all of:

1. **"The external payments program lets you lead users in Japan"** — one
   country, and not this app's.
2. Enrolment: "complete the enrollment steps outlined in the program
   requirements". This account is not enrolled.
3. "Integrate Play Billing Library 8.3 or higher." `PLAY_BILLING_ENABLED` is
   false and no Play Console product exists.
4. **"When linking users to purchases, they must be given a side by side
   choice of making the purchase with Google Play Billing or completing the
   purchase on the developer's website."** A lone "open the unlock page" button
   is not the sanctioned shape even where the programme applies.

The integration guide adds that an app is expected to ask at runtime —
`isBillingProgramAvailableAsync(BillingProgram.EXTERNAL_PAYMENTS, …)` — and that
`BILLING_UNAVAILABLE` means the user is in the wrong country or the account is
not enrolled. A hardcoded `openURL` is the thing that check exists to prevent.

**An earlier version of this section said the programme was live in the US, UK
and Europe and reached India on 30 September 2027.** Both were wrong. They came
from articles about the Epic settlement's *service fee* rollout, which is a
different schedule from the programme's availability, and were written down
without being checked against the source. The conclusion survived; the reasoning
did not, and a wrong reason recorded as fact is worse than none.

Not verifiable from a sandbox: `support.google.com` is blocked by the egress
proxy, so Google's consumption-only wording has only ever been read here in a
search summary. The four points above were read on the page.

`LINK_OUT` in `mobile/src/lib/unlock.ts` is the switch, and it is `false`. Flip it the week
India is covered. `check:payments` asserts the constant still exists, that no
screen calls `Linking.openURL` for this, and that no file in the purchase path
quotes a currency amount — that last one caught a Razorpay leftover in a
`HomeMenuSheet` accessibility label, which TalkBack had been reading out as a
price for weeks after every visible price was deleted.
