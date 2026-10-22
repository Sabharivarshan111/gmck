# INI-CET missing-paper import — 22 October 2026

## Result

Individually reviewed52 additional text-only recalls from16 of the17 recovered source PDFs. INI-CET rises from161 to213; AIIMS PG remains90, for303 combined. All251 earlier AIIMS/INI runtime records compare unchanged in every field. NEET PG2,078 and its source-year sidecar are byte-identical.

This batch adds21 May2022 recalls,30 November2022 recalls and one May2025 Anaesthesia recall. These are source-labelled, condensed recall questions, not authenticated original examination wording or complete historical papers. Original explanations are authored for the app. No MedMCQA, model API, publisher explanation or publisher image was added.

## Source review

The17 PDF downloads match the exact SHA256 receipts from the coverage audit. Selected questions, complete options and marked answers were checked against the actual source pages. Thirty-seven scanned source pages were OCRed privately;47 relevant pages, including a rejected draft and split question/key pages, were rendered and visually inspected. The original PDFs and rendered publisher pages remain private staging, with recoverable links/hashes/page receipts committed.

The source manifest now has115 documents, of which92 contribute selections. Sixteen newly acquired documents contribute questions. The November2022 Anaesthesia PDF is recorded but contributes none: its first ventilator vignette is garbled, and other items need different formats or source clarification. The unavailable November2022 ENT document was not replaced by a guessed URL or another session.

Selected original question/option blocks remain below200 words per newly used document, even before condensation. Output excerpts are smaller. No whole coaching bank was reproduced. New metadata and source-page receipts are in `scripts/aiims-ini-missing-papers-import-20261022.json`.

## Rejected and duplicate candidates

Twenty-one additional holds/duplicate records are preserved in the held ledger. Examples:

| Source finding | Action |
|---|---|
| May2025 thiopentone key includes rapid elimination as the cause of short bolus action | Held; redistribution is the relevant mechanism and the correct statement pair is not supplied |
| May2025 lumbar-puncture false-statement key conflicts with the wording about an unusual complication | Held; no guessed substitute key |
| November2022 pathology gives tobacco as the clear-cell genital-tract carcinogen despite offering DES | Held |
| May2022 spinal-cord question has an option ending at “at a specific” | Draft rejected after page inspection; no missing word added |
| May2022 painful-limp/hip image is paired with intracranial-haemorrhage options | Held |
| November2022 sensitivity question implies a negative result always safely excludes disease | Held; sensitivity alone cannot establish that conclusion |
| Older tamoxifen pregnancy washout and rheumatic-fever prophylaxis options lack adequate current context | Held |
| MHC-I/CD8, transfusion screening, airborne isolation and prostate-volume recalls repeat existing items | Kept existing IDs; no duplicate additions |

Other held items include ambiguous Trendelenburg laterality, internally inconsistent clinical-trial size/phase, multi-answer formats and disputed prophylaxis statements. This is not a complete clinical audit of every question on139 source pages. Source dates are not official examination authentication; unselected shift annotations and inconsistent keys are documented rather than silently reconciled.

Reference checks include FDA/DailyMed drug labels, WHO antenatal/hand-hygiene guidance, CDC/ATSDR toxicology and AIDS-defining conditions, GeneReviews CFTR/MECP2, NICE trauma imaging, WSES bowel-trauma guidance, Indian leprosy guidance, psychiatric emergency guidance and WMS frostbite guidance. Exact URLs are in the import receipt. These checks support the selected educational explanations; no blanket independent clinical certification is claimed.

## Storage and compatibility

The combined uncompressed AIIMS/INI payload is about210KB. INI is about151KB, so its former125KB test ceiling no longer fit the requested additions. The per-file ceiling is now175KB, with a new combined220KB ceiling. This is far below the app's requested10MB content target. Existing IDs, bookmarks, answers and year/session semantics are preserved. Dorzolamide maps to Ocular Therapeutics. The service-worker version is `v28-pg-missing-papers-2026-10-22`.

The missing-figure assertion now distinguishes medical severity wording such as “marked leucocytosis” from a figure reference such as “marked structure”; image/picture/shown/missing-image guards remain in place. This corrects a test false positive without enabling image-dependent imports.

## Verification

Passed locally:11 baseline/source-integrity tests;303 record fingerprints/answers/chapter/year/held-exclusion checks; all2,078 NEET year joins and unchanged payload checks; existing offline reader/installer/discussion; native and preview TypeScript; full mobile ESLint; required version/XP/reminder/edge/diagram/APKG/Kotlin/repository/agent-document guards; production web build; Android production JavaScript bundle;716-module release import graph without generic raw packs. The production reader covers360/390/430px, new May/November2022 and May2025 keys, all five arsenic statements, correct dorzolamide chapter, saved-question isolation and offline reload. New screenshots are inspected. The original NEET illustration/private-import/theme/ACEV-stub flow also passes.

The unrelated legacy raw-pack runtime test cannot run in this checkout because its unshipped generated `.zst` files are absent. Those MedMCQA artifacts were not regenerated or added. Existing broader anatomy/iOS release failures are not bypassed, and no all-CI-green, physical-device, signed-APK or Play-release claim is made. Hosted checks, merge and exact live-bank comparison belong to the PR publication receipt.

## Resume

Continue source-level review of remaining eligible items, with item-specific provenance and original explanations. Keep all115 existing source identities/hashes and the full prior payload stable. Use `--extend-reviewed` with matching newly staged source PDFs; do not attempt to refresh changed historical sources silently. The historical2,277 extraction count is retained as historical metadata, not an approved/unique tally.
