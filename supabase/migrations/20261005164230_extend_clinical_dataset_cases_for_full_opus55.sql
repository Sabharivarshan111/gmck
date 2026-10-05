alter table public.clinical_dataset_cases
  add column if not exists source_disease text,
  add column if not exists clinician_persona text,
  add column if not exists raw_record jsonb;

comment on column public.clinical_dataset_cases.raw_record is
  'Complete source JSON record retained for provenance and future simulator extraction.';

create index if not exists clinical_dataset_cases_source_disease_idx
  on public.clinical_dataset_cases (source_dataset, source_disease);
