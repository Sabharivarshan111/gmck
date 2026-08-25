import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The revision schedule, matching `review_question` in Postgres exactly.
 *
 * **This is not textbook SM-2, and it must not be.** The web app grades on the
 * server: `review_question(_question_id, _grade)` owns the maths, the
 * `revision_schedule` table owns the state, and `record_question_done` enrols a
 * question the moment it is ticked. A phone that ran its own SM-2 would give
 * the same user two different schedules for the same question — the one thing
 * the shared storage keys exist to prevent.
 *
 * So the rules below are transcribed from
 * `supabase/migrations/20260627023056_*.sql`, and `npm run check:spaced` reads
 * that SQL and fails if the two drift:
 *
 *   again   interval := 1                              ease -= 0.20, floor 1.3
 *   hard    interval := max(ceil(i × 1.2), i + 1)       ease -= 0.15, floor 1.3
 *   good    interval := max(ceil(i × ease), i + 1)      ease unchanged
 *   easy    interval := max(ceil(i × ease × 1.3), i+2)  ease += 0.15
 *
 * The `max(…, i + 1)` is what stops a card with a low ease from standing still:
 * ceil(1 × 1.2) is 2, but ceil(3 × 1.2) is 4 while ceil(3 × 1.0) would be 3 —
 * an interval that never grows is a card that is due forever.
 *
 * This copy is used offline and before sign-in. When there is a session the
 * RPC is authoritative and this only mirrors what it returns.
 */

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy'];

export interface ReviewCard {
  /** The question's storage id — the same one progress and the RPC use. */
  questionId: string;
  /** Raw question text, for display. Not part of the server row. */
  question: string;
  subject: string;
  interval: number;
  ease: number;
  /** Epoch ms, midnight local, of the next review. */
  due: number;
}

const KEY = 'orbit:spaced-repetition-v1';

/** The server's floor. Below it a failed card stops growing and jams the queue. */
const MIN_EASE = 1.3;
const START_EASE = 2.5;
const START_INTERVAL = 1;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Midnight local time.
 *
 * The server stores `due_date` as a DATE, so due-ness is a day and not a
 * moment. Keeping a timestamp here instead would make a card reviewed at 11pm
 * undue until 11pm tomorrow — the queue looks empty all morning, which reads
 * as broken.
 */
export function startOfDay(at: number): number {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * A newly enrolled card.
 *
 * Due **tomorrow**, not today: `record_question_done` inserts
 * `due_date = app_today() + 1`. Enrolling a question as due the moment it is
 * ticked would put it in the queue in the same session it was learned, which
 * is neither what the server does nor what spacing means.
 */
export function newCard(
  questionId: string,
  question: string,
  subject: string,
  now = Date.now(),
): ReviewCard {
  return {
    questionId,
    question,
    subject,
    interval: START_INTERVAL,
    ease: START_EASE,
    due: startOfDay(now) + DAY_MS,
  };
}

/** What one grade does to a card. Pure, and identical to the SQL. */
export function grade(card: ReviewCard, quality: Grade, now = Date.now()): ReviewCard {
  let interval = card.interval;
  let ease = card.ease;

  if (quality === 'again') {
    interval = 1;
    ease = Math.max(ease - 0.2, MIN_EASE);
  } else if (quality === 'hard') {
    interval = Math.max(Math.ceil(interval * 1.2), interval + 1);
    ease = Math.max(ease - 0.15, MIN_EASE);
  } else if (quality === 'good') {
    interval = Math.max(Math.ceil(interval * ease), interval + 1);
  } else {
    interval = Math.max(Math.ceil(interval * ease * 1.3), interval + 2);
    ease = ease + 0.15;
  }

  return {
    ...card,
    interval,
    ease,
    due: startOfDay(now) + interval * DAY_MS,
  };
}

/** Everything due today or earlier, soonest-due first, as the web app orders it. */
export function dueCards(cards: ReviewCard[], now = Date.now()): ReviewCard[] {
  const today = startOfDay(now);
  return cards.filter(card => card.due <= today).sort((a, b) => a.due - b.due);
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
        typeof card.questionId === 'string' &&
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
    // A schedule that fails to save starts again tomorrow, which is worth
    // strictly more than crashing the screen it lives on.
  }
}
