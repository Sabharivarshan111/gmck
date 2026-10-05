create table if not exists public.clinical_dataset_catalog (
  dataset_name text primary key,
  display_name text not null,
  source_url text not null,
  source_revision text,
  source_sha256 text,
  raw_bytes bigint,
  records_total integer not null default 0,
  records_structurally_valid integer not null default 0,
  published_cases integer not null default 0,
  source_status text not null default 'loaded_private',
  license_metadata text,
  license_readme text,
  provenance_note text,
  updated_at timestamptz not null default now()
);

alter table public.clinical_dataset_catalog enable row level security;

revoke all on public.clinical_dataset_catalog from anon, authenticated;
grant select on public.clinical_dataset_catalog to anon, authenticated;
grant all on public.clinical_dataset_catalog to service_role;

drop policy if exists "Clinical dataset catalog is publicly readable"
  on public.clinical_dataset_catalog;
create policy "Clinical dataset catalog is publicly readable"
on public.clinical_dataset_catalog
for select
to anon, authenticated
using (true);

comment on table public.clinical_dataset_catalog is
  'Non-sensitive dataset provenance and import status for ORBIT clinical teaching corpora.';
