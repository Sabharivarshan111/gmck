---
description: The focus timer's trees — twelve species drawn from numbers, why they lean towards the theme rather than take it, and the wilt rule
---

# Trees on the focus timer

Forest's idea: you are not earning points, you are growing something, and
walking away costs you the thing rather than the score. What is taken from it
is the **mechanic**, not the artwork.

| File | What |
|---|---|
| `mobile/src/lib/trees.ts` | the twelve species, as numbers |
| `mobile/src/components/FocusTree.tsx` | the one renderer that draws all of them |
| `mobile/src/lib/forest.ts` | what has been planted, on this phone only |

`npm run check:trees` pins the species table to the renderer.

## Drawn from numbers, not stored as pictures

A species is a crown shape, a hue, a trunk height, a girth, a lean, a spread
and a part count. One renderer builds geometry from those, so twelve trees cost
a few hundred bytes rather than a bitmap per species per density — and a
thirteenth is nine numbers.

**Every part's size is a pure function of `growth`,** and `growth` changes once
a second because that is how often the countdown ticks. A tree that takes
twenty-five minutes to grow moves imperceptibly between ticks, so there is
nothing for a frame loop to add. The only thing at frame rate is one sway, and
that is a transform on a plain `View`, native-driven. The alternative — forty
vector nodes redrawn every frame for twenty-five minutes — is the difference
between free and unusable on a cheap phone.

## Species keep their own colour, and lean towards the theme

The hue on a species is **absolute**, not an offset from the accent. It was an
offset, and that was wrong twice over: every tree came out the colour of every
other, and none looked like the thing it is named after. A reader who picks
"Maple" and gets a violet tree has been told the name means nothing.

`FocusTree` rotates each hue towards `colors.accent` — but **capped at 18°**,
not just at a fraction. A fraction alone is not enough: green is almost
opposite fuchsia, so a third of that gap is fifty degrees, which took the oak
to yellow and the pine to cyan. Saturation and value are fixed rather than
taken from the theme, because a tree is the brightest thing on that screen by
design and a muted palette washed them out.

Wilting is the same drawing with the colour taken out of it, not a second set
of shapes.

## The wilt rule is gentler than Forest's, on purpose

`AppState` is all it needs — no permission, no Usage Access, no accessibility
service. Forest's Deep Focus blocks other apps outright, which needs exactly
those, is a Play-policy minefield, and would stop a student opening a
calculator mid-revision.

- **Fifteen seconds of grace** (`WILT_GRACE_MS`). Forest kills the tree the
  instant you leave, which is right for an app whose only job is to stop you
  touching your phone and wrong for a question bank.
- **`'background'` only**, never `'inactive'` — that is the half-second of a
  system dialog or the app switcher opening.
- **Wilt, never delete.** The minutes still count and the session still ends
  normally. Losing the tree is the whole penalty; losing the work would be this
  app throwing away evidence that somebody studied.
- **A withered tree is still planted**, in grey. An empty plot says nothing
  happened; a grey one says exactly what did.
- **Breaks are exempt.** Nobody is being punished for looking at their phone
  during a five-minute break.

## Unlocked by minutes, not by a currency

Forest pays coins and sells species. This app already has one XP ladder shared
with the web app (`lib/xp.ts`), and a second economy is a second set of numbers
to disagree with the first — so species unlock off lifetime focused minutes,
which the timer already counts. The picker shows locked species with their
price rather than hiding them: a ladder with nothing visible above you is a
ladder you stop climbing.

## The whole thing has an off switch

`settings.trees`, on by default. A pomodoro timer is a perfectly good thing to
want on its own, and someone who finds a growing tree twee should not have to
put up with it to use the clock. Off hides the tree, the plot **and** the wilt
rule together — half a feature is worse than none of it.

It sits **under** the durations in the settings sheet, not above them. With the
tree section first, the four duration sliders were pushed off the bottom of a
sheet that will not scroll past them: a settings sheet whose main setting
cannot be reached is broken.

## A break is a detour, not a reset

`switchMode` parks what was on the clock for the mode being left and restores
it when that mode comes back. It used to rebuild the clock from the settings,
so a session paused at 12:04, followed by a break, came back at 25:00 — the
reader had done the thing the app tells them to do and lost the twelve minutes
they had already sat through. Finishing, Reset and Restart clear the parked
clock; those are the controls that mean "start this over".

## The dial holds the tree and the clock, and nothing else

A 260dp circle has about 150dp of usable width across its middle. Tree, mode,
clock and hint do not fit: the hint sat *on* the ring and the break glyph sat
*on* the mode label. Everything that is words is now one pill **under** the
dial — a pill rather than loose text, because loose text in the gap between the
ring and the Play button reads as belonging to neither.

The two stat cards that used to sit below ("Today 0m", "Pomodoros 0") are gone.
They were zero at the moment somebody was most likely to look at them and said
nothing the dial did not. Today's plot — the row of trees grown today, greys
included — is what earns that space.
