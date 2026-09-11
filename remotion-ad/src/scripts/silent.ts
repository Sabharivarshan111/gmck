import type { AdScript, Shot } from './types.ts';

/**
 * Build the silent reel that goes out beside a spoken one.
 *
 * ## Why this is a script and not a prop
 *
 * The muted cut used to be the SAME script handed to the renderer a second
 * time with `withVoice: false`. One edit, two mixes. It sounded efficient and
 * it was the reason both cuts were compromised, because the two are paced by
 * different clocks and only one of them can win:
 *
 * * a **spoken** reel is paced by speech — a shot lasts as long as its line
 *   takes to say, and if it does not, the voice plays on under the next shot;
 * * a **silent** reel is paced by the music — a cut that does not land on a
 *   beat reads as a mistake, and there is no audio to be out of step with.
 *
 * The beat grid won, everywhere, because it was the only one anything
 * computed. So every reel overran its own voice and nobody had written the
 * muted cut on purpose.
 *
 * Now they are two scripts. This one is `noVoice`, so `voice-manifest` never
 * lists it, `synthesize.py` never records a line for it, `ShotTimeline` paces
 * it from its beats, and `preflight` never asks it for an mp3. It is rendered
 * once, under its own id, from its own words.
 *
 * ## Its words are its own
 *
 * `silentText` is authored per shot for somebody who will never hear a word:
 * a standalone claim rather than a span of a sentence, and numerals rather
 * than the spelled-out numbers a voice needs ("5,634" stops a thumb;
 * "five thousand six hundred and thirty-four" is what you have to say out
 * loud). `kicker` names the part of the app the shot is in, which is the job
 * the voice was doing — without it every shot reads as another screenshot of
 * the same app with different words under it.
 *
 * Nothing here invents copy. A shot with no `silentText` is a script that has
 * not been written for silence yet, and `preflight` fails it rather than
 * quietly falling back to the spoken line.
 */
export const silentReel = (voiced: AdScript): AdScript => ({
  ...voiced,
  id: `${voiced.id}-silent`,
  title: `${voiced.title} (silent)`,
  noVoice: true,
  // A reel is cut to its music, so it does NOT borrow its twin's clock — the
  // beat grid is the right one for a film nobody hears. `voiceOf` is for the
  // long-form cut, which has no grid at all. See `silentLongform` below.
  voiceOf: undefined,
  // Nothing is ever spoken here, so carrying a voice would be a claim that
  // something is. `voice-manifest` filters on `noVoice`, but a leftover voice
  // name is the kind of thing a later reader treats as meaningful.
  voice: undefined,
  rate: undefined,
  pitch: undefined,
  shots: voiced.shots.map(
    (shot): Shot => ({
      ...shot,
      // The caption IS the argument in this cut, so it becomes `text` — which
      // is the field `BeatCaption` reads. `vo` is dropped outright: a line
      // nobody will hear is not a line, and leaving it would let a future
      // renderer fall back to it and put a fragment back on screen.
      text: shot.silentText ?? shot.text,
      vo: undefined,
      silentText: undefined,
    }),
  ),
});

/**
 * The silent cut of a 90-second launch ad.
 *
 * Deliberately a much smaller change than `silentReel`, because the long-form
 * ads did not have the bug the reels had. Their shots were always measured
 * from their own recordings, so nothing ever overran; and their captions were
 * always `KineticWordCaption`, which types out every word of the line in time
 * with the recording. Muted, they were already a film with the words on
 * screen.
 *
 * So this keeps the edit frame for frame — same boundaries, same word
 * timings, borrowed through `voiceOf` — and only stops the voice being played.
 * Rewriting them to a beat grid they have no tempo for would be changing three
 * ads that work in order to make a rule look tidy.
 */
export const silentLongform = (voiced: AdScript): AdScript => ({
  ...voiced,
  id: `${voiced.id}-silent`,
  title: `${voiced.title} (silent)`,
  noVoice: true,
  voiceOf: voiced.id,
  voice: undefined,
  rate: undefined,
  pitch: undefined,
});
