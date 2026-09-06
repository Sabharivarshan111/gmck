/**
 * What version this build is, in JavaScript.
 *
 * Android knows — it is in `BuildConfig` — and React Native does not expose it.
 * The three ways to get it across are a native module, a dependency whose only
 * job is this (`react-native-device-info` is ~200KB for one integer), or a
 * committed constant. This is the constant, and it is the same trade
 * `src/lib/adsMode.ts` already makes: a value that must never be guessed at
 * runtime is safer as something CI checks than as something the app derives.
 *
 * `npm run check:version` reads `android/app/build.gradle` and fails if these
 * disagree, so the copy cannot go stale silently — which matters more than
 * usual here, because a wrong number does not crash anything. It just makes
 * the app announce an update that does not exist, or stay quiet about one that
 * does.
 *
 * BUMPING: change `versionCode`/`versionName` in build.gradle, change these to
 * match, and add the matching row to `app_releases` (see `appUpdate.ts`).
 */
export const APP_VERSION_CODE = 17;
export const APP_VERSION_NAME = '0.0.0.17';

/**
 * The Play listing, for the button that sends someone to update.
 *
 * The `market:` scheme opens the Play app directly; the https URL is the
 * fallback for a device that has no Play Store, which on a sideloaded APK is a
 * real case rather than a theoretical one. Both are the *published* listing —
 * this is deliberately the same id as `applicationId` and changing either one
 * alone points the button at somebody else's app.
 */
export const PLAY_PACKAGE = 'com.aistudio.mbbsqbank.aycxvd';
export const PLAY_MARKET_URL = `market://details?id=${PLAY_PACKAGE}`;
export const PLAY_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`;
