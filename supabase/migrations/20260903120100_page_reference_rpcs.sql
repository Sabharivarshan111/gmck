-- The read and write surface for community page references.
--
-- NOT YET APPLIED to production. The tables from the previous migration are
-- live, but with RLS letting a reader see only their own rows and no function
-- to aggregate, so the feature is inert until this runs. Nothing is exposed in
-- the meantime.
--
-- Apply with:  supabase db push
-- or paste into the SQL editor at
--   https://supabase.com/dashboard/project/pmtgeydtqypwrypshhsx/sql

-- Everything a question's page panel needs, in one round trip.
--
-- Returns one row per (book, page) that anybody has claimed for this question,
-- with the vote count and whether it has reached quorum. `mine` marks the row
-- the caller themselves submitted, so the sheet can show their own answer even
-- while it is still short of three.
--
-- SECURITY DEFINER because the table's own RLS deliberately hides other
-- readers' rows: the aggregate is public, the individual votes are not. It
-- reads one question at a time and returns no user ids, so it cannot be used
-- to work out who submitted what.
create or replace function public.page_refs_for_question(_question_id text)
returns table (
  book_id   uuid,
  book_name text,
  edition       text,
  page_number   integer,
  votes         integer,
  confirmed     boolean,
  mine          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.book_id,
    t.name,
    t.edition,
    r.page_number,
    count(*)::integer                        as votes,
    count(*) >= public.page_ref_quorum()     as confirmed,
    bool_or(r.user_id = auth.uid())          as mine
  from public.question_page_refs r
  join public.reference_books t on t.id = r.book_id
  where r.question_id = _question_id
  group by r.book_id, t.name, t.edition, r.page_number
  -- Confirmed first, then the best-supported claim.
  order by (count(*) >= public.page_ref_quorum()) desc, count(*) desc, r.page_number;
$$;

-- Submit or correct a page reference. Upserts the reader's one row, so
-- pressing submit twice fixes a typo instead of stuffing the ballot.
--
-- SECURITY INVOKER on purpose: RLS still applies, which is what refuses an
-- anonymous session. Making this DEFINER would quietly undo the rule the whole
-- feature rests on.
create or replace function public.submit_page_ref(
  _question_id   text,
  _question_text text,
  _book_id   uuid,
  _page          integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.question_page_refs
    (question_id, question_text, book_id, page_number, user_id)
  values
    (_question_id, _question_text, _book_id, _page, auth.uid())
  on conflict (question_id, book_id, user_id)
  do update set page_number = excluded.page_number,
                updated_at  = now();
end;
$$;

-- Withdraw your own reference.
create or replace function public.withdraw_page_ref(_question_id text, _book_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  delete from public.question_page_refs
  where question_id = _question_id
    and book_id = _book_id
    and user_id = auth.uid();
$$;

grant execute on function public.page_refs_for_question(text)                 to authenticated;
grant execute on function public.submit_page_ref(text, text, uuid, integer)   to authenticated;
grant execute on function public.withdraw_page_ref(text, uuid)                to authenticated;
grant execute on function public.page_ref_quorum()                            to authenticated;
