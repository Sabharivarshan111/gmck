import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The order of the Home screen's sections.
 *
 * Not shared with the web app: the web layout is a different set of blocks in
 * a different grid, so a shared key would mean one of them honouring an order
 * that was never chosen for it. The key is versioned for the same reason the
 * others are — adding a section later must not leave stored orders half-valid.
 */
const KEY = 'orbit:home-order-v1';

export const HOME_SECTIONS = ['hero', 'quick', 'whatsapp', 'subjects', 'stats'] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

/**
 * How big a block is drawn, as a multiplier. Dragged, not chosen from a list.
 *
 * The range is deliberately narrow. Past 1.3 a block stops fitting the width
 * it has; below 0.75 its text is something to squint at, and the answer to
 * "I want less of this" is then to shrink it further, not to keep scaling —
 * which is why anything under COMPACT_BELOW also drops the block's secondary
 * detail rather than just rendering it small.
 */
export const HOME_SCALE_MIN = 0.5;
export const HOME_SCALE_MAX = 1.0;
export const HOME_SCALE_DEFAULT = 1;
/** Below this a block sheds its secondary content instead of shrinking it. */
export const COMPACT_BELOW = 0.85;

export const HOME_SECTION_LABEL: Record<HomeSection, string> = {
  hero: 'Welcome card',
  quick: 'Quick actions',
  whatsapp: 'WhatsApp community',
  subjects: 'Your subjects',
  stats: 'Study stats',
};

/**
 * Reconcile a stored order against the sections that exist today.
 *
 * Preserves user's custom section exclusions (e.g. removed WhatsApp block)
 * while ensuring only valid sections are loaded.
 */
export function reconcileOrder(stored: unknown): HomeSection[] {
  const known = new Set<string>(HOME_SECTIONS);
  const seen = new Set<string>();
  const out: HomeSection[] = [];
  if (Array.isArray(stored)) {
    for (const value of stored) {
      if (typeof value === 'string' && known.has(value) && !seen.has(value)) {
        seen.add(value);
        out.push(value as HomeSection);
      }
    }
    if (out.length > 0) {
      return out;
    }
  }
  return [...HOME_SECTIONS];
}

function defaultScales(): Record<HomeSection, number> {
  return Object.fromEntries(
    HOME_SECTIONS.map(key => [key, HOME_SCALE_DEFAULT]),
  ) as Record<HomeSection, number>;
}

export function clampScale(value: number): number {
  if (!Number.isFinite(value)) {
    return HOME_SCALE_DEFAULT;
  }
  return Math.min(HOME_SCALE_MAX, Math.max(HOME_SCALE_MIN, Math.round(value * 100) / 100));
}

/** Anything unrecognised falls back to 1, which is what shipped. */
function reconcileScales(stored: unknown): Record<HomeSection, number> {
  const out = defaultScales();
  if (stored && typeof stored === 'object') {
    for (const key of HOME_SECTIONS) {
      const value = (stored as Record<string, unknown>)[key];
      if (typeof value === 'number') {
        out[key] = clampScale(value);
      }
    }
  }
  return out;
}

export function useHomeOrder() {
  const [order, setOrder] = useState<HomeSection[]>([...HOME_SECTIONS]);
  const [scales, setScales] = useState<Record<HomeSection, number>>(defaultScales);
  const [rendered, setRendered] = useState<HomeSection[]>([...HOME_SECTIONS]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(value => {
        if (!value) {
          return;
        }
        try {
          const parsed = JSON.parse(value);
          const next = reconcileOrder(Array.isArray(parsed) ? parsed : parsed?.order);
          setOrder(next);
          setRendered(next);
          setScales(reconcileScales(Array.isArray(parsed) ? null : parsed?.scales));
        } catch {
          // A corrupt entry should not stop Home from rendering.
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(
    (nextOrder: HomeSection[], nextScales: Record<HomeSection, number>) => {
      AsyncStorage.setItem(KEY, JSON.stringify({ order: nextOrder, scales: nextScales })).catch(
        () => {},
      );
    },
    [],
  );

  const save = useCallback(
    (next: HomeSection[]) => {
      setOrder(next);
      persist(next, scales);
    },
    [persist, scales],
  );

  const removeSection = useCallback(
    (id: HomeSection) => {
      const next = order.filter(key => key !== id);
      setOrder(next);
      persist(next, scales);
    },
    [order, persist, scales],
  );

  const setScale = useCallback(
    (section: HomeSection, scale: number, commit = true) => {
      setScales(previous => {
        const next = { ...previous, [section]: clampScale(scale) };
        if (commit) {
          persist(order, next);
        }
        return next;
      });
    },
    [order, persist],
  );

  const reset = useCallback(() => {
    const next = [...HOME_SECTIONS];
    setOrder(next);
    setRendered(next);
    setScales(defaultScales());
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return { order, rendered, scales, save, removeSection, setScale, reset };
}
