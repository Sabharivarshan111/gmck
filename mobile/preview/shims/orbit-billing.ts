/**
 * Google Play Billing, absent — which is the honest answer here.
 *
 * The preview is a browser. There is no Play services, no Play account and no
 * card, so `TurboModuleRegistry.get` would return null on a device in exactly
 * this situation too — and so would a sideloaded APK, which is every build this
 * repo's CI produces.
 *
 * A shim that resolved a fake purchase would be the worst thing in this folder:
 * `playBilling.ts` would post an invented token to `play-verify-purchase`, and
 * the only two outcomes are a rejected request that looks like a bug or, if
 * anybody ever loosened the server to be helpful, an entitlement granted for
 * money nobody paid. The preview shows what a build Play did not install shows:
 * `isBillingAvailable()` false and no catalogue.
 */
export default null;
