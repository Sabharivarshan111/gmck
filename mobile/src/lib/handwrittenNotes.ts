import { supabase } from './supabase';
import { collectQuestions, type BankNode } from './questionBank';
import { clampQuestions } from './notesLimits';
import { getQuestionId } from './progress';
import { warn } from '@/lib/log';

/**
 * Handwritten-notes generation, ported from
 * src/components/handwritten/HandwrittenNotesHub.tsx.
 *
 * The edge function generates a topic's notes in batches of questions, so a
 * large topic arrives over several calls that are merged client-side. The
 * batch size, inter-batch delay and request shape all match the web app, since
 * they are tuned to the provider's throughput limits.
 */

export interface Section {
  type: string;
  title: string;
  icon?: string;
  pyqYears?: string[];
  payload: Record<string, unknown>;
}

export interface NotesContent {
  highYieldTip?: string;
  pyqYears?: string[];
  diagramUrl?: string;
  sections: Section[];
}

export interface LeafTopic {
  /** Stable identity for the cache: "pathology::paper-1/neoplasia". */
  key: string;
  name: string;
  breadcrumb: string;
  questions: string[];
}

export const NOTES_BATCH_SIZE = 10;
/** Keeps direct Google AI Studio keys under safer throughput. */
export const INTER_BATCH_DELAY_MS = 25_000;

/** A node is a leaf when its children are only question buckets. */
function isLeafShape(node: BankNode): boolean {
  const subs = node?.subtopics as Record<string, BankNode> | undefined;
  if (!subs) {
    return true;
  }
  return Object.keys(subs).every(
    key =>
      key === 'essay' ||
      key === 'short-note' ||
      key === 'short-notes' ||
      Array.isArray(subs[key]?.questions),
  );
}

/** Every leaf topic under a subject that has at least one question. */
export function flattenSubjectTopics(
  subjectKey: string,
  node: BankNode | undefined,
): LeafTopic[] {
  const out: LeafTopic[] = [];

  function walk(
    current: BankNode | undefined,
    keyPath: string[],
    namePath: string[],
  ) {
    if (!current || typeof current !== 'object') {
      return;
    }
    const unique = Array.from(
      new Set([
        ...collectQuestions(current, 'essay'),
        ...collectQuestions(current, 'short-notes'),
      ]),
    ).filter(Boolean);

    const subs = current.subtopics as Record<string, BankNode> | undefined;
    const hasChildren = subs && typeof subs === 'object';

    if (
      unique.length > 0 &&
      (!hasChildren || Object.keys(subs).length === 0 || isLeafShape(current))
    ) {
      out.push({
        key: `${subjectKey}::${keyPath.join('/')}`,
        name: namePath[namePath.length - 1] ?? current.name ?? 'Topic',
        breadcrumb: namePath.join(' › '),
        questions: unique,
      });
      return;
    }

    if (hasChildren) {
      for (const [key, value] of Object.entries(subs)) {
        walk(value, [...keyPath, key], [...namePath, value?.name ?? key]);
      }
    }
  }

  walk(node, [], [node?.name ?? subjectKey]);

  const seen = new Set<string>();
  return out.filter(topic =>
    seen.has(topic.key) ? false : (seen.add(topic.key), true),
  );
}

/** Combine per-batch results, folding same-titled sections together. */
export function mergeNotes(parts: (NotesContent | null)[]): NotesContent {
  const merged: NotesContent = { highYieldTip: '', pyqYears: [], sections: [] };
  const extraTips: string[] = [];
  const years = new Set<string>();
  const byTitle = new Map<string, Section>();

  for (const part of parts) {
    if (!part) {
      continue;
    }
    if (part.highYieldTip) {
      if (!merged.highYieldTip) {
        merged.highYieldTip = part.highYieldTip;
      } else {
        extraTips.push(part.highYieldTip);
      }
    }
    if (Array.isArray(part.pyqYears)) {
      for (const year of part.pyqYears) {
        if (year) {
          years.add(String(year));
        }
      }
    }
    if (Array.isArray(part.sections)) {
      for (const section of part.sections) {
        const key = (section?.title ?? '').toLowerCase().trim();
        if (!key) {
          merged.sections.push(section);
          continue;
        }
        const existing = byTitle.get(key);
        if (!existing) {
          byTitle.set(key, section);
          merged.sections.push(section);
        } else if (
          Array.isArray(existing.payload?.items) &&
          Array.isArray(section.payload?.items)
        ) {
          existing.payload.items = [
            ...(existing.payload.items as unknown[]),
            ...(section.payload.items as unknown[]),
          ];
        }
      }
    }
  }

  if (extraTips.length) {
    merged.highYieldTip = `${merged.highYieldTip} ${extraTips.join(
      ' ',
    )}`.trim();
  }
  merged.pyqYears = Array.from(years).sort();
  return merged;
}

