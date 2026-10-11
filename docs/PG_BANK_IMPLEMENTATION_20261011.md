# PG bank implementation and evidence — 11 October 2026

The app now withholds structural defects and lets a student compare a supplied answer with private textbook evidence. It does not certify a complete historical PYQ archive or medically perfect answers.

| Inventory | Actual result |
|---|---:|
| Stored MedMCQA source-labelled records | 186,930 |
| Packs audited | 76 |
| Withheld pending repair/image/key review | 1,293 |
| Structurally eligible practice records | 185,637 |
| Eligible NEET-labelled validation subset | 4,142 |
| Eligible general/mock subset | 181,495 |
| Nonempty source explanations | 51,542 |
| Missing or shorter-than-20-character explanations | 135,400 |
| Independently clinician-reviewed answer keys | 0 |
| Complete year/session papers independently verified | 0 |
| External source-directory records | 92 |

Every existing imported record is undated. No FMGE or INI-CET year-specific questions were imported in this change. Source-directory links are not offline questions. Original sample questions remain explicitly separate from PYQs.

The quarantine includes 726 duplicate-option records, 558 explicit visual references without supported assets, 10 placeholder-option records and four conflicting answer-label records. Categories overlap. Stem-only variants with different options remain review candidates rather than assumed errors. NFC normalization preserves medically meaningful symbols.

FirstRanker was inspected at the actual download level: 14 NEET links covering 2012–2024, including both 2024 shifts; no 2025/2026 link in that index despite the title. Recent files include partial recalls, missing options and incomplete terminal headings. The legacy AIIMS index has broken 2020 pages. Its FMGE file is a 291-page mixed compilation with numbering resets, not verified complete sessions. See the detailed FirstRanker inventory for fresh observations versus previously cached counts; terminal numbering is not a unique question count.

## Answer review

The authenticated, metered Supabase pg-answer-review endpoint accepts 1991–2026 or an explicitly unknown year. It preserves source labels, compares a supplied key, retains OCR page markers and returns reference IDs, paragraph IDs and SHA-256 hashes. Invented citations, insufficient or conflicting evidence and unsupported image-dependent questions yield UNRESOLVED. Citation membership proves reference provenance, not semantic medical correctness. AI candidates remain provisional and do not replace dataset keys or become approved records. Dedicated reference gaps are disclosed. Private OCR and provider credentials are never returned.

The current endpoint supports a single supplied answer among A–D. INI-CET multiple-correct items require an explicit future format and adjudication path; they must not be coerced into single-correct questions.

## Imports and coverage

Future MedMCQA imports resolve one immutable Hugging Face revision for both splits, preserve that revision in provenance, and preflight option, image and conflicting-key faults before pack generation. The dataset-card Apache declaration is distinguished from the original repository's MIT code licence; it does not independently settle rights in every underlying recalled exam item. Newly researched providers remain reference-only. No private competitor question bank was copied.

Source ranges, publisher counts, recall keys and medical correctness are separate claims. No evidence supports a promise that all questions from the beginning through 2026 are present, or that every answer is perfect. Future exam sittings cannot be inventoried as completed papers. Missing historical sessions, images, rights evidence, full explanations and clinical adjudication remain explicit gaps.

## Validation

Native and web TypeScript and targeted lint passed. The full Vercel build passed using an explicit local Node heap allowance. Deterministic review, import, full-corpus audit/generator and 120 actual offline reader count/pagination/search/year cases passed. Focused browser testing runs in CI; the local Chromium download was blocked. Native bundling and release pipelines are checked separately. No Android-device behavior or Play Store publication is inferred from a bundle or GitHub release.

Existing question source assets retain a 21.63 MB DEFLATE estimate before the small quarantine/catalog additions. This is not a measured APK/AAB delta or iOS cache footprint.
