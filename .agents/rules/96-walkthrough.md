---
description: The first-run walkthrough — how it finds a control by its accessibility label, why the scrim is four rectangles rather than one, and the one thing it may never name
---

# The first-run walkthrough

`mobile/src/tour/` is the script and the state; `components/TourOverlay.tsx`
draws it; `components/TourGestureDemo.tsx` is the one interactive step.
`npm run check:tour` pins it, and `check:smoke` walks all 18 steps.

## Controls are addressed by their accessibility label

A step says `target: 'Timer settings'` and the overlay finds that control,
measures it and cuts a live hole over it. **No screen registers anything.**
`Touchable` does it, gated on a Set of the labels the script actually names —
that gate is not tidiness, it is why a five-hundred-row question list does not
grow a ref and an effect per row for a feature that runs once, for two minutes,
on the first launch.

This is the same handle `check:smoke` uses, for the same stated reason: a
control the tour cannot find is one TalkBack cannot announce. `check:tour`
fails if a label named in the script does not exist in `src/`.

## The scrim is four rectangles, and that is the whole point

Not one view with a hole painted on it. Four panels around the target leave it
genuinely uncovered, so **the reader presses the real control and the real
control works** — `notifyTourPress` then moves the tour on. The root is
`pointerEvents="box-none"` so only the panels and the card take touches.

Consequences worth knowing:

- **A step is never a dead end.** A target that cannot be measured — wrong
  screen, scrolled away, renamed — degrades to a plain centred card. Next
  always works, Skip is on every step.
- **The centred card needs its own style.** An absolutely positioned box with
  `left` and `right` but neither `top` nor `bottom` has **zero height**: the
  card drew correctly and could not be pressed, and on the web preview a
  control behind it took every press aimed at Next.
- **Tapping a spotlit control that opens a sheet buries the tour, and that is
  correct.** A `<Modal>` is its own window. They tapped it to see the sheet;
  they close it and the tour has moved on.

## It stands down for the fresh-install profile gate

`ProfileSheet` is a modal *and* non-dismissable when there is no profile, so
nothing drawn in the app tree can be above it. It calls `setTourPaused`, and
the overlay stops drawing **and stops navigating** — a tour that kept changing
tabs behind a form the reader cannot leave would move the app under them.

## Length was the design problem, not the content

Eighteen steps, five chapters, `FOCUS TIMER · 10 of 18` in the card so the end
is always in sight, Skip on screen at every step, and Settings replays any
single chapter. Nobody comes back wanting all eighteen again.

## What may never appear in it

**No textbook titles and no author names.** The notes step says "grounded in a
standard reference for that subject" and stops there. `check:tour` carries its
own forbidden list (books, authors, music services) on top of the one
`check:textbooks` already enforces across `src/`.

## The rehearsal must teach the real rhythm

`TourGestureDemo`'s `TAP_WINDOW_MS` is 380 because `QuestionRow`'s is.
`check:tour` pins them together. A rehearsed 250ms window would teach a rhythm
that then failed on the real list — worse than no rehearsal, because the reader
would conclude the feature was broken rather than that they were taught wrong.

## The preview must never start it on its own

`?tour=1` runs it, `?tour=focus` runs one chapter, and nothing else does.
`hydrateTour` is not called there. An overlay that appeared by default would
cover the screen for every smoke step and fail all of them for a reason
unrelated to what they test.
