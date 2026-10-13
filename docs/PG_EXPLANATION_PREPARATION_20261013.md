# PG explanation preparation — 2026-10-13

User requires no Gemini or other model API calls. Python downloads private textbook TXT on a trusted runner, indexes with SQLite FTS5, and stores ten question/evidence sets in private_pg_work.evidence_batches. The assistant reads that evidence through the authorized Supabase connection and authors explanations. The script does not generate medical prose, overwrite keys, or publish passages. No raw TXT, source excerpts, service key or private evidence is uploaded as a GitHub artifact.

42 TXT objects, 41,441,912 bytes were counted live. No claim every needed specialty/edition exists. Primary-research abstract lookup is an optional fallback; it does not establish current guidelines. Missing images, disputed answers and weak evidence remain unresolved. PG live textbook checking is removed on the owner’s request. Five explanations were authored by the assistant with traceable sources; missing explanations remain explicitly pending. Full coverage is not claimed.

The newly applied private schema has RLS and no public/anon/authenticated/service_role schema or table grants. Administrative management access writes/reads the private pilot. Its deployed SQL is:

```sql
create schema if not exists private_pg_work; revoke all on schema private_pg_work from public,anon,authenticated,service_role; create table if not exists private_pg_work.evidence_batches (id text primary key check(length(id)<=64), payload jsonb not null check(octet_length(payload::text)<=2000000), created_at timestamptz not null default now()); alter table private_pg_work.evidence_batches enable row level security; revoke all on private_pg_work.evidence_batches from public,anon,authenticated,service_role;
```


## Continuation: selected batches and medical holds

Nine additional original explanations were prepared from primary references
(regulatory product labels and original clinical studies), bringing the authored
overlay to fourteen. Six previously empty explanations were filled; three
existing explanations were replaced with qualified explanations. These remain
source-checked provisional material, not an independent clinical review.

The ketamine-route question `medmcqa-practice-s00-6` is held from practice:
its absolute exclusion of subcutaneous administration conflicts with published
trials (PMIDs 22965960 and 27028832). No alternative answer was invented.
`PG_MEDICAL_REVIEW_HOLDS.json` records the exact identity, reason and references.
Compact schema 2 includes an optional original ordinal when a hold changes a
row's position. Remaining IDs, including s00-7 and s00-9, remain unchanged.
Unknown/mismatched authored entries or holds fail the build.

Current eligible practice inventory: 185,636; structural quarantine: 1,293;
medical holds: 1. Explanations present: 51,141; still missing: 134,495. Pack
assets, manifests and licences total 8,744,604 bytes. The 10 MB limit is checked
on each build; completion of all explanations within that size is not promised.

The private retrieval script now supports `--offset`, `--missing-only` and
`--only-id`. Workflow dispatch selects offset and batch size (maximum 100).
Push-triggered evidence retrieval advances to eligible offset 9 (the next original ordinal is 10) instead of repeatedly
preparing the original pilot. Offsets apply after eligibility/missing filters;
resume skips unchanged local results. Each workflow run/attempt has a distinct
private evidence batch ID, avoiding overwriting a previous dispatch at the same
commit. The runner still makes no model calls and publishes no explanations.
