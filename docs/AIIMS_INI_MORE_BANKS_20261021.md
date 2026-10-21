# Additional recall-source review — 21 October 2026

Owner request: search additional banks and process them like the NEET-PG offline bank. No MedMCQA. Preserve supported exam-year/session labels.

## Content

18 added selections: three AIIMS PG May 2019 questions (anatomical dead space, catalytic efficiency, proximal scaphoid perfusion) and 15 INI-CET May 2024 selections. Totals: AIIMS PG80, INI-CET150, combined230. All earlier212 records and all2078 NEET records retain their complete payloads and IDs. The four newly used PDF documents contain pathology/microbiology4, biochemistry6, dermatology4 and surgery1 selections. Radiology was inspected but its incomplete/image-dependent choices were not promoted.

Each added item has four supplied choices, a supplied key checked against the concept, an authored explanation, an existing syllabus chapter and the source-labelled year/month. Word budgets apply cumulatively per document, including earlier selections. Missing options were not created. Uncertain source items were held: examples include mismatched struvite/cystine key, missing marginal mandibular nerve option, GIST marker inconsistencies, five-choice Kawasaki question, inconsistent acid-base values and duplicate choices. No publisher explanation or clinical image is distributed.

The actual downloaded GetMyUni PDF bytes match the earlier acquisition SHA-256 receipts. Search-service PDF preview images returned different contents at the same URLs; draft selections based on those previews were discarded, and the final items were read from local renders of the hash-pinned documents. Treat the direct file, not a search preview, as the identity-bearing artifact. The draft was never published.

## Additional discovery

- StudyDoc: https://studydoc.co.in/inicet_pyq_bank — publisher advertises1651 memory-based questions,2021–2026. Public page is a dynamic shell; count/provenance not independently established. Its PDF analysis is a topic/key table, not a complete four-choice paper. Not imported.
- Kinase: https://kinaseapp.com — advertises AIIMS/INI May2011–May2026; full bank requires app access. Its headline question count is not an approved import count. Not imported.
- Oncourse: https://getoncourse.ai/questions/indian-medical-pg/previous-year-papers/ini-cet/ — public questions, but older INI-CET labels including2019 require provenance adjudication. No confirmed generic-dataset independence; not imported.
- Medicinoz: https://www.medicinoz.in — paid combined bank; no gated material acquired.
- PW May2025 article contains short question/answer fragments and an unavailable PDF; November2025 PDF says active soon. These are not complete papers.
- Cerebellum November2025 OBG/surgery recall pages were discovered but retrieval returned403. Not counted as retrieved questions.

The five GetMyUni file records were promoted from the existing acquisition inventory into the source manifest. Four are used; radiology remains unselected. This is partial recall-practice coverage, not authenticated official papers or complete historical sessions.

## Reproducibility

The older Prepp-hosted2020/2021 PDFs changed bytes at stable URLs during reacquisition. Their old manifest hashes and released content remain intact; no changed remote source was silently accepted.

`python scripts/build-aiims-ini-bank.py --sources /private/staging --extend-reviewed` verifies every existing runtime row against its review fingerprint, answer, explanation, chapter and source receipt. It permits new identities only through explicit transcriptions and hash-checks their staged source files. The full raw-source rebuild remains available, but correctly fails on changed old PDF bytes until the matching historical files are supplied or re-reviewed separately. `privateExtractedCandidates` retains the historical extraction count2277; it is not the number of reviewed questions.

Focused regression `scripts/test-pg-source-extension.py` rejects changed prior answers/explanations/source receipts, absent new transcriptions and modified new PDFs. Existing offline data/year tests and the production browser flow cover the larger banks. One further Mount Fuji item is held as a duplicate of the existing abbreviated Mt Fuji item. The new browser question checks INI-CET2024May and its supplied answer after search/reveal. The existing browser suite also covers offline reload and bookmark isolation.

Reference checks: INSM1 nuclear staining(PMC6019041); segmental vitiligo course(PubMed24648687); CYP11B1 phenotype(EndotextNBK278965); metabolic screening(CDC MMWR rr5003a1); proximal scaphoid perfusion(PMC2919863). Explanations state relevant limitations; no independent clinical certification is claimed.

Validation/publication outcomes are recorded in the PR and latest resume checkpoint. Browser and JavaScript bundle verification are not physical Android, signed APK, or Play publication evidence. Existing anatomy and legacy iOS failures remain separate and are not bypassed.

Final validation: six source-extension tests,230-item offline data validation,2078 NEET source-year joins and exact earlier-payload comparison all pass. Native+preview TypeScript (mobile pinned compiler), changed-file lint, required native guards, production assembled build and final Android production JS bundle pass. Actual browser checks at360/390/430 verify80/150 counts, the new May2024 item/key, bookmarks and full offline reload. The earlier NEET browser flow also passes. The new question screenshot was visually inspected. Publication receipt is recorded separately; this does not certify a signed APK or physical-device behavior.
