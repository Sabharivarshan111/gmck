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
}

export default TurboModuleRegistry.get<Spec>('OrbitSound');
