# A deploy payload, not a copy of the function

**Delete this folder the moment it is deployed.** It exists only so that a
change to `generate-handwritten-notes` written in a sandbox with no route to
Supabase can be applied later, by whoever has one. The parent folder's README
explains why a *permanent* copy of this function must never come back: the last
one drifted two versions behind production, and reading the code then agreed
with the bug it was hiding.

## What is here

`index.ts` and `textbook.ts`, downloaded from the deployed function at
**version 52** with `get_edge_function`, with one change on top of it:
Physiology notes are guaranteed a flowchart section. `textbook.ts` is byte for
byte what is deployed and is here only because a deploy replaces every file in
the function.

## The change

Physiology is examined on mechanism — reflex arcs, feedback loops, conduction
pathways, cascades — so the sequence is what the student writes down. The
system prompt has always *asked* for a flowchart "if the question asks for a
cycle, pathway, steps, mechanism…", which is one conditional line among forty:
3 of the 11 Physiology notes in the cache came back without one.

A prompt cannot be checked. Output can. So the guarantee is two halves:

1. `PHYSIOLOGY_FLOWCHART_RULE` — a subject-scoped block added to the generation
   prompt when `pickBookKey(subject) === "physiology"`. This is the cheap half:
   when it works, nothing else runs.
2. `ensurePhysiologyFlowchart()` — applied at **every** point that writes to
   `handwritten_notes`, which is what makes it a guarantee rather than a hope:
   - mode 1, the single-question generation upsert,
   - mode 2, `saveContent` — where a merged multi-batch topic note is written,
     and where `physiology::paper-1/general-physiology` slipped through,
   - mode 3, the persisted AI edit, which could otherwise drop a flowchart the
     note was guaranteed.

   If the content has no flowchart with at least three labelled steps, it makes
   ONE targeted call asking for that section and nothing else, and splices the
   result in before "Must-Write Points".

**The repair is allowed to refuse.** A question with no sequence in it — a bare
definition, a list of normal values, a pure enumeration — gets `applicable:
false` and the note is saved unchanged. An invented flowchart is a wrong answer
a student copies onto paper, which is worse than a note without one. Coverage
is the goal; truth outranks it.

Everything is scoped by `pickBookKey(subject) === "physiology"` rather than a
fresh string test, so it cannot drift from the matcher that chooses Sembulingam.
Extending it to another subject is one line in that comparison.

## How to deploy it

`deploy_edge_function` on project `pmtgeydtqypwrypshhsx`, slug
`generate-handwritten-notes`, with these two files named
`generate-handwritten-notes/index.ts` and `generate-handwritten-notes/textbook.ts`.

Then, in order:

1. `get_edge_function generate-handwritten-notes` → version > 52 and the source
   contains `ensurePhysiologyFlowchart`.
2. Triple-tap a Physiology question that has no cached note and confirm the
   flowchart is on the page.
3. `cd mobile && node scripts/physio-flowchart-backfill.mjs` for the plan, then
   `--run` to give the already-cached notes theirs.
4. Delete this folder.
