---
description: Moving ad-free and the notes unlock from Razorpay to Google Play Billing — why it is not optional, what it actually costs to build, and the order to do it in
status: proposal, nothing implemented
written: 2026-09-05
---

# Play Billing, and why Razorpay cannot stay

**Read the "verify this" list at the bottom before acting on any number here.**
Play's policy pages and fee tables change, and some of what follows is from
training rather than from today's console.

## The position, stated plainly

Google Play's Payments policy requires **Google Play Billing for digital
content or features consumed inside the app**. Removing ads and unlocking notes
are both exactly that. Razorpay is fine for physical goods and for services
consumed outside the app; it is not fine for either of the two things this app
sells.

This is not a grey area that gets negotiated. The enforcement outcome is
removal of the app, and for a one-app developer account that is the end of the
listing, the reviews and the install base. The amounts involved — ₹50 to ₹300 —
are not worth that risk in either direction.

Two things soften it:

* **User-choice billing.** Google runs a programme (India was one of the first
  countries in it) where an alternative payment method may be offered
  *alongside* Play Billing, with a few percentage points off the service fee
  when the user picks the alternative. It is not "keep Razorpay instead"; it is
  "offer both, Play first". Worth applying for only after Play Billing works.
* **The fee is 15%, not 30%.** The 30% headline applies above roughly $1M of
  annual developer earnings, and subscriptions are 15% from the first day. On
  ₹50 that is about ₹7.50.

## What it takes to build — honestly, not easy

The client is the small half. The server is the work.

### 1. Decide product shapes first, because they are hard to change

| What is sold now | Play shape | Why |
|---|---|---|
| Ad-free, 1 month / 6 months / 1 year | **Subscription**, one product with three base plans | Auto-renewing is what a reader expects for this, and Play manages the renewal, the reminder and the cancellation. Three separate one-off products is the alternative and it means the reader has to remember to buy again. |
| FM+SPM notes, Pharmacology notes | **In-app product**, non-consumable | Bought once, kept forever. This is the easy one. |

The existing bundle rules (a notes purchase carries a free ad-free month; an
ad-free purchase carries the notes) do **not** map onto anything Play offers.
They have to stay server-side, granted by the verification function — which is
where they already are.

### 2. The client

`react-native-iap` is the practical choice for a bare React Native app; the
alternative is wrapping Google's Play Billing Library in a TurboModule, which
is more control and considerably more code. Either way the flow is:

1. Query products, so the price shown is Play's own localised price rather
   than a string in `razorpay.ts`. (This is a real improvement: the app
   currently hardcodes "₹50" for display.)
2. Launch the billing flow.
3. Get a **purchase token** back.
4. Send that token to our server. **Never** grant anything on the client's say
   so — the client cannot verify a purchase, and treating a returned token as
   proof is the same mistake as trusting a Razorpay amount from the client,
   which `razorpay-verify-payment` already refuses to do.
5. Acknowledge the purchase within three days or **Play refunds it
   automatically**. Acknowledgement happens server-side, after verification.

### 3. The server — this is the bulk of it

A new edge function, `play-verify-purchase`:

* Authenticates with the **Google Play Developer API** using a service account
  (created in Google Cloud, linked in Play Console under Users and permissions).
  The JSON key becomes a Supabase secret. An agent cannot create this; it is an
  owner action, like the OAuth clients.
* Calls `purchases.subscriptionsv2.get` or `purchases.products.get` with the
  token, and reads the real state and expiry from Google rather than from the
  app.
* Writes the same `premium_subscriptions` row the Razorpay function writes,
  with the same `adfree_monthly` plan string and an `expires_at` from Play.
  **Every reader of the entitlement then needs no change at all**, which is the
  single best thing about how this is currently built.
* Acknowledges the purchase.

And then the part people forget: **Real-Time Developer Notifications**. A
subscription renews, lapses, is refunded, is put on hold or is cancelled
without the app being open. Play publishes those events to a Google Cloud
Pub/Sub topic, and something has to receive them and move `expires_at`. Without
it, a cancelled subscription stays "active" in our table until its last known
expiry and a renewed one silently expires. That is a second edge function and a
Pub/Sub push subscription pointed at it.

### 4. Testing, which cannot happen in a sandbox

License testers in Play Console, a build on the **internal testing track**, and
a real device. Test purchases are free and renew on an accelerated clock (a
monthly subscription renews in minutes). There is no emulator here and no way
for an agent to do any of it — this lands in the same bucket as
`razorpay-untested`.

## Effort

Client, a day. Verification function, a day. RTDN plumbing, a day. Play Console
product setup, service account and permissions, half a day of clicking. Testing
and the inevitable round of "the token verifies but the acknowledgement
fails", two days. Call it **a working week**, most of it configuration and
testing rather than code, and none of it doable from a sandbox.

## The order to do it in

1. Create the products in Play Console. Nothing can be tested before they
   exist, and they take a while to propagate.
2. Service account + Play Developer API access. Owner-only.
3. `play-verify-purchase`, written against the API with a token pasted by hand
   from a test purchase. Prove it in isolation before any client work.
4. Client flow behind a flag, alongside Razorpay rather than replacing it.
5. RTDN, before a single real subscription exists — retrofitting it means
   reconciling rows that drifted.
6. Switch the flag, leave Razorpay's code in place for one release so an
   existing entitlement is never orphaned, then remove it.

`check:payments` should grow a section for each half as it lands, in the same
shape as the Razorpay one: the price is never in the client, the grant is never
made without a server verification, and the preview shim refuses rather than
faking a success.

## Verify this before acting on it

* The current Play service fee and the user-choice-billing terms for India.
* Whether Play still requires acknowledgement within three days.
* Whether `react-native-iap` supports the New Architecture on the React Native
  version in `mobile/package.json` — this app runs the New Architecture, and a
  library registered the old way is silently absent (CLAUDE.md, "A native
  module has to be a TurboModule").
* Whether any of this repo's existing entitlement readers assume a Razorpay
  payment id is present. `premium.ts` reads only `expires_at` and the plan, so
  it should be fine; the admin panel prints `razorpay_payment_id` and would
  show a blank.
