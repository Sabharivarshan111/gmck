import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Turning the phone sideways for a fullscreen video, and back afterwards.
 *
 * **Why this exists at all.** `react-native-video`'s `fullscreenOrientation`
 * is iOS-only, and its `fullscreen` prop on Android hands the surface to
 * ExoPlayer's own dialog — which draws *its* built-in controls, and this app
 * turns those off. The result was a fullscreen with no play button, no
 * scrubber, no time and no volume, still in portrait. So fullscreen is built
 * here instead, and this is the one thing it needs that JavaScript cannot do.
 *
 * **Why not a library.** `react-native-orientation-locker` is one
 * `requestedOrientation` assignment wrapped in a package, and this app already
 * has four hand-registered TurboModules and a check that asserts the contract.
 * A dependency for two lines is a dependency to keep updated for ever.
 *
 * `android:configChanges` in the manifest already lists `orientation` and
 * `screenSize`, so the Activity is *not* recreated when this fires — without
 * that, going fullscreen would restart the whole React tree and lose the
 * player's position along with it.
 */
export interface Spec extends TurboModule {
  /**
   * Force landscape, or hand control back to the sensor and the user's
   * rotation lock.
   *
   * Releasing is `SCREEN_ORIENTATION_UNSPECIFIED` rather than `PORTRAIT`: the
   * app has no business deciding the reader holds their phone upright, and
   * pinning it would fight anyone using it on a stand.
   */
  setLandscape(on: boolean): void;
}

export default TurboModuleRegistry.get<Spec>('OrbitScreen');
