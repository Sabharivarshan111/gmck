import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * The sound module's TurboModule spec.
 *
 * This file is not just a type declaration: React Native's codegen reads it
 * at build time and generates `NativeOrbitSoundSpec` (Java) plus the C++ JSI
 * binding that lets the JavaScript side reach the Kotlin one.
 *
 * It exists because the app runs the **New Architecture**, and under it a
 * plain `ReactPackage` that returns modules from `createNativeModules` is
 * invisible: `ReactPackageTurboModuleManagerDelegate` only looks at those
 * packages when `useTurboModuleInterop` is on, and that flag is `false` in
 * every stable React Native release. The module registered that way is not
 * "sometimes missing" — it is never there, on every device, which is exactly
 * how the first version of this shipped: `NativeModules.OrbitSound` was
 * always undefined, so `soundAvailable` was always false and the sound
 * switches were hidden from Settings on real phones.
 *
 * `get` rather than `getEnforcing`: a missing sound must never be a crash.
 */
export interface Spec extends TurboModule {
  /**
   * @param name   'tap' or 'chime'
   * @param volume 0-1
   */
  play(name: string, volume: number): void;

  /**
   * Why Android is currently silencing tap sounds, or '' if it is not.
   *
   * `'dnd'` | `'silent'` | `'vibrate'` | `''`.
   *
   * Taps go out as USAGE_ASSISTANCE_SONIFICATION, which Do Not Disturb and
   * the silent ringer mute — correct behaviour, and completely invisible from
   * inside the app: the switch is on, the module is loaded, the clip is
   * decoded, and nothing comes out. That is indistinguishable from a broken
   * feature unless the app says which one it is, so it says.
   *
   * The focus chime is exempt because it goes out as USAGE_ALARM.
   */
  silencingReason(): string;

  /**
   * Play a clip on the alarm stream, whatever the clip is.
   *
   * For the Settings preset picker only. A tap preset normally goes out as
   * USAGE_ASSISTANCE_SONIFICATION, so on a phone in Do Not Disturb the picker
   * is a list of names that make no sound when tapped — which reads as "the
   * presets do not work" rather than "your phone is muted". Previewing is the
   * one moment the point is to hear the clip, so it borrows the alarm stream
   * the focus chime already uses. Nothing else does this: an actual tap still
   * respects the phone.
   */
  preview(name: string, volume: number): void;
}

export default TurboModuleRegistry.get<Spec>('OrbitSound');
