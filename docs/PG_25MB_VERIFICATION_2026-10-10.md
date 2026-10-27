# ORBIT PG Entrance Offline: 25 MB completeness verification

Audit date: 2026-10-10. Scope: native Android app and identical Vercel/iOS
browser build. **Under 25 MB AND includes everything: NOT VERIFIED / FALSE
for the current ORBIT build**.

## Proof from deployed-source branch

- `mobile/src/lib/pgPacks/generatedManifest.ts` currently declares
  `GENERATED_PG_PACKS = []`.
- `mobile/src/lib/pgEntranceBank.ts` contains 10 clearly labelled original
  practice MCQs, not historical exam PYQs.
- The source directory has 20 external links and metadata. A source **link**
  is not a locally installed question.
- The UI uses `searchOfflinePgQuestions`, which performs no Supabase reads
  for PG questions, but an empty manifest means zero bundled PYQs.

## Full 2022 dataset breakdown

The HF `openlifescienceai/medmcqa` data has 193,155 rows:
* train 182,822 -- principally mock and online test series records;
* validation 4,183 -- historically NEET-PG-labelled;
* test 6,150 -- AIIMS-PG exam-labelled, publicly withheld answer keys.
* 187,005 rows had non-null answer labels across train + validation.
* 30,450 of those keyed rows had explanations shorter than 20 characters.
  A nonempty explanation field is NOT the same as a medically verified answer.

Source: https://huggingface.co/datasets/openlifescienceai/medmcqa
And: https://github.com/medmcqa/medmcqa

## 2026-10-10 on-runner real-data compression benchmark

Exact job evidence:
https://github.com/Sabharivarshan111/gmck/actions/runs/38033051471

Using compiler-like self-contained question chunks with answer labels,
explanations, and metadata:

| Cohort | Keyed rows | DEFLATE/ZIP-style | Brotli 8 |
|---|---:|---:|---:|
| train | 182,822 | 51.55 MB | 44.83 MB |
| validation | 4,183 | 0.86 MB | 0.77 MB |
| TOTAL | 187,005 | **52.41 MB** | **45.60 MB** |

These measures exclude the unanswered 6,150 test questions,
2023–2026 NEET-PG/INI-CET/FMGE recalls, image assets, and Android app code.
They are compressed sources, not measured `AAB` / Play Store download deltas.

The separate max-compression and exact deduplication probe:
https://github.com/Sabharivarshan111/gmck/actions/runs/38033518459

This test compares Brotli 9/11, Zstandard 19 and LZMA 9 on lossless compact
question records. It must finish before anyone can cite a new optimized size.

## Full collection completeness and metadata

- MedMCQA is not a full historical archive of complete NEET-PG papers.
- It is not a complete INI-CET or FMGE archive.
- Per-question exam year is not reliably present in MedMCQA.
- The existing 2023–2026 entries are **research source links**, not packaged,
  independently verified question-and-explanation records.
- Some publishers publish unofficial, partial, memory-based recalls, not
  official questions or answer keys.
- Public dataset license alone does not prove every third-party question
  embedded in it has reuse rights.
- A real completeness claim needs session-by-session inventories, correct
  answers and original source evidence, deduplication reports, diagrams,
  reuse permissions, and device-level offline tests.

## Decision rule

The app must **not** display "all PYQs 1991–2026," "100% complete," or
"under 25 MB contains everything" while these gaps remain.

For a firm 25 MB Android limit, identify precisely which curated,
rights-cleared and explanation-reviewed questions are included; list missing
years/sittings explicitly. For everything offline, raise the bundle budget
based on a measured Android AAB/APK size, or offer clearly labelled optional
offline pack downloads. No paid backend is needed for the bundled portion.
