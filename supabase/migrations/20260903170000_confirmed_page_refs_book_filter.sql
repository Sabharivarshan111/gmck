-- The reader's own book, when they have chosen one.
--
-- Without this the row chip showed whichever book had the most votes, so a
-- reader holding Robbins was handed a page in Harrison — a number that is not
-- wrong, just useless, and indistinguishable from a useful one on a chip.
--
-- Filtering has to happen HERE, not in the client: the function returns one row
-- per question (`distinct on`), so by the time the client sees it the reader's
-- book has already lost to a better-supported one and is simply absent.
--
-- `_book_id` null keeps the old behaviour — best-supported page, and the chip
-- names its book, which is the honest version of not knowing which book the
-- reader has.
--
-- APPLIED to production 2026-09-03.
create or replace function public.confirmed_page_refs(
  _question_ids text[],
  _book_id uuid default null
)
returns table (
  question_id text,
  book_name   text,
  edition     text,
  page_number integer,
  votes       integer
)
language sql stable security definer set search_path = public
as $$
  select distinct on (r.question_id)
    r.question_id, b.name, b.edition, r.page_number, count(*)::integer
  from public.question_page_refs r
  join public.reference_books b on b.id = r.book_id
  where r.question_id = any(_question_ids)
    and (_book_id is null or r.book_id = _book_id)
  group by r.question_id, r.book_id, b.name, b.edition, r.page_number
  having count(*) >= public.page_ref_quorum()
  order by r.question_id, count(*) desc, r.page_number;
$$;

grant execute on function public.confirmed_page_refs(text[], uuid) to authenticated;
