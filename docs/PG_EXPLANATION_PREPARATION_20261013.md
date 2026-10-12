# PG explanation preparation — 2026-10-13

User requires no Gemini or other model API calls. Python downloads private textbook TXT on a trusted runner, indexes with SQLite FTS5, and stores ten question/evidence sets in private_pg_work.evidence_batches. The assistant reads that evidence through the authorized Supabase connection and authors explanations. The script does not generate medical prose, overwrite keys, or publish passages. No raw TXT, source excerpts, service key or private evidence is uploaded as a GitHub artifact.

42 TXT objects, 41,441,912 bytes were counted live. No claim every needed specialty/edition exists. Primary-research abstract lookup is an optional fallback; it does not establish current guidelines. Missing images, disputed answers and weak evidence remain unresolved. Existing online textbook checking remains until prepared explanations replace the missing content; full coverage is not claimed.

The newly applied private schema has RLS and no public/anon/authenticated/service_role schema or table grants. Administrative management access writes/reads the private pilot. Its deployed SQL is:

```sql
create schema if not exists private_pg_work; revoke all on schema private_pg_work from public,anon,authenticated,service_role; create table if not exists private_pg_work.evidence_batches (id text primary key check(length(id)<=64), payload jsonb not null check(octet_length(payload::text)<=2000000), created_at timestamptz not null default now()); alter table private_pg_work.evidence_batches enable row level security; revoke all on private_pg_work.evidence_batches from public,anon,authenticated,service_role;
```

