# Google Play Billing — the setup only the app owner can do

Everything an agent could build is built and committed. **None of it can take a
payment until the steps below are done**, and not one of them is doable from a
sandbox: they need a Play Console login, a Google Cloud project, a card and a
phone. This file is that half, in order, with what each step is for.

Same standing as `oauth-sha1-deployment` and `razorpay-untested` in
`.agents/state/blocked.json`: blocked on the owner, not on more code.

> **Nothing here has been run against a real purchase.** There is no Play
> account, no card and no emulator with Play services in the sandboxes this was
> written in. `npm run check:billing` asserts the contract; the first real proof
> is a licence tester buying something on a phone.

---

## What is already done, and where it lives

| Piece | File | State |
|---|---|---|
| TurboModule spec | `mobile/src/native/NativeOrbitBilling.ts` | written |
| Kotlin module | `.../aycxvd/BillingModule.kt` | written, compiles in CI, never run |
| Package + registration | `.../BillingPackage.kt`, `MainApplication.kt` | wired |
| Gradle dependency | `android/app/build.gradle` — `billing:9.1.0` | added |
| JS client | `mobile/src/lib/playBilling.ts` | written, **behind `PLAY_BILLING_ENABLED = false`** |
| Preview shim | `mobile/preview/shims/orbit-billing.ts` | `export default null` — absent, not fake |
| Verification function | `supabase/functions/play-verify-purchase/` | **deployed**, returns 500 until step 3 |
| RTDN receiver | `supabase/functions/play-rtdn/` | **deployed** (`verify_jwt: false`), returns 500 until step 5 |
| Database columns | `premium_subscriptions.source`, `play_*`, `auto_renewing` | **applied to production** |
| The check | `npm run check:billing` | green, and fails on all five ways this goes wrong |

**Razorpay is untouched and is still the live path.** It stays that way until a
real Play purchase has been taken and a `source = 'play'` row has appeared.

---

## Step 1 — Payments profile

Play Console → **Setup → Payments profile**.

Without one, you cannot create a single in-app product. If the account has ever
been paid by Google (AdMob, for example) the profile probably already exists and
this is one click to confirm.

<https://support.google.com/googleplay/android-developer/answer/9859673>

---

## Step 2 — Create the products

Play Console → **Monetise → Products**. The ids below are the ones the code
already expects; `npm run check:billing` fails if the client and the server ever
disagree about them, but neither can know what you typed into the console — **if
you name a product differently, the purchase silently fails.**

### 2a. One subscription, three base plans

**Monetise → Subscriptions → Create subscription**

- Product ID: `orbit_adfree`  ← cannot be changed later
- Name: *Orbit Ad-free*

Then add three **base plans** inside it (Add base plan):

| Base plan ID | Billing period | Price (India) | Auto-renewing |
|---|---|---|---|
| `adfree-monthly` | 1 month | ₹50 | yes |
| `adfree-6months` | 6 months | ₹150 | yes |
| `adfree-yearly` | 1 year | ₹300 | yes |

Set each to **Active** — a base plan left in draft does not appear in
`queryProductDetailsAsync`, which looks exactly like the code being broken.

### 2b. Two one-off products

**Monetise → Products → In-app products → Create product**

| Product ID | Name | Type | Price |
|---|---|---|---|
| `notes_fmspm` | FM + SPM revision notes | Non-consumable | ₹50 |
| `notes_pharmac` | Pharmacology full-subject notes | Non-consumable | ₹50 |

Both **Active**.

> Products take a while to propagate — sometimes hours. An empty product list
> right after creating them is normal and is not a bug in the app.

<https://support.google.com/googleplay/android-developer/answer/1153481>

---

## Step 3 — Service account, and the secret Supabase needs

This is what lets the server ask Google "what is this purchase token, really".
Without it `play-verify-purchase` returns 500 and grants nothing — which is the
correct failure, not a bug.

1. **Google Cloud console** → the project linked to Play →
   **IAM & Admin → Service accounts → Create service account**.
   Name it something like `orbit-play-billing`. No roles needed in Cloud.
2. On that service account → **Keys → Add key → Create new key → JSON**.
   A `.json` file downloads. **This file is a credential — treat it like the
   keystore.** Do not commit it, do not paste it into a chat, do not screenshot
   it.
3. **Play Console → Users and permissions → Invite new user**, paste the service
   account's email (`…@….iam.gserviceaccount.com`). Give it, for this app:
   - **View financial data, orders, and cancellation survey responses**
   - **Manage orders and subscriptions**
4. Enable the API: Google Cloud console → **APIs & Services → Library** →
   *Google Play Android Developer API* → **Enable**.
5. Put the whole JSON file's contents into Supabase as one secret:

   Supabase dashboard → your project → **Edge Functions → Secrets** (or
   `supabase secrets set`), name it exactly:

   ```
   PLAY_SERVICE_ACCOUNT_JSON
   ```

   Value: the entire contents of the downloaded `.json`, pasted as-is.

<https://developers.google.com/android-publisher/getting_started>

**Permissions can take up to 24 hours to take effect.** A 401 from the Play API
on the first day is usually this, not a wrong key.

---

## Step 4 — The RTDN secret

The Real-Time Developer Notifications endpoint runs with `verify_jwt: false`,
because Pub/Sub cannot send a Supabase JWT. It guards itself with a shared
secret in the URL instead.

Generate a long random string — anything from a password manager, 40+ characters
— and set it as a second Supabase secret:

```
PLAY_RTDN_SECRET
```

Your push endpoint is then:

```
https://pmtgeydtqypwrypshhsx.supabase.co/functions/v1/play-rtdn?secret=THE_SECRET
```

