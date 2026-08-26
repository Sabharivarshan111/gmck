import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventSubscription } from 'react-native';

/**
 * Codegen's EventEmitter, declared here rather than imported.
 *
 * React Native's package `exports` map blocks the deep import
 * (`react-native/Libraries/Types/CodegenTypes`) that its own docs use, so tsc
 * cannot resolve it while codegen has no trouble — codegen matches this by the
 * type's *name*, not by where it came from. Declaring it locally is what makes
 * both agree. `npm run check:native-speech` runs the real codegen over this
 * file, so if that ever stops being true it fails here rather than six minutes
 * into a Gradle build.
 */
type EventEmitter<T> = (handler: (value: T) => void) => EventSubscription;

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

  /**
   * How loud the microphone is, right now, in dB.
   *
   * Android's RecognitionListener delivers this several times a second for
   * free while it is listening, and the module used to throw it away with an
   * empty `onRmsChanged` override — which is why the listening visualiser on
   * the phone was a decoration that ignored the voice it was drawn for. The
   * browser preview reacted because it had its own Web Audio implementation,
   * so the one place it looked right was the one place it did not ship.
   *
   * An EventEmitter rather than a promise because it is a stream: the point is
   * the shape over time, and nothing here needs to be awaited.
   *
   * The range is roughly -2 (silence) to 10 (loud) on most devices, but the
   * scale is not specified and vendors differ, so consumers must normalise
   * rather than trust the bounds.
   */
  readonly onRms: EventEmitter<number>;
}

export default TurboModuleRegistry.get<Spec>('OrbitSpeech');
