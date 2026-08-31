import AsyncStorage from '@react-native-async-storage/async-storage';
import { warn } from '@/lib/log';

/**
 * Every tree this phone has grown.
 *
 * **On this device and nowhere else**, like the notes and the calendar — see
 * `.agents/rules/70-supabase.md`. A record of when somebody was concentrating
 * is a record of their day, and this app has no business keeping a server copy
 * of that. `check:cloud-ids` fails if this file so much as imports the
 * Supabase client.
 *
 * A store with a listener set rather than a context, for the same reason
 * `progress.ts` is one: the timer writes to it on a tick that already
 * re-renders, and a context would re-render the tree above it too.
 */

export interface PlantedTree {
  id: string;
  /** When the session ended, epoch milliseconds. */
  at: number;
  minutes: number;
  species: string;
  /**
   * Left the app while it was growing.
   *
   * A withered tree is still planted, and its minutes still count. Losing the
   * *tree* is the whole penalty — losing the work would be this app throwing
   * away evidence that somebody studied, which it must never do.
   */
  wilted: boolean;
}

const KEY = 'orbit:forest:v1';
/**
 * Enough for a year of four sessions a day, and the oldest fall off the end.
 *
 * The list is one AsyncStorage value, so it is read whole every time the timer
 * screen opens; an unbounded log would make that read grow for ever on a phone
 * that is doing well.
 */
const LIMIT = 500;

let cache: PlantedTree[] | null = null;
const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeForest(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadForest(): Promise<PlantedTree[]> {
  if (cache) {
    return cache;
  }
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter(
          (tree): tree is PlantedTree =>
            !!tree && typeof (tree as PlantedTree).species === 'string',
        )
      : [];
  } catch {
    // A log that will not parse shows as an empty plot rather than taking the
    // screen with it. Nothing here is worth a crash.
    cache = [];
  }
  return cache;
}

/** What is already loaded, for a render that cannot wait on storage. */
export function forestNow(): PlantedTree[] {
  return cache ?? [];
}

export async function plantTree(tree: Omit<PlantedTree, 'id'>): Promise<void> {
  const all = await loadForest();
  const next = [
    { ...tree, id: `t${tree.at}${Math.random().toString(36).slice(2, 6)}` },
    ...all,
  ].slice(0, LIMIT);
  cache = next;
  announce();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    warn('forest save failed:', error);
  }
}

/** Local calendar day, so "today" rolls over at the reader's midnight. */
function dayKey(at: number): string {
  const date = new Date(at);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function treesToday(all: PlantedTree[], now = Date.now()): PlantedTree[] {
  const today = dayKey(now);
  // Oldest first: a plot is read left to right, in the order it was planted.
  return all.filter(tree => dayKey(tree.at) === today).reverse();
}

/** Trees per day, newest day first — the shape the forest screen renders. */
export function byDay(all: PlantedTree[]): { day: string; at: number; trees: PlantedTree[] }[] {
  const days = new Map<string, PlantedTree[]>();
  for (const tree of all) {
    const key = dayKey(tree.at);
    const list = days.get(key);
    if (list) {
      list.push(tree);
    } else {
      days.set(key, [tree]);
    }
  }
  return [...days.entries()].map(([day, trees]) => ({
    day,
    at: trees[0].at,
    trees: [...trees].reverse(),
  }));
}

export async function clearForest(): Promise<void> {
  cache = [];
  announce();
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    warn('forest clear failed:', error);
  }
}

export async function clearTodayForest(now = Date.now()): Promise<void> {
  const all = await loadForest();
  const today = dayKey(now);
  const next = all.filter(tree => dayKey(tree.at) !== today);
  cache = next;
  announce();
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    warn('forest clear today failed:', error);
  }
}

