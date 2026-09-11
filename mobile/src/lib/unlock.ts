import { Linking } from 'react-native';

/**
 * Ad-free is bought on the web, and the app only ever honours it.
 *
 * ## What this replaced, and why it is not Razorpay again
 *
 * The app used to open Razorpay's checkout in a dialog. That is an in-app
 * purchase of a feature consumed in the app, which Play's Payments policy
 * requires Play Billing for, and the enforcement outcome is removal of the
 * listing. It was taken out, and this is not a way of putting it back: no
 * payment happens inside this app, no card is collected here, and no price is
 * shown here.
 *
 * The model is the one the owner named: **Netflix.** You pay on the website,
 * you sign in on the phone, and the app unlocks because the account has an
 * entitlement. The app is a reader of `premium_subscriptions` and nothing
 * else — `syncPremiumCache()` is the whole of it.
 *
 * ## The part that is a real risk, stated plainly rather than buried
 *
 * Play's anti-steering rules are about **directing** a user out of the app to
 * pay. Google's own external-links programme, which permits exactly that, is
 * open to **users in the United States only** and has to be enrolled in. In
 * India the available route is the *billing choice* programme, which is an
 * alternative billing sheet shown beside Play's inside the app — not a link
 * out — and it carries PCI DSS certification, transaction reporting and a
 * service fee.
 *
 * Netflix itself does not link out. It shows no purchase UI at all and says
 * you cannot sign up in the app, precisely because the link is the part the
 * policy objects to.
 *
 * So `LINK_OUT` exists as one constant rather than a hardcoded `openURL`:
 *
 * * `true` — the card carries a button that opens the unlock page. This is
 *   what the app's owner asked for, and it is their listing and their call.
 * * `false` — the card says ad-free is available on the website and offers no
 *   link, only "sign in to restore". That is the Netflix behaviour exactly,
 *   and it is the version with no anti-steering exposure.
 *
 * Flipping it is one edit and needs no other change anywhere.
 */
export const UNLOCK_URL = 'https://mbbsqbank-questor.lovable.app/unlock';

/**
 * Whether the app offers a button that leaves for the unlock page.
 *
 * **True. The app owner's decision, made with the risk in front of them**, and
 * the record of both sides is kept here rather than tidied away — because the
 * next person to read this file deserves to know it was a judgement call and
 * not an oversight.
 *
 * ## What the policy says
 *
 * `developer.android.com/google/play/billing/externalpaymentlinks` sets four
 * conditions, read on the page rather than in a summary, and this app meets
 * none of them:
 *
 * 1. **"The external payments program lets you lead users in Japan"** — one
 *    country, and not this app's. Its readers are in India.
 * 2. Enrolment: "complete the enrollment steps outlined in the program
 *    requirements". This account is not enrolled.
 * 3. "Integrate Play Billing Library 8.3 or higher." `PLAY_BILLING_ENABLED` is
 *    false here and no Play Console product exists.
 * 4. **"When linking users to purchases, they must be given a side by side
 *    choice of making the purchase with Google Play Billing or completing the
 *    purchase on the developer's website."**
 *
 * The integration guide expects a runtime check —
 * `isBillingProgramAvailableAsync(BillingProgram.EXTERNAL_PAYMENTS, …)` — whose
 * `BILLING_UNAVAILABLE` means wrong country or unenrolled account.
 *
 * ## What is actually happening on the store
 *
 * The owner produced a live competitor doing exactly this: an Indian MBBS app
 * on Google Play with an in-app plan picker, prices in rupees, and a button
 * that opens a Razorpay checkout on its own domain in a Custom Tab. It is
 * shipping today.
 *
 * That is evidence about **enforcement**, not about the rule. Play's payments
 * enforcement is review- and complaint-driven and plainly uneven; an app can
 * run in violation for a long time and then not. It is a real datapoint and it
 * is not a permission, and both of those are true at once.
 *
 * ## The one thing this deliberately does NOT copy
 *
 * The competitor's *app* shows the plans and the prices — "₹499", "100/mo" —
 * and only the checkout is on the web. That is the half a reviewer reads as
 * the app selling, and it is the least defensible part of the pattern.
 *
 * This app still prices nothing. `UnlockCard` names the destination and opens
 * it; every amount lives on the page. `check:payments` sweeps the purchase
 * path for a currency figure and fails on one, which is what stops this drifting
 * into the same shape by accident later.
 *
 * Flip to `false` for the Netflix-on-Android behaviour: the card keeps the
 * sentence, loses the button, and there is no anti-steering exposure at all.
 * One edit, nothing else changes.
 */
export const LINK_OUT = true;

/**
 * Open the unlock page.
 *
 * Failure is swallowed on purpose: there is no browser on some devices and no
 * useful thing to say about it. The card's own text still tells the reader
 * where to go, which is why that sentence carries the address in words rather
 * than relying on the tap.
 */
export function openUnlock(): void {
  Linking.openURL(UNLOCK_URL).catch(() => undefined);
}
