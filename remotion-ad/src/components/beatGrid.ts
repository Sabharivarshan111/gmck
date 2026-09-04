/**
 * Where a frame sits inside the music, for the two cuts that are edited to it.
 *
 * The shot boundaries are already on the grid — `resolveShotFrames` puts them
 * there. This is the other half: it lets what happens *inside* a shot move on
 * the same beats, so the caption punches, the device breathes and the room
 * lights on the same pulse the cut lands on. Motion that continues across a
 * cut is what makes a montage read as one film rather than as a slideshow, and
 * a shared grid is the cheapest way to get it.
 *
 * `originFrame` is how many frames of the grid have already gone by at the
 * shot's own frame 0, so every shot measures against the track rather than
 * against itself. Without it, a shot that starts on beat 37 would pulse as
 * though it started on beat 0 and the two would drift apart within a bar.
 */
export interface BeatClock {
  /** Frames per beat at this ad's tempo. Not always a whole number. */
  perBeat: number;
  /** Frames of grid elapsed before this shot's local frame 0. */
  originFrame: number;
}

/** Beats elapsed since the track's first downbeat, fractional. */
export const beatPosition = (frame: number, clock: BeatClock): number =>
  (frame + clock.originFrame) / clock.perBeat;

/**
 * How hard the music is hitting right now: 1 exactly on a beat, decaying to 0
 * about a third of a beat later.
 *
 * Decay rather than a square pulse, because a value that snaps back to zero
 * makes everything driven by it flicker. This is an envelope, and it is the
 * same shape `make-beds.py` gives the sub pulse it is following.
 */
export const beatEnergy = (frame: number, clock: BeatClock): number => {
  const phase = beatPosition(frame, clock) % 1;
  const fall = Math.max(0, 1 - phase * 3.2);
  return fall * fall * fall;
};

/** True on the first beat of a bar, counting bars of four from the downbeat. */
export const isDownbeat = (frame: number, clock: BeatClock): boolean =>
  Math.floor(beatPosition(frame, clock)) % 4 === 0;
