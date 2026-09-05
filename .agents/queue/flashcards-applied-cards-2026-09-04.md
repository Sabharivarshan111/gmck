# The `applied` card mode is asked for and never produced

**Status:** CLOSED 2026-09-05, at v15. Found by invoking the live function, and
closed the same way — three chapters, all three modes present, none zero.

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

---

# Closed at v15, and what the three attempts measured

Step 1 of the plan above (move the proportions into the user prompt as counts)
was right, and took two more tries to land. All numbers below are counted with
SQL over the live response, `noCache: true`, `limit: 12`, first-year
Biochemistry.

| Version | The quota said | applied | recall | Decks full? |
|---|---|---|---|---|
| v11 | "roughly half recall, a quarter reasoning, a quarter applied", in the system prompt | **0 of 32**, twice | fine | yes |
| v13 | counts, in the user prompt, "write the applied cards FIRST, then reasoning, then fill up with recall" | 5 of 12, twice | **0 in one run** | yes |
| v14 | the same counts, but "meet all three counts" instead of the ordering, and a recall integer | **0 in 2 of 3 runs** (and 0 reasoning too) | 9 | **no — two runs stopped 8 cards short** |
| **v15** | the ordering restored, applied and reasoning as counts, **no integer for recall** | **5, 5, 4** | 2, 1, 1 | yes, 12/12 every run |

## The two things worth keeping

**The ordering instruction is load-bearing.** "Write the applied cards FIRST,
then the reasoning ones, then fill up with recall" produced applied cards in
every run it was present for. Replacing it with the calmer "meet all three
counts" — same numbers, same position in the prompt — dropped applied *and*
reasoning to zero in two runs of three. Say the order.

**Do not name an integer for recall.** With "4 applied, 4 reasoning, and the
remaining 9 recall", two runs returned exactly nine theory cards, every one of
them recall, having satisfied the last number they were given and stopped eight
cards short of a total they had been asked for twice. v15 states applied and
reasoning as counts and describes recall as "every remaining card … until you
reach N in total", and the decks come back full.

## What is still worth watching

Recall is thin — 2, 1 and 1 cards across the three runs, against 4-5 applied
and 4-5 reasoning. It is present, which is what this note was opened about, but
the shape has swung from "all recall" to "barely any". If it reaches zero
again, the answer is **not** another sentence: it is the structural route the
code comment names — `appliedCards` as its own array, the way `diagramCards`
already is — leaving one array to be plain recall.

And never close a gap like this by relabelling: a card with no vignette is not
an applied card, and mislabelling would make this measurement stop working.

## A courier note, unrelated to the prompt

Verifying a deploy by diffing the read-back: extract the returned file contents
with `jq -j`, not `jq -r`. `-r` appends its own newline to a file that already
ends in one and reports a spurious one-line difference on every file.
