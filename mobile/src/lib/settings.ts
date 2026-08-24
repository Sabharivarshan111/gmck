import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * The settings a user can change, in one store.
 *
 * A plain module with a listener set rather than a context, for the same
 * reason `progress.ts` is: `Touchable` reads this on every press, and there is
 * a Touchable in every row of a five-hundred-row list. A context whose value
 * changed would re-render all of them; a store they subscribe to individually
 * re-renders only what actually depends on the value.
 */

const KEY = 'orbit:settings-v1';

export interface Settings {
  /** Whether the app vibrates at all. */
  haptics: boolean;
  /**
   * How hard, 0–1.
   *
   * This is a *duration*, not an amplitude. React Native's core Vibration API
   * has no amplitude control — that needs a native module — so "stronger"
   * means "longer", from a tick you half-notice to one you cannot miss. The
   * range is deliberately small: past about 30ms a tap stops feeling like a
   * tap and starts feeling like an alert.
   */
  hapticStrength: number;
  /** Whether a press makes a sound. */
  tapSound: boolean;
  /** Whether a finished focus session makes a sound. */
  timerSound: boolean;
  /** Which press sound. See TAP_PRESETS. */
  tapPreset: string;
  /** Which completion sound. See CHIME_PRESETS. */
  chimePreset: string;
  /**
   * How loud the completion sound is, 0–1.
   *
   * Separate from the phone's volume because this one clip is the only thing
   * in the app loud enough to matter: it fires when you are not looking at the
   * screen, and the right level in a library is the wrong one in a kitchen.
   */
  chimeVolume: number;
  /** Whether the phone buzzes when a session ends, independently of tap haptics. */
  timerVibration: boolean;
}

/**
 * The clips that ship, and the names the native module knows them by.
 *
 * The `id` is the resource name — `mobile/scripts/make-sounds.py` writes
 * `<id>.wav`, SoundModule loads it as `R.raw.<id>`, and sound.ts plays it by
 * this same string. Adding one means touching all four, which is what
 * `npm run check:sounds` verifies.
 */
export const TAP_PRESETS: { id: string; label: string; detail: string }[] = [
  { id: 'tap', label: 'Click', detail: 'The default — short and bright' },
  { id: 'tap_soft', label: 'Soft', detail: 'Lower and rounder' },
  { id: 'tap_crisp', label: 'Crisp', detail: 'Dry and high, easier to hear in a pocket' },
];

export const CHIME_PRESETS: { id: string; label: string; detail: string }[] = [
  { id: 'chime', label: 'Chime', detail: 'Three notes rising — the default' },
  { id: 'chime_bell', label: 'Bell', detail: 'One struck note, carries further' },
  { id: 'chime_digital', label: 'Digital', detail: 'Three flat beeps, like a kitchen timer' },
  { id: 'chime_soft', label: 'Soft', detail: 'Two quiet notes, for shared rooms' },
];

const TAP_IDS = TAP_PRESETS.map(preset => preset.id);
const CHIME_IDS = CHIME_PRESETS.map(preset => preset.id);

export const DEFAULT_SETTINGS: Settings = {
  // On by default because it was asked for. The bar the rest of the app holds
  // — feedback only on a commit or a completion — is still what decides
  // *where* it fires; this decides whether it fires at all.
  haptics: true,
  hapticStrength: 0.4,
  // On by default, because it was asked for as "a sound effect every time the
  // user clicks". The reservation is real — a vibration is private and a sound
  // is not, and a phone that starts clicking in a lecture theatre is a bad
  // first impression — which is why it is the first switch in Settings and
  // takes one tap to silence, rather than something to go looking for.
  tapSound: true,
  timerSound: true,
  tapPreset: 'tap',
  chimePreset: 'chime',
  chimeVolume: 0.85,
  // On by default: the point of the alert is to reach someone who has stopped
  // looking at the screen, and a phone face-down on a desk is silent but not
  // still.
  timerVibration: true,
};

export const HAPTIC_MIN_MS = 6;
export const HAPTIC_MAX_MS = 28;

let current: Settings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

/** Called once at launch, before the first render that matters. */
export async function hydrateSettings(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    current = {
      haptics: typeof parsed.haptics === 'boolean' ? parsed.haptics : DEFAULT_SETTINGS.haptics,
      hapticStrength:
        typeof parsed.hapticStrength === 'number' && Number.isFinite(parsed.hapticStrength)
          ? Math.max(0, Math.min(1, parsed.hapticStrength))
          : DEFAULT_SETTINGS.hapticStrength,
      tapSound:
        typeof parsed.tapSound === 'boolean' ? parsed.tapSound : DEFAULT_SETTINGS.tapSound,
      timerSound:
        typeof parsed.timerSound === 'boolean' ? parsed.timerSound : DEFAULT_SETTINGS.timerSound,
      // Validated against what actually ships: a preset removed in a later
      // release must fall back to the default rather than name a clip the
      // native side cannot load, which would be silence with no explanation.
      tapPreset:
        typeof parsed.tapPreset === 'string' && TAP_IDS.includes(parsed.tapPreset)
          ? parsed.tapPreset
          : DEFAULT_SETTINGS.tapPreset,
      chimePreset:
        typeof parsed.chimePreset === 'string' && CHIME_IDS.includes(parsed.chimePreset)
          ? parsed.chimePreset
          : DEFAULT_SETTINGS.chimePreset,
      chimeVolume:
        typeof parsed.chimeVolume === 'number' && Number.isFinite(parsed.chimeVolume)
          ? Math.max(0, Math.min(1, parsed.chimeVolume))
          : DEFAULT_SETTINGS.chimeVolume,
      timerVibration:
        typeof parsed.timerVibration === 'boolean'
          ? parsed.timerVibration
          : DEFAULT_SETTINGS.timerVibration,
    };
    emit();
  } catch {
    // A corrupt entry should not stop the app starting.
  }
}

/** Read without subscribing. For code paths that are not React. */
export function getSettings(): Settings {
  return current;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  if (current[key] === value) {
    return;
  }
  current = { ...current, [key]: value };
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {});
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}
