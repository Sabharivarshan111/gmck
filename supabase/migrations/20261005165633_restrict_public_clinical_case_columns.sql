revoke select on table public.clinical_dataset_cases from anon, authenticated;

grant select (
  id,
  source_dataset,
  source_record_name,
  canonical_name,
  aliases,
  search_terms,
  search_text,
  icd10,
  body_systems,
  description,
  prevalence,
  patient_scenario,
  conversation,
  common_mistakes,
  differential_diagnosis,
  related_diseases,
  executive_summary,
  pubmed_refs,
  related_drugs,
  drug_interactions,
  food_interactions,
  source_license,
  review_status,
  source_disease,
  clinician_persona,
  created_at,
  updated_at
) on table public.clinical_dataset_cases to anon, authenticated;

comment on column public.clinical_dataset_cases.raw_record is
  'Private complete source JSON. Not granted to public app roles; reserved for server-side provenance, RAG, and transformation.';
