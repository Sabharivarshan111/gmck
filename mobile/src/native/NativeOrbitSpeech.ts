import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Dictation, on Android's own SpeechRecognizer.
 *
 * The platform's recogniser rather than a bundled model, and that is the whole
 * decision. Whisper tiny is ~75MB added to an APK that is already 87MB, and
 * transcribing on the phones this app is built for takes long enough to read
 * as broken. SpeechRecognizer is already installed, costs nothing, needs no
 * key, and is the same engine behind the microphone on the keyboard — so it is
 * also the one users have already learned to trust.
 *
 * **Promise-based and single-shot**, not an event stream. Partial results
 * would need a codegen EventEmitter and a subscription to tear down on every
 * unmount; what the composer actually needs is "listen until I stop, then give
 * me the text", which is one call and one resolve. `stop()` ends listening and
 * still resolves with whatever was heard; `cancel()` throws it away.
 *
 * A TurboModule for the same reason the sound module is one: under the New
 * Architecture a module registered from a plain ReactPackage is never
 * reachable, on any device, silently. `get` rather than `getEnforcing`, so a
 * build without it degrades to a hidden mic instead of a crash.
 */
export interface Spec extends TurboModule {
  /**
   * Whether this device has a recogniser at all.
   *
   * Not a given: it is a system app, and a phone can ship without it or have
   * it disabled. The mic is hidden entirely when this is false, rather than
   * offered and then failing.
   */
  isAvailable(): boolean;

  /**
   * Listen, and resolve with what was said.
   *
   * @param locale BCP-47, e.g. 'en-IN'.
   *
   * Rejects with a code in the message: `no-match`, `no-speech`, `busy`,
   * `network`, `permission`, `cancelled`, or `unavailable`. Those are
   * different messages to a user — "I didn't catch that" is not "you're
   * offline" — so they are distinguished here rather than flattened.
   */
  start(locale: string): Promise<string>;

  /** Stop listening and resolve the pending start() with what was heard. */
  stop(): void;

  /** Abandon the pending start(). Rejects it with `cancelled`. */
  cancel(): void;
}

export default TurboModuleRegistry.get<Spec>('OrbitSpeech');
