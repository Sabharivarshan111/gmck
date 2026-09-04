/**
 * A shot is 3.0 seconds — 90 frames at 30fps — and an ad is 30 of them.
 *
 * The three ads differ only in this data. The motion engine is shared, so a
 * fix to the camera or the caption safe-zone lands in all three at once, which
 * is the whole reason the timeline is not written out three times.
 */
export const FPS = 30;
export const SHOT_FRAMES = 90;
export const SHOT_COUNT = 30;
export const TOTAL_FRAMES = SHOT_FRAMES * SHOT_COUNT; // 2700 = 90.0s

/**
 * A Reels cut is exactly 60 seconds — 1,800 frames at 30fps.
 *
 * This is a *second* format, not a re-timing of the first. The long-form ads
 * are paced by their own recorded audio (`dynamicScriptTimings.ts` measures
 * every clip and stretches the shot to fit), which is right when the video can
 * be as long as it needs to be and wrong when the platform is the one holding
 * the stopwatch. Instagram trims, and a 60.4-second reel loses its call to
 * action.
 *
 * So a reel declares `frames` on every shot and those frames must add up to
 * exactly this. `npm run preflight` fails if they do not — a reel that is four
 * frames long in the wrong direction is not something to discover in the
 * upload dialog.
 */
export const REEL_FRAMES = 1800; // 60.0s

/**
 * How the camera treats the device during a shot.
 *
 * Every one of these is applied to the *device container*, never to the screen
 * content inside it. Scaling the inner <Img> is what cropped the nav bar and
 * pushed text under the Dynamic Island last time.
 */
export type CameraMove =
  | 'hero'        // gentle floating wide, slight 3D perspective
  | 'push'        // smooth push-in
  | 'pull'        // pull-back reveal
  | 'trackLeft'   // lateral glide
  | 'trackRight'
  | 'glideDown'   // vertical travel down a long screen
  | 'orbit'       // orbital rotation around Y
  | 'macro'       // close on one region, background softens
  | 'settle';     // arrives and gently overshoots to rest

export interface Shot {
  /** 1-30, for readability against the script document. */
  n: number;
  /**
   * Key into the screen registry, or a plate filename. `null` renders the
   * device dark — used only for the cold-open beats.
   */
  screen: string | null;
  camera: CameraMove;
  /** Big kinetic headline. Kept to a few words; it is not the voiceover. */
  text: string;
  /**
   * The spoken line. 7-11 words so it lands in 1.8-2.4s and leaves air.
   *
   * Optional, because the two subtitle-led reels have nothing spoken at all —
   * their `text` is the whole message. A shot on a script that IS spoken must
   * have one, and `preflight` fails a script where that is not true rather
   * than letting a shot go quietly silent.
   */
  vo?: string;
  /**
   * Which vertical slice of a tall screenshot to favour, 0 = top, 1 = bottom.
   * The camera frames the device; this only chooses what the device is
   * currently scrolled to, which is a property of the screen, not the camera.
   */
  focus?: number;
  /** Accent that lights the background mesh and the rim for this shot. */
  accent?: string;
  /**
   * Exactly how long this shot runs, in frames.
   *
   * Only the reels set it. When it is absent the shot is timed from the
   * measured-audio table, which is what the three long-form ads do and must
   * keep doing — setting this on one of them would override the measurement
   * and clip its own voiceover.
   *
   * A script that declares a `bpm` sets `beats` instead and never this: the
   * frames are derived from the beat grid, so writing both would be two
   * answers to one question and the grid would win silently.
   */
  frames?: number;
  /**
   * How long this shot runs, in **beats of the script's `bpm`**.
   *
   * This is the unit a beat-synced cut is actually authored in — 4 beats is
   * one bar and reads as a held idea, 2 beats is a snap, 8 is a breath. See
   * `resolveShotFrames` for how it becomes frames, and
   * `.agents/video/BEAT-SYNC.md` for the contract the owner uses when they
   * swap the music.
   */
  beats?: number;
  /**
   * A two-or-three word label above the caption, saying where in the app this
   * lives ("QUESTION BANK", "FOCUS TIMER").
   *
   * Only the subtitle-led ads use it. With no voice to say "open the timer",
   * the kicker is what stops every shot reading as a screenshot of the same
   * app with different words under it.
   */
  kicker?: string;
  /**
   * Where the mascot stands in this shot.
   *
   * `hero` gives it the frame to itself — no device at all — which is what the
   * open and the close are. `guide` keeps the device as the subject and puts
   * the mascot in the lower-left corner, in front of it, presenting: it is the
   * recurring figure, not a sticker in one shot. Absent means no mascot, which
   * is every shot of every ad that does not have one.
   */
  mascot?: 'hero' | 'guide';
}

