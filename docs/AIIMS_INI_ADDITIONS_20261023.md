# AIIMS PG / INI-CET additions — 23 October 2026

Eleven newly reviewed selections add eight AIIMS PG recalls (five May 2012, three May 2015) and three INI-CET May 2024 recalls. The resulting candidate contains **108 AIIMS PG and 216 INI-CET questions**, 324 total.

Before writing, the remote native branch was fetched and its earlier ten-question AIIMS extension (79dfbc9633372e3e873104f7a6196114c564ef59) was preserved. That branch had 100 AIIMS/213 INI records; main had 90/213. All 313 full prior records and all 2,078 NEET records/year-sidecar bytes are preserved. This pass adds eleven, not twenty-one newly researched selections.

## Included concepts

- AIIMS May 2012: paediatric femoral traction, pericallosal-lipoma calcification, firearm choke terminology, thermodilution and genetic-code degeneracy.
- AIIMS May 2015: Shenton line, jersey finger and propofol injection pain.
- INI-CET May 2024: methylergometrine with hypertension, antenatal dexamethasone regimen and autism diagnostic criteria.

Each selection has all four supplied choices, a source-supported key, an original explanation, a real syllabus chapter and publisher year/session metadata. Source page numbers are collection identifiers, not authenticated exam order. Public original HTML was acquired and hash-pinned. Publisher illustrations/explanations are not redistributed. Three selected Reflex questions use 89 question/option words from its shared document, under the cumulative 200-word ceiling.

## Exclusions and limitations

AIIMS May 2012 neuroanatomy item 8 duplicates aiims-2012:5 with shuffled choices; Reflex CT duplicates ini-2024-01:5; its Downes item duplicates ini-2024-01:14. All stay held. A dated forensic terminology item and an oversimplified nephrotic-oedema item are held separately. Rechecking the newer native branch also prevented reimporting its carpal-tunnel and thymic-framework questions.

Reflex explicitly mixes recall questions with marked practice additions and contains disputed keys. No practice addition or flagged disputed item was promoted. Other bank domains discovered in the research ledger remain leads; their advertised question counts are not imported counts. MedMCQA was not used.

## Validation

Eleven source-extension integrity tests pass. All 324 record fingerprints, keys, chapters, held exclusions and offline searches pass; all 2,078 NEET source-year joins and old planner/discussion checks pass. Exact comparison confirms preservation of all 313 earlier records. Native TypeScript and ESLint pass; version, XP, reminders, edge insets, diagrams, APKG and Kotlin guards pass. Both production browser bundles assemble successfully; the Android production JS bundle also builds. A 250 KB combined JSON budget replaces the earlier 220 KB budget to accommodate the larger bank; current combined payload is about 224 KB.

Browser verification and publication results are recorded in the final resume entry and PR description. Browser checks are not physical Android or signed-APK certification. No signed APK or Play release is claimed.

Rebuild using the hash-matching new HTML documents:

```sh
python scripts/build-aiims-ini-bank.py --extend-reviewed --sources /path/to/staging
python scripts/test-pg-source-extension.py
node scripts/test-aiims-ini-offline.mjs
node scripts/test-pg-exam-years.mjs
```

Question-level evidence and primary-reference links: scripts/aiims-ini-additions-20261023.json. New source bytes stay outside the repository. The two existing runtime banks remain separate exam banks and the service-worker cache version is refreshed.
