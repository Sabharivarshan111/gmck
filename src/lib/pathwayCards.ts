/**
 * Pathway flashcards — the shape, and the reading of it. One implementation,
 * both apps.
 *
 * This file lives in the web app's `src/lib` because that is where the shared
 * tree already is: the native app reaches it through `@shared/*`, the same
 * route `profanity.ts` and `questionDiagrams.ts` take. There is no second copy
 * and there must never be one — `npm run check:pathway-cards` fails if either
 * app grows its own reader for this shape.
 *
 * ## Why a first-year card needs more than a picture
 *
 * A biochemistry chapter's real exam questions are *"Glycolysis — definition,
 * sequence of reaction, energetics, regulation"*, *"Urea cycle — regulations,
 * significance, disorder"*. What is being examined is an ordered chain: which
 * step, which enzyme, where the ATP goes, which block causes which disease. A
 * card whose whole answer is a JPEG teaches none of that on a phone held at
 * arm's length, and a card whose whole answer is a paragraph of prose is
 * something nobody reads at 1am.
 *
 * So a pathway card answers with **the plate and the chain**: the diagram the
 * question already owns, and beneath it the four to eight steps that the
 * diagram draws, each a label and a short detail. The steps are what make the
 * card legible when the plate is a thumbnail — and they are what is left when
 * the plate does not load at all, which is the whole reason they are data on
 * the card rather than pixels inside the picture.
 *
 * ## The shape is the notes function's, deliberately
 *
 * `generate-handwritten-notes` already emits flowchart nodes as
 * `{ label, detail }`, and `NotesContentView`'s `case 'flowchart'` already
 * draws them. Reusing that vocabulary means one mental model across notes and
 * flashcards, and it means the model is being asked for a shape it already
 * produces well.
 *
 * ## Never stringify an item
 *
 * The notes renderer shipped with `String(item)` in it, which prints an object
 * as the literal text `[object Object]` — unreadable on a phone, perfect in a
 * demo whose fixture happened to use plain strings. The model returns objects
 * *usually* and bare strings *sometimes*, so any reader of model output has to
 * handle both by name and never by coercion. `normalizePathway` is the only
 * thing in either app that reads this shape, for exactly that reason.
 */

/** One rung of a pathway: what happens, and the thing worth remembering about it. */
export interface PathwayStep {
  /** The step itself — "Glucose → Glucose-6-phosphate". */
  label: string;
  /** The examinable detail — the enzyme, the cost, the block. Optional. */
  detail?: string;
}

/** An ordered chain drawn on the answer side of a card. */
export interface CardPathway {
  /** A heading for the chain. Optional; the card's own back text usually says it. */
  title?: string;
  steps: PathwayStep[];
  /** One line under the chain — the clinical hook, the rate-limiting step. */
  caption?: string;
}

/**
 * A card that needs more than eight steps is two cards.
 *
 * This is the minimum-information principle the deck already follows applied to
 * a chain: glycolysis has ten enzymatic steps and a card listing all ten is a
 * page, not a flashcard. The examinable spine — the three irreversible steps,
 * where ATP is spent and made — fits in eight. The cap is enforced when the
 * payload is read rather than trusted from the model, because the model will
 * cheerfully return twenty.
 */
export const MAX_PATHWAY_STEPS = 8;

/** Below this a "chain" is just a sentence, and the arrows are decoration. */
export const MIN_PATHWAY_STEPS = 2;

/**
 * What kind of thinking a card asks for.
 *
 * The owner's brief was for decks shaped like the real papers: not only
 * "define X" but *"Emulsification is a prerequisite in lipid digestion —
 * why?"* and *"a 52-year-old with cholesterol 465 — mechanism of atorvastatin"*.
 * Those are different acts of recall and the reader benefits from knowing which
 * one is being asked before they start, the way an exam paper's section heading
 * tells them.
 *
 * It is a field on the card rather than something derived from the text,
 * because deriving it would be a keyword rule over model output and would be
 * wrong on exactly the cards that matter. A card with no mode shows no chip,
 * which is what every deck built before this looks like.
 */
export type CardMode = 'recall' | 'reasoning' | 'applied' | 'pathway';

export const CARD_MODES: readonly CardMode[] = ['recall', 'reasoning', 'applied', 'pathway'];

/**
 * The chip's text.
 *
 * Short because it sits above the question and must not compete with it.
 * "WHY" rather than "REASONING" because that is the word the question itself
 * ends with, and the reader recognises the task from it instantly.
 */
export const CARD_MODE_LABEL: Record<CardMode, string> = {
  recall: 'RECALL',
  reasoning: 'WHY',
  applied: 'CLINICAL',
  pathway: 'PATHWAY',
};

function readString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

/**
 * A named field off a model-returned item — by name, never by coercion.
 *
 * The same `field()` discipline `NotesContentView` uses, and for the same
 * reason: an item may legitimately be a bare string, and an object must never
 * be turned into one.
 */
function field(item: unknown, ...names: string[]): string {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    for (const name of names) {
      const found = readString((item as Record<string, unknown>)[name]);
      if (found) return found;
    }
  }
  return '';
}

/** `'reasoning'` if the model said so, and nothing at all if it said something else. */
export function normalizeCardMode(value: unknown): CardMode | undefined {
  const raw = readString(value).toLowerCase();
  return (CARD_MODES as readonly string[]).includes(raw) ? (raw as CardMode) : undefined;
}

/**
 * Read a pathway payload off a card, or decide it does not have one.
 *
 * Returns `null` rather than an empty chain whenever the payload cannot carry a
 * card: fewer than two steps, or steps that are all blank. A one-rung
 * "pathway" drawn with an arrow pointing at nothing looks like a rendering bug,
 * and the card still has its written back to fall through to.
 */
export function normalizePathway(value: unknown): CardPathway | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const rawSteps = Array.isArray(source.steps)
    ? source.steps
    : Array.isArray(source.items)
      ? source.items
      : null;
  if (!rawSteps) return null;

  const steps: PathwayStep[] = [];
  for (const item of rawSteps) {
    const label = field(item, 'label', 'title', 'step', 'name');
    if (!label) continue;
    const detail = field(item, 'detail', 'description', 'note', 'enzyme');
    steps.push(detail && detail !== label ? { label, detail } : { label });
    if (steps.length >= MAX_PATHWAY_STEPS) break;
  }
  if (steps.length < MIN_PATHWAY_STEPS) return null;

  const title = field(source, 'title', 'heading');
  const caption = field(source, 'caption', 'takeaway', 'note');
  return {
    steps,
    ...(title ? { title } : null),
    ...(caption ? { caption } : null),
  };
}

/**
 * One spoken sentence per rung.
 *
 * TalkBack reads a row, not a layout: a node whose label and detail are two
 * separate focusable texts is announced as two fragments with no ordinal, and
 * the reader cannot tell where in the chain they are. Both renderers use this,
 * which is the point of it living here.
 */
export function pathwayStepLabel(step: PathwayStep, index: number, total: number): string {
  const head = `Step ${index + 1} of ${total}. ${step.label}`;
  return step.detail ? `${head}. ${step.detail}` : head;
}

/**
 * Whether a card should draw its chain.
 *
 * A pathway is only ever *additional* to the card's ordinary answer — the back
 * text still has to stand on its own, because a deck built before this field
 * existed has no chain and must look finished rather than broken.
 */
export function hasPathway(card: { pathway?: unknown } | null | undefined): boolean {
  return normalizePathway(card?.pathway) !== null;
}
