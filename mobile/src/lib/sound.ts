import OrbitSound from '@/native/NativeOrbitSound';
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
 * It is reached through `src/native/NativeOrbitSound.ts` — a TurboModule
 * spec, not `NativeModules`. Under the New Architecture the latter finds
 * nothing here: a module registered from a plain `ReactPackage` is skipped by
 * the TurboModule manager unless a feature flag that ships `false` is turned
 * on. That is why sound was silent on every device while the code looked
 * correct; the spec file carries the full explanation.
 *
 * **Every call is a no-op if the module is missing.** It is absent in the
 * preview harness, which is react-native-web. A missing sound must never take
 * a button with it, so this resolves once, quietly, and stops asking.
 */

const native = OrbitSound ?? undefined;

/** Whether this build can actually make a noise. For Settings to be honest. */
export const soundAvailable = native != null;

/**
 * Quiet on purpose.
 *
 * A tap sound fires thousands of times a day, and one at the volume of a
 * notification is one that gets the whole feature switched off within a
 * minute. It should sit under whatever else is happening, not on top of it.
 */
const TAP_VOLUME = 0.28;
const CHIME_VOLUME = 0.85;

/** A press. Gated on the tap-sound setting, and plays the chosen preset. */
export function playTap(): void {
  const settings = getSettings();
  if (!native || !settings.tapSound) {
    return;
  }
  native.play(settings.tapPreset, TAP_VOLUME);
}

/** A finished focus session. Gated on the timer-sound setting. */
export function playChime(): void {
  const settings = getSettings();
  if (!native || !settings.timerSound) {
    return;
  }
  native.play(settings.chimePreset, CHIME_VOLUME);
}

/**
 * Why Android is muting tap sounds right now, or '' if it is not.
 *
 * Settings has always carried a sentence saying silent mode and Do Not
 * Disturb mute clicks. It is true, it is in the right place, and it does not
 * work: it reads as general small print, so a phone that is *currently* in Do
 * Not Disturb still looks like an app whose sound is broken. Asking the OS and
 * naming the actual state turns a paragraph people skim into a line about
 * their phone, right now.
 *
 * Read on open rather than watched — there is no callback for either state,
 * and Settings is the only place it is worth knowing.
 */
export function silencingReason(): 'dnd' | 'silent' | 'vibrate' | '' {
  if (!native?.silencingReason) {
    return '';
  }
  try {
    const reason = native.silencingReason();
    return reason === 'dnd' || reason === 'silent' || reason === 'vibrate'
      ? reason
      : '';
  } catch {
    // A module that will not answer is not a phone that is muted.
    return '';
  }
}

/**
 * Play a clip by name, ignoring the on/off settings.
 *
 * For the Settings picker: choosing a sound has to make that sound, or you
 * are picking from a list of words. It deliberately bypasses the toggles —
 * you may want to hear the options before deciding to turn them on.
 */
export function previewSound(name: string): void {
  const volume = name.startsWith('chime') ? CHIME_VOLUME : TAP_VOLUME;
  // preview() when the module has it — it routes to the alarm stream, so a
  // phone in Do Not Disturb still lets you hear what you are choosing. Falls
  // back on an older build rather than going silent.
  if (native?.preview) {
    native.preview(name, volume);
    return;
  }
  native?.play(name, volume);
}
