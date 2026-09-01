import type { HeadGaze } from './face';

/**
 * The six the chat actually has something to say with.
 *
 * The reference (jeremy-prt/bloub, MIT) carries fifteen — orbit, swirl, burst,
 * comet, egg, hexagon, play, notify, alert as well as these. They are a
 * showcase, and they are also where its particle and arc renderers live, which
 * is most of its cost. A study app does not need a bot doing tricks, and every
 * state kept here is one the chat can genuinely be *in*:
 *
 * | state     | when                                            |
 * |-----------|-------------------------------------------------|
 * | `idle`    | resting — blink and gaze drift, no body morph    |
 * | `thinking`| a request is in flight; this *is* the spinner    |
 * | `wide`    | an answer landed — one beat, then back to idle   |
 * | `wink`    | the reader got an MCQ right                      |
 * | `exclaim` | an error, or offline                             |
 * | `sleep`   | screen unfocused or app backgrounded             |
 *
 * `sleep` is also the cheapest: lids shut, no wander, no float. That matters
 * more than it looks, because it is the state the bot spends most of its life
 * in and the one where it must cost nothing at all.
 */
export type StateId = 'idle' | 'thinking' | 'wide' | 'wink' | 'exclaim' | 'sleep';

export interface StateDef {
  id: StateId;
  /** How long the morph into this state takes, in seconds. */
  morph: number;
  /** Where the head points while here. */
  gaze: HeadGaze;
  /** Eye size, as a multiple of the resting size. */
  eyeW: number;
  eyeH: number;
  /**
   * Per-eye lid, so an expression can be asymmetric.
   *
   * This is the whole of `wink`: one lid at 0 and the other at 1. Building it
   * as a separate state with its own geometry would have been a second way to
   * say the same thing, and the two would have drifted.
   */
  lids: [number, number];
  /** How much of the resting drift survives. 0 pins the gaze still. */
  wander: number;
  /** Whether the automatic blink runs at all. */
  blink: boolean;
  /** Whether the body breathes. */
  float: boolean;
  /**
   * A slow rocking of the head while in this state, degrees and seconds.
   *
   * Only `thinking` uses it, and it is the entire reason the state reads as
   * thinking rather than as waiting: a still face with a spinner beside it is
   * a spinner. `null` means the head holds its pose.
   */
  sway: { amplitude: number; period: number } | null;
}

const REST_EYES: [number, number] = [1, 1];

export const STATES: Record<StateId, StateDef> = {
  idle: {
    id: 'idle',
    morph: 0.42,
    gaze: { yaw: 28.49, pitch: 28.62, roll: -13 },
    eyeW: 1,
    eyeH: 1,
    lids: REST_EYES,
    wander: 1,
    blink: true,
    float: true,
    sway: null,
  },

  /**
   * Looking away and up, which is where people look when they are working
   * something out — and the one state whose gaze is deliberately *not* at the
   * reader. Eyes narrow slightly; the head rocks.
   */
  thinking: {
    id: 'thinking',
    morph: 0.34,
    gaze: { yaw: 41, pitch: 34, roll: -17 },
    eyeW: 0.97,
    eyeH: 0.74,
    lids: REST_EYES,
    // Some drift, but less: a mind on a problem is not idly looking round.
    wander: 0.45,
    blink: true,
    float: true,
    sway: { amplitude: 7.5, period: 2.6 },
  },

  /** The answer landed. Eyes open wider and come back to the reader. */
  wide: {
    id: 'wide',
    morph: 0.22,
    gaze: { yaw: 18, pitch: 20, roll: -8 },
    eyeW: 1.12,
    eyeH: 1.24,
    lids: REST_EYES,
    wander: 0.8,
    blink: true,
    float: true,
    sway: null,
  },

  /** One lid down. The automatic blink is off, or it fights the wink. */
  wink: {
    id: 'wink',
    morph: 0.18,
    gaze: { yaw: 22, pitch: 24, roll: -16 },
    eyeW: 1.04,
    eyeH: 1.06,
    lids: [1, 0.06],
    wander: 0.6,
    blink: false,
    float: true,
    sway: null,
  },

  /**
   * Something went wrong. Wide, level, and looking straight at the reader —
   * the one expression here that must not be charming, because it appears when
   * the app has failed to do the thing that was asked.
   */
  exclaim: {
    id: 'exclaim',
    morph: 0.16,
    gaze: { yaw: 6, pitch: 10, roll: 0 },
    eyeW: 1.2,
    eyeH: 1.3,
    lids: REST_EYES,
    wander: 0.2,
    blink: true,
    float: true,
    sway: null,
  },

  /**
   * Shut. No wander, no blink, no float — nothing moves and nothing is
   * computed, which is the point: this is where the bot spends most of its
   * life, and the scheduler stops entirely once the morph into it has landed.
   */
  sleep: {
    id: 'sleep',
    morph: 0.5,
    gaze: { yaw: 24, pitch: 14, roll: -10 },
    eyeW: 1,
    eyeH: 1,
    lids: [0.04, 0.04],
    wander: 0,
    blink: false,
    float: false,
    sway: null,
  },
};

/** Whether anything in this state moves once its morph has finished. */
export function isStill(state: StateId): boolean {
  const def = STATES[state];
  return !def.blink && !def.float && def.wander === 0 && def.sway === null;
}
