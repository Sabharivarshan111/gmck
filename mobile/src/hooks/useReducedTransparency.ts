import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

// One subscription for all glass surfaces; no per-pane native listeners.
let reduced = false;
let dispose: (() => void) | undefined;
const listeners = new Set<() => void>();
function publish(value: boolean) {
  if (value === reduced) return;
  reduced = value;
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (Platform.OS === 'web') {
      type Media = {
        matches: boolean;
        addEventListener?: (type: 'change', listener: () => void) => void;
        removeEventListener?: (type: 'change', listener: () => void) => void;
      };
      const browser = globalThis as unknown as {
        matchMedia?: (query: string) => Media;
      };
      const media = browser.matchMedia?.(
        '(prefers-reduced-transparency: reduce)',
      );
      const contrast = browser.matchMedia?.('(prefers-contrast: more)');
      const update = () => publish(!!media?.matches || !!contrast?.matches);
      update();
      media?.addEventListener?.('change', update);
      contrast?.addEventListener?.('change', update);
      dispose = () => {
        media?.removeEventListener?.('change', update);
        contrast?.removeEventListener?.('change', update);
      };
    } else {
      let active = true;
      void AccessibilityInfo.isReduceTransparencyEnabled?.()
        .then(value => {
          if (active) publish(value);
        })
        .catch(() => {});
      const subscription = AccessibilityInfo.addEventListener(
        'reduceTransparencyChanged',
        publish,
      );
      dispose = () => {
        active = false;
        subscription.remove();
      };
    }
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      dispose?.();
      dispose = undefined;
    }
  };
}
export function useReducedTransparency() {
  return useSyncExternalStore(
    subscribe,
    () => reduced,
    () => false,
  );
}
