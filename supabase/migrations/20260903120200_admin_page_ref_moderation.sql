-- Admin moderation for community page references.
--
-- The three-reader quorum stops one person putting a number in front of the
-- app; it does not stop three people being wrong, or one person with three
-- accounts. So an admin can see what has landed and take it down.
--
-- Every function here checks public.is_admin() itself rather than trusting the
-- caller, because they are SECURITY DEFINER and would otherwise be a way for
-- anyone to read the whole table.
--
-- APPLIED to production 2026-09-03.

create or replace function public.admin_page_ref_stats()
returns table (
  total_refs      integer,
  confirmed_pages integer,
  pending_pages   integer,
  books           integer,
  contributors    integer
)
language sql stable security definer set search_path = public
as $$
  select
    (select count(*)::integer from public.question_page_refs),
    (select count(*)::integer from (
       select 1 from public.question_page_refs
       group by question_id, book_id, page_number
       having count(*) >= public.page_ref_quorum()) c),
    (select count(*)::integer from (
       select 1 from public.question_page_refs
       group by question_id, book_id, page_number
       having count(*) < public.page_ref_quorum()) p),
    (select count(*)::integer from public.reference_books),
    (select count(distinct user_id)::integer from public.question_page_refs)
  where public.is_admin();
$$;

create or replace function public.admin_list_page_refs(_only_pending boolean default false)
returns table (
  question_id   text,
  question_text text,
  book_id       uuid,
  book_name     text,
  edition       text,
  page_number   integer,
  votes         integer,
  confirmed     boolean,
  last_seen     timestamptz
)
language sql stable security definer set search_path = public
as $$
  select
    r.question_id, min(r.question_text), r.book_id, b.name, b.edition,
    r.page_number, count(*)::integer,
    count(*) >= public.page_ref_quorum(), max(r.updated_at)
  from public.question_page_refs r
  join public.reference_books b on b.id = r.book_id
  where public.is_admin()
  group by r.question_id, r.book_id, b.name, b.edition, r.page_number
  having (not _only_pending) or count(*) < public.page_ref_quorum()
  order by max(r.updated_at) desc
  limit 200;
$$;

-- Take down one wrong claim: every reader's vote for that page of that book.
create or replace function public.admin_delete_page_ref(
  _question_id text, _book_id uuid, _page integer
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare removed integer;
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  delete from public.question_page_refs
   where question_id = _question_id and book_id = _book_id and page_number = _page;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- Remove a book somebody added as spam, and every reference hanging off it.
create or replace function public.admin_delete_reference_book(_book_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  delete from public.reference_books where id = _book_id;
end;
$$;

grant execute on function public.admin_page_ref_stats()                     to authenticated;
grant execute on function public.admin_list_page_refs(boolean)              to authenticated;
grant execute on function public.admin_delete_page_ref(text, uuid, integer) to authenticated;
grant execute on function public.admin_delete_reference_book(uuid)          to authenticated;
