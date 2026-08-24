import { supabase } from './supabase';
import { collectQuestions, type BankNode } from './questionBank';
import { clampQuestions } from './notesLimits';

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
    subject: request.subjectName || request.subjectKey || 'Community Medicine',
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

const DIAGRAM_STOP_WORDS = new Set([
  'define', 'describe', 'explain', 'discuss', 'enumerate', 'classify', 'write',
  'short', 'note', 'notes', 'briefly', 'detail', 'types', 'various', 'causes',
  'features', 'clinical', 'management', 'treatment', 'prevention', 'control',
  'diagnosis', 'laboratory', 'importance', 'difference', 'differentiate',
  'compare', 'versus', 'medical', 'patient', 'person', 'child', 'female',
  'male', 'years', 'months', 'rules', 'rule', 'case', 'cases', 'study',
  'outline', 'aspects', 'factors', 'principles', 'methods', 'criteria',
  'guidelines', 'algorithm', 'signs', 'symptoms', 'procedure', 'investigations',
  'role', 'what', 'which', 'about', 'with', 'from', 'between', 'under',
  'their', 'does', 'have', 'been', 'give', 'name', 'list', 'state', 'applied',
  'life', 'cycle', 'diagram', 'draw', 'drawn', 'neat', 'labelled', 'question',
  'examination', 'appearance', 'effects', 'program', 'programme', 'scheme',
  'strategy', 'national', 'india', 'indian', 'level', 'levels', 'status',
  'health', 'community', 'public', 'primary', 'secondary', 'tertiary',
  'following', 'based', 'first', 'second', 'third', 'final', 'paper', 'topic',
  'practice', 'body', 'changes', 'death', 'living', 'post', 'mortem',
  'antemortem', 'postmortem', 'wounds', 'wound', 'injury', 'injuries',
  'poisons', 'poison', 'poisoning', 'acute', 'chronic', 'general', 'special',
  'system', 'systemic', 'organs', 'organ', 'human', 'structure', 'structures',
  'functions', 'function', 'parts', 'part', 'suitable', 'examples', 'available',
  'protection', 'act', 'acts', 'proof', 'therapeutic'
]);

/**
 * Look up a diagram from `question_diagrams` for a single question or topic query.
 */
export async function findDiagramForQuery(
  query: string,
): Promise<{ url: string; title?: string } | null> {
  const clean = query
    .replace(/[0-9]+\./g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[*#★☆]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length < 4) {
    return null;
  }

  const words = clean
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !DIAGRAM_STOP_WORDS.has(w));
  if (words.length === 0) {
    return null;
  }

  try {
    const { data } = await supabase
      .from('question_diagrams')
      .select('public_url, question_text')
      .not('public_url', 'is', null);

    if (!data || data.length === 0) {
      return null;
    }

    let bestMatch: { public_url: string; question_text: string } | null = null;
    let maxScore = 0;

    for (const row of data) {
      if (!row.public_url || !row.question_text) continue;
      const rowText = row.question_text.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (rowText.includes(w)) {
          score += 1;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = row;
      }
    }

    if (maxScore >= 1 && bestMatch) {
      return { url: bestMatch.public_url, title: bestMatch.question_text };
    }
  } catch (err) {
    console.warn('[handwrittenNotes] diagram lookup failed:', err);
  }
  return null;
}

/**
 * Ensures single-question note content carries its visual exam diagram.
 */
export async function ensureSingleNoteDiagram(
  content: NotesContent,
  request: SingleNoteRequest,
): Promise<NotesContent> {
  const hasStorageDiagram = content.sections?.some(
    s =>
      s.icon === '🎨' ||
      (typeof s.payload?.text === 'string' &&
        s.payload.text.includes('supabase.co/storage/v1/object/public/diagrams')),
  );

  if (hasStorageDiagram) {
    return content;
  }

  const diagram = await findDiagramForQuery(request.question);
  if (!diagram?.url) {
    return content;
  }

  const diagramSection: Section = {
    type: 'definition',
    title: 'High-Yield Visual Exam Diagram',
    icon: '🎨',
    payload: {
      text: `![High-Yield Exam Diagram](${diagram.url})\n\n💡 High-Yield Continuous Visual Mnemonic (Standard Textbook Grounded)`,
    },
  };

  const enriched: NotesContent = {
    ...content,
    diagramUrl: diagram.url,
    sections: [diagramSection, ...content.sections],
  };

  // Best effort save back to Supabase so future requests receive the diagram
  try {
    const clean = request.question.trim();
    await supabase.from('handwritten_notes').upsert({
      subtopic_key: `single::${request.subjectKey}::${hashKey(clean)}`,
      year: request.yearLabel,
      subject: request.subjectName || request.subjectKey || 'Community Medicine',
      subtopic_name: clean.slice(0, 80),
      content: enriched,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }

  return enriched;
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
  const out = [...(previous.sections ?? [])];
  const indexByKey = new Map<string, number>();
  out.forEach((section, i) => {
    const key = keyOf(section);
    if (key && !indexByKey.has(key)) {
      indexByKey.set(key, i);
    }
  });
  for (const section of next.sections ?? []) {
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
  return {
    ...previous,
    highYieldTip: next.highYieldTip || previous.highYieldTip,
    pyqYears: Array.from(
      new Set([...(previous.pyqYears ?? []), ...(next.pyqYears ?? [])]),
    ),
    sections: out,
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
