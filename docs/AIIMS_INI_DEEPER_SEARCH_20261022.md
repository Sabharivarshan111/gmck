# Additional faculty recalls and archive audit — 22 October 2026

The owner requested a deeper search for AIIMS PG and INI-CET recalls, continuing the existing NEET-PG-style import and explicitly excluding MedMCQA.

## Reviewed addition

Nine text-only selections: AIIMS May2016 psychiatry3 and INI-CET May2022 community medicine6. Candidate totals are **AIIMS83 + INI156 =239**. The previous230 complete records retain their IDs, choices, answers, explanations and years. NEET2078 is unchanged. The receipt filename remains stable for existing tooling; its date and counts describe this candidate.

The two public faculty decks are linked and hashed in `scripts/aiims-ini-discovered-20261022.json` and the main source manifest. Actual downloaded HTML, question/answer slide images and their hashes were checked; search-generated descriptions were not treated as source answers. Source slide numbers are recorded in each new review. Original slide images and publisher explanations are not distributed. Selected question/option text totals52 words for the AIIMS deck and163 for the INI deck, within the cumulative200-word document limits.

AIIMS selections: semantic versus episodic memory, MMSE cognition assessment, and the false claim that obsessions are always present in schizophrenia. Source spelling “Mood and effect” is retained as a supplied choice. No missing distractor was invented.

INI selections: the April2022 WHO SAGE HPV dose recommendation, descriptive statistics, resuming interrupted DPT vaccination, measles airborne isolation, Indian routine donor-screening targets, and amphotericin B in visceral leishmaniasis. Historical policy context is made explicit where needed. WHO, CDC, Indian Ministry of Health and original research references are recorded as answer cross-checks; these do not authenticate original exam wording.

The confidence-interval item was held as a semantic duplicate of an existing AglaSem selection. The remaining faculty-deck questions were not bulk approved: some require images, have several potentially correct statements or ambiguous populations, or depend on historical programme definitions. The AIIMS enuresis item has a questionable routine-ultrasound key and remains outside the bank.

## Additional sources actually found

| Collection | Evidence and remaining work |
|---|---|
| [PG Blazer May2011](https://pgblazer.com/aiims/aiims-2011/) | Category reaches label160 and includes duplicate numbering158/159. Individual complete question pages exist, but other entries contain missing choices. Direct acquisition returned406; search retrieval alone is not substituted for acquired source bytes. |
| [PG Blazer November2011](https://pgblazer.com/aiims/aiims-november-2011/) | Publisher advertises200 recalls and links individual entries. Some have incomplete options. The exam was13November2011 for January2012 admission: preserve the exam year. This is a candidate pool, not200 reviewed imports. |
| [PG Blazer May2015](https://pgblazer.com/aiims/aiims-may-2015/) | Collection reaches label35; independent pages include choices and, for some, editorial answers. Other entries rely on discussion comments or have disputed/context-sensitive stems. No claim that all35 are complete or unique. |
| [AIIMS2015 faculty deck](https://www.slideshare.net/slideshow/1-aiims-november-2015-questions-answers/62976682) |436 slides, not436 questions. Cover and first question sayNovember; numerous interior headers sayMay. Hold session attribution until resolved. |
| [AIIMS May2016 psychiatry](https://www.slideshare.net/slideshow/aiims-2016-may-psychiatry-questions-and-answers/62976754) |10 slides with six numbered questions, not the search-generated claim of ten questions. Three selected after key/concept review. |
| [INI-CET May2022 PSM](https://www.slideshare.net/slideshow/inicet-may-2022-psm-recall-questions/251923213) |90 slides with22 numbered questions. Six selected. Slide count, repeated explanation slides and duplicate questions are excluded from question totals. |
| [INI-CET November2023 Part1](https://www.slideshare.net/slideshow/ini-cet-nov-2023-recall-session-part1pdf/264931543) | New multi-subject lead with named faculty. Original publisher provenance, images, choices and keys need review. Its generated summary confuses pityriasis rosea with psoriasis, reinforcing the need to inspect slides. Not imported. |

PG **Blazer** is a distinct domain from the previously searched PG **Blaster** WordPress archive. None of the large archive/deck counts above is added to the runtime totals. Existing GetMyUni, FirstRanker and EducationObserver mirrors are not counted as independent new papers. AIIMS undergraduate and nursing papers are excluded.

## Rebuild and verification

Stage the two exact manifest-matching faculty HTML files, then run:

```sh
python scripts/build-aiims-ini-bank.py --extend-reviewed --sources /path/to/staging
python scripts/test-pg-source-extension.py
node scripts/test-aiims-ini-offline.mjs
node scripts/test-pg-exam-years.mjs
```

New faculty HTML sources opt into byte pinning; a tampered staged HTML document must fail just like a changed PDF. Earlier mutable WordPress behavior is preserved. Seven extension integrity checks pass, including altered-source rejection. The offline test pins83/156/239 and preserves the NEET bank. Browser checks include the new May2016 semantic-memory answerB and May2022 HPV answerC, year labels, bookmarking and offline switching. Final build/browser/publication outcomes are recorded in the PR receipt; this document is not a signed APK or Play publication claim.
