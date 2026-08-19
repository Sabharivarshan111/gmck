/**
 * Whether this build has ads at all.
 *
 * When false, `ads.ts` does nothing: the SDK is never started, the consent
 * form never runs, no unit is ever loaded, and no ad can be shown. Not "test
 * ads" — **no ads**. That is a standing instruction for every build that gets
 * installed by hand, and it is also the faster answer, because initialising
 * AdMob and running the UMP consent flow is real work at launch on a phone
 * that has none to spare.
 *
 * This is a committed constant rather than a runtime check on purpose. The
 * consequence of getting it wrong is an AdMob policy violation that can
 * suspend the account, so it must not depend on anything a build could get
 * wrong by accident. CI overwrites this file with `false` before building any
 * installable test APK — see .github/workflows/android-debug.yml.
 *
 * The value committed here is what a local `assembleRelease` gets, so it has
 * to be `!__DEV__`: the shipped app has ads, and running from Metro does not.
 */
export const ADS_ENABLED = !__DEV__;
