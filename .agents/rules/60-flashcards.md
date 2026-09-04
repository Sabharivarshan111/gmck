---
description: Anki flashcards — why the scheduler is not the app's other one, and what is still unverified
---

# Flashcards

Notes → **Anki flashcards** → year → subject → chapter → study.
`mobile/src/screens/FlashcardsScreen.tsx`, `src/lib/anki.ts`,
`mobile/src/lib/flashcards.ts`, edge function `generate-flashcards`.

## Do not merge this with the app's other spaced repetition

There are two schedulers and they must stay two.

| | `lib/spacedRepetition.ts` | `lib/anki.ts` |
|---|---|---|
| Mirrors | the server's `review_question` SQL | ankitects/anki |
| Grain | whole days only | minutes, then days |
| A lapse | shrinks the interval | sends the card through **relearning** |
| Used by | My Progress → revision | flashcards |

Anki walks a new card through learning steps of **1 and 10 minutes** before it
earns a day-scale interval at all. Plain SM-2 has no concept of that. Folding
one into the other breaks whichever one loses.

`npm run check:anki` pins the Anki one to behaviours Anki's own tests assert:

- **Again jumps to the first step**, not one rung down.
- **Hard on the first step is the average of that step and the next** (5.5m).
- Good on the last step graduates at 1 day; Easy graduates from anywhere at 4.
- A review lapse goes to relearning, never straight back to review.
- An interval always grows on a pass — a low-ease card that stands still is due
  for ever.

Defaults are Anki's, not invented: ease 2.5 start, −0.20/−0.15/0/+0.15, floor
1.3, hard ×1.2, easy ×1.3, lapse ×0, leech at 8, 20 new and 200 reviews a day.

## Half the deck is theory, half is diagrams

`generate-flashcards` writes the theory half with `gemini-3.1-flash-lite` from
the chapter's own past-year questions, so a deck tests what the exam asked.

The image half takes **no model call**. It reads `question_diagrams` rows that
already exist for the same `subtopic_key` and uses the picture with the question
it belongs to. Captioning a diagram the model cannot see would be a guess
presented as a fact.

**Dedupe on `public_url`.** The chapters have far more rows than pictures —
Community Medicine's communicable-diseases chapter has 34 rows and 16 distinct
images — so without it the same diagram appears three times in one sitting.

A chapter with no diagrams becomes an all-theory deck, not an error.

## The diagram is the answer, so it goes on the back

An image card is: **front** the question, **back** the diagram *and* the answer
text. It shipped the other way round for a few hours — the diagram rendered
above the question, before Show Answer — which handed the reader the answer and
left the reveal with nothing but a line telling them to look at the picture they
had already seen. A diagram of the answer shown on the front is not a flashcard.

`generate-flashcards` currently returns `back: ""` for image cards. That should
become a short written answer alongside the picture; it needs the function
redeployed and is listed in HANDOFF §8d.

## Decks you write are on the phone, and nowhere else

`lib/customDecks.ts`, AsyncStorage under `orbit:anki:custom-decks`.

Generated decks are cached server-side because a chapter produces the same cards
for everyone, so one Gemini call is worth sharing. A deck someone wrote is the
opposite: it is theirs, it is nobody else's revision, and there is no shared
cost to amortise. Uploading it would mean an account, a policy, and a row that
outlives the app on someone else's server, for no benefit to the person who
typed it.

The trade is real — reinstall and they are gone — so the UI says so on the
screen where the deck is created, not in a help page.

They study through **the same `StudyView`**, with the cards handed in rather
than fetched. A second study screen would be a second place for the scheduler to
drift. The schedule key is namespaced `custom::{id}` so it can never collide
with a generated deck's `{year}::{subject}::{chapter}` — a collision would have
one deck reading the other's schedule, and the symptom is cards that are
mysteriously already due.

`StudyView` hides "Write this deck again" when it is given cards directly: on a
hand-written deck that button would call the edge function and replace what
someone typed with something Gemini made up.

## Decks are shared, schedules are not

The deck is cached in the `flashcards` table keyed
`{year}::{subject}::{subtopicKey}` and is readable by everyone: the same chapter
produces the same cards, which is the whole reason the cache is worth having.
Only the service role may write — a client that could write there could replace
a chapter's cards for every student.

The **schedule** lives on the device under `orbit:anki:{deckKey}`. That split is
what lets one generated deck serve everyone on their own timetable.

Regenerating a deck renumbers the cards, so `reconcile()` drops schedule entries
whose id is gone. Keeping them would leave the queue permanently short.

## What is NOT verified, and what to do about it

**Direct network access to Supabase is blocked** in the agent sandboxes — the
egress gateway refuses CONNECT — but that is not the same as having no route.
A **Supabase MCP connector is a route**, and when one is loaded these can be
checked from Claude Code as easily as from Antigravity. Items 1 and 3 below sat
unverified for weeks because "the sandbox cannot reach Supabase" was read as
"this cannot be checked"; both took one query each.

`npm run supabase:status` says the same thing at the top of its output. Read it
before concluding something here is unknowable.

