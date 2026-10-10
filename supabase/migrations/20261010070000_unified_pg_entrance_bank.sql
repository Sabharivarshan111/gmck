-- Unified PG Entrance QBank; completely separate from MBBS university questions.
-- Only explicitly cleared and verified records can be exported here.
create table if not exists public.pg_exam_questions (
  id text primary key,
  question text not null,
  opa text not null, opb text not null, opc text not null, opd text not null,
  answer text not null check (answer in ('A','B','C','D')),
  explanation text not null check (length(trim(explanation)) >= 20),
  exam text not null check (exam in ('NEET_PG','INI_CET','FMGE','AIIMS_PG','AIPGMEE','PGIMER_PG','JIPMER_PG','GENERAL_MEDICAL')),
  exam_year smallint check (exam_year between 1991 and 2026),
  exam_session text,
  record_type text not null check (record_type in ('historical_dataset','recalled','original_exam_style','verified_pyq')),
  subject text,
  topic text,
  source_id text not null,
  source_url text not null,
  reuse_status text not null check (reuse_status in ('licensed','public_domain','original')),
  rights_evidence text not null check (length(trim(rights_evidence)) > 0),
  answer_reference text not null check (length(trim(answer_reference)) > 0),
  published_at timestamptz not null default now(),
  constraint no_fabricated_original_year check (not (record_type = 'original_exam_style' and exam_year is not null)),
  constraint no_fabricated_medmcqa_year check (not (record_type = 'historical_dataset' and exam_year is not null))
);
create index if not exists pg_exam_questions_filter_idx on public.pg_exam_questions (exam, exam_year, subject);
alter table public.pg_exam_questions enable row level security;
revoke all on public.pg_exam_questions from anon, authenticated;
grant select on public.pg_exam_questions to anon, authenticated;
drop policy if exists "Read reviewed PG questions" on public.pg_exam_questions;
create policy "Read reviewed PG questions" on public.pg_exam_questions
for select to anon, authenticated using (true);
-- Anonymous users and normal authenticated users are deliberately unable
-- to insert, update or delete. Backend import requires privileged credentials.
