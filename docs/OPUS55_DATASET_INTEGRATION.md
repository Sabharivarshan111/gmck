# Opus 5.5 clinical dataset integration

ORBIT can use the Hugging Face dataset `nisten/opus5-5-doctor-patient-conversations-all-human-diseases` as a **review queue for exam-practice cases**. It must not be treated as a diagnosis engine or a source that bypasses clinical review.

## Why it is useful

The dataset currently describes 2,194 synthetic encounters, with a 20-field schema including aliases, ICD-10, body systems, patient scenario, a multi-turn clinician/patient conversation, common mistakes, differentials, related diseases, drug/food interactions and PubMed references. This maps well onto ORBIT's existing Case Proformas and Viva workflow.

## Hard boundaries

1. **Do not bundle the 75 MB JSONL in Android or the web app.** Import it to the server and fetch only reviewed rows.
2. **Every imported row starts as `pending`.** RLS exposes only `approved` rows. A model-generated record is never self-approving.
3. **The UI says “Simulated case for exam practice — not clinical guidance.”**
4. **Do not use this corpus for patient-specific diagnosis or treatment advice.**
5. PubMed metadata is a useful pointer, not proof that every generated clinical statement is supported by the cited paper.
6. Keep the existing deterministic/hand-reviewed ORBIT case-proforma path. The dataset supplements it; it does not replace it.
7. Do not automatically copy numeric drug doses into scoring rubrics. Dose verification needs a separately maintained source of truth.
8. Preserve provenance and source hash for every import.

## License/provenance caution

As checked on 2026-10-05, the Hugging Face dataset metadata says **Apache-2.0**, while its README still contains **MIT** text. The README also says several structured clinical fields are copied from the same curated source used by the earlier dataset; the seed disease list `nisten/all-human-diseases` is published as **AGPL-3.0**.

That combination is ambiguous enough that ORBIT should not redistribute the raw JSONL inside its APK/PWA until the intended license/provenance is clarified. The importer therefore requires `OPUS55_LICENSE_ACK=1`.

This is an engineering safeguard, not legal advice.

## Import

The migration creates `public.clinical_dataset_cases` with:
- service-role-only writes;
- explicit SELECT grants for app roles;
- RLS that returns only `review_status='approved'`;
- no client insert/update/delete policy.

Run:

```bash
OPUS55_LICENSE_ACK=1 \
SUPABASE_URL=https://<project>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret> \
node scripts/import-opus55-clinical-cases.mjs
```

For schema testing without writing:

```bash
OPUS55_LICENSE_ACK=1 OPUS55_DRY_RUN=1 OPUS55_LIMIT=20 \
node scripts/import-opus55-clinical-cases.mjs
```

Never put the service-role/secret key in the app, Vite public env, logs, screenshots, or repository.

## Product flow

- Notes → **Patient simulator cases**
- Search reviewed cases by disease / alias / ICD-10.
- Open the synthetic presentation without immediately revealing the diagnosis.
- “Reveal debrief” shows the reviewed summary, differentials, common mistakes and source references.
- A full interactive patient role-play can later map reviewed cases into the existing Case Proforma workflow. The raw doctor transcript should be treated as teaching material after the attempt, not as the live patient's response engine.


## Production state — 2026-10-05

The full Opus 5.5 JSONL corpus is now imported into the ORBIT Supabase project.

- Source records: **2,194 / 2,194 unique diseases**
- Raw source size: **75,312,131 bytes**
- Source SHA-256: `f828c30cee7006a3cf5b88909f9b865688f98b11d4c886108b9b9a39e5402e0b`
- Source revision: `9277244e642a8ba02cb8c1d26408e5792932045b`
- All 20 source keys retained in the private `raw_record` JSON
- Conversation validation: 25–59 turns, mean 33.4
- PubMed reference objects retained: 6,377
- ORBIT-curated starter cases: 25
- Total readable teaching cases: 2,219

### Publication states

- `source`: external synthetic teaching record published for education. This is **not** an ORBIT clinical review.
- `approved`: ORBIT-curated/reviewed teaching case.
- `pending`: private import/review queue.
- `rejected`: hidden.

RLS exposes `source` and `approved` rows. The complete `raw_record` column is intentionally **not granted** to public app roles; it is retained server-side for provenance, retrieval, and future controlled transformations.

### Product surfaces

The same corpus now powers two separate experiences:

1. **Patient simulator cases** — practice-first flow. Presentation first; debrief, differentials, mistakes, medicines, interactions, references and transcript come after the learner attempts the case.
2. **Clinical case library** — direct browse/reference mode over the same searchable teaching corpus.

Search indexes disease names, aliases, ICD-10, body systems, descriptions, patient presentations and executive summaries. Trigram indexing keeps symptom/substring search fast across the full corpus.

### Licensing / provenance

The Hugging Face repository metadata currently declares Apache-2.0 while its README states MIT. The dataset card also states that the seed disease list derives from `nisten/all-human-diseases` and that several structured clinical fields were copied from the same curated source used by the previous dataset. ORBIT therefore retains dataset identity, revision, hash and provenance instead of disguising origin.
