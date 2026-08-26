/**
 * Anki's scheduler, as Anki actually implements it.
 *
 * Ported from ankitects/anki `rslib/src/scheduler/states/` and the default deck
 * config in `rslib/src/deckconfig/`. This is deliberately **not**
 * `spacedRepetition.ts`: that one mirrors the server's `review_question` SQL,
 * which is plain SM-2 with no sub-day scheduling. Anki is a different machine —
 * a card walks learning steps in *minutes* before it ever earns a day-scale
 * interval, and a lapse sends it back through relearning rather than just
 * shrinking the gap. Merging the two would break both.
 *
 * The numbers below are Anki's defaults, not invented ones. Changing any of
 * them changes what a review means, so change them together with the comment.
 */

/** The four answer buttons. Anki's order, and the order they must be drawn in. */
export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy'];

/**
 * Where a card is in its life.
 *
 * `relearning` is separate from `learning` on purpose: a lapsed card walks a
 * shorter set of steps and keeps the interval it had, which is what stops a
 * mature card that was missed once from starting again from nothing.
 */
export type CardType = 'new' | 'learning' | 'review' | 'relearning';

export interface Card {
  /** Stable id. For us: the question's storage id, so a card and its question agree. */
  id: string;
  type: CardType;
  /** Steps left in the current learning/relearning ladder. Meaningless in review. */
  remainingSteps: number;
  /** Days between reviews. Only meaningful once the card is in review. */
  interval: number;
  /** Anki stores this permille (2500). Kept as 2.5 here; the maths is the same. */
  ease: number;
  reps: number;
  lapses: number;
  /** Epoch ms. Sub-day while learning, midnight-aligned once in review. */
  due: number;
}

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/** Anki's defaults, from DEFAULT_DECK_CONFIG_INNER. */
export const LEARN_STEPS_MIN = [1, 10];
export const RELEARN_STEPS_MIN = [10];
export const GRADUATING_INTERVAL_GOOD = 1;
export const GRADUATING_INTERVAL_EASY = 4;
export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const HARD_MULTIPLIER = 1.2;
export const EASY_MULTIPLIER = 1.3;
export const LAPSE_MULTIPLIER = 0;
/** Eight lapses and Anki calls a card a leech. We surface it rather than suspend. */
export const LEECH_THRESHOLD = 8;
export const NEW_PER_DAY = 20;
export const REVIEWS_PER_DAY = 200;
/**
 * A hundred years, which is Anki's `maximum_review_interval`.
 *
 * It exists because the multipliers compound: a card answered Easy a dozen
 * times runs past any horizon a medical student has, and "next due in 4.2
 * years" is not a schedule, it is a card that has left the deck without
 * saying so.
 */
export const MAX_INTERVAL = 36_500;
/** `minimum_lapse_interval`: a lapsed card is never scheduled at zero days. */
export const MIN_LAPSE_INTERVAL = 1;

