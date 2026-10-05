alter table public.clinical_dataset_cases
  drop constraint if exists clinical_dataset_cases_review_status_check;

alter table public.clinical_dataset_cases
  add constraint clinical_dataset_cases_review_status_check
  check (review_status in ('pending','source','approved','rejected'));

drop policy if exists "Approved clinical dataset cases are readable"
  on public.clinical_dataset_cases;

create policy "Published clinical teaching cases are readable"
on public.clinical_dataset_cases
for select
to anon, authenticated
using (review_status in ('approved','source'));

comment on column public.clinical_dataset_cases.review_status is
  'pending = imported/private; source = published external synthetic source, not ORBIT-reviewed; approved = ORBIT-reviewed/curated; rejected = hidden.';
