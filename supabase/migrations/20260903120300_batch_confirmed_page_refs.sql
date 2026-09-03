-- One call per screen, not one per row.
--
-- A topic can hold five hundred questions and the list renders them all, so
-- asking page_refs_for_question() from inside a row would be five hundred round
-- trips on a phone that is already scrolling. The screen asks once for
-- everything it is about to show.
--
-- Only CONFIRMED pages come back. A row is a glance, and half a claim
-- ("2 of 3") is a conversation -- that belongs in the sheet, where there is
-- room to say what it means and a control to add the third vote.
--
-- APPLIED to production 2026-09-03.
create or replace function public.confirmed_page_refs(_question_ids text[])
returns table (
  question_id text,
  book_name   text,
  edition     text,
  page_number integer,
  votes       integer
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (r.question_id)
    r.question_id,
    b.name,
    b.edition,
    r.page_number,
    count(*)::integer
  from public.question_page_refs r
  join public.reference_books b on b.id = r.book_id
  where r.question_id = any(_question_ids)
  group by r.question_id, r.book_id, b.name, b.edition, r.page_number
  having count(*) >= public.page_ref_quorum()
  -- Best-supported page wins when a question has confirmed pages in more than
  -- one book; the sheet still lists them all.
  order by r.question_id, count(*) desc, r.page_number;
$$;

grant execute on function public.confirmed_page_refs(text[]) to authenticated;
