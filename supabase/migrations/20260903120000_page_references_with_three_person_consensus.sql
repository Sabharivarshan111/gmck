-- NOTE ON THE NAME: this is `reference_books`, not `textbooks`. There is
-- already a private storage bucket called `textbooks` holding the OCR'd books
-- that ground handwritten notes, and `mobile/src/lib/textbooks.ts` picks one by
-- subject. That is a different thing entirely -- those are eight books the app
-- ships against, these are books readers name for themselves -- and giving them
-- the same name is how the wrong one gets wired up.
--
-- The first cut of this migration did create `public.textbooks`; the rename
-- below is what fixes an already-applied copy.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='textbooks')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='reference_books') then
    alter table public.textbooks rename to reference_books;
    alter table public.question_page_refs rename column textbook_id to book_id;
  end if;
end $$;

-- Community page references.
--
-- A reader names the textbook they revise from, and says which page a question
-- is answered on. A page number is only shown to everyone once THREE DIFFERENT
-- readers have submitted the same page for the same book -- one person cannot
-- put a number in front of the whole app.
--
-- The anti-spam work is in the constraints, not in the client:
--   * one row per (question, textbook, reader), so a reader can correct their
--     own page but can never be three of the three.
--   * submissions require a real account. The app signs everyone in
--     anonymously to carry their progress, and an anonymous session is free to
--     mint, so counting those towards a consensus would make the threshold
--     mean nothing.
--   * nobody can read the raw rows. Who voted what is exposed only as counts,
--     through a SECURITY DEFINER function, so the table cannot be enumerated
--     to see how close a page is to landing and then topped up.
--
-- APPLIED to production 2026-09-03.

-- A textbook, as a reader named it. Shared, because a page number is only
-- useful when everybody is holding the same book -- and the edition is part of
-- the book: page 341 of Robbins 9th is not page 341 of Robbins 10th.
create table if not exists public.reference_books (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) between 2 and 120),
  edition     text not null default '' check (length(edition) <= 60),
  subject     text check (length(subject) <= 80),
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Case- and spacing-insensitive, so "Robbins 10e" is not entered four times.
create unique index if not exists reference_books_name_edition_key
  on public.reference_books (lower(btrim(name)), lower(btrim(edition)));

-- One reader's claim that a question is answered on a page of a book.
create table if not exists public.question_page_refs (
  id            uuid primary key default gen_random_uuid(),
  question_id   text not null check (length(question_id) between 3 and 200),
  question_text text not null check (length(question_text) <= 2000),
  book_id   uuid not null references public.reference_books(id) on delete cascade,
  page_number   integer not null check (page_number between 1 and 9999),
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- The whole anti-spam rule in one line: a reader gets one say per book.
  unique (question_id, book_id, user_id)
);

create index if not exists question_page_refs_lookup
  on public.question_page_refs (question_id, book_id, page_number);

alter table public.reference_books           enable row level security;
alter table public.question_page_refs  enable row level security;

-- Everyone signed in may read the book list; it is a shared catalogue.
drop policy if exists textbooks_read on public.reference_books;
create policy reference_books_read on public.reference_books
  for select to authenticated using (true);

-- Only a real (non-anonymous) account may add a book, and only as itself.
drop policy if exists textbooks_insert on public.reference_books;
create policy reference_books_insert on public.reference_books
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'false'
  );

-- A reader sees only their OWN submissions. Everything else about this table
-- reaches the app as a count, never as rows.
drop policy if exists page_refs_read_own on public.question_page_refs;
create policy page_refs_read_own on public.question_page_refs
  for select to authenticated using (user_id = auth.uid());

drop policy if exists page_refs_write_own on public.question_page_refs;
create policy page_refs_write_own on public.question_page_refs
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'false'
  );

drop policy if exists page_refs_update_own on public.question_page_refs;
create policy page_refs_update_own on public.question_page_refs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists page_refs_delete_own on public.question_page_refs;
create policy page_refs_delete_own on public.question_page_refs
  for delete to authenticated using (user_id = auth.uid());

-- How many readers have to agree before a page is shown to everybody.
create or replace function public.page_ref_quorum()
returns integer language sql immutable as $$ select 3 $$;
