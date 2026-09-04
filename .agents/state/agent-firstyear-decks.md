# agent-firstyear-decks — progress log

## Task
First-year-aware flashcard generation: reasoning + applied + pathway cards,
textbook-grounded, pathway plates on the back, gorgeous pathway rendering in
BOTH mobile (`mobile/src/screens/FlashcardsScreen.tsx`) and web
(`src/components/flashcards/StudyView.tsx`). Shared logic in `src/lib/`.

## Status
- [ ] reading sources

## Log
- (start) reading edge functions + both study screens.

### Facts confirmed by read-only SQL (project pmtgeydtqypwrypshhsx)
- `question_diagrams.diagram_kind` is a real column: flowchart / lifecycle /
  algorithm / anatomy / histology_plate / comparison / table / other.
  Biochemistry 79 flowchart + 3 lifecycle; Physiology 56 flowchart; Anatomy 78
  flowchart. So "is this plate a pathway" is a COLUMN VALUE, not a text rule.
- First-year rows are filed under `question_id` = `question-` + first 50 chars
  whitespace-dashed (e.g. `question-Glycolysis-–-definition,-sequence-of-reaction,-ene`),
  and `question_text` still carries the stars. Both the id join and the text
  equality will hit. `subtopic_key` on those rows is 'essay'/'short-notes',
  which is why generate-flashcards' existing `matchesSubKey` heuristic finds
  nothing for first year.

### Plan
1. `supabase/functions/generate-flashcards/textbook.ts` — byte-identical copy of
   the notes function's, pinned by a new check.
2. index.ts: identity join on question_id/question_text (never a text rule),
   textbook grounding, first-year prompt (reasoning/applied/pathway mix),
   `pathway` payload + `mode` on cards.
3. Shared `src/lib/pathwayCards.ts` (types + normalizePathway). Mobile via @shared.
4. Two thin renderers: mobile/src/components/PathwayFlow.tsx and
   src/components/flashcards/PathwayFlow.tsx.

## 2026-09-04 — edge function DONE (not deployed; parent owns deploys)
- `supabase/functions/generate-flashcards/textbook.ts` = byte copy of notes'.
- index.ts: pickBookKeys → FIRST_YEAR_BOOKS gate; buildTextbookContext grounding
  for any subject with a book; identity join (question_id + question_text, .in
  chunked at 40) ranked BEFORE the old subject-wide substring scan; pathway
  cards only from identity rows whose diagram_kind ∈ {flowchart,lifecycle,
  algorithm}; FIRST_YEAR_SYSTEM_PROMPT (recall/reasoning/applied with the real
  paper's phrasings) + PATHWAY_SYSTEM_PROMPT; cards gain `mode` and `pathway`.
  `wantTheory = target - selectedDiagrams.length` and the clamp are untouched
  (check:flashcard-size greps them literally).
- Shared reader: `src/lib/pathwayCards.ts` (normalizePathway, CardMode,
  pathwayStepLabel). Mobile will import via `@shared/pathwayCards`.
NEXT: DeckCard shape in both flashcards.ts; PathwayFlow renderers x2;
check:pathway-cards; preview shots.

## Clients DONE
- `mobile/src/components/PathwayFlow.tsx` and
  `src/components/flashcards/PathwayFlow.tsx` — numbered rail + step boxes +
  HIGH-YIELD caption. Both read via the shared `normalizePathway`.
- Both study screens: mode chip above the question; PathwayFlow under the plate
  on the back; the "could not be loaded" line softens when a chain is present.
- `DeckCard` in mobile/src/lib/flashcards.ts and src/lib/flashcards.ts gains
  `mode?` and `pathway?` (orthogonal to `kind`, so old decks are unaffected).
- NEW `npm run check:pathway-cards` (mobile) — negative-tested twice, bites.
- check:textbooks now also pins the two edge functions' textbook.ts byte-equal.
NEXT: preview fixtures + screenshots on both apps; smoke.