**That whole URL is a credential.** Anyone who has it can post notifications at
the endpoint. It still cannot forge an entitlement — the handler ignores what a
notification says and re-asks Play about the token — but it should not be
screenshotted or pasted into a chat either.

---

## Step 5 — Pub/Sub, and the topic Play publishes to

1. Google Cloud console → **Pub/Sub → Topics → Create topic**.
   Id: `orbit-play-rtdn`. Leave "Add a default subscription" **unticked**.
2. On that topic → **Permissions → Add principal**:
   - New principal: `google-play-developer-notifications@system.gserviceaccount.com`
   - Role: **Pub/Sub Publisher**

   This is Google's own publisher account. Skip it and Play refuses to save the
   topic name in step 3 below, with an error about permissions that does not say
   whose.
3. On that topic → **Create subscription**:
   - Delivery type: **Push**
   - Endpoint URL: the full URL from step 4, secret included
   - Leave "Enable authentication" off — the secret in the URL is the auth.
   - Acknowledgement deadline: 60 seconds
4. **Play Console → Monetise → Monetisation setup → Real-time developer
   notifications**. Paste the full topic name:

   ```
   projects/YOUR_CLOUD_PROJECT_ID/topics/orbit-play-rtdn
   ```

   Press **Send Test Message**.

**A successful test message proves the whole chain**: Play → Pub/Sub → the edge
function → a 200. The function handles `testNotification` deliberately and
touches nothing in the database, so this is safe to press as often as you like.
If it fails, check the function's logs in the Supabase dashboard — a 403 there
means the secret in the URL does not match `PLAY_RTDN_SECRET`.

<https://developer.android.com/google/play/billing/getting-ready#configure-rtdn>

---

## Step 6 — Licence testers

Play Console → **Setup → Licence testing**. Add the Google account(s) that will
test, by email.

A licence tester buys with a **test card and is never charged**, and
subscriptions renew on an accelerated clock — a monthly plan renews in minutes,
which is the only practical way to see a renewal RTDN arrive.

<https://developer.android.com/google/play/billing/test>

---

## Step 7 — A build Play installed

**This is the step people skip, and it makes everything look broken.**

Billing answers nothing at all for a build Play did not install. Every APK this
repo's CI produces is sideloaded, so on one of those:
`isBillingAvailable()` is false, `loadProducts()` returns `[]`, and no Buy button
appears. That is correct behaviour, not a failure.

So:

1. Upload the `.aab` to the **internal testing** track.
2. Add your tester account to that track's tester list.
3. Install **from the Play link**, not by sideloading the APK.

Internal-test purchases also have their own spend limits — read the testing page
above before assuming a refusal is the code.

---

## Step 8 — Turn it on, in that order

Only after steps 1–7:

1. Flip `PLAY_BILLING_ENABLED` to `true` in `mobile/src/lib/playBilling.ts`
   (one line, deliberately — there is no remote flag, because "which payment
   system is live" changing without a build is exactly what should not be
   possible from a console at two in the morning).
2. Cut a build, upload to internal testing, buy each of the five things once.
3. Check each purchase:
   - a `premium_subscriptions` row appeared with `source = 'play'`,
   - `expires_at` matches what Play shows,
   - an `admin_notifications` row appeared **once** (not once per launch),
   - the app shows no ads.
4. Wait for one accelerated renewal and confirm `expires_at` moved **without
   opening the app** — that is the RTDN working.
5. Cancel one subscription and confirm it stays ad-free until its expiry, then
   stops.
6. Only then promote to production, and **leave Razorpay's code in place for one
   full release** so nobody's existing entitlement is orphaned.

`npm run check:billing` fails while `PLAY_BILLING_ENABLED` is true, on purpose —
that is the reminder to come back and update this document and the check
together once a real purchase has actually gone through.

---

## What this does NOT cover, and shouldn't yet

**India's alternative billing.** Google permits an alternative payment system
alongside Play's in India, with the Play service fee reduced by 4 percentage
points. It is the one legitimate way Razorpay could stay in the picture.

It is also strictly more work than Play Billing, on top of Play Billing:
console onboarding and approval, an external transaction token per transaction, a
developer-generated external transaction ID, and reporting every transaction back
to Google through the Play Developer API. On a ₹50 sale, four points is ₹2 —
and out of that you then pay Razorpay's own fee and carry the refunds,
chargebacks and tax invoicing yourself.

Get Play Billing working first. Revisit only if the volume ever justifies it.

- <https://support.google.com/googleplay/android-developer/answer/12570971>
- <https://developer.android.com/google/play/billing/alternative>

---

## The fee, so it is written down once

Verify in your own console before planning around it — Play's fee tables have
moved twice in the last year.

- **Subscriptions: 15%** from day one. There is no first-year-30% rule any more.
- **One-off products: 15%** on the first $1M of annual earnings.
- On ₹50 that is **₹7.50**. Razorpay costs roughly 2% + GST, about ₹1.20. The
  real cost of compliance is about **₹6.30 per ₹50 sale**.
- Coming from the Epic settlement: subscriptions move to a 10% service fee + 5%
  billing fee (≈15% effective — roughly neutral here), rolling out by
  **30 June 2026** in the US, UK and EEA. India was not named in that rollout.

<https://support.google.com/googleplay/android-developer/answer/112622>

---

## Why this is not optional

Play's Payments policy requires Google Play Billing for **digital content or
features consumed inside the app**. Removing ads and unlocking notes are both
exactly that. Razorpay is fine for physical goods and for services consumed
outside the app; it is not fine for either of the two things this app sells.

The enforcement outcome is removal of the app. For a one-app developer account
that is the end of the listing, the reviews and the install base — which is not
a risk worth ₹50 in either direction.

<https://support.google.com/googleplay/android-developer/answer/10281818>
