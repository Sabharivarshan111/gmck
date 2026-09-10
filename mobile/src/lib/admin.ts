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

/**
 * A read that can fail, and says so.
 *
 * Every fetch here used to swallow its error into `warn()` and hand back an
 * empty list or a null. On a phone that is invisible: the panel rendered zeros,
 * and **three completely different situations looked identical** — there is
 * genuinely nothing yet, the RPC failed, or this session is not an admin so a
 * `where public.is_admin()` returned no rows at all.
 *
 * That is the failure this codebase keeps meeting: a thing that is absent
 * rather than broken, with nothing anywhere saying which. The textbook-pages
 * section showed "Nobody has entered a textbook page yet" for all three, and
 * the only way to tell them apart was a `warn()` in a log nobody on a phone can
 * read.
 *
 * So a reader now carries its own error, and the panel prints it under the
 * section it belongs to. One section failing no longer hides the others, and
 * "0" now means zero.
 */
export interface AdminRead<T> {
  data: T;
  /** Null when the read succeeded, whatever it found. */
  error: string | null;
}

const ok = <T,>(data: T): AdminRead<T> => ({ data, error: null });
const failed = <T,>(data: T, error: string): AdminRead<T> => ({ data, error });

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
export async function listSubscribers(): Promise<AdminRead<Subscriber[]>> {
  const { data, error } = await supabase.rpc('admin_list_subscribers');
  if (error) {
    warn('admin.listSubscribers', error.message);
    return failed([], error.message);
  }
  return ok(((data ?? []) as Record<string, unknown>[]).map(row => ({
    userId: row.user_id as string,
    displayName: (row.display_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    notesActive: Boolean(row.notes_active),
    adfreeActive: Boolean(row.adfree_active),
    notesPlans: (row.notes_plans as string | null) ?? null,
    totalPaise: Number(row.total_paise ?? 0),
    firstPurchase: (row.first_purchase as string) ?? '',
    adfreeExpiresAt: (row.adfree_expires_at as string | null) ?? null,
  })));
}

/**
 * One purchase, as the admin panel shows it.
 *
 * Separate from `Subscriber` because they answer different questions.
 * `Subscriber` is the aggregate — who has paid, how much in total, what is
 * live now — and it genuinely cannot say when anything was bought: a reader
 * who bought a month in June, a month in August and a year in September is one
 * row reading "Rs 400" and a single date. The refund question, the "my ads came
 * back" question and the "when does mine run out" question are all about the
 * individual purchases.
 */
export interface Purchase {
  id: string;
  plan: string;
  amountPaise: number;
  purchasedAt: string;
  startsAt: string | null;
  expiresAt: string | null;
  /** Still running, measured against the DATABASE's clock rather than a phone's. */
  active: boolean;
  /** A bundled grant the reader did not pay for — the free month with notes. */
  complimentary: boolean;
  paymentId: string | null;
  orderId: string | null;
}

/** Everything one account has ever bought, newest first. */
export async function listUserPurchases(userId: string): Promise<Purchase[]> {
  const { data, error } = await supabase.rpc('admin_user_purchases', {
    _user_id: userId,
  });
  if (error) {
    warn('admin.listUserPurchases', error.message);
    return [];
  }
  return ((data ?? []) as Record<string, unknown>[]).map(row => ({
    id: row.id as string,
    plan: (row.plan as string) ?? '',
    amountPaise: Number(row.amount_paise ?? 0),
    purchasedAt: (row.purchased_at as string) ?? '',
    startsAt: (row.starts_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    active: Boolean(row.active),
    complimentary: Boolean(row.complimentary),
    paymentId: (row.razorpay_payment_id as string | null) ?? null,
    orderId: (row.razorpay_order_id as string | null) ?? null,
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

export async function pageRefStats(): Promise<AdminRead<PageRefStats | null>> {
  const { data, error } = await supabase.rpc('admin_page_ref_stats');
  if (error) {
    warn('admin.pageRefStats', error.message);
    return failed(null, error.message);
  }
  const row = (data ?? [])[0] as Record<string, unknown> | undefined;
  if (!row) {
    /*
     * No row is not "no data". `admin_page_ref_stats` is
     * `select ... where public.is_admin()` with no FROM, so a non-admin gets
     * ZERO ROWS rather than an error — and that is indistinguishable from an
     * empty table unless it is said out loud here. It was rendering as four
     * zeros and "Nobody has entered a textbook page yet", which is a sentence
     * about the data when the truth was about the caller.
     */
    return failed(null, 'The database returned no row — this session is not an admin.');
  }
  return ok({
    totalRefs: Number(row.total_refs ?? 0),
    confirmedPages: Number(row.confirmed_pages ?? 0),
    pendingPages: Number(row.pending_pages ?? 0),
    books: Number(row.books ?? 0),
    contributors: Number(row.contributors ?? 0),
  });
}

export async function listPageRefs(
  onlyPending: boolean,
): Promise<AdminRead<AdminPageRef[]>> {
  const { data, error } = await supabase.rpc('admin_list_page_refs', {
    _only_pending: onlyPending,
  });
  if (error) {
    warn('admin.listPageRefs', error.message);
    return failed([], error.message);
  }
  return ok(((data ?? []) as Record<string, unknown>[]).map(row => ({
    questionId: row.question_id as string,
    questionText: (row.question_text as string) ?? '',
    bookId: row.book_id as string,
    bookName: (row.book_name as string) ?? '',
    edition: (row.edition as string) ?? '',
    page: Number(row.page_number ?? 0),
    votes: Number(row.votes ?? 0),
    confirmed: Boolean(row.confirmed),
    lastSeen: (row.last_seen as string) ?? '',
  })));
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
