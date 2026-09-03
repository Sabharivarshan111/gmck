/**
 * Community page references — "which page of which book answers this question".
 *
 * NOT to be confused with `lib/textbooks.ts`, which picks one of the eight
 * OCR'd books in the private `textbooks` bucket to ground a handwritten note.
 * These are books *readers* name for themselves, in the `reference_books`
 * table, and the app ships knowing none of them.
 *
 * The rule that makes the numbers worth trusting is the quorum: a page is only
 * shown to everybody once THREE DIFFERENT readers have submitted the same page
 * for the same book. That is enforced in Postgres, not here — the client cannot
 * be the thing that decides, because anyone can write their own client.
 *
 * What the database guarantees, so this file does not have to:
 *   * one row per (question, book, reader) — a unique constraint, so submitting
 *     twice corrects your own number instead of adding a second vote;
 *   * submissions require a real account. Everyone gets an anonymous session to
 *     carry their progress and those are free to mint, so they are refused here
 *     or the threshold would mean nothing;
 *   * nobody can read the raw rows — the counts arrive through a SECURITY
 *     DEFINER function, so the table cannot be enumerated to see how close a
 *     page is to landing.
 */
import { supabase } from './supabase';
import { getQuestionId } from './progress';
import { warn } from './log';

/** How many readers have to agree. Mirrors `page_ref_quorum()` in Postgres. */
export const PAGE_REF_QUORUM = 3;

export interface ReferenceBook {
  id: string;
  name: string;
  /** "10th edition", "2019 reprint" — free text, because readers say it their way. */
  edition: string;
  subject: string | null;
}

export interface PageRef {
  bookId: string;
  bookName: string;
  edition: string;
  page: number;
  /** How many distinct readers have submitted this page for this book. */
  votes: number;
  /** True once `votes` reaches the quorum. Only these are shown on a row. */
  confirmed: boolean;
  /** Whether the signed-in reader is one of those votes. */
  mine: boolean;
}

/**
 * Whether this session may contribute at all.
 *
 * An anonymous session can read every page number in the app and is refused
 * only at the point of submitting one. That asymmetry is the anti-spam rule,
 * and the UI has to say so rather than letting a submit button fail.
 */
export async function canContribute(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    return false;
  }
  // supabase-js exposes it on the user; the JWT claim is what Postgres checks.
  return user.is_anonymous !== true;
}

/** The shared catalogue of books readers have named. */
export async function listBooks(): Promise<ReferenceBook[]> {
  const { data, error } = await supabase
    .from('reference_books')
    .select('id, name, edition, subject')
    .order('name');
  if (error) {
    warn('pageRefs.listBooks', error.message);
    return [];
  }
  return (data ?? []).map(row => ({
    id: row.id as string,
    name: row.name as string,
    edition: (row.edition as string) ?? '',
    subject: (row.subject as string | null) ?? null,
  }));
}

/**
 * Add a book to the shared catalogue, or return the one that is already there.
 *
 * The unique index is on `lower(btrim(name)), lower(btrim(edition))`, so
 * "Robbins 10e" typed with different capitals is the same book. A duplicate is
 * therefore not an error to report — it is the answer, and the existing row is
 * what the caller wanted.
 */
export async function addBook(
  name: string,
  edition: string,
  subject?: string,
): Promise<ReferenceBook | null> {
  const cleanName = name.trim();
  const cleanEdition = edition.trim();
  if (cleanName.length < 2) {
    return null;
  }

  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) {
    return null;
  }

  const { data, error } = await supabase
    .from('reference_books')
    .insert({
      name: cleanName,
      edition: cleanEdition,
      subject: subject?.trim() || null,
      created_by: uid,
    })
    .select('id, name, edition, subject')
    .single();

  if (!error && data) {
    return {
      id: data.id as string,
      name: data.name as string,
      edition: (data.edition as string) ?? '',
      subject: (data.subject as string | null) ?? null,
    };
  }

  // 23505 is unique_violation: somebody already added this exact book, which
  // is a success from the reader's point of view. Find it and hand it back.
  if (error?.code === '23505') {
    const existing = (await listBooks()).find(
      b =>
        b.name.trim().toLowerCase() === cleanName.toLowerCase() &&
        b.edition.trim().toLowerCase() === cleanEdition.toLowerCase(),
    );
    return existing ?? null;
  }

  warn('pageRefs.addBook', error?.message ?? 'unknown');
  return null;
}

/**
 * Every page anybody has claimed for this question, with its vote count.
 *
 * `rawQuestion` exists for the same reason it does in the diagram lookup: the
 * screens strip a leading "12. " before they show a question, and a key built
 * from the stripped form is not the key built from the raw one. Asking under
 * both is the difference between finding a reference and silently finding none.
 */