export interface BatchResult {
  cached: boolean;
  content: NotesContent;
  batchIndex: number;
  totalBatches: number;
  hasMore: boolean;
  estSecondsPerBatch: number;
}

interface FunctionErrorContext {
  json?: () => Promise<{ error?: unknown }>;
  text?: () => Promise<string>;
}

/** Edge-function errors carry the useful message in the response body. */
async function unwrapError(error: {
  message?: string;
  context?: unknown;
}): Promise<Error> {
  let message = error.message ?? 'Failed';
  try {
    const context = error.context as FunctionErrorContext | undefined;
    if (context?.json) {
      const body = await context.json();
      if (body?.error) {
        message =
          typeof body.error === 'string'
            ? body.error
            : JSON.stringify(body.error);
      }
    } else if (context?.text) {
      const text = await context.text();
      if (text) {
        message = text.slice(0, 300);
      }
    }
  } catch {
    // Keep the original message.
  }
  return new Error(message);
}

interface TopicRequest {
  topic: LeafTopic;
  yearLabel: string;
  subject: string;
}

function baseBody({ topic, yearLabel, subject }: TopicRequest) {
  return {
    subtopicKey: topic.key,
    year: yearLabel,
    subject,
    subtopicName: topic.name,
    questions: clampQuestions(topic.questions),
  };
}

