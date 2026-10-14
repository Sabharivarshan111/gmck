/** Google authentication stays enabled in internal and release APKs.
 * Debug and native-preview workflows explicitly disable it only for their
 * separately installable test packages, including optimized bundles.
 * Local Metro debug sessions also skip Google authentication.
 */
export const GOOGLE_SIGN_IN_ENABLED = !__DEV__;
