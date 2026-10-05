create table if not exists public.clinical_dataset_cases (
  id uuid primary key default gen_random_uuid(),
  source_dataset text not null default 'nisten/opus5-5-doctor-patient-conversations-all-human-diseases',
  source_record_name text not null,
  canonical_name text not null,
  aliases text[] not null default '{}'::text[],
  search_terms text[] not null default '{}'::text[],
  search_text text not null default '',
  icd10 text,
  body_systems text[] not null default '{}'::text[],
  description text,
  prevalence text,
  patient_scenario text not null,
  conversation jsonb not null default '[]'::jsonb,
  common_mistakes jsonb not null default '[]'::jsonb,
  differential_diagnosis jsonb not null default '[]'::jsonb,
  related_diseases jsonb not null default '[]'::jsonb,
  executive_summary text,
  pubmed_refs jsonb not null default '[]'::jsonb,
  related_drugs jsonb not null default '[]'::jsonb,
  drug_interactions jsonb not null default '[]'::jsonb,
  food_interactions jsonb not null default '[]'::jsonb,
  source_sha256 text,
  source_license text not null default 'Apache-2.0 metadata; README also says MIT — verify before redistribution',
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_dataset, source_record_name)
);

comment on table public.clinical_dataset_cases is
  'Synthetic clinical teaching cases imported from external datasets. Client reads are restricted to rows explicitly reviewed and approved.';

alter table public.clinical_dataset_cases enable row level security;

revoke all on table public.clinical_dataset_cases from anon, authenticated;
grant select on table public.clinical_dataset_cases to anon, authenticated;
grant all on table public.clinical_dataset_cases to service_role;

drop policy if exists "Approved clinical dataset cases are readable" on public.clinical_dataset_cases;
create policy "Approved clinical dataset cases are readable"
on public.clinical_dataset_cases
for select
to anon, authenticated
using (review_status = 'approved');

create index if not exists clinical_dataset_cases_status_name_idx
  on public.clinical_dataset_cases (review_status, canonical_name);
create index if not exists clinical_dataset_cases_body_systems_idx
  on public.clinical_dataset_cases using gin (body_systems);
create index if not exists clinical_dataset_cases_icd10_idx
  on public.clinical_dataset_cases (icd10);