export async function fetchNotesBatch(
  request: TopicRequest,
  batchIndex: number,
  regenerate: boolean,
): Promise<BatchResult> {
  const { data, error } = await supabase.functions.invoke(
    'generate-handwritten-notes',
    {
      body: {
        ...baseBody(request),
        batchIndex,
        batchSize: NOTES_BATCH_SIZE,
        // Only the first batch may bust the cache.
        regenerate: regenerate && batchIndex === 0,
      },
    },
  );
  if (error) {
    throw await unwrapError(error);
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  return data as BatchResult;
}

/** Persist the merged result so later opens hit the cache. Non-fatal. */
export async function saveMergedNotes(
  request: TopicRequest,
  content: NotesContent,
): Promise<void> {
  try {
    await supabase.functions.invoke('generate-handwritten-notes', {
      body: { ...baseBody(request), saveContent: true, content },
    });
  } catch {
    // Caching is best-effort.
  }
}

export async function applyNotesEdit(
  request: TopicRequest,
  content: NotesContent,
  editInstruction: string,
): Promise<NotesContent> {
  const { data, error } = await supabase.functions.invoke(
    'generate-handwritten-notes',
    {
      body: { ...baseBody(request), content, editInstruction },
    },
  );
  if (error) {
    throw await unwrapError(error);
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  const updated = data?.content as NotesContent | undefined;
  if (!updated?.sections) {
    throw new Error('AI edit returned invalid notes.');
  }
  return updated;
}

/**
 * A handwritten note for **one** question.
 *
 * The web app's third-year triple tap does this (QuestionCard.tsx dispatches
 * `orbit:single-note`, SingleQuestionNoteOverlay calls the function): third
 * year is Community Medicine and Forensic Medicine, and those are the two
 * subjects `generate-handwritten-notes` grounds in a real textbook — Sia and
 * Vision, bundled into the function itself. Sending the question to
 * `ask-gemini` instead, as the native app did, gets a general-purpose answer
 * from a model that has never seen either book.
 *
 * `singleMode` is what makes the function treat one question as an essay
 * rather than a batch item, so the depth matches what the exam asks for.
 *
 * **The key has to match the web app's character for character.** It is
 * `single::<subjectKey>::<hash>`, the hash is that app's own string hash, and
 * `subtopicName` is the first 80 characters — because the rows those keys
 * point at are not empty. The diagram pass wrote a
 * `🎨 High-Yield Visual Exam Diagram` section into 75+ existing
 * `handwritten_notes` rows, so a key that matches returns a note with its
 * picture already in it, instantly and for free. A key that is merely
 * *similar* misses every one of them, regenerates, and spends quota to arrive
 * somewhere worse.
 */
export interface SingleNoteRequest {
  question: string;
  subjectKey: string;
  subjectName: string;
  yearLabel: string;
}

/**
 * The identity of one question's note.
 *
 * Every call about that note — generate, propose an edit, save the result —
 * has to carry the identical body, or the edge function looks at a different
 * cache row than the one on screen. Built in one place for that reason.
 */
function singleNoteBody(request: SingleNoteRequest): Record<string, unknown> {
  const clean = request.question.trim();
  return {
    subtopicKey: `single::${request.subjectKey}::${hashKey(clean)}`,
    year: request.yearLabel,
    /*
     * No fallback subject. This read `|| 'Community Medicine'`, which was
     * harmless while the feature was third-year-only and Community was most of
     * it — an empty subject there guessed right. It is now offered for Anatomy,
     * Physiology, Biochemistry, Pharmacology, Pathology and Microbiology, where
     * the same guess grounds the answer in Park's Community Medicine and
     * returns it with a textbook's confidence. A wrong book is worse than none:
     * the server falls back to general MBBS knowledge when it cannot place the
     * subject, and says nothing false.
     */
    subject: request.subjectName || request.subjectKey,
    subtopicName: clean.slice(0, 80),
    questions: clampQuestions([clean]),
    singleMode: true,
  };
}

async function invokeNotes(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke(
    'generate-handwritten-notes',
    { body },
  );
  if (error) {
    throw await unwrapError(error);
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  return (data ?? {}) as Record<string, unknown>;
}

/** Map a bank subject key or display name onto the name the diagram rows use. */
function normalizeSubject(keyOrName?: string): string | undefined {
  if (!keyOrName) return undefined;
  const s = keyOrName.toLowerCase().replace(/[-_]/g, ' ').trim();
  if (s.includes('anat')) return 'Anatomy';
  if (s.includes('physio')) return 'Physiology';
  if (s.includes('biochem')) return 'Biochemistry';
  if (s.includes('patho')) return 'Pathology';
  if (s.includes('pharm')) return 'Pharmacology';
  if (s.includes('micro')) return 'Microbiology';
  if (s.includes('comm') || s.includes('psm')) return 'Community Medicine';
  if (s.includes('foren') || s.includes('fmt')) return 'Forensic Medicine';
  if (s.includes('ent')) return 'ENT';
  if (s.includes('ophth')) return 'Ophthalmology';
  if (s.includes('surg') || s.includes('ortho')) return 'General Surgery and Orthopaedics';
  if (s.includes('med')) return 'General Medicine';
  if (s.includes('paed') || s.includes('ped')) return 'Paediatrics';
  if (s.includes('obg') || s.includes('gyn') || s.includes('obst')) return 'Obstetrics & Gynaecology';
  return undefined;
}

/**
 * Build an authentic, textbook-grounded Gemini image generation prompt for any MBBS question.
 */
export function buildGeminiPromptForQuestion(
  question: string,
  subject?: string,
): string {
  const cleanQ = question
    .replace(/[0-9]+\./g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[*#★☆]/g, '')
    .trim();

  const subj = normalizeSubject(subject) || 'Medical Science';

  const textbook = `standard MBBS ${subj} curriculum benchmark`;

  return `A professional university exam diagram for the MBBS ${subj} topic: "${cleanQ}".\n\nTextbook Grounding: Based directly on standard schematics from ${textbook}.\nLayout & Style: Crisp 2D medical textbook illustration, anatomical line art with soft watercolor shading, straight horizontal leader lines with clear bold labels, strictly centered on a solid pure white background (#FFFFFF) with high contrast and zero clutter.`;
}

/**
 * The identity of a question, as `question_diagrams.question_id` stores it.
 *
 * `getQuestionId` is the app's own per-question storage key — `question-` plus
 * the first 50 characters with whitespace turned into dashes — and it is the
 * *same string* the diagram pipeline filed every row under. 849 of the 862
 * rows that carry a picture match it character for character, so this is a
 * primary-key join, not a search. It is imported rather than re-implemented
 * because a second copy of that 50 would drift and silently match nothing.
 */
function diagramQuestionId(question: string): string {
  return getQuestionId(question.trim());
}

/**
 * The remaining rows were inserted by hand and carry a paraphrased
 * `question_id` (`anat-types-of-synovial-joints`), so they are reached through
 * their `question_text` instead. Stars are the importance markers the bank
 * appends and the row may or may not have kept them, so they come off both
 * sides before the comparison — which stays an **equality**, never a
 * containment. "Types of synovial joint" and "Types of synovial joint **" are
 * the same question; "Glycolysis …" and "TCA cycle …" are not, and every
 * looser test that has been tried here made them look like they were.
 */
function normalizeQuestionText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[*#★☆•]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const DIAGRAM_URL_MARK = 'supabase.co/storage/v1/object/public/diagrams';

function isDiagramSection(section: Section): boolean {
  return (
    section?.icon === '🎨' ||
    (typeof section?.payload?.text === 'string' &&
      section.payload.text.includes(DIAGRAM_URL_MARK))
  );
}

export interface QuestionDiagram {
  url: string;
  title?: string;
}

/**
 * One question's diagrams, and nobody else's.
 *
 * This used to score candidates by keyword against "exclusive entity
 * families", and the families are the reason a TCA cycle note opened with a
 * Glycolysis diagram, a Gluconeogenesis diagram and then its own: every
 * biochemistry row in the family was a hit, ranked, and all of them were
 * attached as "Diagram (1/3)". Widening or narrowing the word lists only ever
 * moved which questions were wrong — a question whose text merely *mentions*
 * a pathway is not a question about it.
 *
 * `question_diagrams` already answers this exactly. Every row is one question
 * and carries that question's own id, so the number of diagrams a question has
 * is the number of rows it has — usually one, sometimes none, and never a
 * neighbour's. Identity is the whole matcher now; there is no scoring left to
 * tune.
 */
export async function findDiagramsForQuestion(
  question: string,
  subjectKey?: string,
  subjectName?: string,
): Promise<QuestionDiagram[]> {
  const clean = question.trim();
  if (clean.length < 3) {
    return [];
  }

  const out: QuestionDiagram[] = [];
  const seen = new Set<string>();
  const take = (
    rows: Array<{ public_url?: string | null; question_text?: string | null }> | null,
  ) => {
    for (const row of rows ?? []) {
      const url = row.public_url;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, title: row.question_text ?? undefined });
    }
  };

  try {
    /*
     * The identity join. Both halves are equalities on indexed columns, so
     * this is two tiny lookups rather than the whole subject pulled down and
     * filtered in JavaScript, which is what the keyword version did on every
     * note open.
     */
    const [byId, byText] = await Promise.all([
      supabase
        .from('question_diagrams')
        .select('public_url, question_text')
        .eq('question_id', diagramQuestionId(clean))
        .not('public_url', 'is', null),
      supabase
        .from('question_diagrams')
        .select('public_url, question_text')
        .eq('question_text', clean)
        .not('public_url', 'is', null),
    ]);

    take(byId.data);
    take(byText.data);

    if (out.length > 0) {
      return out;
    }

    /*
     * Only if neither exact key hit: the hand-inserted rows, whose stars and
     * the bank's differ. Scoped to the subject because a bare question like
     * "Jaundice" exists in more than one, and still compared for equality
     * after normalisation.
     */
    const canonicalSubject = normalizeSubject(subjectName || subjectKey);
    if (!canonicalSubject) {
      return [];
    }
    const wanted = normalizeQuestionText(clean);
    if (!wanted) {
      return [];
    }

    const { data } = await supabase
      .from('question_diagrams')
      .select('public_url, question_text')
      .not('public_url', 'is', null)
      .ilike('subject', `%${canonicalSubject}%`);

    take(
      (data ?? []).filter(
        row =>
          typeof row.question_text === 'string' &&
          normalizeQuestionText(row.question_text) === wanted,
      ),
    );
  } catch (err) {
    warn('[handwrittenNotes] diagram lookup failed:', err);
  }

  return out;
}

/** A chapter's diagram, and the question inside that chapter it belongs to. */
export interface TopicDiagram extends QuestionDiagram {
  question: string;
}

/**
 * How many ids go into one `in (…)` list.
 *
 * PostgREST puts the filter in the query string, and a question id is about
 * sixty characters, so a chapter with two hundred questions would be a twelve
 * kilobyte URL. Chunking keeps each request ordinary; the chapters that need
 * more than one chunk are the ones with the most pictures to find.
 */
const DIAGRAM_LOOKUP_CHUNK = 80;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Every diagram belonging to any question in a chapter.
 *
 * The Notes tab showed no pictures at all — in any year, for any subject —
 * while triple-tapping a single question showed them, and the reason was that
 * nothing in the chapter path ever asked. `findDiagramsForQuestion` is a
 * question's own lookup and the chapter screen simply never called an
 * equivalent, so a chapter built out of forty questions with thirty pictures
 * between them rendered as text.
 *
 * This is the same join, widened: `question_diagrams` holds one row per
 * question keyed by the app's own `getQuestionId`, so a chapter's diagrams are
 * the rows for its questions' ids. Identity, still — a chapter is a *set* of
 * questions rather than a looser match, and nothing here scores or guesses. A
 * question with no row contributes nothing, and a picture belonging to a
 * question in another chapter can never appear.
 *
 * One request per chunk rather than one per question: a forty-question chapter
 * would otherwise be eighty round trips on a phone, before a single word of
 * the note is drawn.
 */
export async function findDiagramsForTopic(
  questions: string[],
  subjectKey?: string,
  subjectName?: string,
): Promise<TopicDiagram[]> {
  const clean = questions.map(q => q.trim()).filter(q => q.length >= 3);
  if (clean.length === 0) {
    return [];
  }

  /*
   * Both keys map back to the question they came from, so a picture can be
   * captioned with the question it answers. In a chapter that matters more
   * than it does on a single note: twenty unlabelled diagrams in a row are
   * twenty pictures nobody can place.
   */
  const byId = new Map<string, string>();
  const byText = new Map<string, string>();
  for (const question of clean) {
    byId.set(diagramQuestionId(question), question);
    byText.set(question, question);
  }

  const found = new Map<string, TopicDiagram>();
  const order = new Map(clean.map((question, index) => [question, index]));

  try {
    const idChunks = chunk([...byId.keys()], DIAGRAM_LOOKUP_CHUNK);
    const textChunks = chunk([...byText.keys()], DIAGRAM_LOOKUP_CHUNK);

    const results = await Promise.all([
      ...idChunks.map(ids =>
        supabase
          .from('question_diagrams')
          .select('question_id, public_url, question_text')
          .in('question_id', ids)
          .not('public_url', 'is', null),
      ),
      ...textChunks.map(texts =>
        supabase
          .from('question_diagrams')
          .select('question_id, public_url, question_text')
          .in('question_text', texts)
          .not('public_url', 'is', null),
      ),
    ]);

    for (const result of results) {
      for (const row of result.data ?? []) {
        const url = (row as { public_url?: string | null }).public_url;
        if (!url || found.has(url)) {
          continue;
        }
        const rowId = (row as { question_id?: string | null }).question_id ?? '';
        const rowText = (row as { question_text?: string | null }).question_text ?? '';
        const question = byId.get(rowId) ?? byText.get(rowText.trim());
        if (!question) {
          // A row that came back but matches none of this chapter's questions
          // is somebody else's. It cannot normally happen — both filters are
          // equalities on this chapter's own keys — and dropping it is what
          // keeps that true if one ever changes.
          continue;
        }
        found.set(url, { url, question, title: rowText || question });
      }
    }
    /*
     * The hand-inserted rows, reached the same way the single-question path
     * reaches them: their `question_id` is a slug (`anat-types-of-synovial-
     * joints`) and their `question_text` keeps a different number of stars, so
     * neither exact key finds them.
     *
     * One subject-scoped query for the whole chapter, and still an
     * **equality** after normalisation — never a containment. Every looser
     * test tried here is what put Glycolysis at the top of a TCA cycle note.
     */
    const canonicalSubject = normalizeSubject(subjectName || subjectKey);
    if (canonicalSubject) {
      const wanted = new Map<string, string>();
      for (const question of clean) {
        const key = normalizeQuestionText(question);
        if (key) {
          wanted.set(key, question);
        }
      }
      const { data } = await supabase
        .from('question_diagrams')
        .select('question_id, public_url, question_text')
        .not('public_url', 'is', null)
        .ilike('subject', `%${canonicalSubject}%`);

      for (const row of data ?? []) {
        const url = (row as { public_url?: string | null }).public_url;
        const rowText = (row as { question_text?: string | null }).question_text;
        if (!url || found.has(url) || typeof rowText !== 'string') {
          continue;
        }
        const question = wanted.get(normalizeQuestionText(rowText));
        if (question) {
          found.set(url, { url, question, title: rowText });
        }
      }
    }
  } catch (err) {
    warn('[handwrittenNotes] chapter diagram lookup failed:', err);
  }

  // In the chapter's own question order, so the pictures read down the page in
  // the order the material does.
  return [...found.values()].sort(
    (a, b) => (order.get(a.question) ?? 0) - (order.get(b.question) ?? 0),
  );
}

/**
 * A chapter's diagrams, each captioned with the question it answers.
 *
 * Separate from `buildDiagramSections` because the numbering means something
 * different. On one question, "(2/3)" is the second of that question's three
 * pictures. In a chapter it would be the second of the chapter's forty, which
 * says nothing — the question is the useful label, and it is the one thing a
 * chapter's diagrams have that a single note's do not.
 */
export function buildTopicDiagramSections(diagrams: TopicDiagram[]): Section[] {
  return diagrams.map(diag => {
    const cleanTitle = (diag.title || diag.question)
      .replace(/[0-9]+\./g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[*#★☆]/g, '')
      .trim()
      // A chapter's questions are full exam questions and run long; a caption
      // is a label, not the question restated.
      .slice(0, 90);

    return {
      type: 'definition',
      title: 'High-Yield Visual Exam Diagram',
      icon: '🎨',
      // The caption goes in the image's own alt text and nowhere else:
      // `DiagramCard` already prints it under the picture, so repeating it in
      // the body draws the same line twice.
      payload: { text: `![${cleanTitle}](${diag.url})` },
    };
  });
}

/**
 * Put a chapter's diagrams on its note.
 *
 * **Replaces, like the single-question path**, and for the same reason: a
 * chapter note is cached server-side, so a page that was built before its
 * pictures existed has to pick them up on the next open rather than staying
 * blank until somebody regenerates it. Stripping and rebuilding every time is
 * what makes that free.
 *
 * The saved copy stays free of them — `saveMergedNotes` is given the merged
 * text, not this — because the cache is shared with the web app and the
 * diagrams are decided on the client each time it is read.
 */
export function applyTopicDiagrams(
  content: NotesContent,
  diagrams: TopicDiagram[],
): NotesContent {
  const body = (content.sections ?? []).filter(s => !isDiagramSection(s));
  return {
    ...content,
    diagramUrl: diagrams[0]?.url,
    sections: [...buildTopicDiagramSections(diagrams), ...body],
  };
}

/**
 * The diagram sections a note is *allowed* to have, in the order they render.
 *
 * Pure and synchronous so every path that rewrites a note — first open,
 * regenerate, an accepted AI edit — can land on the same answer without asking
 * the network again.
 */
export function buildDiagramSections(
  diagrams: QuestionDiagram[],
  question: string,
): Section[] {
  return diagrams.map((diag, idx) => {
    const cleanTitle = (diag.title || question)
      .replace(/[0-9]+\./g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[*#★☆]/g, '')
      .trim();

    const sectionTitle =
      diagrams.length > 1
        ? `High-Yield Visual Exam Diagram (${idx + 1}/${diagrams.length})`
        : 'High-Yield Visual Exam Diagram';

    return {
      type: 'definition',
      title: sectionTitle,
      icon: '🎨',
      payload: {
        text: `![${cleanTitle}](${diag.url})\n\n💡 High-Yield Continuous Visual Mnemonic (Standard Textbook Grounded)`,
      },
    };
  });
}

/**
 * Replace whatever diagrams a note is carrying with the ones that belong to it.
 *
 * **Replace, not top up.** The old version kept any existing diagram section
 * that mentioned a family keyword and only fetched when there were none, so a
 * note cached with three wrong pictures kept all three for ever — reopening it
 * confirmed them, and Regenerate and "Fix notes with AI" both explicitly
 * pinned them back on top of the new text. Rebuilding from the lookup every
 * time is what makes those three paths self-healing: the wrong picture is gone
 * the next time the note is opened, without anyone clearing a cache.
 *
 * A question with no row gets no diagram section at all, rather than a
 * plausible neighbour.
 */
export function applyQuestionDiagrams(
  content: NotesContent,
  diagrams: QuestionDiagram[],
  question: string,
): NotesContent {
  const body = (content.sections ?? []).filter(s => !isDiagramSection(s));
  const diagramSections = buildDiagramSections(diagrams, question);
  return {
    ...content,
    diagramUrl: diagrams[0]?.url,
    sections: [...diagramSections, ...body],
  };
}

/** True when two notes carry the same diagrams in the same order. */
function sameDiagrams(a: NotesContent, b: NotesContent): boolean {
  const urls = (content: NotesContent) =>
    (content.sections ?? [])
      .filter(isDiagramSection)
      .map(s => (typeof s.payload?.text === 'string' ? s.payload.text : ''))
      .join('|');
  return urls(a) === urls(b) && (a.diagramUrl ?? '') === (b.diagramUrl ?? '');
}

/**
 * Give one question's note exactly its own diagrams.
 *
 * Called on every open, every regenerate and every accepted AI edit, so the
 * lookup is memoised for the life of the process — the answer is a database
 * identity and cannot change between two taps.
 */
const diagramCache = new Map<string, Promise<QuestionDiagram[]>>();

export function resolveQuestionDiagrams(
  request: SingleNoteRequest,
): Promise<QuestionDiagram[]> {
  const key = `${request.subjectKey}::${request.question.trim()}`;
  let pending = diagramCache.get(key);
  if (!pending) {
    pending = findDiagramsForQuestion(
      request.question,
      request.subjectKey,
      request.subjectName,
    ).catch(() => []);
    diagramCache.set(key, pending);
  }
  return pending;
}

export async function ensureSingleNoteDiagram(
  content: NotesContent,
  request: SingleNoteRequest,
): Promise<NotesContent> {
  const diagrams = await resolveQuestionDiagrams(request);
  const next = applyQuestionDiagrams(content, diagrams, request.question);

  /*
   * Write the corrected note back only when the diagrams actually moved.
   * An unconditional upsert would rewrite `updated_at` on every open of every
   * note, which turns a read into a write for the whole question bank.
   */
  if (!sameDiagrams(content, next)) {
    try {
      const clean = request.question.trim();
      await supabase.from('handwritten_notes').upsert({
        subtopic_key: `single::${request.subjectKey}::${hashKey(clean)}`,
        year: request.yearLabel,
        subject: request.subjectName || request.subjectKey || 'Medical Science',
        subtopic_name: clean.slice(0, 80),
        content: next,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // The reader has the right picture on screen; failing to cache it is not
      // worth an error in their face.
    }
  }

  return next;
}

export async function fetchSingleQuestionNote(
  request: SingleNoteRequest,
  regenerate = false,
): Promise<NotesContent> {
  const data = await invokeNotes({ ...singleNoteBody(request), regenerate });
  const content = data.content as NotesContent | undefined;
  if (!content) {
    throw new Error('The note came back empty. Tap to try again.');
  }
  return ensureSingleNoteDiagram(content, request);
}

export interface NoteProposal {
  /** Where the answer came from, which is the thing worth knowing before saying yes. */
  source: 'textbook' | 'knowledge' | 'web';
  found: boolean;
  summary: string[];
  content: NotesContent;
}

/**
 * Ask for a change without making it.
 *
 * `proposeOnly` is the whole point: the function looks the request up in the
 * reference textbook, drafts the change, and returns it *without writing
 * anything*. Nothing is saved until the reader says yes, so a wrong answer
 * costs a tap rather than the notes they were revising from.
 *
 * `useWeb` is the second try, offered only after a rejection — the textbook is
 * the source that should win, and reaching past it by default would quietly
 * turn a grounded note into a search result.
 */
export async function proposeNoteEdit(
  request: SingleNoteRequest,
  content: NotesContent,
  editInstruction: string,
  useWeb = false,
): Promise<NoteProposal> {
  const data = await invokeNotes({
    ...singleNoteBody(request),
    content,
    editInstruction,
    proposeOnly: true,
    useWeb,
  });
  const proposed = data.content as NotesContent | undefined;
  if (!proposed?.sections) {
    throw new Error('The answer came back in a shape the app could not read.');
  }
  const source = data.source;
  return {
    source: source === 'textbook' || source === 'web' ? source : 'knowledge',
    found: Boolean(data.found),
    summary: Array.isArray(data.summary)
      ? (data.summary as string[]).map(String)
      : [],
    content: proposed,
  };
}

/**
 * Fold a proposal into the notes instead of overwriting them.
 *
 * Gemini answers the question it was asked, which means it returns only the
 * sections it touched. Treating that as the new note wipes every section it
 * did not mention — the reader asks for one correction and loses the other
 * nine. Same-titled sections are replaced, new ones appended, everything else
 * left alone.
 */
export function mergeProposal(
  previous: NotesContent | null,
  next: NotesContent,
): NotesContent {
  if (!previous) {
    return next;
  }
  const keyOf = (section: Section) =>
    String(section?.title ?? '')
      .toLowerCase()
      .trim();

  /*
   * Diagrams are carried across so a text edit does not drop the picture, but
   * they are *not* the last word on which pictures the note gets:
   * `ensureSingleNoteDiagram` runs over the merged result and replaces them
   * with the question's own. Pinning them here was how a wrong diagram
   * survived every regenerate and every AI edit.
   */
  const prevDiagrams = (previous.sections ?? []).filter(isDiagramSection);
  const prevNonDiagrams = (previous.sections ?? []).filter(
    s => !isDiagramSection(s),
  );

  const out = [...prevNonDiagrams];
  const indexByKey = new Map<string, number>();
  out.forEach((section, i) => {
    const key = keyOf(section);
    if (key && !indexByKey.has(key)) {
      indexByKey.set(key, i);
    }
  });

  for (const section of next.sections ?? []) {
    // If next has a diagram section, prefer it, otherwise keep previous
    if (section.icon === '🎨') continue;

    const key = keyOf(section);
    const at = key ? indexByKey.get(key) : undefined;
    if (at === undefined) {
      out.push(section);
      if (key) {
        indexByKey.set(key, out.length - 1);
      }
    } else {
      out[at] = section;
    }
  }

  // Diagrams always sit at the top of the note.
  const nextDiagrams = (next.sections ?? []).filter(isDiagramSection);
  const finalDiagrams = nextDiagrams.length > 0 ? nextDiagrams : prevDiagrams;

  return {
    ...previous,
    diagramUrl: next.diagramUrl || previous.diagramUrl,
    highYieldTip: next.highYieldTip || previous.highYieldTip,
    pyqYears: Array.from(
      new Set([...(previous.pyqYears ?? []), ...(next.pyqYears ?? [])]),
    ),
    sections: [...finalDiagrams, ...out],
  };
}

/** Persist an accepted edit so the next open reads it back. Best-effort. */
export async function saveSingleNote(
  request: SingleNoteRequest,
  content: NotesContent,
): Promise<void> {
  try {
    await invokeNotes({
      ...singleNoteBody(request),
      saveContent: true,
      content,
    });
  } catch {
    // The reader already has the change on screen; failing to cache it is not
    // worth an error in their face.
  }
}

/**
 * A stable short key for one question.
 *
 * Same algorithm as the web app's overlay (`SingleQuestionNoteOverlay.tsx`),
 * so a question noted in the browser and the same question noted on the phone
 * land on one cached row rather than generating twice. Left shift by 5 minus
 * itself, forced back to int32 each step — change any of that and the two
 * apps stop sharing a cache silently.
 */
function hashKey(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