export async function pageRefsFor(
  question: string,
  rawQuestion?: string,
): Promise<PageRef[]> {
  const ids = Array.from(
    new Set([getQuestionId(question), rawQuestion ? getQuestionId(rawQuestion) : null].filter(
      (id): id is string => Boolean(id),
    )),
  );

  const results = await Promise.all(
    ids.map(async id => {
      const { data, error } = await supabase.rpc('page_refs_for_question', {
        _question_id: id,
      });
      if (error) {
        warn('pageRefs.pageRefsFor', error.message);
        return [] as PageRef[];
      }
      return (data ?? []).map(
        (row: Record<string, unknown>): PageRef => ({
          bookId: row.book_id as string,
          bookName: row.book_name as string,
          edition: (row.edition as string) ?? '',
          page: row.page_number as number,
          votes: row.votes as number,
          confirmed: row.confirmed as boolean,
          mine: row.mine as boolean,
        }),
      );
    }),
  );

  // The two ids can both answer, so fold by (book, page) rather than
  // concatenating and showing the same claim twice.
  const merged = new Map<string, PageRef>();
  for (const ref of results.flat()) {
    const key = `${ref.bookId}:${ref.page}`;
    const seen = merged.get(key);
    if (!seen || ref.votes > seen.votes) {
      merged.set(key, ref);
    }
  }
  return [...merged.values()].sort(
    (a, b) => Number(b.confirmed) - Number(a.confirmed) || b.votes - a.votes,
  );
}

/** A confirmed page, as a row shows it. */
export interface ConfirmedPage {
  bookName: string;
  edition: string;
  page: number;
  votes: number;
}

/**
 * Confirmed pages for a whole screenful of questions, in one call.
 *
 * A topic can hold five hundred questions and the list renders them all, so a
 * per-row fetch would be five hundred round trips on a phone that is already
 * scrolling. The screen asks once for everything it is about to show, and the
 * rows read the answer out of a map.
 *
 * Only confirmed pages come back. A row is a glance, and half a claim
 * ("2 of 3") is a conversation — that belongs in the sheet, where there is room
 * to say what it means and a control to add the third vote.
 *
 * Keyed by the id, and questions are asked about under both forms for the same
 * reason `pageRefsFor` does it.
 */
export async function confirmedPagesFor(
  questions: { question: string; rawQuestion?: string }[],
): Promise<Map<string, ConfirmedPage>> {
  const out = new Map<string, ConfirmedPage>();
  if (questions.length === 0) {
    return out;
  }

  const ids = new Set<string>();
  for (const item of questions) {
    ids.add(getQuestionId(item.question));
    if (item.rawQuestion) {
      ids.add(getQuestionId(item.rawQuestion));
    }
  }

  const { data, error } = await supabase.rpc('confirmed_page_refs', {
    _question_ids: [...ids],
  });
  if (error) {
    warn('pageRefs.confirmedPagesFor', error.message);
    return out;
  }

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    out.set(row.question_id as string, {
      bookName: row.book_name as string,
      edition: (row.edition as string) ?? '',
      page: row.page_number as number,
      votes: row.votes as number,
    });
  }
  return out;
}

/**
 * Submit or correct this reader's page for a book.
 *
 * Returns the error message to show, or null on success. It returns rather than
 * throws because supabase-js reports errors instead of throwing them, and a
 * try/catch around this would never fire.
 */
export async function submitPageRef(
  question: string,
  bookId: string,
  page: number,
): Promise<string | null> {
  if (!Number.isInteger(page) || page < 1 || page > 9999) {
    return 'Enter a page number between 1 and 9999.';
  }
  const { error } = await supabase.rpc('submit_page_ref', {
    _question_id: getQuestionId(question),
    _question_text: question.slice(0, 2000),
    _book_id: bookId,
    _page: page,
  });
  if (!error) {
    return null;
  }
  // RLS refusing an anonymous session is the expected failure, and "new row
  // violates row-level security policy" is not something to show a reader.
  if (/row-level security/i.test(error.message)) {
    return 'Sign in with Google to add a page number.';
  }
  warn('pageRefs.submitPageRef', error.message);
  return 'Could not save that just now.';
}

/** Take back your own page reference. */
export async function withdrawPageRef(
  question: string,
  bookId: string,
): Promise<void> {
  const { error } = await supabase.rpc('withdraw_page_ref', {
    _question_id: getQuestionId(question),
    _book_id: bookId,
  });
  if (error) {
    warn('pageRefs.withdrawPageRef', error.message);
  }
}