export interface AdScript {
  id: string;
  title: string;
  /**
   * Edge-TTS voice; never a *MultilingualNeural one.
   *
   * Optional only because a `noVoice` script has nothing to speak. Preflight
   * fails a script that has neither a voice nor `noVoice`, so "I forgot to set
   * the voice" can never be mistaken for "this ad is deliberately silent".
   */
  voice?: string;
  rate?: string;
  pitch?: string;
  /**
   * This ad has no spoken track at all, by design.
   *
   * Not the same thing as the `-silent` cut of a voiced reel: that one has an
   * mp3 per shot which the mix leaves out, and it exists so one edit ships in
   * two mixes. A `noVoice` script was never written to be spoken — the
   * captions are the argument — so `voice-manifest` does not list it,
   * `synthesize.py` never records it, and `preflight` does not demand clips
   * that were never meant to exist.
   */
  noVoice?: boolean;
  /**
   * `longform` is the 90-second standalone ad: audio-paced shots, karaoke
   * captions, no music bed. `reel` is the 60-second vertical cut: fixed
   * frames, one bold headline per shot in the platform's safe band, and a
   * music bed under everything so the silent cut is still a film.
   *
   * Absent means `longform`, which is what keeps the three shipped ads
   * byte-identical to what they render today.
   */
  format?: 'longform' | 'reel';
  /**
   * Music bed, relative to `public/`. Generated by `scripts/make-beds.py` —
   * see `.agents/video/REEL-RESEARCH.md` for why it is synthesised rather
   * than sourced. Only the reels carry one.
   */
  music?: string;
  /**
   * The tempo the edit is cut to, in beats per minute.
   *
   * **This is the one number the owner changes to fit their own track.** When
   * it is set, every shot's length is written in `beats` and the frames are
   * derived, so a bed at this tempo has a cut on a beat and nothing else does.
   * See `.agents/video/BEAT-SYNC.md`.
   *
   * Absent means the shots declare raw `frames` — which is what the first
   * three reels do, and they are not touched by any of this.
   */
  bpm?: number;
  /**
   * Frames of lead-in before the track's first downbeat.
   *
   * A synthesised bed starts on beat one at sample zero, so this is 0 and the
   * grid starts with the film. A recording the owner drops in may have a
   * pickup, a count-in or a moment of room tone first; this shifts the whole
   * grid by that much so the cuts land on *their* beats. It is paid for out of
   * the first shot and given back by the last, which is what keeps the reel
   * exactly 60 seconds however far the grid moves.
   */
  beatOffsetFrames?: number;
  shots: Shot[];
}

/** How many frames one beat lasts at this tempo. Not always a whole number. */
export const framesPerBeat = (bpm: number): number => (FPS * 60) / bpm;

