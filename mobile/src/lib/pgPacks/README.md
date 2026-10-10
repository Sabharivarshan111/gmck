# ORBIT PG QBank — native offline packaging

The PG Entrance PYQ Bank in Notes (below Case Proformas) reads **only**
question assets compiled into the Android native package and the Vercel build.
This is deliberately independent of the existing Supabase-backed features in
the rest of ORBIT.

## Included today — 2026-10-10 expanded import

* **186,930** source-answer-labelled offline MCQs in **76** lazy local chunks.
* **4,180** authentic-source NEET-PG validation questions (individual exact exam years not recorded, no independent key audit).
* **182,750** medical **mock/test-series** questions. They are NOT historical PYQs; the app provides a separate Mock practice filter.
* All 186,930 include the complete available question stem, A–D options, dataset answer label, subject, topic/source reference. Exactly **51,530 original full explanations** remain; the remainder were not supplied or omitted to meet 25 MB. Never invent explanations.
* **75 malformed source records** quarantined (3 validation + 72 train).
* Measured packed TS source assets: **53.238 MB raw**, **21.630 MB DEFLATE** and **16.749 MB Brotli**. Not the actual installed APK size or PWA cache storage.
* Original ORBIT practice questions remain separately available. 2023–2026 recall directory and secure optional Supabase textbook answer checker are separately accessible, but 2023–2026 official papers have NOT been imported as complete offline PYQs.
* The separate unlabelled AIIMS test split (**6,150 questions**) has no published answer keys; no answer was invented.
* Detailed audit: `docs/PG_25MB_EXPANDED_SOURCE_ACCOUNTING.json`.

Rebuild the full current bank reproducibly:

```sh
pip install pyarrow huggingface_hub brotli
python scripts/expand-pg-medmcqa-25mb.py --output /tmp/pg-all-answer-keyed.jsonl --report docs/PG_25MB_EXPANDED_SOURCE_ACCOUNTING.json
python scripts/build-pg-offline-packs.py --input /tmp/pg-all-answer-keyed.jsonl --out mobile/src/lib/pgPacks --rows-per-pack 2500 --max-compressed-mb 25
node scripts/check-pg-content-integrity.mjs
```

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

The pack compiler refuses to replace existing question packs if its budget is exceeded. The dedicated expansion importer keeps all valid labelled answers and options, but explicitly omits some full explanation text to preserve the 25 MB size bound; it reports exactly how many. It never fabricates year/session provenance.

## 25 MB versus complete corpus

MedMCQA's Hugging Face Parquet files total about **88.3 MB compressed**;
their reported logical contents are **135.5 MB**. The code here uses
dictionary-coded question source/subject/topic/reference strings and
up to 1,000 questions per dynamically imported pack. **Measured on GitHub runner on 2026-10-10:** 187,005 answer-keyed MedMCQA
records (train + validation) produced **52.41 MB DEFLATE** and **45.60 MB
Brotli** as compiled TS source packs. The other 6,150 test records had no answer
labels. A further 30,450 records with answer labels had inadequate explanations
and cannot pass the review gate without independent remediation. This benchmark
did **not** include 2023–2026 recall papers, and was **not** a complete audit or
Android Play Store APK/AAB size measurement.

The full answer-keyed historical benchmark **fails 25 MB** with current lossless compression. **52.41 MB** is the measured Android ZIP-like approximation for the 2022-era set, not final Play Store delivery size. **45.60 MB Brotli** for web is under the requested 50 MB ceiling before 2023–2026 additions. The actual APK delta is still unmeasured. The real size will depend on
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


## Attribution for distributed benchmark MCQs

MedMCQA by Ankit Pal, Logesh Kumar Umapathi and Malaikannan Sankarasubbu, CHIL/PMLR 2022, https://arxiv.org/abs/2203.14371.
Source: https://github.com/medmcqa/medmcqa . Upstream code/dataset license notice: Apache License 2.0, https://github.com/medmcqa/medmcqa/blob/main/LICENSE .
Dataset location: https://huggingface.co/datasets/openlifescienceai/medmcqa . This does not establish individually cleared rights for all upstream third-party exam questions.
