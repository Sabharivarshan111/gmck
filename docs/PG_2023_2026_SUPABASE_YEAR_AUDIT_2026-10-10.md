# ORBIT PG year verification and 2023–2026 textbook-answer integration
Audit date: 2026-10-10

## Year provenance — 4,180 existing MCQs

- MedMCQA published in 2022. Source authors label their **validation / dev**
  split as NEET-PG questions from **2001–2022 at the latest**.
  https://github.com/medmcqa/medmcqa/blob/main/README.md
- The dataset's individual validation records include question, opa/opb/opc/opd,
  cop, exp, id, subject and topic **but no trustworthy source exam year/session**.
- Exactly 4,180 rows passed import; three were quarantined as malformed.
  Year attribution for **all 4,180 remains NULL**. This is deliberate,
  not missing effort or a claim all 4,180 come from 2022.
- All 4,180 answer labels are dataset-supplied, not independently medically
  reviewed by ORBIT. 1,986 lack a useful explanation.

## External 2023–2026 source coverage

Each of the following 12 exam-year slots has *at least one* linked
published memory-recall **source** in the app. Source coverage is NOT an
imported/clinically reviewed question count.

| Exam | 2023 | 2024 | 2025 | 2026 |
|------|------|------|------|------|
| NEET-PG | Recall links | Recall links | Recall links | Aug 2026 recall links |
| INI-CET | Recall links | Recall links | Jan/Jul recall links | May recall links |
| FMGE | Recall links | Recall links | Recall links | Jan/Jun recall links |

Evidence:
- https://medicine.careers360.com/articles/neet-pg-question-paper
- https://medicine.careers360.com/articles/neet-pg-2026-question-paper-memory-based-with-solutions
- https://medicine.careers360.com/articles/ini-cet-previous-years-question-papers-pdf-with-answer-key-and-solutions
- https://medicine.careers360.com/articles/ini-cet-2025-question-paper-with-answer-key
- https://medicine.careers360.com/articles/ini-cet-2026-question-paper-with-answer-key-solutions
- https://medicine.careers360.com/articles/fmge-question-paper

The NEET-PG 2026 official answer release, reported in October 2026, contains
question identifiers, not full question stems and options. Therefore the
official answer IDs alone cannot create a complete paper:
https://indianexpress.com/article/education/neet-pg-2026-answer-key-out-candidate-response-sheet-question-id-nbems-supreme-court-petition-objection-window-nbe-edu-in-10906086/

DO NOT claim "complete official solved PYQs 2023–2026." Even memory-based
question stems, options and diagrams are not automatically licensed for
republishing merely because a page is publicly readable.

## Live Supabase textbook availability

Project: pmtgeydtqypwrypshhsx (ORBIT)
- Private storage bucket: `textbooks`
- 42 files / approximately 39.52 MiB across 16 subject prefixes
- The public `reference_books` table has 3 metadata entries. Most OCR
  content is in private Storage, not in this table.
- `public.pg_exam_questions` has **0** imported historical/recent questions;
  it already enforces year provenance, rights evidence, explanation and
  answer-reference constraints through PostgreSQL CHECKs and has RLS enabled.

New edge function: `pg-answer-review`
- Deployed to the existing Supabase project with `verify_jwt=true`
- Requires an authenticated user via `auth.getUser`
- Rate-limited through atomic `consume_edge_quota` RPC: 3/minute, 25/day
- Retrieves relevant private OCR paragraphs **only on the backend** through
  the same `buildTextbookContext` implementation used by notes
- Sends limited source context to existing configured Gemini AI model
- Returns only paraphrased answer candidates, short explanation and evidence
  note, **never** the raw textbook passages or credentials
- Refuses missing context and outputs `UNRESOLVED` if support insufficient.
- A returned A/B/C/D is a PROVISIONAL interpretation, not an official answer,
  clinical proof, or validation that the student's claimed exam/year is true.
- Does not write the user's recalled question/answer to Supabase, because its
  copyright/reuse approval and provenance have not been established.

## Actual app changes

- Third "2023–26 Textbook AI" tab in PG Entrance Questions.
- Four year quick filters and multiple exam-type filters.
- Exam-specific source links and year notes.
- Searchable 4,180-question offline bank remains intact.
- Users can submit their **own authorized** recalled question + A–D options
  for a one-off, signed-in, online textbook check.
- Corrected white-on-white selected-tab text visibility.

## Remaining blockers to full requested archive

1. Obtain papers/questions whose reuse licenses or permissions are clear.
2. Attach exact exam/session and source question identifier for every record.
3. Check images, option fidelity and answer against actual cited textbook
   evidence; clinician-review ambiguous keys.
4. Export only approved records through the existing pack generator.
5. Re-measure actual app size and offline launch on Android and iOS PWA.

The 25 MB cap is met by the current 4,180-question core pack only,
not by every question from 2001–2026.
