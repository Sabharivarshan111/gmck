# ORBIT PG offline question-bank audit — 10 October 2026

**Overall status: NOT COMPLETE. Do not advertise "all PYQs to 2026" or
"every question with explanations under 25 MB".**

This report separates genuine reproducible dataset facts, installed app content,
and publisher claims. All MB are decimal unless stated otherwise.

## 1. Installed Android/Vercel app content

| Area | Verified | Notes |
|---|---:|---|
| PG QBank entry in Notes | yes | Immediately below Case Proformas |
| Offline PG source files | yes | `mobile/src/lib/pgEntranceBank.ts` |
| Source directory links | 20 | May require internet and publisher account |
| Original practice MCQs | 10 | NOT past-year questions |
| Approved historical PYQ pack manifest | **0** | `mobile/src/lib/pgPacks/generatedManifest.ts` contains `[]` |
| Imported NEET-PG/AIIMS/INI-CET/FMGE solved PYQs | **0** | No built-in approved records yet |
| PG question dependency on Supabase | **none** | `pgLocalBank.ts` searches bundled packs |
| Full offline 1991–2026 archive | **no** | External sources are links, not installed questions |
| Offline app build size delta | **not measured** | Compression benchmark is not a signed Android AAB/APK |

The `pg_exam_questions` Supabase table was previously created but is not
used by the PG reader and had zero imported questions. Other ORBIT features
may still use Supabase.

## 2. Full real-data benchmark

Dataset: https://huggingface.co/datasets/openlifescienceai/medmcqa

Completed and successful GitHub Action:
https://github.com/Sabharivarshan111/gmck/actions/runs/38033518459

| Test | Result |
|---|---:|
| Total raw rows | 193,155 |
| Rows with answer labels | 187,005 |
| Rows without labels (AIIMS-PG test) | 6,150 |
| Rows with inadequate explanations (under 20 characters) | 30,450 |
| Exact identical stems+options found | 0 |
| Exact duplicate detection includes normalized/near matches? | No |
| Brotli 9 in 1,000-row blocks | 45.277 MB |
| DEFLATE 9 in 1,000-row blocks | 52.162 MB |
| Brotli 9 in 10,000-row blocks | 39.035 MB |
| Zstd 19 in 10,000-row blocks | 36.888 MB |
| LZMA 9 in 10,000-row blocks | 36.013 MB |
| **Brotli 11 in 25,000-row blocks** | **35.197 MB** |
| Without explanations: Brotli 9 diagnostic | 7.714 MB |

**35.197 MB is the smallest of the tested full-content variants**, not a
theoretical minimum for all possible encodings. It retains question, options,
answer and available explanation, plus identifiers/topic metadata.
It does not contain missing answers or missing explanations.
It is NOT an APK size or legally cleared publishable dataset.

**25 MB target verdict: FAILED** for full answer-keyed 2022-era content.
35.197 MB is 10.197 MB over the requested 25 MB cap even before packaging,
2023–2026 questions, image-dependent items, review metadata and possible
additional full explanations. An answer-only diagnostic of 7.714 MB meets
the size constraint but breaks the user's requirement to retain all explanations.

## 3. Exam completeness and clinical validation

- MedMCQA *training* contains 182,822 prep/mock/online test-series items;
  these must NOT be sold as 182,822 confirmed PYQs.
- The 4,183 validation entries correspond to historical NEET-PG-labelled
  material but do not prove complete year/session coverage.
- The 6,150 test entries are historical AIIMS-PG-labelled questions, with
  public answer labels withheld.
- The historical pre-2020 AIIMS-PG/JIPMER/PGIMER exams are predecessors, not
  old sessions of INI-CET.
- FMGE is not represented as a distinct complete exam in MedMCQA.
- 2023–2026 source directory contains links; zero recalled questions have
  been extracted, medically checked, and packaged into the app.
- Free-to-read unofficial answer compilations do not imply redistribution
  permission. Source-level licensing and question-level provenance both
  require independent review.
- Format checks and "expert explanation" labels are NOT independent clinical
  review or proof of a correct key.
- Full completion requires per-exam, year, sitting, question/source, answer
  reference, rights, and any original image to be audited before packaging.

## 4. Outside source spot-checks (10 October 2026)

- NBEMS NEET-PG 2026 answer-key/scorecard notice dated 1 October 2026:
  https://webdisk.natboard.edu.in/allnotice.php
- Reporting indicates the NEET-PG key supplies question identifiers but not
  full stems/options; thus a key alone cannot reconstruct the full paper:
  https://indianexpress.com/article/education/neet-pg-2026-answer-key-out-candidate-response-sheet-question-id-nbems-supreme-court-petition-objection-window-nbe-edu-in-10906086/
- INI-CET May 2026 memory-based questions/solutions:
  https://medicine.careers360.com/articles/ini-cet-2026-question-paper-with-answer-key-solutions
- FMGE June 2026 memory-based questions/answers:
  https://medicine.careers360.com/articles/fmge-2026-question-paper-answer-key-solutions

These sources document *availability of partial recalls*; they are not a
verified complete, freely redistributable machine-readable archive.

## 5. Required release gates

1. Approve the content's reuse rights, question provenance and clinical answer
   verification; include source link and exact examination/session where known.
2. Keep historical and original practice questions distinctly labelled.
3. Generate the local pack manifest; ensure it is not empty.
4. Run `node scripts/check-pg-content-integrity.mjs`,
   `python3 scripts/test-pg-offline-packs.py`, and
   `npm --prefix mobile run typecheck`.
5. Build the signed Android variant and compare true compressed APK/AAB delta.
6. Test airplane-mode launch, year search, answer reveal and large-pool paging
   on an actual low-end Android device and mobile Safari/PWA.
7. Claim "under 25 MB" only when the complete claimed corpus passes the
   *actual* download-size measurement. Do not omit records silently.

## 6. Recommendation

For a strict 25 MB fully offline Android increment, use a transparently labelled
curated core pack with independently checked answers and explanations. If the
entire available historical corpus is required, accept a measured larger bundle
or offer an optional verified offline expansion. Neither solution requires
Supabase as the live question-answer database.
