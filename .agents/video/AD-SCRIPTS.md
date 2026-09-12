# The ad scripts

**The scripts are not written down here. They live in
`remotion-ad/src/scripts/` and you read them with:**

```sh
cd remotion-ad
npm run scripts:print                 # all of them, as prose
npm run scripts:print -- how-notes    # one, by part of its id
```

That prints every shot as `[screen] / spoken / muted`, which is the shape the
app's owner writes and reviews them in.

## Why this file no longer holds them

It used to. It was written on 2026-09-04, described **three** ads, and was
still describing three when the repo had **twenty-nine**. It prescribed three
different voices where there is now one. And at the top it carried a table
headed *"Claim you may use"*:

| Questions in the bank | **5,545 unique** |
| Carrying a PYQ year marker | **2,025** |
| Diagram rows with a picture | **915**, across **272** plates |

Every one of those is now **forbidden in an ad**, and the word "plates" is the
one that leaked into a spoken line ("a real labelled plate, not a stock
drawing"). The statistics were taken out of the ads twice — once from the
spoken lines, once from the captions — and both times this file still told the
next reader to put them back.

That is the failure `CLAUDE.md` names: *a distilled copy that has gone stale is
worse than no copy*. A stale rule is not neutral. It is an instruction to undo
the fix.

So the prose view is **generated on demand and never stored**. It cannot drift,
because there is nothing to drift from.

## The rules a script has to keep

Each is enforced, and the check that does it is named. Run all three from
`remotion-ad/`.

| Rule | Why | Enforced by |
|---|---|---|
| **No digit** in a spoken line, a caption or a muted caption | A figure in an ad is a claim somebody has to defend, and the muted cut is the one most people read. Spell it out or cut it. | `check:ad-truth` |
| **Never the word "plate"** | That is our word for the image file. Students say *diagram*, and so does the app. Screen keys like `plateBrachial` are fine; they are never spoken. | `check:ad-truth` |
| **No absolutes** — "never a neighbour's picture", "every subject", "exam-verified" | A promise about every row of a table of thousands. Say what the reader will see. | review |
| One screenshot at most **four times**, never **three in a row** | Otherwise it stops looking like a tour of an app and starts looking like one screenshot. | `check:ad-truth` |
| No line tells the viewer **what their year is** | A medical student does not need telling, and being told wrongly is worse. | `check:ad-truth` |
| A reel's spoken track fits **57s** of a 60-second cut | The platform trims the end, and the end is the call to action. Commas and full stops cost about 0.7s each — a list is the most expensive thing a line can hold. | `preflight` |
| `text` is a **verbatim span** of `vo` | Keeps the voiced caption in sync with the word being said. | `preflight` |
| `silentText` is a standalone claim, **six words maximum** | A span of a sentence is usually a fragment, and the muted viewer never heard the rest. | `preflight` |
| A caption fits the **230px band** | Below it is the platform's own UI. | `check:reel-layout` |
| Every ad has a **matrix entry** in `ad-videos.yml`, both cuts | Or it is a script that exists and never renders. | `preflight` |

## What every ad opens and closes on

Applied by `src/scripts/bookends.ts` as a transform, not by editing each file —
there are twenty-nine of them and two cuts each, which is fifty-eight chances
for one to drift.

- **Opens** on the mark: *"Welcome to Orbit."*
- **Closes** on the end card: the mark, *made by the medical community for the
  medical community*, **Completely free**, and *Download Orbit on the Play
  Store* with the official Play badge.

A script must not write either itself. Its own last shot is replaced.

## Voice

One voice, `en-US-AvaNeural`, for every ad that has one. Three voices was the
old plan and it made the mascot three different characters. Mood is carried by
the music bed instead.

**Never** a `*MultilingualNeural` voice: "M.G.R." and "MBBS" flip to French
phonemes on those. Say *"The Tamil Nadu Dr. M.G.R. Medical University"* in
full, never "TNMGRMU".

## The register

Written as a medical student talking, not as a marketer describing a product.
The app's owner's note, which is the standard to hold:

> too many lines sound like copy written by a marketer describing a product,
> rather than an MBBS student saying "I'm stressed, I need this, here's what it
> does."
