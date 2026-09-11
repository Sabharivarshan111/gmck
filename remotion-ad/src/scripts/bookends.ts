import type { AdScript, Shot } from './types.ts';

/**
 * Every ad opens the same way and closes the same way.
 *
 * The app's owner asked for one opening line and one closing line across all
 * of them: **"Welcome to Orbit"** first, **"Download Orbit on the Play Store"**
 * last. A viewer who sees three of these in a week should recognise the second
 * one from the first second and know where to get it by the last.
 *
 * ## Why it is a transform and not twenty-four edits
 *
 * There are twenty-four scripts and each ships in two cuts. Stamping the same
 * two lines into forty-eight places by hand means forty-eight chances for one
 * of them to drift, and nothing would notice — this repo has already been
 * caught twice by exactly that shape, once with the launch ads missing a
 * silent cut and once with three components quoting the same measurement at
 * each other. So it is applied in one place, to the one list that has them
 * all, and `check:reel-layout` asserts it held.
 *
 * ## What it costs, and why the hook still comes second
 *
 * The opening shot of a reel is the most valuable one: a viewer decides in
 * about 1.7 seconds. "Welcome to Orbit" is a greeting rather than a hook, so
 * putting it first does cost something real, and the mitigation is to keep it
 * SHORT — under a second of speech — and leave the script's own hook
 * immediately behind it, untouched, as shot two. It reads as a title card, not
 * as the first argument.
 *
 * The closing line replaces whatever sign-off the script had, because those
 * were already eight different phrasings of the same sentence ("Orbit MBBS.
 * Free on Google Play.", "That's Orbit. Free on Google Play.", "I am Orbit.
 * Free on Google Play.") and none of them said the thing a viewer has to do.
 * "Download" is an instruction; "free on Google Play" is a fact about pricing.
 */

export const WELCOME_VO = 'Welcome to Orbit.';
export const WELCOME_TEXT = 'Welcome to Orbit';
export const CTA_VO = 'Download Orbit on the Play Store.';
export const CTA_TEXT = 'Download Orbit';
export const CTA_SILENT = 'Download Orbit on Play Store';

/** The accent the brand opens and closes on. */
const BRAND_ACCENT = '#7C5CFF';

const welcomeShot = (script: AdScript): Shot => ({
  n: 0,
  screen: null,
  // The mascot has the frame to itself for a title card, in the three ads it
  // hosts and in the ones it does not — it is the app's face either way.
  mascot: 'hero',
  camera: 'settle',
  text: WELCOME_TEXT,
  silentText: WELCOME_TEXT,
  vo: WELCOME_VO,
  accent: BRAND_ACCENT,
  /*
     Short — a title card that outstays a second is a second of the hook gone.

     Written in whichever dialect the script it is joining uses. A shot must
     never carry both: `beats` against a `bpm` and a raw `frames` are two
     answers to one question, and `resolveShotFrames` would silently take the
     grid's. Long-form ads set neither, because they are paced by their own
     recording.
  */
  ...(script.format === 'reel' ? (script.bpm ? { beats: 2 } : { frames: 62 }) : {}),
});

/**
 * Prepend the welcome and rewrite the sign-off.
 *
 * Shots are renumbered from 1, because `n` is what names the voice clip on
 * disk (`shot_01.mp3`) and a gap or a zero there would leave a shot looking
 * for a recording nothing made.
 */
export const withBookends = (script: AdScript): AdScript => {
  const shots = [welcomeShot(script), ...script.shots];

  const last = shots[shots.length - 1];
  shots[shots.length - 1] = {
    ...last,
    vo: CTA_VO,
    text: CTA_TEXT,
    silentText: CTA_SILENT,
    accent: BRAND_ACCENT,
    /*
       The closing shot is the END CARD, not another screenshot with a line
       over it. A viewer who has just decided they want this needs the mark
       they will recognise in the store, and every ad used to end on whatever
       screen happened to be last.
    */
    endCard: true,
    screen: null,
  };

  return { ...script, shots: shots.map((shot, i) => ({ ...shot, n: i + 1 })) };
};
