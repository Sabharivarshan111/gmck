import { clamp, deg, loopNoise } from './math';

/**
 * The eyes are painted on a sphere, not laid on a disc.
 *
 * Ported from jeremy-prt/bloub (MIT, © 2026 Jérémy Perret). The measurement
 * that settles it is in the original and is worth repeating, because it is
 * what stops this being a pair of ovals that lean: on the reference, the eye
 * nearer the edge is 0.69 times the width of the other and 0.663 times its
 * area — which is exactly the depth factor (z = 0.669) of a point on a sphere
 * at that distance from the centre. So the model is a real head orientation:
 * each eye takes the sphere's tangent frame at its own position and is
 * projected orthographically. The squash and the lean fall out of that on
 * their own, and that is where the volume comes from.
 *
 * The constants below were fitted to positions measured frame by frame, not
 * chosen by eye. Changing one to taste undoes the fit.
 */

type Vec3 = [number, number, number];

/** Half the angular gap between the eyes, in degrees. Total separation ~31°. */
export const EYE_SPLIT = 15.46;

/** Eye size at rest, in units of the body's radius. */
export const EYE_W = 0.186;
export const EYE_H = 0.412;

/** Resting head orientation, fitted to the reference frames. */
export const REST_GAZE: HeadGaze = { yaw: 28.49, pitch: 28.62, roll: -13 };

export interface HeadGaze {
  /** Yaw, degrees. Positive looks right. */
  yaw: number;
  /** Pitch, degrees. Positive looks up. */
  pitch: number;
  /** Roll, degrees. The head tilting in its own plane. */
  roll: number;
}

export interface EyePose {
  x: number;
  y: number;
  /** The 2×2 tangent matrix, in the sense of SVG `matrix(a,b,c,d,e,f)`. */
  a: number;
  b: number;
  c: number;
  d: number;
  /** The normal's z component. Positive means this face is towards us. */
  depth: number;
}

/** Rotate two vectors of an orthonormal frame within their shared plane. */
function spin(u: Vec3, v: Vec3, angle: number): [Vec3, Vec3] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s],
    [v[0] * c - u[0] * s, v[1] * c - u[1] * s, v[2] * c - u[2] * s],
  ];
}

/**
 * The head's frame, then each eye's.
 *
 * Screen axes: x right, y **down**, z towards the viewer. Index 0 is the inner
 * eye, index 1 the outer one.
 */
export function eyePoses(gaze: HeadGaze, scale: number, split = EYE_SPLIT): [EyePose, EyePose] {
  let forward: Vec3 = [0, 0, 1];
  let right: Vec3 = [1, 0, 0];
  let down: Vec3 = [0, 1, 0];

  // Yaw tips forward towards right; pitch tips forward away from down; roll
  // leans the head in its own plane. Order matters — these are not commutative.
  [forward, right] = spin(forward, right, deg(gaze.yaw));
  [down, forward] = spin(down, forward, deg(gaze.pitch));
  [right, down] = spin(right, down, deg(gaze.roll));

  const build = (side: number): EyePose => {
    const [eyeForward, eyeRight] = spin(forward, right, deg(split * side));
    return {
      x: eyeForward[0] * scale,
      y: eyeForward[1] * scale,
      a: eyeRight[0],
      b: eyeRight[1],
      c: down[0],
      d: down[1],
      depth: eyeForward[2],
    };
  };

  return [build(-1), build(1)];
}

/**
 * When the eyes close, over the app's lifetime.
 *
 * A fixed schedule rather than a random one, because `sample(t)` has to be a
 * pure function of the time: pausing, resuming, or jumping to an arbitrary
 * moment must all give the same picture. A blink drawn from a generator would
 * make the avatar unreproducible and the check below impossible.
 *
 * Human blink spacing is irregular, so the gaps are too — and they are chosen
 * to be mutually prime-ish, so the pattern does not settle into a rhythm.
 */
const BLINK_DUR = 0.14;
const BLINKS = [1.9, 5.3, 6.1, 11.4, 15.8, 16.6, 22.3, 27.9, 31.2, 32.0, 38.7, 44.1];
/** The schedule loops, so the bot keeps blinking past the last entry. */
const BLINK_CYCLE = 48;

function blinkLid(t: number): number {
  const at = ((t % BLINK_CYCLE) + BLINK_CYCLE) % BLINK_CYCLE;
  for (const start of BLINKS) {
    const k = (at - start) / BLINK_DUR;
    if (k >= 0 && k <= 1) {
      // Shuts fast, opens a little slower. The other way round reads as a
      // flinch rather than a blink.
      return k < 0.45 ? 1 - k / 0.45 : (k - 0.45) / 0.55;
    }
  }
  return 1;
}

export interface Liveliness {
  dYaw: number;
  dPitch: number;
  dRoll: number;
  lid: number;
  driftX: number;
  driftY: number;
  breath: number;
}

export interface LivelinessOptions {
  wander?: number;
  blink?: boolean;
  float?: boolean;
}

/**
 * Life at rest: a slow gaze drift, and blinking.
 *
 * A pure function of the time, with no internal state, for the reason above.
 * The values are **offsets** to add to the current state's pose, never a pose
 * of their own.
 *
 * The periods are mutually prime so the drift never visibly repeats. And the
 * body barely moves at all — on the reference its centre is stable to ±0.003
 * and its radius is constant — so all the life is in the gaze and the blink,
 * with just enough float left to stop the picture looking frozen.
 */
export function liveliness(t: number, opt: LivelinessOptions = {}): Liveliness {
  const { wander = 1, blink = true, float = true } = opt;
  return {
    dYaw: (loopNoise(t, 11.3, 0.4) * 5.5 + loopNoise(t, 3.7, 2.1) * 1.6) * wander,
    dPitch: (loopNoise(t, 9.1, 1.3) * 4.2 + loopNoise(t, 4.3, 0.7) * 1.3) * wander,
    dRoll: loopNoise(t, 13.7, 3.2) * 2.2 * wander,
    lid: blink ? blinkLid(t) : 1,
    driftX: float ? loopNoise(t, 7.9, 1.9) * 0.006 : 0,
    driftY: float ? loopNoise(t, 5.3, 0.3) * 0.007 : 0,
    // Width stays constant; only the height breathes, and barely.
    breath: float ? 1 + Math.sin((t / 3.4) * Math.PI * 2) * 0.005 : 1,
  };
}

/**
 * A blink is a **vertical** squash in screen space, around the eye's centre.
 *
 * Measured: the bounding box keeps its width and its height falls to about
 * 0.35. It is not a shrink along the capsule's own leaning axis, which is what
 * you get if you fold it into the tangent matrix — so it is composed *after*
 * that matrix and touches only the y outputs.
 */
export function blinkScale(lid: number): number {
  return 0.06 + 0.94 * clamp(lid);
}
