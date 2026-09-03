/**
 * The admin panel's data layer.
 *
 * Every function here calls an RPC that checks `is_admin()` in Postgres before
 * it returns anything. Nothing is gated by this file — a non-admin calling
 * these gets an empty list or a raised exception from the database, which is
 * what makes the panel safe to ship inside an APK anybody can unpack.
 *
 * The subscribers and diagram halves mirror the web app's
 * `AdminSubscribersCard` and `AdminDiagramsPanel` so the two admin surfaces
 * report the same numbers. The page-reference half is new, and exists because
 * the three-reader quorum stops one person publishing a page but does not stop
 * three people being wrong.
 */
import { supabase } from './supabase';
import { warn } from './log';

export interface Subscriber {
  userId: string;
  displayName: string | null;
  email: string | null;
  notesActive: boolean;
  adfreeActive: boolean;
  notesPlans: string | null;
  totalPaise: number;
  firstPurchase: string;
  adfreeExpiresAt: string | null;
}

export interface DiagramStats {
  total: number;
  withPicture: number;
  approved: number;
  failed: number;
}

export interface PageRefStats {
  totalRefs: number;
  confirmedPages: number;
  pendingPages: number;
  books: number;
  contributors: number;
}

export interface AdminPageRef {
  questionId: string;
  questionText: string;
  bookId: string;
  bookName: string;
  edition: string;
  page: number;
  votes: number;
  confirmed: boolean;
  lastSeen: string;
}

/** Everyone who has ever paid, and what they currently hold. */
export async function listSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabase.rpc('admin_list_subscribers');
  if (error) {
    warn('admin.listSubscribers', error.message);
    return [];
  }
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    userId: row.user_id as string,
    displayName: (row.display_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    notesActive: Boolean(row.notes_active),
    adfreeActive: Boolean(row.adfree_active),
    notesPlans: (row.notes_plans as string | null) ?? null,
    totalPaise: Number(row.total_paise ?? 0),
    firstPurchase: (row.first_purchase as string) ?? '',
    adfreeExpiresAt: (row.adfree_expires_at as string | null) ?? null,
  }));
}

/** Take every unlock off one account. */
export async function revokeAccess(userId: string): Promise<string | null> {
  const { error } = await supabase.rpc('admin_revoke_user_access', {
    _user_id: userId,
  });
  if (error) {
    warn('admin.revokeAccess', error.message);
    return error.message;
  }
  return null;
}

/**
 * Diagram coverage.
 *
 * Counted here rather than in an RPC because `question_diagrams` is already
 * readable, and the number that actually matters is not the row count: a row
 * with no `public_url` is a placeholder for a picture nobody has generated, and
 * 4,500 of them look like coverage until you ask which ones a reader can see.
 */
export async function diagramStats(): Promise<DiagramStats> {
  const count = async (build: (q: any) => any): Promise<number> => {
    const { count: n, error } = await build(
      supabase.from('question_diagrams').select('id', { count: 'exact', head: true }),
    );
    if (error) {
      warn('admin.diagramStats', error.message);
      return 0;
    }
    return n ?? 0;
  };

  const [total, withPicture, approved, failed] = await Promise.all([
    count((q: any) => q),
    count((q: any) => q.not('public_url', 'is', null)),
    count((q: any) => q.eq('status', 'approved')),
    count((q: any) => q.eq('status', 'failed')),
  ]);

  return { total, withPicture, approved, failed };
}

export async function pageRefStats(): Promise<PageRefStats | null> {
  const { data, error } = await supabase.rpc('admin_page_ref_stats');
  if (error) {
    warn('admin.pageRefStats', error.message);
    return null;
  }
  const row = (data ?? [])[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return {
    totalRefs: Number(row.total_refs ?? 0),
    confirmedPages: Number(row.confirmed_pages ?? 0),
    pendingPages: Number(row.pending_pages ?? 0),
    books: Number(row.books ?? 0),
    contributors: Number(row.contributors ?? 0),
  };
}

export async function listPageRefs(onlyPending: boolean): Promise<AdminPageRef[]> {
  const { data, error } = await supabase.rpc('admin_list_page_refs', {
    _only_pending: onlyPending,
  });
  if (error) {
    warn('admin.listPageRefs', error.message);
    return [];
  }
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    questionId: row.question_id as string,
    questionText: (row.question_text as string) ?? '',
    bookId: row.book_id as string,
    bookName: (row.book_name as string) ?? '',
    edition: (row.edition as string) ?? '',
    page: Number(row.page_number ?? 0),
    votes: Number(row.votes ?? 0),
    confirmed: Boolean(row.confirmed),
    lastSeen: (row.last_seen as string) ?? '',
  }));
}

/** Remove a wrong claim — every reader's vote for that page of that book. */
export async function deletePageRef(
  questionId: string,
  bookId: string,
  page: number,
): Promise<string | null> {
  const { error } = await supabase.rpc('admin_delete_page_ref', {
    _question_id: questionId,
    _book_id: bookId,
    _page: page,
  });
  if (error) {
    warn('admin.deletePageRef', error.message);
    return error.message;
  }
  return null;
}

/** Remove a book added as spam, and every reference hanging off it. */
export async function deleteReferenceBook(bookId: string): Promise<string | null> {
  const { error } = await supabase.rpc('admin_delete_reference_book', {
    _book_id: bookId,
  });
  if (error) {
    warn('admin.deleteReferenceBook', error.message);
    return error.message;
  }
  return null;
}
