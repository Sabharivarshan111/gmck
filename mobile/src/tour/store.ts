import AsyncStorage from '@react-native-async-storage/async-storage';
import type React from 'react';
import { useSyncExternalStore } from 'react';
import type { View } from 'react-native';

/** The measurable host instance behind a `<View>`, not the component type. */
type ViewHandle = React.ComponentRef<typeof View>;
import { STEPS, TOUR_TARGETS, type ChapterId, type TourStep } from './script';

/**
 * Whether the walkthrough is running, where it is up to, and where its
 * controls are on screen.
 *
 * A plain module with a listener set rather than a context, for the reason
 * `settings.ts` and `progress.ts` are: `Touchable` reads this on every press
 * and every layout, and there is a Touchable in every row of a five-hundred-row
 * list. A context whose value changed would re-render all of them.
 *
 * ## It is on this phone only
 *
 * Whether somebody has seen the walkthrough is not a fact about them worth
 * putting on a server, and there is no second device to keep in step: a fresh
 * install is a fresh phone and should get the tour again. `check:cloud-ids`
 * holds this file to that.
 */

const KEY = 'orbit:tour-v1';

/**
 * Bumped only when the tour changes enough that somebody who has seen it
 * should be shown it again. Adding a step is not that; a new tab is.
 */
const SCRIPT_VERSION = 1;

interface Stored {
  /** The script version whose run was finished or skipped. */
  seen: number;
}

export interface TourState {
  /** Null when nothing is running. */
  index: number | null;
  /**
   * True while something the reader *must* deal with is on top.
   *
   * A `<Modal>` is its own window, so nothing drawn in the app tree can be
   * above one — and the profile sheet on a fresh install is both a modal and
   * non-dismissable. Without this the tour's My Progress step would navigate
   * into a mandatory form, be buried by it, and leave a half-visible overlay
   * behind a control the reader cannot skip past.
   *
   * So the tour stands down instead of competing: it stops drawing and stops
   * navigating, keeps its place, and comes back when the gate is gone. That
   * ordering is also the honest one — a reader who has not said what year they
   * are in has nothing for the progress screen to show them yet.
   */
  paused: boolean;
  /** Steps this run will walk, in order. A chapter replay is a subset. */
  run: number[];
  /** False until AsyncStorage has answered, so nothing starts twice. */
  hydrated: boolean;
  /** True once the stored version says this phone has already had the tour. */
  seen: boolean;
}

let state: TourState = { index: null, run: [], hydrated: false, seen: false, paused: false };
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTourState(): TourState {
  return state;
}

export function useTourState(): TourState {
  useSyncExternalStore(subscribe, () => version, () => version);
  return state;
}

/**
 * The step showing right now, or null.
 *
 * Read by `Touchable` on every press, so it is a plain field read and not a
 * hook — the press path must not grow a subscription per control.
 */
export function currentStep(): TourStep | null {
  if (state.index === null) {
    return null;
  }
  const stepIndex = state.run[state.index];
  return stepIndex === undefined ? null : STEPS[stepIndex];
}

export function isTourRunning(): boolean {
  return state.index !== null;
}

export async function hydrateTour(): Promise<void> {
  let seen = false;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      seen = typeof parsed.seen === 'number' && parsed.seen >= SCRIPT_VERSION;
    }
  } catch {
    /*
     * An unreadable record counts as "not seen", which shows the tour again.
     * The other way round is worse: a first-run reader who is never offered it
     * has no way to discover that it exists, whereas a second showing is one
     * tap on Skip.
     */
  }
  state = { ...state, hydrated: true, seen };
  emit();
}

async function markSeen() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ seen: SCRIPT_VERSION } satisfies Stored));
  } catch {
    // A tour that cannot record itself will offer itself again next launch.
    // Mildly annoying, and strictly better than crashing on a full disk.
  }
}

/** Start the whole tour, or just one chapter. */
export function startTour(chapter?: ChapterId): void {
  const run = STEPS.map((step, index) => ({ step, index }))
    .filter(({ step }) => (chapter ? step.chapter === chapter : true))
    .map(({ index }) => index);
  if (run.length === 0) {
    return;
  }
  state = { ...state, index: 0, run };
  emit();
}

