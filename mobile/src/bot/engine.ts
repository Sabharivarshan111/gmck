import { blinkScale, EYE_H, EYE_W, eyePoses, liveliness, type HeadGaze } from './face';
import { clamp, deg, easings, lerp, r2 } from './math';
import { isStill, STATES, type StateDef, type StateId } from './states';

/**
 * The avatar, as a pure function of the time.
 *
 * Derived from jeremy-prt/bloub (MIT, © 2026 Jérémy Perret). The architecture
 * is the part worth taking wholesale: `sample(t)` reads a clock and returns
 * everything needed to draw one frame, holding no state that the time does not
 * already determine. Which means the same `t` always gives the same picture —
 * so the whole thing is testable in Node with no DOM, no emulator and no
 * screenshot, which in this repo is a rare and valuable thing.
 *
 * ## The body is a circle
 *
 * The reference measured it: radial deviation under 0.7% from a perfect
 * circle, so the "squircle" everyone assumes is not there. That is why there
 * is no radial profile table here — the six states this app keeps all share
 * one silhouette, and the shapes that genuinely morph (egg, hexagon) were the
 * ones cut. A circle is two numbers, and drawing it as a 64-point polygon to
 * match a reference that is a circle would be cost with nothing bought.
 *
 * ## What it does not do
 *
 * It does not run at 60fps, and the scheduler above it must not let it. This
 * repo's focus tree states the rule: redrawing vector nodes every frame, for
 * minutes, is what makes a cheap phone unusable. A morph is a third of a
 * second; a blink is 140ms; the rest of the time the avatar is a still frame
 * that costs nothing. `isStill` is how the scheduler knows it may stop.
 */

export interface RenderedEye {
  /** The path's `d`, in the same units as the body. */
  d: string;
  /** An SVG `transform`, already composed. */
  transform: string;
  opacity: number;
}

export interface BotFrame {
  /** Centre and radius of the body, in viewBox units. */
  cx: number;
  cy: number;
  r: number;
  eyes: RenderedEye[];
  /** Which state this frame belongs to, for the caller's own logic. */
  state: StateId;
  /** True once the morph has landed and nothing further will change. */
  settled: boolean;
}

/** The body's radius at rest, in viewBox units. Everything is a fraction of it. */
export const RADIUS = 100;

/** Half the viewBox. The margin past the radius is where the float lives. */
export const HALF_BOX = 118;

interface Pose {
  gaze: HeadGaze;
  eyeW: number;
  eyeH: number;
  lids: [number, number];
  driftX: number;
  driftY: number;
  breath: number;
}

function poseFor(def: StateDef, elapsed: number, t: number): Pose {
  const life = liveliness(t, { wander: def.wander, blink: def.blink, float: def.float });

  /*
   * The sway is applied to the yaw only, and it is a sine rather than noise on
   * purpose: `thinking` should read as deliberate, and noise reads as
   * distracted. It is the one motion here that is meant to be regular.
   */
  const sway = def.sway ? Math.sin((elapsed / def.sway.period) * Math.PI * 2) * def.sway.amplitude : 0;

  return {
    gaze: {
      yaw: def.gaze.yaw + life.dYaw + sway,
      pitch: def.gaze.pitch + life.dPitch,
      roll: def.gaze.roll + life.dRoll,
    },
    eyeW: def.eyeW,
    eyeH: def.eyeH,
    /*
     * The state's lid multiplied by the automatic blink, not replaced by it.
     * A wink whose open eye never blinks looks taxidermied; a wink whose shut
     * eye re-opens because a blink ended is worse.
     */
    lids: [def.lids[0] * life.lid, def.lids[1] * life.lid],
    driftX: life.driftX,
    driftY: life.driftY,
    breath: life.breath,
  };
}

function blendPose(from: Pose, to: Pose, k: number): Pose {
  return {
    gaze: {
      yaw: lerp(from.gaze.yaw, to.gaze.yaw, k),
      pitch: lerp(from.gaze.pitch, to.gaze.pitch, k),
      roll: lerp(from.gaze.roll, to.gaze.roll, k),
    },
    eyeW: lerp(from.eyeW, to.eyeW, k),
    eyeH: lerp(from.eyeH, to.eyeH, k),
    lids: [lerp(from.lids[0], to.lids[0], k), lerp(from.lids[1], to.lids[1], k)],
    driftX: lerp(from.driftX, to.driftX, k),
    driftY: lerp(from.driftY, to.driftY, k),
    breath: lerp(from.breath, to.breath, k),
  };
}

/**
 * One eye, as a capsule with its tangent frame baked into a transform.
 *
 * The capsule is drawn upright and centred on the origin, then placed by the
 * matrix — so the leaning, the foreshortening and the position all come from
 * the sphere rather than from three separate fudge factors. The vertical
 * squash of a blink is composed *after* it, on the y outputs only, because a
 * blink is a screen-space squash and folding it into the matrix shrinks the
 * capsule along its own leaning axis instead.
 */
