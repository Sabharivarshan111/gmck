# Uploaded plates with no row — filed to their questions (2026-09-02)

**Done, in production.** This records what was changed and how, because the fix
is data and a data fix leaves no diff to read.

## What was wrong

Diagrams keep being generated and uploaded to the `diagrams` bucket (Antigravity
runs the engine) without a matching `question_diagrams` row ever being written.
A plate with no row is invisible in every app — `findDiagramsForQuestion` is a
strict identity join, so no row means no picture, correctly. That is why
triple-tapping *ulnar nerve*, *median nerve*, *elbow joint* and ~30 others
showed nothing though the picture existed.

Found with: every `storage.objects` name in `diagrams` that no row's
`public_url` ends with. On 2026-09-02 that was ~33 recent uploads (all of
1–2 Sep) plus a tail of older ones.

## What was done

Each plate was matched to the bank question it draws by reading the filename
against the extracted question bank (`scripts` in the scratchpad walk
`src/data/topics/**`, tokenise the filename, and print candidate questions for a
human to pick — the same discipline as `audit:diagrams`, never applied blind).
Then the question's existing placeholder row (they all existed, `public_url
IS NULL`) was updated to point at the plate:

```
update question_diagrams set storage_path = <plate>,
  public_url = <base>||<plate>, updated_at = now()
where question_id = <question-<first50>>;
```

60 rows across ~50 plates, in two batches. Where two plates draw one question
(stomach: arterial + lymphatics; duodenum: histology + gross), the second plate
is a new row reached by `question_text` — `question_id` is UNIQUE, so a
question's extra diagrams can only be found by the text query. Slug ids used for
those: `question-duodenum-parts-interior-arterial-arcade`,
`question-stomach-lymphatics-virchow-node`.

Both apps picked it up with no deploy: both read this table live and
`applyQuestionDiagrams` / `applyTopicDiagrams` rebuild a cached note's diagrams
on every open.

## Still homeless (plate exists, no bank question)

Four plates draw a topic the question bank has no question for, so there is
nothing to file them under and they stay invisible — correctly, not a bug:

- `anatomy/femoral_nerve_course_branches.jpg`
- `anatomy/trigeminal_nerve_divisions_ganglia.jpg`
- `anatomy/spleen_visceral_surfaces_relations.jpg`
- `anatomy/submandibular_ganglion_secretomotor_pathway.jpg`

A further ~27 orphans are histology plates, references, and duplicate takes of a
topic that already has its canonical plate (several shoulder/hip/bone variants).
Left alone on purpose: a second near-identical picture is clutter, not a fix.

## The recurring cause

This will happen again on the next upload run. The durable fix is for whatever
uploads a plate to write its row in the same step. Until then: after an upload,
re-run the orphan query above and file the new plates. Do **not** loosen the
matcher to reach them — that is the keyword search coming back through the side
door. File the row.
