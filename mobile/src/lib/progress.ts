import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { warn } from '@/lib/log';

/**
 * Completion state for individual questions.
 *
 * The web app reads localStorage synchronously inside render. AsyncStorage is
 * async, so the whole set is hydrated once at launch into an in-memory Set and
 * components subscribe to it via useSyncExternalStore. Writes update memory
 * first (instant UI), then persist and sync to Supabase in the background.
 *
 * Storage keys are identical to the web app's, so a signed-in user sees the
 * same progress on both.
 */

const KEY_PREFIX = 'question-';

/**
 * Un-ticks whose `record_question_undone` has not been confirmed by the server.
 *
 * `pullProgressFromCloud` merges and never deletes, which is right — a tick
 * made on another device has to reach this one. But it also means a row the
 * reader un-ticked HERE comes straight back if the RPC that was meant to
 * delete it did not land: offline, no session yet, or a profile with no year,
 * all of which the RPC family returns from silently.
 *
 * The resurrection then arrives as a rise in the count, and `XpToast` reads a
 * rise as a tick — so un-ticking a question announced "+1 XP" a moment later,
 * for undoing something. That is what the app's owner reported.
 *
 * An id is parked here at the un-tick and released the moment the server
 * confirms the delete. So the tombstone exists exactly while it is needed: if
 * the RPC succeeded there is no cloud row left to resurrect anyway, and if it
 * failed this is what holds the un-tick until a later reconcile retries it. It
 * is persisted because the failure that needs it most is an app that was
 * killed before the retry.
 */
const PENDING_UNDO_KEY = 'orbit:pending-undo';
let pendingUndo = new Set<string>();

function persistPendingUndo(): void {
  AsyncStorage.setItem(PENDING_UNDO_KEY, JSON.stringify(Array.from(pendingUndo))).catch(error =>
    warn('pending-undo persist failed:', error),
  );
}

let doneIds = new Set<string>();
let hydrated = false;
let version = 0;

const listeners = new Set<() => void>();

/**
 * Per-question listeners, keyed by question id.
 *
 * There are two kinds of subscriber and they want very different things:
 *
 *   • Counts ("142 of 405 done") care about *any* change, so they use the
 *     global `version` below.
 *   • A question row cares only about its own question.
 *
 * Rows used the global version too, which meant ticking one checkbox
 * re-rendered every row mounted in the list — a dozen or so with the current
 * virtualization window, each re-running its star/page-number parsing. On a
 * cheap phone that is the lag between the tap and the tick appearing.
 *
 * Keeping a listener set per id means a tick re-renders exactly one row.
 */
const questionListeners = new Map<string, Set<() => void>>();

function emit() {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

/** Notify one question's rows. For single-question changes. */
function emitQuestion(id: string) {
  const set = questionListeners.get(id);
  if (set) {
    for (const listener of set) {
      listener();
    }
  }
}

/** Notify every question row. For hydration and cloud merges. */
function emitAllQuestions() {
  for (const set of questionListeners.values()) {
    for (const listener of set) {
      listener();
    }
  }
}

/** Subscribe to one question. Used by useQuestionDone. */
export function subscribeQuestion(id: string, listener: () => void): () => void {
  let set = questionListeners.get(id);
  if (!set) {
    set = new Set();
    questionListeners.set(id, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) {
      // Rows unmount constantly as the list scrolls; leaving empty sets behind
      // would grow the map for the life of the process.
      questionListeners.delete(id);
    }
  };
}

/** Snapshot for one question, by id. */
export function isQuestionIdDone(id: string): boolean {
  return doneIds.has(id);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): number {
  return version;
}

export function isHydrated(): boolean {
  return hydrated;
}

export function getQuestionId(question: string): string {
  return `${KEY_PREFIX}${question.slice(0, 50).replace(/\s+/g, '-')}`;
}

export function isQuestionDone(question: string): boolean {
  return doneIds.has(getQuestionId(question));
}

export function countDone(questions: string[]): number {
  let total = 0;
  for (const question of questions) {
    if (doneIds.has(getQuestionId(question))) {
      total += 1;
    }
  }
  return total;
}

export function totalDone(): number {
  return doneIds.size;
}

/** Load persisted completion state. Call once, before the UI reads counts. */
export async function hydrateProgress(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const parked = await AsyncStorage.getItem(PENDING_UNDO_KEY);
    if (parked) {
      const list: unknown = JSON.parse(parked);
      if (Array.isArray(list)) {
        pendingUndo = new Set(list.filter((id): id is string => typeof id === 'string'));
      }
    }
    const questionKeys = keys.filter(key => key.startsWith(KEY_PREFIX));
    if (questionKeys.length > 0) {
      const entries = await AsyncStorage.getMany(questionKeys);
      doneIds = new Set(
        Object.entries(entries)
          .filter(([, value]) => value === 'true')
          .map(([key]) => key),
      );
    }
  } catch (error) {
    warn('hydrateProgress failed:', error);
  } finally {
    hydrated = true;
    emit();
    emitAllQuestions();
  }
}

/**
 * The day something was last ticked off, as a local epoch day.
 *
 * The daily reminder's most important rule is "say nothing if they already
 * studied today", and this is the only fact that answers it. Deriving it from
 * the total done would make it true for anyone who has ever ticked anything —
 * which silences the reminder permanently, for everyone, from their second day
 * onwards.
 */
