# Swapping the music on the subtitle-led reels

Two of the reels have no voice at all — `orbit-reel-functions` and
`orbit-reel-one-question`. The captions carry the argument, the ground is
black, and the cuts land on the beat. This is the contract for putting **your
own track** under them and having every cut still land.

It is one number.

## The one number

Each script declares the tempo it is cut to:

| Script | File | Tempo | Bed |
|---|---|---|---|
| `orbit-reel-functions` | `remotion-ad/src/scripts/reelFunctions.ts` | `bpm: 100` | `public/audio/bed/bed-functions.wav` |
| `orbit-reel-one-question` | `remotion-ad/src/scripts/reelOneQuestion.ts` | `bpm: 120` | `public/audio/bed/bed-one-question.wav` |

To use your own music:

1. Put the file where `music` points, or point `music` at where you put it.
2. Set `bpm` to **your track's tempo**.

That is the whole change. Nothing else in the script is touched — not a shot
length, not a caption, not a transition.

## Why one number is enough

Shot lengths in these two scripts are written in **beats**, never in frames:
`beats: 4` is a bar, `beats: 2` is a snap, `beats: 8` is a breath. Frames are
derived at render time by `resolveShotFrames` in
`remotion-ad/src/scripts/types.ts`, which is the only place that knows how.

The reel is always 1800 frames — 60.0 seconds at 30fps — so a 60-second reel at
T beats per minute contains exactly T beats. Change the tempo and the number of
beats available changes with it. The shots therefore **cannot** keep the
beat-counts they were written with: eighteen shots totalling 100 beats do not
fit a 128-beat grid, and stretching them to fit would land every cut between
two beats, which is the exact failure this design exists to avoid.

So the authored `beats` are read as **proportions**, not absolutes. They are
scaled onto however many beats your tempo actually provides and rounded to
whole beats by largest remainder. Three things hold at once:

- every cut lands on a beat of **your** track, at any tempo;
- the shots keep the shape they were written with — a 6-beat hold stays roughly
  three times a 2-beat snap;
- the total is exactly 1800 frames. Always. That one is not negotiable.

## The rounding, and why it is on the boundaries

A beat is 18 frames at 100bpm and 18.75 at 96. Rounding each shot on its own
would lose or gain frames until the reel came out the wrong length. So the
**boundaries** are rounded rather than the durations: every error is at most
half a frame and none of them accumulate, and the final boundary is pinned to
the end.

That is why a fractional tempo costs you one very slightly early or late cut
rather than a 61-second reel — which matters, because Instagram trims a reel
that overruns, and what is at the end of these two is the call to action.

Every shot also keeps **at least one beat**. A zero-length shot is a frame
nobody sees.

## If your track does not start on the downbeat

A synthesised bed starts on beat one at sample zero, so the grid starts with
the film and `beatOffsetFrames` is 0. A recording may have a pickup, a count-in
or a moment of room tone first. Set `beatOffsetFrames` to that lead-in, in
frames at 30fps, and the whole grid shifts by that much so the cuts land on
*your* beats.

It is paid for out of the first shot and given back by the last, which is what
keeps the reel exactly 60 seconds however far the grid moves.

## The beds that ship, and why they are synthesised

`remotion-ad/scripts/make-beds.py` generates them:

    bed-functions      25 bars -> 100 beats in 60s -> reelFunctions    bpm: 100
    bed-one-question   30 bars -> 120 beats in 60s -> reelOneQuestion  bpm: 120

They are synthesised rather than sourced because "free for non-commercial use"
does not cover an advertisement for a paid app. The bed is owned outright, and
so is anything anyone does with these files.

## What this does not apply to

- **The three 90-second ads** (`orbit-2am`, `orbit-the-pattern`,
  `orbit-draw-it-from-memory`) are audio-paced. Their shots are timed to a
  measured voiceover from a generated timing table, and they carry no music
  bed. Setting `bpm` on one would override the measurement and clip its own
  voice. Don't.
- **The first three reels** (`repeats`, `six-hours`, `draw-it`) declare raw
  `frames` and are not touched by any of this. Their `-silent` cuts are a
  different thing from a `noVoice` script: they have a voice clip per shot that
  the mix leaves out, so one edit ships in two mixes.

A script may declare `frames` **or** `beats`, never both. Two answers to one
question, and the grid would win silently.
