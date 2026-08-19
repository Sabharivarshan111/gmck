/**
 * The preview harness is react-native-web, which has no NativeModules and no
 * SoundPool. `src/lib/sound.ts` already resolves to a no-op when the module is
 * absent, so nothing needs shimming — this file exists to say so, next to the
 * other shims, rather than leaving the next person to work out why sound is
 * the one native dependency without one.
 */
export {};
