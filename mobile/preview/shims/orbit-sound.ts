/**
 * The preview harness is react-native-web, which has no TurboModuleRegistry
 * and no SoundPool. `src/lib/sound.ts` already resolves to a no-op when the
 * module is absent, so this stands in for the spec module and reports absent —
 * without it, importing the real spec would reach for a
 * `TurboModuleRegistry` react-native-web does not export.
 */
export default null;
