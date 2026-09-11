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
 * See the note above before changing this. It is the whole of the difference
 * between "we mention the website" and "we send you to it".
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
