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
  /** Whether a finished focus session makes a sound. */
  timerSound: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  // On by default because it was asked for. The bar the rest of the app holds
  // — feedback only on a commit or a completion — is still what decides
  // *where* it fires; this decides whether it fires at all.
  haptics: true,
  hapticStrength: 0.4,
  timerSound: true,
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
      timerSound:
        typeof parsed.timerSound === 'boolean' ? parsed.timerSound : DEFAULT_SETTINGS.timerSound,
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
