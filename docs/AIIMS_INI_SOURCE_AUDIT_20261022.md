# AIIMS PG and INI-CET audit continuation — 22 October 2026

Baseline: main `4233d8fe939cbc9a5c8d5bb1948f193b45e2b821`, AIIMS83 / INI156 (239 total). The owner requested continued audit and source-based expansion, with year/session labels and no MedMCQA.

## Result

13 additions, one source-confirmed repair and one duplicate withdrawal produce **AIIMS90 / INI161 =251**. All237 other earlier records retain their entire payloads and IDs. All2078 NEET records and the year sidecar remain byte-identical. This is a partial recall-practice collection, not complete official papers or independently authenticated exam wording.

Seven new AIIMS selections come from directly acquired PG Blazer pages: May2011 CAP regulation, November2011 mean arterial pressure, and May2015 Judet projections, secular trends, hypertensive haemorrhage, HTLV myelopathy and latanoprost pigmentation. Five May2015 selections together use88 question/option words; each acquired page is also below the per-document200-word limit. Original HTML is byte-pinned. Earlier HTTP406/403 acquisition problems were not treated as evidence that the collections were empty; ordinary public curl downloads succeeded this pass. No access-controlled material was used.

Six INI November2023 selections concern apocrine glands, transdermal rivastigmine, ethionamide-associated hypothyroidism, dexrazoxane, aspirin in thyroid storm and the proliferative/nonproliferative retinopathy distinction. Their actual annotated slides were visually inspected, with concept checks against primary drug labels, professional guidance and government/research sources. The deck is a third-party upload with faculty-labelled recall slides; original exam authenticity is not guaranteed. Vignettes were normalised without changing supplied choices or keys. Selected question/option text totals106 words from this document. Its189 slides are not189 validated questions, and the entire slide deck was not clinically certified. Publisher images/explanations are not distributed.

## Audit findings and actions

| Finding | Action |
|---|---|
| `inicetmay25-psm:4` contained only the final research-step fragment, although its options were four-number permutations | Restored the full stem and all four statements from the original DocTutorials PDF, page2. Actual PDF SHA-256 still matches the original receipt. Preserved the ID, choices, answerC and original explanation. |
| `faculty-ini-2022-may-psm:5` repeats `aglasem-68d61bf6-b5c8-11ed-ac15-0a5e36bc6706:2` in the same May2022 session, with shuffled options | Retained the older canonical ID and withdrew the duplicate. Full historical review and `duplicateOf` are retained in the held ledger. Stored device bookmarks are not rewritten; a bookmark on the withdrawn duplicate may no longer appear. |
| PG Blazer May2015 item33: the dye/top-swab stem conflicts with its own unstained-urine explanation and ureterovaginal key | Held; no guessed replacement stem/key. Original page acquired and source identity marked held. |
| INI2023 slide36 annotates ritonavir outside the four supplied options | Held because source key/option completeness is unresolved, even though tipranavir has a documented hepatotoxicity warning. |
| INI2023 slide34 adds an E/empagliflozin annotation outside the four listed options | Held instead of silently substituting a source key, even though listed dapagliflozin has a valid HFrEF indication. |
| Similar MSUD2022 and tight-junction2025 records have different precision of session attribution | Recorded for follow-up. No month is guessed from collection01; similar concepts across sessions are not automatically merged. |

Exact acquisition hashes, original URLs, private slide-verification hashes, clinical reference URLs and pending pairs are in `scripts/aiims-ini-audit-20261022.json`. The before/after repair record is in `scripts/aiims-ini-audit-corrections.json`. No generic dataset or model API was used.

## Import safeguards

The builder still rejects changed released rows. An intentional repair now requires an explicit audit with the original fingerprint/review, a reviewed replacement transcription, matching source/number and the replacement fingerprint. A pending repair also requires its original staged source bytes. Full-source extraction can accept the same explicitly audited replacement, while ordinary overlapping transcriptions remain errors. A withdrawal requires a complete matching historical held review and a reason; held items cannot have active reviews or be reintroduced.

A permutation-answer guard rejects a sequencing question when the numbered statements are absent. It distinguishes an actual permutation of the same numbers from unrelated numeric answer pairs such as HPV types. This addresses the extraction failure without rejecting legitimate short stems or factual numeric choices.

## Verification and resumption

11 source-extension tests cover old-row tampering, changed PDF/HTML bytes, missing new transcriptions, a reviewed withdrawal, audited before/after repair, missing original correction sources, authorised full-source overrides and missing numbered context. The251-item check validates keys/fingerprints, real chapters, labels, held exclusion, the restored research statements and the duplicate's absence. Exact comparison against the baseline confirms237 unaffected records plus unchanged NEET bytes.

Native/preview TypeScript, mobile ESLint, required native guards, offline reader/installer/planner/discussion, final production web assembly and Android production JS bundle passed. The actual reader passed at360/390/430px: new AIIMS2011November answerA, AIIMS2015May answerC, INI2023November answerB, restored INI2025May question/answerC, existing year labels, bookmark isolation and offline reload. New screenshots were inspected. The original NEET illustration/private-import/ACEV-fixture regression also passed. These are browser/JS checks, not physical-device or signed-APK certification.

To extend using the exact newly acquired sources:

```sh
python scripts/build-aiims-ini-bank.py --extend-reviewed --sources /path/to/staging
python scripts/test-pg-source-extension.py
node scripts/test-aiims-ini-offline.mjs
node scripts/test-pg-exam-years.mjs
```

Historical remote PDFs can change bytes at stable URLs; do not replace old hashes to force a rebuild. Signed Android, broader anatomy and older iOS gates remain unchanged. Final merge/deployment/public-asset verification outcomes are recorded in the publication PR receipt.
