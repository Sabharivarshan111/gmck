import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SM-2, the SuperMemo 2 scheduler.
 *
 * Revision works because recall is *hard*: a question you can barely answer
 * teaches you more than one you know cold. SM-2 finds that edge by growing the
 * gap between reviews for questions you get right and collapsing it for ones
 * you do not, so the cards you keep forgetting come back tomorrow and the ones
 * you own come back in a month.
 *
 * The algorithm is small enough to state completely:
 *
 *   ease      how generous the growth is, starting at 2.5 and never below 1.3
 *   interval  days until the next review
 *   reps      consecutive successes
 *
 * A grade of 3–5 is a pass, 0–2 a fail. On a fail, reps and interval reset —
 * the question is due again immediately, which is the point. On a pass, the
 * first two intervals are fixed at 1 and 6 days and every one after that is
 * the previous interval times the ease.
 *
 * The floor of 1.3 on ease is what stops a question you keep failing from
 * becoming permanently due — without it the ease decays towards zero and the
 * card jams the queue forever.
 */

export interface ReviewCard {
  /** The raw question text, which is also its identity across the app. */
  question: string;
  subject: string;
  /** Days between the last review and the next. */
  interval: number;
  ease: number;
  reps: number;
  /** Epoch ms of the next due date, midnight-aligned. */
  due: number;
}

const KEY = 'orbit:spaced-repetition-v1';

/** Below this the scheduler stops separating hard cards from impossible ones. */
const MIN_EASE = 1.3;
const START_EASE = 2.5;

/** A pass. Below it, the card resets. */
export const PASS_GRADE = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Midnight local time.
 *
 * Due dates are days, not moments. Storing the exact timestamp means a card
 * reviewed at 11pm is not due until 11pm tomorrow, so a student revising in
 * the morning sees an empty queue and concludes it is broken.
 */
function startOfDay(at: number): number {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** A brand new card, due today. */
export function newCard(question: string, subject: string, now = Date.now()): ReviewCard {
  return {
    question,
    subject,
    interval: 0,
    ease: START_EASE,
    reps: 0,
    due: startOfDay(now),
  };
}

/**
 * Apply a grade and return the card's next state.
 *
 * Pure, so the whole schedule can be tested without storage or a clock —
 * `npm run check:spaced` walks years of reviews through this.
 */
export function grade(card: ReviewCard, quality: number, now = Date.now()): ReviewCard {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  if (q < PASS_GRADE) {
    // Failed. Back to the start of the ladder and due again today — the ease
    // is still penalised, so a card failed repeatedly grows slower next time.
    return {
      ...card,
      reps: 0,
      interval: 0,
      ease: Math.max(MIN_EASE, card.ease - 0.2),
      due: startOfDay(now),
    };
  }

  const reps = card.reps + 1;
  // The first two steps are fixed. SM-2 does not trust a single success to
  // predict anything, so the ease only starts compounding from the third.
  const interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(card.interval * card.ease);

  // The classic SM-2 ease update: a 5 nudges it up, a 4 leaves it, a 3 pulls
  // it down. Rewriting this "more simply" is how the curve stops working.
  const ease = Math.max(
    MIN_EASE,
    card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  return {
    ...card,
    reps,
    interval,
    ease,
    due: startOfDay(now) + interval * DAY_MS,
  };
}

/** Everything due today or earlier, hardest first. */
export function dueCards(cards: ReviewCard[], now = Date.now()): ReviewCard[] {
  const today = startOfDay(now);
  return cards
    .filter(card => card.due <= today)
    // Lowest ease first: the cards you find hardest are the ones worth the
    // attention you have, and a queue you abandon halfway should have spent it
    // on those rather than on the ones you already know.
    .sort((a, b) => a.ease - b.ease || a.due - b.due);
}

export async function loadCards(): Promise<ReviewCard[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (card): card is ReviewCard =>
        card &&
        typeof card.question === 'string' &&
        typeof card.due === 'number' &&
        typeof card.ease === 'number',
    );
  } catch {
    return [];
  }
}

export async function saveCards(cards: ReviewCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(cards));
  } catch {
    // A schedule that fails to save is a schedule that starts again tomorrow,
    // which is worth strictly more than crashing the screen it lives on.
  }
}
