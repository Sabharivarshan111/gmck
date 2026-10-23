# Larger AIIMS/INI PDF review — 23 October 2026

The owner corrected the target to **500 additional questions across both exams combined**, starting from the 357-question checkpoint. This pass adds **64 questions: 11 AIIMS PG and 53 INI-CET**. It also withdraws eight earlier misattributed questions. The resulting reviewed candidate is **125 AIIMS PG + 288 INI-CET = 413**, a net increase of **56**; **444 net additions remain** to reach 857. The 500-question target is not complete.

## Acquisition and review scope

All **100 source PDFs** in the existing manifest were acquired into private staging and matched their stored SHA-256 hashes: **1,669 pages**, 128,608,597 bytes. These are source documents, not 100 newly discovered exam sittings. A hash match proves the bytes are unchanged, not that an answer or exam attribution is correct. Twenty-three scanned documents required OCR across 101 content pages. Acquisition receipts are in `scripts/aiims-ini-scale500-acquisition-20261023.json`.

A stricter private extractor identified 709 candidate rows / 705 source-number identities across the 36 AglaSem subject documents. Of those, 560 have no parser flags; none is approved merely by extraction. The historical 2,277 candidate number is preserved separately and is not added to this new count. Raw PDFs, OCR images and candidate collections are not distributed in the repository. Only selected factual questions, original explanations and metadata are included.

The final 23 contributing documents have individually inspected question/options/key pages, including continuations. All 64 new selections have complete, single publisher-supplied keys; no absent distractors or editorial keys are invented. Options and their order are preserved, with OCR digit spacing repaired against the page where needed. The Tangier item has sufficient low-HDL/ABCA1 text to answer independently of its redundant illustration. Source question numbers are collection numbers, not authenticated examination order. Every existing source document remains limited to 200 cumulative selected question/option words; the maximum among this pass's contributors is 184.

## Corrections and exclusions

The archive file named `aiims-2005-eo.pdf` identifies itself on rendered page25 as “AIPPG.com Manipal 2002 recollected questions” with copyright2002. Eight earlier selections from it therefore cannot retain AIIMS2005 attribution. They are fully preserved in the held ledger and withdrawal receipt, while the source identity is marked held. No date or exam is inferred from the archive filename. All other **349 earlier complete runtime records** are byte-for-value preserved; NEET2078 and its year sidecar are byte-for-byte unchanged.

Visual review caught two partial-key extraction hazards: the paediatric seizure answer is the sequence A–B–D–C, and the Klumpke source prints C,D. Neither becomes a fake single answer. The private extractor now retains the full key text, rejects non-single keys, flags duplicate source numbers, and suggests semantic overlaps for human review. Five focused regression tests cover these behaviours.

A final TF-IDF/correct-answer/concept review held seven further overlaps, including methanol/hooch, MSUD dietary restriction, central versus peripheral cyanosis, tongue fasciculations, AIDS-defining cancer and methylcytosine deamination. Finasteride's enzyme mechanism also overlapped an earlier 5-alpha-reductase item. Other holds include ambiguous sirtuin stimulation, a defective B-ALL distractor and exclusive fracture-risk claims involving both canagliflozin and rosiglitazone. No wholesale acceptance of publisher keys is implied. Per-item pages, keys, review notes, reference links, duplicates and full withdrawal evidence are in `scripts/aiims-ini-scale500-20261023.json`.

## Offline size and verification

The final two text banks occupy **286,967 bytes**, or **71,281 gzip bytes**. The original 250KB combined /175KB per-bank checks sized a much smaller partial selection. The explicit larger owner target now has a documented budget in `scripts/aiims-ini-payload-budget.json`: 750KB per bank, 1MB combined raw, 250KB combined gzip. This is an allowance for question text data, not a claim that the full Android app or its anatomy assets fit in 10MB. Source hashes, answer/provenance checks, per-document excerpts, duplicate holds and the anatomy95% floor remain enforced.

Eleven source-extension tests, five extraction regressions, all413 question/source/chapter/offline checks and all2078 NEET year joins pass. Final production web and Android JavaScript bundles pass after duplicate removals. Final browser and screenshot, type/lint, publication and remote-CI results belong to the latest resume entry and PR122 receipt. Digestive anatomy reach remains103/108; no anatomy changes are made here. No deployment, main merge, physical-device verification or Play upload is claimed.

## Resume toward500

Continue from the current413 total with 444 net additions still required. Reuse the pinned100-PDF receipts, private extractor and complete source keys; inspect the original pages before promotion. Do not count the709 candidate rows as709 usable new questions or reintroduce held exam identities. The source-level200-word excerpt limit remains in the builder. Further sources and any permissible reuse must be checked separately; this pass does not promise that the existing archive contains500 more eligible unique questions.