/** Midnight local. Review intervals are days, so due-ness is a day, not a moment. */
export function startOfDay(at: number): number {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function newCard(id: string, now = Date.now()): Card {
  return {
    id,
    type: 'new',
    remainingSteps: LEARN_STEPS_MIN.length,
    interval: 0,
    ease: START_EASE,
    reps: 0,
    lapses: 0,
    due: now,
  };
}

/** A card that has lapsed this many times is a leech — the question needs rewriting. */
export function isLeech(card: Card): boolean {
  return card.lapses >= LEECH_THRESHOLD;
}

function clampEase(ease: number): number {
  return Math.max(MIN_EASE, ease);
}

/**
 * The delay Hard gives inside the learning ladder.
 *
 * Anki averages the current step with the next one, and repeats the same delay
 * when there is no next step. A flat "repeat the step" would make Hard and
 * Again indistinguishable on a two-step ladder.
 */
function hardLearnDelayMin(steps: number[], index: number): number {
  const current = steps[index] ?? steps[steps.length - 1] ?? 1;
  const next = steps[index + 1];
  return next === undefined ? current : (current + next) / 2;
}

/** Which rung of the ladder `remainingSteps` refers to. */
function stepIndex(steps: number[], remaining: number): number {
  return Math.max(0, steps.length - Math.max(1, remaining));
}

function graduate(card: Card, days: number, now: number): Card {
  const capped = Math.min(days, MAX_INTERVAL);
  return {
    ...card,
    type: 'review',
    remainingSteps: 0,
    interval: capped,
    due: startOfDay(now) + capped * DAY,
  };
}

/**
 * Answer a card.
 *
 * Pure: it takes a card and returns the next one, so the same function drives
 * the button previews ("2m", "10m", "4d") and the actual commit. Anki shows
 * those on the buttons and it is the single most useful thing about its UI —
 * you can see what a choice costs before making it.
 */
export function answer(card: Card, grade: Grade, now = Date.now()): Card {
  const next: Card = { ...card, reps: card.reps + 1 };

  if (card.type === 'new' || card.type === 'learning') {
    const steps = LEARN_STEPS_MIN;
    if (grade === 'again') {
      // All the way back to the first step, not one rung down.
      return {
        ...next,
        type: 'learning',
        remainingSteps: steps.length,
        due: now + steps[0] * MINUTE,
      };
    }
    if (grade === 'easy') {
      return graduate(next, GRADUATING_INTERVAL_EASY, now);
    }
    const remaining = card.type === 'new' ? steps.length : card.remainingSteps;
    const index = stepIndex(steps, remaining);
    if (grade === 'hard') {
      return {
        ...next,
        type: 'learning',
        remainingSteps: remaining,
        due: now + hardLearnDelayMin(steps, index) * MINUTE,
      };
    }
    // Good: down a rung, or out of the ladder entirely.
    if (remaining <= 1) {
      return graduate(next, GRADUATING_INTERVAL_GOOD, now);
    }
    return {
      ...next,
      type: 'learning',
      remainingSteps: remaining - 1,
      due: now + steps[index + 1] * MINUTE,
    };
  }

  if (card.type === 'relearning') {
    const steps = RELEARN_STEPS_MIN;
    if (grade === 'again') {
      return {
        ...next,
        remainingSteps: steps.length,
        due: now + steps[0] * MINUTE,
      };
    }
    if (grade === 'hard') {
      return { ...next, due: now + hardLearnDelayMin(steps, 0) * MINUTE };
    }
    // Good and Easy both return it to review. The interval was already cut by
    // the lapse; relearning is about getting it back, not re-earning it.
    const days = Math.max(1, card.interval);
    return graduate(next, grade === 'easy' ? days + 1 : days, now);
  }

  // Review.
  if (grade === 'again') {
    const lapsed = Math.max(MIN_LAPSE_INTERVAL, Math.floor(card.interval * LAPSE_MULTIPLIER));
    return {
      ...next,
      type: 'relearning',
      lapses: card.lapses + 1,
      ease: clampEase(card.ease - 0.2),
      remainingSteps: RELEARN_STEPS_MIN.length,
      interval: lapsed,
      due: now + RELEARN_STEPS_MIN[0] * MINUTE,
    };
  }

  const interval = card.interval || 1;
  if (grade === 'hard') {
    const days = Math.max(interval + 1, Math.round(interval * HARD_MULTIPLIER));
    return { ...graduate(next, days, now), ease: clampEase(card.ease - 0.15) };
  }
  if (grade === 'good') {
    const days = Math.max(interval + 1, Math.round(interval * card.ease));
    return graduate(next, days, now);
  }
  const days = Math.max(interval + 2, Math.round(interval * card.ease * EASY_MULTIPLIER));
  return { ...graduate(next, days, now), ease: card.ease + 0.15 };
}

/**
 * What each button would cost, for the row of previews under the answer.
 *
 * Minutes below an hour, then hours, then days — Anki's own rounding, which
 * exists because "0.007 days" is not an answer anyone can use.
 */
export function intervalLabel(card: Card, grade: Grade, now = Date.now()): string {
  const after = answer(card, grade, now);
  /*
   * A day-scale card is labelled by its **interval**, not by the wall clock.
   *
   * Review due dates are midnight-aligned, so `due - now` is short by however
   * much of today has already gone: answering Easy at 3pm scheduled the card 4
   * days out and the button read "3d". Anki shows the interval it just gave
   * you, and it is the number that means something — "4d" is the schedule,
   * "3d and 9 hours" is an accident of when you happened to press.
   */
  if (after.type === 'review') {
    return dayLabel(after.interval);
  }
  const ms = Math.max(0, after.due - now);
  if (ms < 60 * MINUTE) {
    return `${Math.max(1, Math.round(ms / MINUTE))}m`;
  }
  if (ms < DAY) {
    return `${Math.round(ms / (60 * MINUTE))}h`;
  }
  return dayLabel(Math.round(ms / DAY));
}

/** Days, months or years — Anki's own rounding. "0.007 days" is not an answer. */
function dayLabel(days: number): string {
  if (days < 30) {
    return `${days}d`;
  }
  if (days < 365) {
    return `${(days / 30).toFixed(days < 60 ? 1 : 0)}mo`;
  }
  return `${(days / 365).toFixed(1)}y`;
}

/**
 * The queue, in Anki's order: learning first (they are minutes overdue and the
 * whole point is the short loop), then review, then new.
 *
 * Capped the way Anki caps: a day's study is bounded so a huge deck does not
 * present itself as an impossible wall.
 */
export function dueQueue(cards: Card[], now = Date.now()): Card[] {
  const learning = cards
    .filter(c => (c.type === 'learning' || c.type === 'relearning') && c.due <= now)
    .sort((a, b) => a.due - b.due);
  const review = cards
    .filter(c => c.type === 'review' && c.due <= startOfDay(now) + DAY - 1)
    .sort((a, b) => a.due - b.due)
    .slice(0, REVIEWS_PER_DAY);
  const fresh = cards.filter(c => c.type === 'new').slice(0, NEW_PER_DAY);
  return [...learning, ...review, ...fresh];
}

/** The three counts Anki puts at the bottom of a deck. */
export function counts(cards: Card[], now = Date.now()) {
  const queue = dueQueue(cards, now);
  return {
    learning: queue.filter(c => c.type === 'learning' || c.type === 'relearning').length,
    review: queue.filter(c => c.type === 'review').length,
    fresh: queue.filter(c => c.type === 'new').length,
  };
}
