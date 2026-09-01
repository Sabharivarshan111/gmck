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

/**
 * How tall a block is drawn, as a multiplier of the height its content needs.
 *
 * A second axis, because width alone could not do the job the side and bottom
 * grips advertise: both used to drive `scales`, so dragging the *bottom* bar
 * made the block narrower and never taller, and the control did the opposite
 * of what it showed.
 *
 * **Grow-only, and deliberately.** Height is applied as a `minHeight`, so the
 * block can be given more room than its content needs but never less — there
 * is no honest way to make a card shorter than the words inside it except by
 * cutting them off, and "I want less of this" is what the width axis and the
 * bin are for.
 */
/**
 * Where a block sits across the width: 0 hard left, 0.5 centred, 1 hard right.
 *
 * It only means anything once a block has been made narrower than the page —
 * a full-width block has nowhere to go — which is exactly when it was asked
 * for: shrink the Welcome card and it sat marooned in the middle with empty
 * space either side, and there was no way to push it into a corner.
 *
 * A fraction of the *free* space rather than an absolute offset, so the
 * placement survives resizing the block afterwards: a block pinned left stays
 * left whatever width it is given next.
 */
export const HOME_ALIGN_DEFAULT = 0.5;

export const HOME_HEIGHT_MIN = 1;
export const HOME_HEIGHT_MAX = 1.8;
export const HOME_HEIGHT_DEFAULT = 1;

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

function defaultHeights(): Record<HomeSection, number> {
  return Object.fromEntries(
    HOME_SECTIONS.map(key => [key, HOME_HEIGHT_DEFAULT]),
  ) as Record<HomeSection, number>;
}

export function clampAlign(value: number): number {
  if (!Number.isFinite(value)) {
    return HOME_ALIGN_DEFAULT;
  }
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

export function clampHeight(value: number): number {
  if (!Number.isFinite(value)) {
    return HOME_HEIGHT_DEFAULT;
  }
  return Math.min(
    HOME_HEIGHT_MAX,
    Math.max(HOME_HEIGHT_MIN, Math.round(value * 100) / 100),
  );
}

function defaultAligns(): Record<HomeSection, number> {
  return Object.fromEntries(
    HOME_SECTIONS.map(key => [key, HOME_ALIGN_DEFAULT]),
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

/**
 * Heights read back the same way. A layout stored before this axis existed has
 * no `heights` key at all and lands on 1 for every block, which is the size it
 * was already being drawn at — so nobody's arrangement changes under them.
 */
/**
 * Placements read back, with anything missing centred.
 *
 * An install from before this existed has no `aligns` key and lands on 0.5 for
 * every block, which is where they have always been drawn.
 */
function reconcileAligns(stored: unknown): Record<HomeSection, number> {
  const next = defaultAligns();
  if (stored && typeof stored === 'object') {
    for (const key of HOME_SECTIONS) {
      const value = (stored as Record<string, unknown>)[key];
      if (typeof value === 'number') {
        next[key] = clampAlign(value);
      }
    }
  }
  return next;
}

function reconcileHeights(stored: unknown): Record<HomeSection, number> {
  const out = defaultHeights();
  if (stored && typeof stored === 'object') {
    for (const key of HOME_SECTIONS) {
      const value = (stored as Record<string, unknown>)[key];
      if (typeof value === 'number') {
        out[key] = clampHeight(value);
      }
    }
  }
  return out;
}

export function useHomeOrder() {
  const [order, setOrder] = useState<HomeSection[]>([...HOME_SECTIONS]);
  const [scales, setScales] = useState<Record<HomeSection, number>>(defaultScales);
  const [heights, setHeights] = useState<Record<HomeSection, number>>(defaultHeights);
  const [aligns, setAligns] = useState<Record<HomeSection, number>>(defaultAligns);

  /**
   * The order the blocks are rendered in, which is kept equal to `order`.
   *
   * `Reorderable` uses `translateY` offsets to *preview* a move while a finger
   * is down, and normal flow layout for everything else. It is tempting to
   * make the offsets the permanent truth and never re-render — that is what
   * the code did — but the offsets are a running sum of measured block
   * heights, and a measured height excludes the block's own margin. Flow
   * layout does not. Every commit therefore left each block out by the margins
   * between it and its old slot: a screen-high hole above the Welcome card and
   * the WhatsApp strip drawn through the middle of it.
   *
   * So the list re-renders and the offsets are zeroed in the same commit. They
   * agree because only one of them is ever in charge.
   */
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
          setHeights(reconcileHeights(Array.isArray(parsed) ? null : parsed?.heights));
          setAligns(reconcileAligns(Array.isArray(parsed) ? null : parsed?.aligns));
        } catch {
          // A corrupt entry should not stop Home from rendering.
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(
    (
      nextOrder: HomeSection[],
      nextScales: Record<HomeSection, number>,
      nextHeights: Record<HomeSection, number>,
      nextAligns: Record<HomeSection, number>,
    ) => {
      AsyncStorage.setItem(
        KEY,
        JSON.stringify({
          order: nextOrder,
          scales: nextScales,
          heights: nextHeights,
          aligns: nextAligns,
        }),
      ).catch(() => {});
    },
    [],
  );

  const save = useCallback(
    (next: HomeSection[]) => {
      setOrder(next);
      setRendered(next);
      persist(next, scales, heights, aligns);
    },
    [aligns, heights, persist, scales],
  );

  const removeSection = useCallback(
    (id: HomeSection) => {
      const next = order.filter(key => key !== id);
      setOrder(next);
      setRendered(next);
      persist(next, scales, heights, aligns);
    },
    [aligns, heights, order, persist, scales],
  );

  const setScale = useCallback(
    (section: HomeSection, scale: number, commit = true) => {
      setScales(previous => {
        const next = { ...previous, [section]: clampScale(scale) };
        if (commit) {
          persist(order, next, heights, aligns);
        }
        return next;
      });
    },
    [aligns, heights, order, persist],
  );

  const setHeightScale = useCallback(
    (section: HomeSection, scale: number, commit = true) => {
      setHeights(previous => {
        const next = { ...previous, [section]: clampHeight(scale) };
        if (commit) {
          persist(order, scales, next, aligns);
        }
        return next;
      });
    },
    [aligns, order, persist, scales],
  );

  const setAlign = useCallback(
    (section: HomeSection, align: number, commit = true) => {
      setAligns(previous => {
        const next = { ...previous, [section]: clampAlign(align) };
        if (commit) {
          persist(order, scales, heights, next);
        }
        return next;
      });
    },
    // Not `aligns`: this reads the previous value through the updater, which is
    // what keeps the identity stable while a finger is dragging the block —
    // a new callback every frame would replace the responder mid-gesture.
    [heights, order, persist, scales],
  );

  const reset = useCallback(() => {
    const next = [...HOME_SECTIONS];
    setOrder(next);
    setRendered(next);
    const defScales = defaultScales();
    const defHeights = defaultHeights();
    const defAligns = defaultAligns();
    setScales(defScales);
    setHeights(defHeights);
    setAligns(defAligns);
    persist(next, defScales, defHeights, defAligns);
  }, [persist]);

  return {
    order,
    rendered,
    scales,
    heights,
    aligns,
    save,
    removeSection,
    setScale,
    setHeightScale,
    setAlign,
    reset,
  };
}
