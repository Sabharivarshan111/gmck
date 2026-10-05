create extension if not exists pg_trgm with schema extensions;

create index if not exists clinical_dataset_cases_search_text_trgm_idx
  on public.clinical_dataset_cases
  using gin (search_text extensions.gin_trgm_ops);
