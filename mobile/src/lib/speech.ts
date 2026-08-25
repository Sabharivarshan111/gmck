import * as ReactNative from 'react-native';
import { Platform } from 'react-native';
import OrbitSpeech from '@/native/NativeOrbitSpeech';

/**
 * Reached through the namespace, not as a named import.
 *
 * react-native-web does not export `PermissionsAndroid` at all, and an ESM
 * named import of something a module does not export is a hard failure at
 * evaluation — it does not resolve to undefined, it takes the whole bundle
 * down. Importing the namespace and reading the property off it degrades to
 * undefined instead, which is what the guards below already expect.
 */
const PermissionsAndroid = (
  ReactNative as unknown as { PermissionsAndroid?: typeof ReactNative.PermissionsAndroid }
).PermissionsAndroid;

/**
 * Dictation for the Ask AI composer.
 *
 * The native half is `SpeechModule.kt`, on Android's own SpeechRecognizer —
 * see `src/native/NativeOrbitSpeech.ts` for why the platform recogniser rather
 * than a bundled model.
 *
 * Every call here is safe when the module is absent, which it is in the
 * preview harness and would be in any build where registration was missed. A
 * missing recogniser hides the microphone; it never takes the composer with
 * it.
 */

const native = OrbitSpeech ?? undefined;

/**
 * Whether this build and this device can dictate at all.
 *
 * Two separate things, and both have to be true: the module has to be
 * reachable (it is not, under react-native-web), and the phone has to have a
 * recogniser installed. A phone can ship without one, or have it disabled, so
 * this is a runtime question rather than a build-time one.
 */
export function speechAvailable(): boolean {
  if (!native) {
    return false;
  }
  if (Platform.OS === 'web') {
    return true;
  }
  if (Platform.OS !== 'android') {
    return false;
  }
  try {
    return native.isAvailable();
  } catch {
    return false;
  }
}

/**
 * Ask for the microphone, the first time it is needed.
 *
 * Deliberately not at launch. A permission prompt before anyone has asked for
 * anything is the fastest way to get it denied, and denied-forever is the one
 * state this feature cannot recover from — Android stops showing the dialog
 * after two refusals and the only route back is the system settings screen.
 */
export async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }
  if (Platform.OS !== 'android') {
    return false;
  }
  if (!PermissionsAndroid) {
    return false;
  }
  try {
    const already = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    if (already) {
      return true;
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Use the microphone?',
        message: 'Orbit needs the microphone to turn what you say into a question.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/** What went wrong, in words a student can act on. */
export function speechErrorMessage(code: string): string {
  switch (code) {
    case 'no-match':
    case 'no-speech':
      return "Didn't catch that — try again.";
    case 'network':
      return 'Dictation needs a connection right now.';
    case 'permission':
      return 'Microphone access is off for Orbit.';
    case 'busy':
      return 'Still listening to the last one.';
    case 'unavailable':
      return 'This phone has no speech recogniser.';
    default:
      return "Couldn't hear that — try again.";
  }
}

/**
 * Listen, and resolve with what was said.
 *
 * `en-IN` by default: the bank is Indian MBBS, the drug and disease names in
 * it are pronounced the way they are pronounced here, and a recogniser told to
 * expect en-US mishears most of them.
 */
export async function listen(locale = 'en-IN'): Promise<string> {
  if (!native) {
    throw new Error('unavailable');
  }
  return native.start(locale);
}

/** Stop listening and keep what was heard. */
export function stopListening(): void {
  native?.stop();
}

/** Stop listening and throw it away. */
export function cancelListening(): void {
  native?.cancel();
}
