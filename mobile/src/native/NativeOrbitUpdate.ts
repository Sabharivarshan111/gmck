import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Google Play's own in-app update API.
 *
 * `com.google.android.play:app-update`. Play answers whether a newer version
 * is available to *this* user on *their* track, downloads it, and installs it —
 * no version number of ours is compared against anything, and no table decides
 * when a release is live. That is the whole reason to use it: the app was
 * asking a row in Supabase whether an update existed, which meant a human had
 * to remember to flip a flag the moment the listing changed, and until they did
 * the prompt was silent or wrong.
 *
 * ## The three things it cannot do, and what happens instead
 *
 * * **It says nothing about what changed.** Play does not hand release notes to
 *   a client, at all. So `app_releases` stays, purely as the text for the card
 *   — looked up by the versionCode Play reports. No row means the prompt still
 *   appears, without a list.
 * * **It only works for a build Play installed.** A sideloaded APK — every one
 *   this repo's CI produces — gets no update, ever, whatever is on the listing.
 *   The account must also have downloaded the app from Play at least once, and
 *   the application id and signing key must match the published ones. Testing
 *   is through **internal app sharing**; a debug build cannot exercise this at
 *   all, and neither can the preview harness.
 * * **It cannot be tested here.** No emulator, no Play services, no Play
 *   account. `npm run check:native-update` asserts the four TurboModule pieces
 *   and the JS contract; the first real proof is an internally-shared build on
 *   a phone.
 *
 * ## Flexible, not immediate
 *
 * FLEXIBLE downloads in the background and lets the reader carry on, then asks
 * to restart. IMMEDIATE takes the screen over and will not give it back until
 * the update is installed — which for this app means locking a student out of
 * their question bank the evening before an exam. It exists here only for a
 * release Play itself marks high priority, and `updatePriority` is set through
 * the Play Developer API rather than the console, so today nothing sets it.
 */

/** What `check()` resolves — JSON, the same shape the other modules use. */
export interface UpdateStatus {
  /** Play has a newer version for this user on this track. */
  available: boolean;
  /** The versionCode Play is offering, 0 when there is nothing. */
  versionCode: number;
  /** Days the update has been available to this user, -1 when unknown. */
  staleness: number;
  /** 0-5, from the Play Developer API. 0 unless somebody has set it. */
  priority: number;
  flexibleAllowed: boolean;
  immediateAllowed: boolean;
  /**
   * A flexible download already in flight or finished, as Play's own
   * `InstallStatus` name: 'downloading', 'downloaded', 'installing',
   * 'installed', 'failed', 'pending', 'canceled', 'unknown'.
   */
  installStatus: string;
  bytesDownloaded: number;
  totalBytes: number;
  /** Why there is nothing to offer, when that is worth knowing. */
  reason: string;
}

export interface Spec extends TurboModule {
  /**
   * Ask Play. Resolves a JSON `UpdateStatus`; never rejects — "no Play
   * services", "not installed by Play" and "already up to date" are all
   * ordinary answers rather than errors, and a rejection would make the caller
   * tell them apart from a catch block.
   */
  check(): Promise<string>;

  /**
   * Show Play's own confirmation sheet and start the download.
   *
   * @param type 'flexible' or 'immediate'.
   * @returns 'accepted', 'cancelled', 'failed', or 'unavailable' when there was
   *   nothing to start. Cancelling is an outcome, not an error.
   */
  start(type: string): Promise<string>;

  /**
   * Install a flexible update that has finished downloading. **This restarts
   * the app**, so nothing may be unsaved when it is called.
   */
  complete(): void;
}

/*
 * `get`, never `getEnforcing`. The module is legitimately absent in the preview
 * harness, and on any build without Play services — turning that into a crash
 * would take the whole app down for a feature that is decoration.
 */
export default TurboModuleRegistry.get<Spec>('OrbitUpdate');
