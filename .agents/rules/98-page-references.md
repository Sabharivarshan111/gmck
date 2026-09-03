---
description: Community textbook pages — why three different readers have to agree before a page number is shown, and why that rule lives in Postgres rather than in the app
---

# Textbook page references — the number three readers had to agree on

A reader can say which page of which book answers a question. The toggle is on
the question screen ("Textbook pages · ON"), the sheet is
`components/PageRefSheet.tsx`, the client is `lib/pageRefs.ts`, and the tables
are `reference_books` and `question_page_refs`.

## The quorum is in Postgres, and that is the whole feature

A page is shown to everybody only once **three different readers** have
submitted the same page for the same book and edition. The app ships as an APK
anyone can unpack, so the client can never be what decides this. The anti-spam
work is entirely in constraints:

| What stops it | How |
|---|---|
| One reader voting three times | `unique (question_id, book_id, user_id)` — a second submit **corrects** their number, it does not add a vote |
| Free throwaway accounts | Submissions require a non-anonymous session. Everyone gets an anonymous one to carry progress and those cost nothing to mint |
| Watching for a page one vote short and topping it up | RLS shows a reader only their own rows; counts come from a SECURITY DEFINER function |

`page_ref_quorum()` is the threshold, mirrored in the client as
`PAGE_REF_QUORUM`. Changing one without the other makes the sheet lie about
what it takes.

Proved against production before any UI existed: 2 voters → not confirmed; the
same voter again → refused by the constraint (3 rows from 3 distinct users, not
4); a third distinct reader → confirmed.

## The edition is part of the book

It is in the unique index, not a note beside it. Page 341 of Robbins 9th is not
page 341 of the 10th, and a reference that does not say which is worse than
none.

## `reference_books` is not `textbooks`

`textbooks` is already the **private storage bucket** holding the eight OCR'd
books that ground handwritten notes, picked by subject in `lib/textbooks.ts`.
These are books *readers* name for themselves and the app ships knowing none of
them. The table was created as `textbooks` for about ten minutes and renamed for
exactly this reason — do not name anything else in this feature `textbook`.

## Three things on the client that look like preferences and are not

- **The toggle gates the fetch.** Off, no chip is drawn and nothing is
  requested. Most readers do not own the book somebody else numbered, and a
  screen that queries on their behalf spends a request on nothing.
- **Pages arrive in one batch per screen** (`confirmed_page_refs`), keyed by
  question id. A topic can hold five hundred questions, so a fetch per row is
  five hundred round trips on a phone that is already scrolling.
- **Only confirmed pages reach a row.** A row is a glance; "2 of 3" is a
  conversation, and it belongs in the sheet where there is room to say what it
  means and a control to add the third vote.

## The chip always names the book

Never merge it with the existing `Pg.` marker on a row. That one is the page in
whichever book the bank was compiled from; this one is a page in a book three
readers say they are holding. A bare number for both merges two different books
into one wrong reference.

## Checking it

```sh
cd mobile && npm run check:page-refs
```

Drives the real screen: the toggle switches, rows gain and lose their chip with
it, the sheet opens and states the quorum, and "Add a book" has both a name and
an edition field. Fields are asserted **by accessibility label**, not by body
text — a placeholder is not in `innerText`, so matching on that passes whether
or not the field exists.

What it cannot prove is the quorum, which lives in Postgres. That is covered by
the SQL self-test recorded in the migration notes.
