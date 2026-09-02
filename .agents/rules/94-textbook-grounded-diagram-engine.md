# 94 - Textbook-Grounded Medical Diagram Engine (Antigravity Exclusive)

## 0. Which diagram a question shows — read this before touching the lookup

**A question shows the diagram its own `question_diagrams` row points at, and
nothing else.** `mobile/src/lib/handwrittenNotes.ts` joins on
`question_diagrams.question_id`, which is the app's own per-question key
(`question-` + the first 50 characters, whitespace dashed — `getQuestionId` in
`lib/progress.ts`), with the row's `question_text` as the second key for the
hand-inserted rows whose id is a slug. Every row is one question, so the number
of diagrams a question has is the number of rows it has: usually one, often
none, never a neighbour's.

That is not how it started. The lookup used to score candidates against
"exclusive entity families" — per-pathway word lists — and return every
biochemistry row that shared a word with the question, numbered `(1/3)`,
`(2/3)`. Opening *TCA cycle – definition, sequence of reaction, energetics,
regulation* gave a Glycolysis plate, then a Gluconeogenesis plate, then its own.
Two rounds of widening and narrowing those lists only moved which questions
were wrong. **Do not reintroduce keyword matching, scoring, or containment**;
`npm run check:diagrams` fails if `EXCLUSIVE_ENTITIES`, `DIAGRAM_STOP_WORDS` or
a score reappears, and runs the real lookup against production rows.

Three more things that were part of the same bug:

- **The rebuild replaces, it does not top up.** `applyQuestionDiagrams` strips
  every diagram section and rebuilds from the lookup, on first open, on
  Regenerate, and on an accepted "Fix notes with AI" edit. Those last two used
  to *pin* the existing diagrams to the top as something to preserve, so a note
  cached with the wrong picture kept it for ever and no correction could reach
  it.
- **No row means no picture.** A plausible neighbour is worse than nothing.
- **The cache heals itself.** A note whose diagrams no longer match is rewritten
  back to `handwritten_notes` the next time it is opened.

**Placing a picture is not choosing it.** Once a chapter's diagrams are known to
be its own, `sectionFor` decides where each sits on the page, and a heuristic is
allowed there because a mistake reorders a correct picture by a paragraph and
never shows a wrong one. It was containment-only, which matched almost nothing
(two-word headings like "Shoulder Joint" were skipped; "Breast: Anatomy and
Lymphatics" is not a substring of the breast question), so every early picture
fell to the batch fallback and stacked on section zero — every image at the top,
then all the theory. It now also places a picture against the unclaimed heading
sharing the most of its distinctive words. That is `overlap` on placement, not a
`score` on the lookup; the lookup stays a strict identity join.

### The filename is an auditor, not a matcher

Every plate is named for what it draws, so a question sharing two or more of a
filename's *specific* words is probably that plate's. `npm run audit:diagrams`
does exactly that and prints where it disagrees with the stored row — it found
eleven genuinely wrong rows on its first run ("Megaloblastic Anaemia" filed
under a bilirubin plate, "Peptic Ulcer Disease" under serum protein
electrophoresis). **Use it to fix rows; never to choose what the reader sees.**
It also puts "Cerebellum — external and internal features" on
`right_atrium_internal_features.jpg` and "Median nerve" on
`facial_nerve_complete_course.jpg`, which is the reported bug all over again.

## Core Architecture & Duplicate Prevention Protocol

This skill and pipeline is **exclusive to Antigravity** using its native `generate_image` (Gemini image generator) tool. Claude does not have native `generate_image` capabilities.

---

### 1. Mandatory Pre-Generation Live Supabase Storage Check
Before generating ANY diagram:
1. **LIVE QUERY**: Run a live script against `https://pmtgeydtqypwrypshhsx.supabase.co` storage bucket `diagrams/` across all subject directories.
2. **STRICT RULE**: **NEVER regenerate an existing diagram**. If an image already exists in Supabase Storage or `question_diagrams`, REUSE IT. Do NOT call `generate_image` for already-generated structures.

---

### 2. The inventory is the table, not this file

This section used to list all 216 filenames by subject. It is gone on purpose:
it had already drifted (the bucket holds **196** distinct plates across 862
mapped rows, not 216), and a hand-copied inventory in a rules file is a
duplicate-prevention tool that itself causes duplicates. Ask the database:

```sql
-- what exists, and how many questions each plate serves
select split_part(storage_path,'/',1) as folder,
       split_part(storage_path,'/',2) as file,
       count(*) as questions
from question_diagrams
where public_url is not null
group by 1,2 order by 1,2;

-- what still has no picture
select subject, question_text from question_diagrams
where public_url is null order by subject;
```

**Never regenerate an existing diagram.** If a plate already draws the
structure, point the row at it instead of spending image quota — a second file
of the same thing is a second answer that can disagree with the first.

### 3. Diagram Generation Specifications (Antigravity Native `generate_image`)
- **Title**: Bold uppercase title centered at the top of the canvas matching the exact university exam question.
- **Background**: Solid clean white paper background (`#FFFFFF`) with high contrast and zero clutter.
- **Leader Lines**: Crisp, straight horizontal pointer lines with legible bold anatomical/biochemical labels.
- **Art Style**: Colored pencil anatomical/histological sketching standard for university theory and practical exams.
- **Aspect Ratio**: `4:3` (optimal for mobile and desktop viewports).

