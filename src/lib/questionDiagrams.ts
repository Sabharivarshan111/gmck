/**
 * Which diagram belongs to a question — the one implementation, for both apps.
 *
 * This file lives in the web app's `src/lib` because that is where the shared
 * code already lives: the native app reaches it through the `@shared/*` alias,
 * the same route `profanity.ts` takes. There is no second copy anywhere and
 * there must never be one.
 *
 * ## A diagram is looked up by identity, never by words
 *
 * `question_diagrams` holds **one row per question**, and that row's
 * `question_id` is the app's own per-question key — `question-` plus the first
 * 50 characters with whitespace dashed. 849 of the 862 rows carrying a picture
 * match it character for character. So the number of diagrams a question has
 * is the number of rows it has: usually one, often none, and never a
 * neighbour's.
 *
 * It was a keyword search in both apps, and that is the bug that was reported.
 * Candidates were scored against hand-written "exclusive entity families" — a
 * word list per pathway — so *TCA cycle – definition, sequence of reaction,
 * energetics, regulation* opened with **"High-Yield Visual Exam Diagram (1/3)"
 * showing Glycolysis**, then Gluconeogenesis, then its own. The native app was
 * fixed; the web app was not, and it had a second failure the native one did
 * not: a question matching **no** family returned an empty list, so most
 * questions showed no diagram at all rather than the wrong one.
 *
 * Widening and narrowing those lists only ever moved which questions were
 * wrong, because the premise is wrong: a question that *mentions* a pathway is
 * not a question about it, and no vocabulary separates them. Identity is the
 * whole matcher now, and there is nothing left to tune.
 *
 * **No row means no picture.** A plausible neighbour is worse than a blank.
 */

/** A row of `question_diagrams`, as either app selects it. */
export interface DiagramRow {
  public_url?: string | null;
  question_text?: string | null;
}

export interface QuestionDiagram {
  url: string;
  title?: string;
}

/**
 * A Supabase client, structurally.
 *
 * `from` is typed loosely on purpose, and it is the only loose type here. The
 * two apps generate their own `Database` types from the same project, and
 * pinning this to either one would make the file importable by only that app —
 * which is the thing this file exists to avoid. What matters is that the
 * *queries and the matching rules* below are written once; the client is just
 * the transport.
 */
export interface DiagramClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any;
}

/**
 * The identity of a question, as `question_diagrams.question_id` stores it.
 *
 * This is the same string both apps use as their per-question progress key —
 * `mobile/src/lib/progress.ts`'s `getQuestionId` and the web's
 * `question-progress.ts` both build it, and the diagram pipeline filed every
 * row under it. **The 50 is load-bearing and must exist in exactly one place**:
 * a second copy of it drifts and then silently matches nothing, which looks
 * identical to "this question has no diagram".
 */
export function questionDiagramId(question: string): string {
  return `question-${question.trim().slice(0, 50).replace(/\s+/g, '-')}`;
}

/**
 * For the thirteen rows that were inserted by hand and carry a paraphrased
 * `question_id` (`anat-types-of-synovial-joints`), reached through their
 * `question_text` instead.
 *
 * Stars are the importance markers the bank appends, and a row may or may not
 * have kept them, so they come off both sides — but the comparison stays an
 * **equality**, never a containment. "Types of synovial joint" and "Types of
 * synovial joint **" are the same question; "Glycolysis …" and "TCA cycle …"
 * are not, and every looser test tried here made them look like they were.
 */
