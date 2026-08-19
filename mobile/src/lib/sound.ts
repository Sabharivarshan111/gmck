import { NativeModules, Platform } from 'react-native';
import { getSettings } from '@/lib/settings';

/**
 * Sound effects.
 *
 * The clips are synthesised rather than sourced — see
 * `mobile/scripts/make-sounds.py` — so they can be tuned to the app rather
 * than the app tuned around a stock file, and so nothing ships whose licence
 * has to be traced later. They are played by a small native module built on
 * Android's SoundPool: see SoundModule.kt for why that rather than an npm
 * audio library or the video player already in the project.
 *
 * **Every call is a no-op if the module is missing.** It is absent in the
 * preview harness, which is react-native-web, and it would be absent in any
 * build where the native side failed to register. A missing sound must never
 * take a button with it, so this resolves once, quietly, and stops asking.
 */

interface OrbitSound {
  play(name: string, volume: number): void;
}

const native: OrbitSound | undefined =
  Platform.OS === 'android' ? (NativeModules as { OrbitSound?: OrbitSound }).OrbitSound : undefined;

/** Whether this build can actually make a noise. For Settings to be honest. */
export const soundAvailable = native !== undefined;

/**
 * Quiet on purpose.
 *
 * A tap sound fires thousands of times a day, and one at the volume of a
 * notification is one that gets the whole feature switched off within a
 * minute. It should sit under whatever else is happening, not on top of it.
 */
const TAP_VOLUME = 0.28;
const CHIME_VOLUME = 0.85;

/** A press. Gated on the tap-sound setting. */
export function playTap(): void {
  if (!native || !getSettings().tapSound) {
    return;
  }
  native.play('tap', TAP_VOLUME);
}

/** A finished focus session. Gated on the timer-sound setting. */
export function playChime(): void {
  if (!native || !getSettings().timerSound) {
    return;
  }
  native.play('chime', CHIME_VOLUME);
}
