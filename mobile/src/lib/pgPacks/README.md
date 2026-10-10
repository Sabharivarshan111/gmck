# ORBIT PG QBank — native offline packaging

The PG Entrance PYQ Bank in Notes (below Case Proformas) reads **only**
question assets compiled into the Android native package and the Vercel build.
This is deliberately independent of the existing Supabase-backed features in
the rest of ORBIT.

## Included today

* Original practice questions: 10 in `../pgEntranceBank.ts`.
* Research directory: 20 free-access source entries with answer availability,
  historical exam predecessors and 2026 recall links.
* The approved PYQ pack manifest is **empty** until content passes audit.
  This prevents a misleading 190,000+ purported verified-PYQ claim.

## Compile an approved question archive into the app

1. Use the existing ORBIT PG audit kit, review content and rights, then export
   JSONL **with `status: "published"` preserved**, answer evidence and
   documented redistribution permission for each question.
2. Place `approved.jsonl` on your local machine or private CI environment.
   Do not commit unapproved third-party question dumps to a public repository.
3. Run:

   ```sh
   python3 scripts/build-pg-offline-packs.py \\
     --input approved.jsonl \\
     --out mobile/src/lib/pgPacks \\
     --max-compressed-mb 25
   python3 scripts/test-pg-offline-packs.py
   npm --prefix mobile run typecheck
   npm run build:vercel
   ```

4. Inspect `mobile/src/lib/pgPacks/packing-report.json` for record counts,
   DEFLATE and Brotli compressed sizes. Actual Play Store AAB/APK increase can
   only be measured from a full Android release build.
5. Commit the generated *reviewed, reuse-cleared* TypeScript modules and
   manifest. The web build includes dynamic chunks in its offline asset list;
   Android bundles modules with Metro.

The script refuses to replace the existing question packs if the budget is
exceeded. It will not trim answers or explanations, lie about year/session
labels, or drop thousands of questions without telling you.

## 25 MB versus complete corpus

MedMCQA's Hugging Face Parquet files total about **88.3 MB compressed**;
their reported logical contents are **135.5 MB**. The code here uses
dictionary-coded question source/subject/topic/reference strings and
up to 1,000 questions per dynamically imported pack. **It has not yet been
benchmarked on the 193,155-row full dataset.**

A maximum **25 MB extra Android download size for *every* answer-bearing
question is a target, not a proven result**. The real size will depend on
deduplication, accepted question count and explanation lengths. Options:

* Native bundled 25 MB: keep the complete approved corpus only if it fits,
  otherwise present explicit, labelled subset packs.
* 25 MB base + optional ≤50 MB download: store *compressed static packs*
  on a CDN/Supabase Storage, download once, verify checksum and keep on-device
  for subsequent offline use. This is not first-launch offline content, and
  this optional download implementation has not been added.
* All content offline from first install: accept the actual larger Android
  app size when verified full data does not fit 25 MB.

The iOS/Vercel web app also benefits from its own static compressed chunks and
offline precache; avoid shipping all text as a single JavaScript bundle.

## Safety and accuracy

"Free to view" is not redistribution permission. Do not copy publisher PDFs
or forum answer banks directly into app packages without appropriate rights.
MedMCQA contains mock/prep and labelled AIIMS/NEET content, but it is not a
verified per-year official PYQ archive. Never assign missing year data.
