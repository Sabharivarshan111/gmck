---
description: Ad copy — why no line counts what the bank holds, why a drawing is a diagram and never a "plate", and the student's voice the owner rewrote all twenty-six scripts into
---

# 97 - Ad copy: what a line may say, and how it should sound

The pipeline that renders these is `.agents/rules/97-video-ads.md`. This file is
the writing: the twenty-six scripts in `remotion-ad/src/scripts/`, what they may
claim, and the voice the app's owner rewrote them into.

`npm run check:ad-truth` and `npm run preflight`, both in `remotion-ad/`, are
where these stop being remembered and start being enforced.

## Voice

Python **edge-tts** (`pip install edge-tts`). `voice-manifest.mjs` dumps the 90
lines to JSON, `synthesize.py` speaks them. A file under 2KB raises — edge-tts
writes a zero-byte mp3 when the socket is refused, and a silent shot in a
finished ad is worse than a crash.

Voiceover lines are **7-11 words**, which lands in 1.8-2.4s and leaves ~0.6s of
air before the cut.

## No ad counts what the bank holds

The table that used to sit here listed the measured figures an ad could claim,
and re-measuring it had already corrected three of four once. It is gone, on
the owner's instruction: **an ad does not read an inventory out at the viewer.**

A rendered frame made the case. A caption said **"General Medicine alone is
660"** over a screenshot of Pathology, and the real figure was 680 — subject
wrong, number wrong, no unit. A figure a viewer cannot check against the screen
in front of them rots between the writing and the render, and nobody installs a
question bank for its row count. "A lot of these have already shown up in
papers" is the same claim in the form a student would make it.

Numbers a **feature** owns are fine: a twenty-five minute timer, four MBBS
years, the days left in a posting. Those are what the thing is, and the reader
can see them on the screen under the line.

Three things are refused outright:

- **A quantity shaped like a year.** "2,025" beside "the years asked" reads as
  2025, and the owner reported it as such. `preflight` refuses any bare
  `19xx`/`20xx` or `1,xxx`/`2,xxx` in `text`, `vo`, `silentText` or `kicker`.
- **A count of the drawings**, in any wording. `check:ad-truth` refuses a
  quantity within two words of "diagram", "picture", "drawing" or "image".
- **The word "plate".** That is our name for the file and for the screen
  registry key (`plateBrachial`); a student revising Anatomy says "diagram".
  The registry keys keep their names — renaming those renames the files they
  point at — but no spoken line or caption may use the word.

**Never claim** a user count, a pass rate, that AI answers are exam-verified, or
any university endorsement. "100% offline" is also refused — the bundled bank
works offline; notes, diagrams and Ask AI do not.

## The voice is a student's, not a marketer's

The owner rewrote all twenty-six scripts by hand, and the note with them is the
rule: the lines had been "copy written by a marketer describing a product,
rather than an MBBS student saying, *I'm stressed, I need this, here's what it
does*." Read off that rewrite:

- **Contractions, second person.** "You can go straight down to the chapter you
  actually need", not "Every past question, sorted down to your chapter."
- **No absolutes.** "Every subject…", "Never a neighbour's picture" were cut.
  They sound scripted, and each is a claim somebody could hold the app to.
- **What it does, not what it is.** "The answers are based on the standard
  textbook for the subject" survived; "Grounded in your own textbook" did not —
  the app grounds a note in the subject's book, not one the reader chose.
- **A feature is described once.** "Full handwritten answer", "its own
  diagram", "ask anything" each appeared in three ads in the same words.

## The caption must be the words that are spoken

Three separate bugs made the ads look unsynchronised, and all three are now
enforced rather than remembered:

1. **A voiced reel is captioned with `shot.vo` itself** — the whole line. `text`
   once had to be a verbatim *span* of `vo`, which stopped a caption disagreeing
   with its voice and cost something worse: a span of a sentence is a fragment,
   and 264 of 385 shots showed under three quarters of what was said ("Every day
   you studied, coloured in." reached the screen as "coloured in"). Reading and
   hearing are one string now, and `ReelHeadline` still lights each word as it
   is said. `text` is the caption the muted cut reads instead.
2. **Word timings come from the synthesiser.** `synthesize.py` passes
   `boundary="WordBoundary"` (the edge-tts default is `SentenceBoundary`, which
   returns audio and no word marks at all) and keeps every event.
   `measure-audio.mjs` bakes them into `remotion-ad/src/generated/voiceTimings.ts`.
3. **`remotion-ad/src/dynamicScriptTimings.ts` is generated, never edited.** It used to be
   committed and unregenerated, so CI recorded new lines and laid them on
   boundaries measured from an older script; the shots run end to end, so one
   line that grew pushed every later shot out of step. `preflight` fails when a
   row describes a line the script no longer contains.

The committed `remotion-ad/src/generated/voiceTimings.ts` is deliberately EMPTY. A
checked-in measurement is a measurement of an older recording.