/**
 * Every shot's length in frames, however the script chose to say it.
 *
 * There are two dialects and this is the only place that knows both:
 *
 * * **Raw frames.** `shot.frames`, which the first three reels use. Nothing
 *   here changes them.
 * * **Beats.** `script.bpm` plus `shot.beats`, which is how a beat-synced cut
 *   is authored — the edit is a rhythm, and a rhythm written in frames stops
 *   being editable the moment the music changes.
 *
 * ## The contract, because the owner will change `bpm`
 *
 * A 60-second reel at T beats per minute contains exactly T beats. So when the
 * tempo changes, the number of beats available changes with it, and the shots
 * cannot simply keep the beat-lengths they were written with — 18 shots
 * totalling 100 beats do not fit a 128-beat grid, and stretching them to fit
 * would land every cut between two beats, which is the whole failure being
 * avoided.
 *
 * So the authored `beats` are read as **proportions**, not as absolutes. They
 * are scaled onto however many beats the declared tempo actually provides and
 * rounded to whole beats by largest remainder, so:
 *
 * * every cut lands on a beat of the owner's track, at any tempo;
 * * the shots keep the shape they were written with — a 6-beat hold stays
 *   roughly three times a 2-beat snap;
 * * the total is exactly `REEL_FRAMES`, always, which is the hard rule.
 *
 * The last of those is what the cumulative rounding below is for. A beat is
 * 18 frames at 100bpm and 18.75 at 96, and rounding each shot on its own would
 * lose or gain frames until the reel was the wrong length. Rounding the
 * *boundaries* instead means every error is at most half a frame and never
 * accumulates — and the final boundary is pinned to the end, so an owner who
 * types a fractional tempo gets one slightly-off cut rather than a 61-second
 * reel that Instagram trims the call to action off.
 */
export const resolveShotFrames = (script: AdScript): number[] => {
  if (!script.bpm) {
    return script.shots.map((shot) => shot.frames ?? 0);
  }

  const total = REEL_FRAMES;
  const perBeat = framesPerBeat(script.bpm);
  const gridBeats = Math.max(script.shots.length, Math.round(total / perBeat));
  const authored = script.shots.reduce((n, shot) => n + (shot.beats ?? 0), 0);

  if (authored <= 0) {
    throw new Error(
      `${script.id} declares a bpm but no shot declares \`beats\` — there is ` +
        'no rhythm to cut to.',
    );
  }

  // Proportional, then whole, by largest remainder. Every shot keeps at least
  // one beat: a zero-length shot is a frame the viewer never sees and a voice
  // clip with nothing under it.
  const exact = script.shots.map((shot) => ((shot.beats ?? 0) * gridBeats) / authored);
  const beats = exact.map((v) => Math.max(1, Math.floor(v)));
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  let owed = gridBeats - beats.reduce((a, b) => a + b, 0);
  for (let k = 0; owed > 0; k += 1, owed -= 1) {
    beats[order[k % order.length].i] += 1;
  }
  while (owed < 0) {
    // The min-one clamp overspent the grid, which only happens at a very slow
    // tempo with a lot of shots. Take the beats back off the longest shots,
    // because that is where one beat is least of the shot.
    let longest = 0;
    for (let i = 1; i < beats.length; i += 1) {
      if (beats[i] > beats[longest]) longest = i;
    }
    if (beats[longest] <= 1) break;
    beats[longest] -= 1;
    owed += 1;
  }

  const frames: number[] = [];
  let cumBeats = 0;
  let cumFrames = 0;
  for (const b of beats) {
    cumBeats += b;
    const edge = Math.round(cumBeats * perBeat);
    frames.push(edge - cumFrames);
    cumFrames = edge;
  }
  // Pin the end. At an integer tempo this adds nothing.
  frames[frames.length - 1] += total - cumFrames;

  // The lead-in comes out of the first shot and goes back into the last, so
  // the grid moves and the length does not.
  const offset = script.beatOffsetFrames ?? 0;
  if (offset !== 0 && frames.length > 1) {
    frames[0] += offset;
    frames[frames.length - 1] -= offset;
  }

  return frames;
};

/**
 * How long a script runs, in frames.
 *
 * A reel is the sum of its shots, whether those were written in frames or in
 * beats. A long-form ad is whatever its measured audio came to, which lives in
 * the generated timing table and is read by `Root.tsx`, not here.
 */
export const scriptFrames = (script: AdScript): number =>
  resolveShotFrames(script).reduce((total, n) => total + n, 0);