export function nextStep(): void {
  if (state.index === null) {
    return;
  }
  const next = state.index + 1;
  if (next >= state.run.length) {
    endTour();
    return;
  }
  state = { ...state, index: next };
  emit();
}

export function previousStep(): void {
  if (state.index === null || state.index === 0) {
    return;
  }
  state = { ...state, index: state.index - 1 };
  emit();
}

/**
 * Stop, and remember that this phone has been offered it.
 *
 * Skipping counts the same as finishing on purpose. Somebody who skipped has
 * told us they do not want it; showing it again next launch would be arguing
 * with them, and it is one tap away in Settings for as long as they want it.
 */
export function endTour(): void {
  state = { ...state, index: null, run: [], seen: true };
  emit();
  markSeen();
}

/**
 * Told by a blocking sheet that it is up, or gone.
 *
 * Called from the sheet itself rather than sniffed for by the overlay: there
 * is no way to ask React Native what modals are open, and a guess based on
 * measurement would be wrong the moment a new sheet was added.
 */
export function setTourPaused(paused: boolean): void {
  if (state.paused === paused) {
    return;
  }
  state = { ...state, paused };
  emit();
}

// ---- Where the controls are ------------------------------------------------

/**
 * Registered by `Touchable`, keyed by accessibility label.
 *
 * A **list** per label rather than one node, because two controls can share a
 * label honestly: the bottom bar's Notes tab and My Progress's Notes tab are
 * both called "Notes", and both are correct. Which one is meant is decided at
 * measure time by which one is actually on screen — an inactive tab screen is
 * detached by react-native-screens and measures as zero, so the wrong one
 * rules itself out without the script having to name a screen.
 */
const targets = new Map<string, Set<ViewHandle>>();

/** Whether this label is worth the cost of registering. Called on every layout. */
export function isTourTarget(label: string): boolean {
  return TOUR_TARGETS.has(label);
}

export function registerTourTarget(label: string, node: ViewHandle): void {
  let set = targets.get(label);
  if (!set) {
    set = new Set<ViewHandle>();
    targets.set(label, set);
  }
  set.add(node);
}

export function unregisterTourTarget(label: string, node: ViewHandle): void {
  const set = targets.get(label);
  if (!set) {
    return;
  }
  set.delete(node);
  if (set.size === 0) {
    targets.delete(label);
  }
}

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Measure a labelled control in window coordinates.
 *
 * Window and not screen: the overlay is an absolutely-positioned view filling
 * the app, so the two agree, and `measureInWindow` is the only one of the
 * measure family that does not need a reference node.
 *
 * Resolves null when nothing by that label is on screen, which is a normal
 * answer rather than a failure — the reader may have scrolled it away, or be
 * on another tab. The overlay turns that into a plain centred card.
 */
export async function measureTourTarget(label: string): Promise<TargetRect | null> {
  const set = targets.get(label);
  if (!set || set.size === 0) {
    return null;
  }
  const rects = await Promise.all(
    [...set].map(
      node =>
        new Promise<TargetRect | null>(resolve => {
          try {
            node.measureInWindow((x, y, width, height) => {
              resolve(
                Number.isFinite(x) && Number.isFinite(y) && width > 0 && height > 0
                  ? { x, y, width, height }
                  : null,
              );
            });
          } catch {
            resolve(null);
          }
        }),
    ),
  );
  return rects.find(rect => rect !== null) ?? null;
}

/**
 * Told by `Touchable` that a control was pressed, while the tour is running.
 *
 * Only the current step's own target advances anything. Any other press is
 * left alone: the hole is live so the reader can genuinely use the app during
 * the tour, and a tour that jumped forward because they tapped something else
 * would be worse than one that never moved.
 */
export function notifyTourPress(label: string): void {
  const step = currentStep();
  if (!step || !step.tapToAdvance || step.target !== label) {
    return;
  }
  /*
   * A beat, so the press does what it does before the card changes under it.
   * Tapping "Timer settings" opens a sheet; advancing on the same frame would
   * make the sheet and the next caption arrive together and read as one jump.
   */
  setTimeout(nextStep, 420);
}