1. ~~A deck has never been generated.~~ **Four have, and they were checked on
   2026-09-01.** All three worries came back clean:

   | deck | cards | image | distinct images | avg back | longest back |
   |---|---|---|---|---|---|
   | Forensic · toxicology | 44 | 2 | 2 | 10 w | 19 w |
   | Pharmacology · ANS | 24 | 0 | 0 | 5 w | 10 w |
   | Forensic · mechanical injuries | 15 | 3 | 3 | 13 w | 16 w |
   | Community Med · communicable dis. | 12 | 6 | 6 | 14 w | 20 w |

   **Dedupe on `public_url` works** — image cards equals distinct images in
   every deck. **"One fact per card" is landing** — the longest back in 95
   cards is 20 words, against a ≤25 target, so the prompt does not need
   tightening. The image half is a ceiling and not a quota, as designed: the
   chapter with no diagrams got 24 theory cards.

   One thing to expect rather than treat as a bug: **all four rows have a null
   `deck_target`**, so they predate the sizing algorithm, and two of them (15
   and 12) are under today's floor of 20. Those two rebuild once on next open
   and then carry a target. That is the documented self-healing, not a loop.
2. **429 handling is untested.** The free tier is the binding constraint and a
   deck is one call. Confirm the quota message reaches the screen rather than a
   raw error.
3. ~~The `textbooks` bucket is public.~~ **Verified private by query,
   2026-09-01** — not by `supabase-tasks.yml`, which had never succeeded (it
   required HTTP 200 from an endpoint that answers 201; now fixed).
   `storage.buckets.public` is `false` for `textbooks` (42 files, 40 MB), and
   the deployed `textbook.ts` fetches
   `${SUPABASE_URL}/storage/v1/object/textbooks/${path}` — the *authenticated*
   endpoint, not `/object/public/` — with the service-role key in the header.
   Nothing needs doing. `diagrams` is still public and is meant to be: those
   are this app's own generated plates, referenced by public URL from notes.

## Deck size is a floor, and two places have to agree on it

A chapter's question count is **not** its deck size. One "describe and classify"
essay question is worth a dozen cards, so a 15-question chapter still owes the
reader a full sitting, and a 44-question one has material for more than 44.

    target = clamp(20, 50, round(questions x 1.2))

`MIN_CARDS`/`MAX_CARDS`/`CARDS_PER_QUESTION` in the edge function and
`MIN_DECK_CARDS`/`MAX_DECK_CARDS`/`CARDS_PER_QUESTION` in
`mobile/src/lib/flashcards.ts` are **20, 50 and 1.2**, and `deckTargetFor()` is
the client's copy of the server's formula. Flat rather than weighted on purpose:
two implementations in two languages must produce the identical number, and
every extra term is another way for them to disagree.

**A cached row is only current if it carries `deck_target`.** That column exists
because `card_count` cannot do the job — it has been written since long before
the algorithm, so every legacy row already has one and would be mistaken for
current. A row without a target is served only if it already meets today's
target, and rebuilt otherwise; a row *with* one is always served, which is what
stops a chapter that genuinely falls short regenerating on every open for ever.

The chapter list shows that number *before the deck exists*, which is why the
two must not drift: the row is a promise the server has to keep.
`npm run check:flashcard-size` pins the constants, both formulas, and two rules
that are easy to undo:

- **Images are a ceiling, never a quota.** `wantTheory = target - images`, so a
  chapter with four diagrams gets four image cards and sixteen theory ones, and
  a chapter with none gets twenty theory cards. Take that subtraction out and
  every chapter without diagrams builds a near-empty deck.
- **An undersized cached deck rebuilds once, not for ever.** Rows carry
  `card_count` as the marker that they came from a version that knows about the
  floor. Without it, a chapter that genuinely cannot reach 20 cards would fail
  its own cache test on every open and burn a Gemini call each time.

Ask the model for **more** cards than the deck needs (`THEORY_MARGIN`). It
routinely under-delivers, and cards are then dropped again as duplicates. Asking
for exactly 20 is how a deck arrives with 11.

## The three counts are Anki's, and the queue is capped

`20 new · 3 learning · 0 to review` is not a deck summary — it is what is **due
right now**:

- **new** — never studied. `dueQueue` serves at most `settings.newCardsPerDay`
  a day. It defaults to Anki's 20 and **the reader can move it** (5-50) from the
  slider under HOW MUCH A DAY on the Flashcards screen — the control lives next
  to the decks it governs, not in Settings, because "why are there only 20?" is
  the question it answers. A 50-card deck showing "20 new" has not lost 30; the
  header says `30 more tomorrow` for exactly this reason.
- **learning** — seen today, still inside the 1m/10m steps, coming back within
  the hour.
- **to review** — graduated cards whose interval has elapsed. It is **0 on a
  new deck and stays 0 until the next day**, because a card graduated today is
  due tomorrow at the earliest. Zero there is the system working.

## Card ids are hashed from the front, not the index

They used to be `{subtopicKey}::0`, `::1`, … The schedule lives on the phone and
is keyed on the id, so regenerating a chapter handed card 0's ease, interval and
lapses to whatever question landed in slot 0 next time. The deck kept working
and quietly lied about what the reader had learned.

Decks the reader makes themselves — written, generated, or with photos on
them — are in `.agents/rules/61-own-decks.md`.
