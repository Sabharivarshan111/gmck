# The `applied` card mode is asked for and never produced

**Status:** open. Found 2026-09-04 by invoking the live function, not by reading code.

## What was measured

`generate-flashcards` **v11** (deployed today), invoked against the live function
with `noCache: true` so nothing was written to the shared cache. First-year
Biochemistry, `biochemistry::paper-1/carbohydrate-metabolism`.

    run A — 30 questions, 32 cards: firstYear true, textbookChars 17908,
            identityDiagrams 5, pathwayCards 5, imageCards 5, theoryCards 27
            modes present: recall, reasoning, pathway
            applied cards: 0 of 32

    run B — 5 questions, limit 8
            modes present: recall, reasoning, pathway
            applied cards: 0

## Why this is a real gap and not a preference

The app's owner asked for applied questions explicitly, modelled on their own
exam papers — "a 52-year-old with cholesterol 465 … mechanism of atorvastatin",
"a 4-year-old with night blindness … role of the vitamin in Wald's cycle".

And the prompt already asks for them. `FIRST_YEAR_SYSTEM_PROMPT` defines the
mode ("a one-line clinical vignette, then the question") and states the
proportions outright:

> roughly half "recall", a quarter "reasoning", a quarter "applied". Never fewer
> than three of each once you are asked for twelve or more cards.

27 theory cards were asked for and produced. Three applied were owed. Zero came.

## What has been ruled out

- **Not the gate.** `stats.firstYear` is `true`, so `FIRST_YEAR_SYSTEM_PROMPT`
  was appended — the run would not report `pathwayCards: 5` otherwise.
- **Not the validator dropping an unknown mode.** The keeper only accepts
  `recall|reasoning|applied`, so a card labelled e.g. "clinical" would arrive
  with no mode at all — but every card came back carrying one of the three
  legitimate values, and `pathway` is assigned server-side. The model chose
  recall and reasoning and simply did not use applied.

So it is prompt adherence: the taxonomy is being followed and the quota is not.

## What to try, in order, and how to know

The measurement is cheap and does not touch anyone's deck — invoke with
`noCache: true` through the `http` extension from Postgres (the anon key is a
valid JWT and `verify_jwt` is true), then count
`jsonb_array_elements(j->'cards') where c->>'mode' = 'applied'`.

1. Move the proportions out of the tail of a long system prompt and into the
   **user** prompt, next to the card count, where the other numeric demands the
   model does obey already live ("Write AT LEAST N theory cards").
2. Ask for the split as explicit counts rather than fractions — "exactly 7
   applied cards" beats "a quarter".
3. If it still refuses, make it structural rather than persuasive: request
   `appliedCards` as its own array in the JSON schema, the way `diagramCards`
   already is. A separate array is the thing this function has empirically got
   the model to fill; a proportion inside one array is not.

Do **not** fake it by relabelling recall cards as applied. A card with no
vignette in it is not an applied card, and mislabelling would make this
measurement stop working as a check.
