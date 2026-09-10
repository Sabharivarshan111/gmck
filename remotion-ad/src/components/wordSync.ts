/**
 * Which word is being spoken, on this frame.
 *
 * ## The bug this replaces
 *
 * The caption used to find its active word by dividing the clip's duration
 * into equal slices — `interpolate(frame, [2, audioFrames - 4], [0, n - 1])`.
 * That is only correct if every word takes the same time to say, and no
 * sentence works that way. In "Two thousand and twenty-five carry a year",
 * "a" and "twenty-five" got the same slice, so by the middle of the line the
 * highlighted word was one or two words away from the word in the air. The
 * app's owner watched the finished films and said nothing was in sync; this
 * is the half of that they could hear.
 *
 * The synthesiser already knows the answer — it emits a WordBoundary event per
 * word as it renders — so `synthesize.py` keeps them and `measure-audio.mjs`
 * bakes them into `generated/voiceTimings.ts`. This is the lookup.
 *
 * ## Why it still has a fallback
 *
 * A shot with no recorded boundaries falls back to the even spread. That is
 * the old, wrong behaviour, kept deliberately: a caption that is slightly out
 * of step is a worse film, and a caption that throws is no film at all. It is
 * never what ships, because `preflight` fails a render whose timing table is
 * empty or stale.
 */
import { VOICE_TIMINGS, type SpokenLine } from '../generated/voiceTimings';

export const lineFor = (scriptId: string, shotN: number): SpokenLine | undefined =>
  VOICE_TIMINGS[scriptId]?.[shotN];

/**
 * The index of the word being spoken at `frame`, counting from the shot's
 * first frame.
 *
 * Returns -1 before the first word starts, which is what lets a caption hold
 * every word unlit through the breath before the line — the moment that makes
 * the first word landing read as deliberate rather than as a caption that was
 * already there.
 */
export const activeWordAt = (
  line: SpokenLine | undefined,
  frame: number,
  fps: number,
  fallbackWordCount: number,
  fallbackFrames: number,
): number => {
  const ms = (frame / fps) * 1000;

  if (line && line.words.length > 0) {
    // Walk from the end: the active word is the last one that has started.
    // Comparing against each word's own end instead would leave the caption
    // dark in the gaps between words, which flickers.
    for (let i = line.words.length - 1; i >= 0; i -= 1) {
      if (ms >= line.words[i].startMs) return i;
    }
    return -1;
  }

  if (fallbackWordCount <= 0 || fallbackFrames <= 0) return -1;
  const share = fallbackFrames / fallbackWordCount;
  return Math.min(fallbackWordCount - 1, Math.floor(frame / share));
};

/**
 * When a span of words inside a line is spoken, in frames from the shot start.
 *
 * A voiced reel's headline is a verbatim span of its spoken line — that is the
 * rule `preflight` enforces — so this is how the headline knows to arrive on
 * the word that starts it. `null` when the span cannot be located, in which
 * case the caller should behave as it did before: show it from frame zero.
 */
export const spanFrames = (
  line: SpokenLine | undefined,
  span: string,
  fps: number,
): { from: number; to: number } | null => {
  if (!line || line.words.length === 0) return null;

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wanted = span.split(/\s+/).map(norm).filter(Boolean);
  if (wanted.length === 0) return null;

  const said = line.words.map((w) => norm(w.text));
  for (let start = 0; start + wanted.length <= said.length; start += 1) {
    let hit = true;
    for (let k = 0; k < wanted.length; k += 1) {
      if (said[start + k] !== wanted[k]) {
        hit = false;
        break;
      }
    }
    if (!hit) continue;
    const first = line.words[start];
    const last = line.words[start + wanted.length - 1];
    return {
      from: Math.floor((first.startMs / 1000) * fps),
      to: Math.ceil(((last.startMs + last.durationMs) / 1000) * fps),
    };
  }
  return null;
};

/**
 * When each word of a span is spoken, in frames from the shot's first frame.
 *
 * A voiced reel's headline is a verbatim span of its spoken line, so this maps
 * headline word `i` onto the recorded word that says it. `null` when the span
 * is not found — a silent cut, an unrecorded shot, or a headline that broke
 * the rule — and the caller then draws the headline with no highlight at all,
 * which is exactly right for the cut that has no voice.
 *
 * Deliberately NOT used to delay the headline's arrival. A reel is watched
 * muted and the headline has to be legible inside a third of a second; holding
 * a word back until it is spoken would trade the cut that gets watched for the
 * cut that gets watched twice. The words all arrive together and then light up
 * in time with the voice.
 */
export const spanWordFrames = (
  line: SpokenLine | undefined,
  span: string,
  fps: number,
): number[] | null => {
  if (!line || line.words.length === 0) return null;

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wanted = span.split(/\s+/).map(norm).filter(Boolean);
  if (wanted.length === 0) return null;

  const said = line.words.map((w) => norm(w.text));
  for (let start = 0; start + wanted.length <= said.length; start += 1) {
    let hit = true;
    for (let k = 0; k < wanted.length; k += 1) {
      if (said[start + k] !== wanted[k]) {
        hit = false;
        break;
      }
    }
    if (!hit) continue;
    return wanted.map((_, k) =>
      Math.floor((line.words[start + k].startMs / 1000) * fps),
    );
  }
  return null;
};
