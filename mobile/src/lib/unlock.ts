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
 * **False**, and this time the reasons are quoted from Google's own developer
 * documentation rather than from a search summary. An earlier version of this
 * comment said the programme was live in "the US, UK and Europe" and reached
 * India on 30 September 2027. Both were wrong: they came from articles about
 * the Epic settlement's *service fee* rollout, which is a different schedule
 * from the programme's availability, and neither was checked against the
 * source. The conclusion did not change. The reasoning was unsound.
 *
 * `developer.android.com/google/play/billing/externalpaymentlinks` says four
 * things, and this app fails all four:
 *
 * 1. **"The external payments program lets you lead users in Japan"** — one
 *    country, and not this app's.
 * 2. Enrolment: "complete the enrollment steps outlined in the program
 *    requirements". This account is not enrolled.
 * 3. "Integrate Play Billing Library 8.3 or higher." `PLAY_BILLING_ENABLED` is
 *    false here and no product exists in Play Console.
 * 4. **"When linking users to purchases, they must be given a side by side
 *    choice of making the purchase with Google Play Billing or completing the
 *    purchase on the developer's website."** So even where it is permitted, a
 *    bare "open the unlock page" button is not the sanctioned shape — and this
 *    app could not offer that choice, because it has no Play Billing side to
 *    put beside it.
 *
 * The integration guide adds that the app is expected to *ask* at runtime —
 * `isBillingProgramAvailableAsync(BillingProgram.EXTERNAL_PAYMENTS, …)` — and
 * that `BILLING_UNAVAILABLE` means "the user is not in an eligible country for
 * this program or your account has not been successfully enrolled". A
 * hardcoded `openURL` is not a lenient version of that; it is the thing the
 * check exists to prevent.
 *
 * ## The Netflix question, since it is the one people ask
 *
 * The owner's friend said Netflix has a link. They had seen an iPhone: Apple
 * gave reader apps an entitlement in 2022 for exactly one external
 * account-management link. Different store, different rules.
 *
 * On Android, Netflix sells nothing in the app — you sign in and watch what you
 * already pay for. **Caveat, stated because it was not verifiable from here:**
 * `support.google.com` is blocked by this sandbox's egress proxy, so Google's
 * consumption-only wording was read in a search summary rather than on the
 * page. The four numbered points above were read on the page.
 *
 * Flip this to `true` only once the Play Console says this account is enrolled
 * and this app's users are in an eligible country — and then give the reader
 * the side-by-side choice the page requires, rather than a lone button.
 */
export const LINK_OUT = false;

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
