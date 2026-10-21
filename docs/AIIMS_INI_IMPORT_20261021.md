# AIIMS PG and INI-CET recall-practice import — 21 October 2026

The owner requested the same offline, chapter-wise experience as the existing NEET bank, using papers and other direct sources rather than a generic dataset.

## Included in this first batch

- AIIMS PG: **66** text-only single-answer recall-practice items, across **29** existing chapters.
- INI-CET: **49** items across the source collection years 2020–2026.
- **115 total**, with original authored explanations. Combined JSON payload is approximately **70 KB** before compression.
- The existing **2,078 NEET questions** and their images, installed-bank pointer, question IDs and progress are unchanged.
- Vault's PG Practice entry opens the existing reader with NEET-PG, AIIMS PG and INI-CET choices. Each bank has its own saved questions and study state. Search, year/subject/chapter filters, answer reveal and the existing study tools use the same renderer. No years, publishers or book titles are added to the study UI.

This is a **partial recall-practice selection**, not a claim to have recovered every full paper, authenticated original examination wording, or obtained independent clinical certification. Twenty-seven older items were manually transcribed with whitespace and obvious OCR spelling normalised; the remaining 88 were joined to explicit reviews using question/options/key fingerprints. Missing options, image-dependent items, multi-selects and disputed answers are not padded with invented content.

## Research and source accounting

`scripts/aiims-ini-sources.json` records **44 retrieved source documents/pages**, with original URLs and fingerprints. Nineteen are the earlier INI PDF audit's question/key documents; the rest are AIIMS PG collections from EducationObserver, FirstRanker and MedicoApps. Raw source documents and full candidate extracts remain in private local staging, not the public repository or application bundle. No publisher explanations or illustrations are copied into the app.

The current extraction pass produces **2,277 candidate rows**. These are parser outputs, not validated unique questions or imported questions. Many require extraction repair, item-level attribution, answer checking, images or multiple-answer support. Only the 115 explicit reviewed selections are reachable at runtime. The compilation limits selected question/option excerpts from each document; it is not a wholesale reprint of any collection.

Important exclusions discovered while reading the sources:

- EducationObserver attachment `12980`, labelled 2003 in its archive filename, begins **AIIMS MAY 11 PAPER** and has a 2011 update stamp. It cannot establish 2003 coverage.
- Attachment `12984`, labelled a November 2007 PG paper, contains a **DENTAL MATERIALS** section. Do not silently count it as an MD/MS paper.
- Attachment `12977`, labelled 2000, contains only four anatomy questions. It is not a complete paper and none is included in this batch.
- Attachment `12985` has a broken text/font mapping and needs OCR plus visual checking.
- The 2011 archive file contains missing choices and answers; no complete-paper claim is made.
- MedicoApps November 2017 first-item key conflicts with its external-carotid question; excluded.
- Prepp 2024 Oslo declaration key conflicts with the topic and is excluded, as are its ambiguous image/clinical items.
- DigiNerve May 2026 includes a cleft-development item with a questionable key and several image-dependent questions; those are excluded. No substitute image is generated.

Answers are preserved where a supplied key passes the author check. A small number of older selections have explicit `answerOrigin: author_checked` because no usable key was supplied alongside that item. Their answers and explanations were authored for this import; they are not represented as official AIIMS keys. Medical reference spot checks included NCBI Bookshelf anatomy/physiology and vitamin chapters. The source ledger and per-item receipt retain provenance without cluttering the student reader.

## Rebuild and verification

```sh
python scripts/build-aiims-ini-bank.py --sources /path/to/private-staging --download
node scripts/test-aiims-ini-offline.mjs
CHROME_PATH=/path/to/chromium node mobile/web/pg-recall-check.mjs
```

The builder validates source files, explicit review identities, source-option/key fingerprints, syllabus paths, duplicate identities and complete options before writing a candidate bank. It does not call a model, use Gemini, fetch a generic dataset, modify the installed NEET bank or publish a deployment.

Verified locally:

- All 115 question/options/key fingerprints, authored explanations and exact existing syllabus paths; answer indexes, pagination, offline search/filtering and mutation isolation.
- Existing NEET reader/installer, planner and discussion tests.
- Actual production browser UI at **360, 390 and 430 px**: exam switching, counts, answer/explanation reveal, saved-question separation, offline switching and returning to the unchanged NEET bank. Screenshots are in `docs/evidence/pg-recalls/`.
- Existing NEET browser regression including private imports, persistence, failed-import recovery and offline reload.
- Native and preview TypeScript, targeted ESLint, status-bar insets, version agreement, Kotlin interface guard, question-diagram guard and repository integrity.
- Production Vercel-shaped build and Android production JavaScript bundle. Both new bank identity markers and content are present in the Android bundle.

The older broad preview smoke harness was also attempted (with loopback binding for this environment). It reports missing home controls such as Themes/Menu/View all years and failures in several legacy topic flows; it is not counted as passing. Those home controls are outside this patch. The dedicated production PG and existing NEET browser checks above passed.

Browser checks are not physical Android-device checks. No Play Store upload is performed by this change. Deployment/build status must be checked against the eventual commit rather than inferred from these local results.

## Resume

Expand the individually checked selection from staged sources, retaining original explanations, correct chapter mappings and complete option sets. Resolve disputed supplied keys instead of automatically trusting them. Add actual required images and explicit multiple-answer support before promoting those items. Verify actual source identity for 2002/2003/2004/2007/2008/2011 and other gaps; the 1999–2020 archive span is not all-session completeness. Keep exam-date and admission-year labels distinct. Do not restore the retired generic bank.