const LAST_STUDY_KEY = 'orbit:last-study-day';

let lastStudyDay = -1;

export function getLastStudyDay(): number {
  return lastStudyDay;
}

export async function hydrateLastStudyDay(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LAST_STUDY_KEY);
    const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
    lastStudyDay = Number.isFinite(parsed) ? parsed : -1;
  } catch {
    lastStudyDay = -1;
  }
}

function markStudiedToday(): void {
  const today = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
  if (lastStudyDay === today) {
    return;
  }
  lastStudyDay = today;
  AsyncStorage.setItem(LAST_STUDY_KEY, String(today)).catch(() => {});
}

export function setQuestionDone(question: string, done: boolean): void {
  const id = getQuestionId(question);
  if (done) {
    doneIds.add(id);
  } else {
    doneIds.delete(id);
  }
  // Only a tick counts as studying. Un-ticking is a correction, and treating
  // it as activity would let someone silence the reminder by undoing things.
  if (done) {
    markStudiedToday();
  }
  emit();
  emitQuestion(id);

  AsyncStorage.setItem(id, done ? 'true' : 'false').catch(error =>
    warn('setQuestionDone persist failed:', error),
  );

  // Park the un-tick before the request goes out, so a pull that overlaps it
  // cannot put the row back. A tick clears any tombstone the same id had.
  if (done) {
    if (pendingUndo.delete(id)) {
      persistPendingUndo();
    }
  } else {
    pendingUndo.add(id);
    persistPendingUndo();
  }

  // The RPCs are idempotent, so an un-tick always lowers XP even if this
  // device never recorded the original tick.
  const rpc = done ? 'record_question_done' : 'record_question_undone';
  void (async () => {
    try {
      const { error } = await supabase.rpc(rpc, { _question_id: id });
      if (error) {
        warn(`${rpc} failed:`, error);
        return;
      }
      // Confirmed gone from the server, so there is nothing left to guard
      // against — and leaving the tombstone would block a genuine re-tick made
      // on another device from ever reaching this one.
      if (!done && pendingUndo.delete(id)) {
        persistPendingUndo();
      }
    } catch (error) {
      warn(`${rpc} threw:`, error);
    }
  })();
}

export function toggleQuestionDone(question: string): boolean {
  const next = !isQuestionDone(question);
  setQuestionDone(question, next);
  return next;
}

let pushing = false;

/** Push every locally-completed question to the cloud in chunks. */
export async function pushProgressToCloud(): Promise<void> {
  if (pushing || doneIds.size === 0) {
    return;
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) {
    return;
  }
  pushing = true;
  try {
    // Never push an id that is parked for deletion: the pull's retry above and
    // this would then fight, one deleting the row and the other re-inserting
    // it, on every launch.
    const ids = Array.from(doneIds).filter(id => !pendingUndo.has(id));
    const CHUNK = 500;
    for (let i = 0; i < ids.length; i += CHUNK) {
      await supabase.rpc('record_questions_done', { _question_ids: ids.slice(i, i + CHUNK) });
    }
  } catch (error) {
    warn('pushProgressToCloud failed:', error);
  } finally {
    pushing = false;
  }
}

/** Merge cloud rows into local state. Never deletes — un-ticks are explicit. */
export async function pullProgressFromCloud(): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      return;
    }
    const { data, error } = await supabase
      .from('question_progress')
      .select('question_id')
      .eq('user_id', userId);
    if (error) {
      warn('pullProgressFromCloud failed:', error);
      return;
    }
    const incoming: Record<string, string> = {};
    const stillThere: string[] = [];
    let added = false;
    for (const row of (data ?? []) as { question_id: string }[]) {
      if (!row.question_id) {
        continue;
      }
      // An un-tick this device made and the server has not confirmed. Merging
      // it would undo the reader's own action and read as a fresh tick.
      if (pendingUndo.has(row.question_id)) {
        stillThere.push(row.question_id);
        continue;
      }
      if (!doneIds.has(row.question_id)) {
        doneIds.add(row.question_id);
        incoming[row.question_id] = 'true';
        added = true;
      }
    }
    // The row surviving is the proof the RPC never landed, so this is the
    // retry. Sequential rather than parallel: a reader who un-ticked a whole
    // topic offline should not open with fifty simultaneous requests.
    for (const id of stillThere) {
      const { error: undoError } = await supabase.rpc('record_question_undone', {
        _question_id: id,
      });
      if (undoError) {
        warn('record_question_undone retry failed:', undoError);
        continue;
      }
      pendingUndo.delete(id);
    }
    if (stillThere.length > 0) {
      persistPendingUndo();
    }
    if (added) {
      await AsyncStorage.setMany(incoming);
      emit();
      // A cloud merge can flip any number of questions at once.
      emitAllQuestions();
    }
  } catch (error) {
    warn('pullProgressFromCloud threw:', error);
  }
}

/** Non-destructive two-way sync. Safe to call on launch and on sign-in. */
export async function reconcileProgress(): Promise<void> {
  await pullProgressFromCloud();
  await pushProgressToCloud();
}
