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
 * **False, and the research is why.** The owner's friend said Netflix has a
 * link, which is a reasonable thing to have seen — but it is an iPhone. Apple
 * granted reader apps an entitlement in 2022 for exactly one external
 * account-management link, and Netflix uses it. That is a different store with
 * different rules and it says nothing about this one.
 *
 * On Android, Netflix is a **consumption-only app**: you sign in, you watch
 * what you already pay for, and there is no purchase and no checkout link in
 * the app at all. Google's own wording is that *any* app may be
 * consumption-only — "any products or services, whether digital or physical,
 * cannot be purchased from within the app" — so this route is open to a study
 * app just as much as to a video one, and it is the route Netflix is actually
 * on.
 *
 * Leading a user out to pay is a separate programme, it requires enrolment,
 * and it is live in the US, UK and Europe. India is in the batch that does not
 * land until **30 September 2027**. What India has today is *user choice
 * billing*: an alternative payment sheet shown beside Play's, inside the app,
 * with PCI DSS certification and transaction reporting. Not a link.
 *
 * So a button here would be a Payments policy violation for this app's readers
 * for another year, and the outcome is a rejected update or removal of a
 * listing that a one-app account cannot afford to lose. The card names the
 * site in words instead, which is what a consumption-only app is allowed to do.
 *
 * Flip it to `true` the week India is covered, or sooner if the owner decides
 * the risk is theirs to take. Nothing else has to change.
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
