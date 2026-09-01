/**
 * The small maths the bot is made of.
 *
 * Ported from jeremy-prt/bloub (MIT, © 2026 Jérémy Perret), which recreates
 * the x.ai avatar. Comments are rewritten in English here rather than
 * translated, because restating each rule is how it gets understood rather
 * than copied — and this file's rules are the kind that look arbitrary until
 * somebody says what they are for.
 */

export const TAU = Math.PI * 2;

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const deg = (d: number) => (d * Math.PI) / 180;

/**
 * Exponential ease-outs, and no ease-in-out among them.
 *
 * Measured off the reference: every transition is an ease-out and **the body
 * never overshoots**. The only springy things are local — the notification
 * pip, the eyes opening — and they are written into the state that owns them
 * rather than made available here, so nothing acquires a bounce by accident.
 */
export const easings = {
  outCubic: (t: number) => 1 - (1 - t) ** 3,
  outQuint: (t: number) => 1 - (1 - t) ** 5,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
};

/**
 * Periodic 1-D noise: loops seamlessly over `period`.
 *
 * Three sine terms rather than one, because a single sine reads as a metronome
 * — and what this drives is a gaze drifting, which is the one motion that must
 * not look counted out.
 */
export function loopNoise(t: number, period: number, seed = 0): number {
  const p = (t / period) * TAU;
  return (
    0.55 * Math.sin(p + seed) +
    0.3 * Math.sin(2 * p + seed * 1.7 + 1.1) +
    0.15 * Math.sin(3 * p + seed * 2.3 + 2.4)
  );
}

/**
 * Two decimal places, and it is not cosmetic.
 *
 * Every number here ends up inside an SVG path string that crosses the bridge
 * to a native view. Rounding halves the length of that string, and nothing in
 * a refracted, hand-sized avatar can show the difference.
 */
export const r2 = (v: number) => Math.round(v * 100) / 100;