function renderEye(
  pose: Pose,
  index: 0 | 1,
  scale: number,
  cx: number,
  cy: number,
): RenderedEye {
  const [inner, outer] = eyePoses(pose.gaze, scale);
  const eye = index === 0 ? inner : outer;

  /*
   * The far eye is narrower because it is on a sphere, and `depth` is exactly
   * how much. Clamped away from zero so an extreme gaze leaves a sliver rather
   * than a mathematically correct nothing, which reads as a missing eye.
   */
  const squash = clamp(Math.abs(eye.depth), 0.18, 1);

  const halfW = (EYE_W * scale * pose.eyeW * squash) / 2;
  const halfH = (EYE_H * scale * pose.eyeH) / 2;
  const lid = blinkScale(pose.lids[index]);

  // A capsule: two vertical sides closed by semicircular caps.
  const d =
    `M${r2(-halfW)} ${r2(-halfH + halfW)}` +
    `A${r2(halfW)} ${r2(halfW)} 0 0 1 ${r2(halfW)} ${r2(-halfH + halfW)}` +
    `L${r2(halfW)} ${r2(halfH - halfW)}` +
    `A${r2(halfW)} ${r2(halfW)} 0 0 1 ${r2(-halfW)} ${r2(halfH - halfW)}Z`;

  const x = cx + eye.x + pose.driftX * scale;
  const y = cy + eye.y + pose.driftY * scale;

  const transform =
    `translate(${r2(x)} ${r2(y)}) ` +
    `matrix(${r2(eye.a)} ${r2(eye.b * lid)} ${r2(eye.c)} ${r2(eye.d * lid)} 0 0)`;

  return {
    d,
    transform,
    /*
     * An eye on the far side of the sphere fades rather than popping out of
     * existence. It never reaches zero within any gaze these states use; the
     * term is here so that a future one cannot produce a hard edge.
     */
    opacity: r2(clamp(0.25 + eye.depth * 1.6, 0, 1)),
  };
}

export class BotEngine {
  private current: StateId = 'idle';
  private previous: StateId | null = null;
  /** When the current state began, on the same clock `sample` is given. */
  private since = 0;

  /*
   * A plain field rather than a constructor parameter property. The latter is
   * a TypeScript *transform* rather than an annotation, so Node cannot simply
   * erase it — and being runnable under `--experimental-strip-types` is what
   * lets `check:bot` execute this exact file instead of a compiled copy that
   * could drift from it.
   */
  private readonly scale: number;

  constructor(scale: number = RADIUS) {
    this.scale = scale;
  }

  get state(): StateId {
    return this.current;
  }

  /**
   * Change state, as of `now`.
   *
   * Re-entering the state already showing is ignored rather than restarted:
   * a second "thinking" while thinking would otherwise snap the head back to
   * the start of its sway.
   */
  setState(next: StateId, now: number): void {
    if (next === this.current) {
      return;
    }
    this.previous = this.current;
    this.current = next;
    this.since = now;
  }

  /**
   * Whether the frame at `now` is the last one that will ever change.
   *
   * A glance does not un-settle anything: it is a step, applied whole, and
   * the caller re-samples when it changes. Treating it as motion would keep
   * the loop alive for as long as the keyboard was open.
   */
  settledAt(now: number): boolean {
    const def = STATES[this.current];
    return now - this.since >= def.morph && isStill(this.current);
  }

  /**
   * Where the bot is looking, when something outside is steering it.
   *
   * On the web the reference follows the pointer. A phone has none, so what
   * steers it here is what the reader is *doing*: while the composer has
   * focus, the bot looks down at it. That is a better answer than a cursor
   * would be, because on a phone the thing worth watching is the thing being
   * typed.
   *
   * Degrees, added to whatever the state's own pose says, and clamped — an
   * unbounded offset would let a caller push the eyes off the sphere, which
   * the engine's own check would then catch as an eye outside the body.
   */
  private glance: { yaw: number; pitch: number } = { yaw: 0, pitch: 0 };

  setGlance(yaw: number, pitch: number): void {
    this.glance = { yaw: clamp(yaw, -22, 22), pitch: clamp(pitch, -22, 22) };
  }

  sample(now: number): BotFrame {
    const def = STATES[this.current];
    const elapsed = Math.max(0, now - this.since);

    let pose = poseFor(def, elapsed, now);

    /*
     * The morph. `easeOutQuint`, and the ratio is clamped — reading a time
     * *before* the state changed would give a negative ratio, which an ease-out
     * happily extrapolates, and the face would fly somewhere no state defines.
     * The previous state is never discarded, so an earlier time can still be
     * replayed correctly; that is the optimisation that looks free and is not.
     */
    if (this.previous && elapsed < def.morph) {
      const from = poseFor(STATES[this.previous], elapsed, now);
      pose = blendPose(from, pose, easings.outQuint(clamp(elapsed / def.morph)));
    }

    /*
     * Applied after the morph blend, not before it. Blending a glance would
     * make the offset arrive gradually, and the eyes would lag behind the
     * keyboard opening by the length of whatever morph happened to be running.
     */
    pose = {
      ...pose,
      gaze: {
        ...pose.gaze,
        yaw: pose.gaze.yaw + this.glance.yaw,
        pitch: pose.gaze.pitch + this.glance.pitch,
      },
    };

    const cx = HALF_BOX;
    const cy = HALF_BOX;
    const r = this.scale * pose.breath;

    return {
      cx: r2(cx),
      cy: r2(cy),
      r: r2(r),
      eyes: [renderEye(pose, 0, this.scale, cx, cy), renderEye(pose, 1, this.scale, cx, cy)],
      state: this.current,
      settled: this.settledAt(now),
    };
  }
}

/** Degrees to radians, re-exported so callers steering the gaze need one import. */
export { deg };
