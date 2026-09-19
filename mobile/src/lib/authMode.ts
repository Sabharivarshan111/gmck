/** Google authentication stays enabled in internal and release APKs.
 * The debug-APK workflow explicitly disables it even for its optimized bundle.
 * Local Metro debug sessions also skip Google authentication.
 */
export const GOOGLE_SIGN_IN_ENABLED = !__DEV__;