export function normalizeQuestionText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[*#★☆•]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Collect rows into diagrams, dropping blanks and duplicates. */
function take(rows: DiagramRow[] | null | undefined, into: QuestionDiagram[], seen: Set<string>) {
  for (const row of rows ?? []) {
    const url = row.public_url;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    into.push({ url, title: row.question_text ?? undefined });
  }
}

/**
 * One question's diagrams, and nobody else's.
 *
 * `subject` is only ever used to scope the last-resort fallback, and even
 * there the comparison is an equality after normalisation. It is never a
 * matcher in its own right.
 */
export async function findDiagramsForQuestion(
  client: DiagramClient,
  question: string,
  subject?: string,
): Promise<QuestionDiagram[]> {
  const clean = question.trim();
  if (clean.length < 3) {
    return [];
  }

  const out: QuestionDiagram[] = [];
  const seen = new Set<string>();

  try {
    /*
     * The identity join. Both halves are equalities on indexed columns, so
     * this is two tiny lookups rather than every row for the subject pulled
     * down and filtered in JavaScript — which is what the keyword version did,
     * on every note open.
     */
    const [byId, byText] = await Promise.all([
      client
        .from('question_diagrams')
        .select('public_url, question_text')
        .eq('question_id', questionDiagramId(clean)),
      client
        .from('question_diagrams')
        .select('public_url, question_text')
        .eq('question_text', clean),
    ]);

    /*
     * The error is inspected, not just the data. supabase-js **returns**
     * errors rather than throwing them, so the `try` around this never fires
     * for a query that failed — `data` is simply null and `take` adds nothing.
     * A question with a perfectly good row then renders with no diagram and
     * nothing says why, which looks exactly like the question having no
     * picture.
     */
    if (byId?.error || byText?.error) {
      // eslint-disable-next-line no-console
      console.warn('[questionDiagrams] lookup failed:', byId?.error ?? byText?.error);
    }
    take(byId?.data, out, seen);
    take(byText?.data, out, seen);

    if (out.length > 0) {
      return out;
    }

    /*
     * Only when neither exact key hit: the hand-inserted rows, whose stars and
     * the bank's differ. Scoped to the subject because a bare question like
     * "Jaundice" exists in more than one, and still an equality after
     * normalisation rather than a search.
     */
    const canonical = (subject ?? '').trim();
    const wanted = normalizeQuestionText(clean);
    if (!canonical || !wanted) {
      return out;
    }

    const { data } = await client
      .from('question_diagrams')
      .select('public_url, question_text')
      .ilike('subject', `%${canonical}%`);

    take(
      (data ?? []).filter(
        (row: DiagramRow) =>
          typeof row.question_text === 'string' &&
          normalizeQuestionText(row.question_text) === wanted,
      ),
      out,
      seen,
    );
  } catch {
    // A diagram is an enrichment. Failing to find one must never take the note
    // down with it, so the caller gets an empty list and renders without.
  }

  return out;
}

/**
 * Every diagram in a chapter, each tagged with the question it belongs to.
 *
 * Same join, widened: one round trip for the whole chapter instead of one per
 * question, because a chapter is up to a few hundred questions and that many
 * sequential lookups is a visibly slow page.
 */
export async function findDiagramsForTopic(
  client: DiagramClient,
  questions: string[],
  subject?: string,
): Promise<Map<string, QuestionDiagram[]>> {
  const byQuestion = new Map<string, QuestionDiagram[]>();
  const cleaned = questions.map(q => q.trim()).filter(q => q.length >= 3);
  if (cleaned.length === 0) {
    return byQuestion;
  }

  const idOf = new Map<string, string>();
  for (const question of cleaned) {
    idOf.set(questionDiagramId(question), question);
  }

  try {
    const { data } = await client
      .from('question_diagrams')
      .select('public_url, question_text, question_id')
      .in('question_id', [...idOf.keys()]);

    for (const row of (data ?? []) as (DiagramRow & { question_id?: string | null })[]) {
      const question = row.question_id ? idOf.get(row.question_id) : undefined;
      if (!question || !row.public_url) continue;
      const list = byQuestion.get(question) ?? [];
      if (!list.some(d => d.url === row.public_url)) {
        list.push({ url: row.public_url, title: row.question_text ?? undefined });
      }
      byQuestion.set(question, list);
    }
  } catch {
    // As above: no diagrams rather than no chapter.
  }

  // Questions the batch missed are looked up individually — the hand-inserted
  // rows are only reachable by text, and there are few enough to be cheap.
  const missing = cleaned.filter(q => !byQuestion.has(q));
  if (missing.length > 0 && missing.length <= 40) {
    const found = await Promise.all(
      missing.map(q => findDiagramsForQuestion(client, q, subject)),
    );
    missing.forEach((question, index) => {
      if (found[index].length > 0) {
        byQuestion.set(question, found[index]);
      }
    });
  }

  return byQuestion;
}

// ---------------------------------------------------------------------------
// Where a diagram sits on the page
// ---------------------------------------------------------------------------

/**
 * Normalised enough to compare a question with a heading.
 *
 * Lower case, no punctuation, no importance stars or PYQ markers, single
 * spaces. Deliberately not a stemmer: this is used for *containment*, not for
 * scoring, and the whole point is that it either matches or it does not.
 */
export function comparable(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Which section a picture belongs above, or null when nothing says.
 *
 * **Containment, never a score.** A heading is placed above a diagram only
 * when the heading's words appear inside the question that diagram answers —
 * "Axilla: Boundaries and Contents" inside "Axilla - boundaries, contents,
 * applied anatomy" — or the reverse.
 *
 * The stakes here are much lower than in `findDiagramsForQuestion`: this
 * decides only *where on the page* an already-correct picture sits, never
 * which picture a question gets. That is why a fallback is acceptable here at
 * all and is not up there. It is still not a licence to guess — an unmatched
 * diagram goes to the end, not to whichever heading looked closest.
 */
export function sectionIndexForQuestion(
  titles: string[],
  question: string,
  taken: Set<number>,
): number | null {
  const wanted = comparable(question);
  if (!wanted) {
    return null;
  }
  for (let i = 0; i < titles.length; i += 1) {
    if (taken.has(i)) continue;
    const title = comparable(titles[i] ?? '');
    /*
     * Three words is the floor. "Contents" or "Course" appears in half the
     * headings in an anatomy chapter and inside most of the questions, so a
     * shorter match is a coincidence rather than a subject.
     */
    if (title.split(' ').length < 3) continue;
    if (wanted.includes(title) || title.includes(wanted.slice(0, 60))) {
      return i;
    }
  }
  return null;
}

/**
 * Lay a chapter's diagrams against the sections they illustrate.
 *
 * Returns, for each section index, the questions whose diagrams go immediately
 * before it, plus the ones nothing placed. They used to go in a block at the
 * top, and the report was exactly what that layout does to somebody revising:
 * you scroll past forty pictures to reach the writing, read about the axilla,
 * then scroll back up to find the axilla picture. A diagram is a caption for a
 * piece of text and belongs against it.
 *
 * Unplaced diagrams go to **the end, never the top**: a picture nobody can
 * place is still less confusing after the reading than in front of it.
 */
export function placeDiagrams(
  sectionTitles: string[],
  questions: string[],
): { before: Map<number, string[]>; trailing: string[] } {
  const before = new Map<number, string[]>();
  const trailing: string[] = [];
  const taken = new Set<number>();

  for (const question of questions) {
    const at = sectionIndexForQuestion(sectionTitles, question, taken);
    if (at === null) {
      trailing.push(question);
      continue;
    }
    taken.add(at);
    const list = before.get(at) ?? [];
    list.push(question);
    before.set(at, list);
  }

  return { before, trailing };
}
