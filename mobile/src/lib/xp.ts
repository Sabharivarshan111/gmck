import { collectAllQuestions, getSubjects, type YearKey } from '@/lib/questionBank';
import { countDone } from '@/lib/progress';

/**
 * The XP economy, in one place.
 *
 * It used to be in three: the level ladder in ProgressScreen, the badge list
 * beside it, and — once ticking a question started announcing itself — a third
 * copy in the toast. Three copies of a number that has to agree with a fourth
 * in the web app is three chances to disagree, and it had already taken one:
 * 60 XP was level 2 in a browser and level 3 on the phone.
 *
 * Everything here mirrors `src/lib/rewards.ts` in the web app, and
 * `npm run check:xp` reads both files and fails if they part company.
 */

/** One level per 50 questions, the same band the web app climbs. */
export const XP_PER_LEVEL = 50;

/** The six XP badges, thresholds and names identical to the web app's. */
export const XP_MILESTONES = [
  { label: 'Bronze Scholar', xp: 10, medal: '🥉' },
  { label: 'Silver Scholar', xp: 50, medal: '🥈' },
  { label: 'Gold Scholar', xp: 100, medal: '🥇' },
  { label: 'Platinum Mind', xp: 250, medal: '🔘' },
  { label: 'Diamond Mind', xp: 500, medal: '💎' },
  { label: 'Legendary Healer', xp: 1000, medal: '👑' },
] as const;

export function levelFor(xp: number): { level: number; into: number; percent: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, into, percent: (into / XP_PER_LEVEL) * 100 };
}

/**
 * Questions ticked in one year — the number the card calls "Year XP".
 *
 * Year-scoped rather than global because that is what the card shows, what the
 * badges are earned against and what the leaderboard ranks on. A second copy
 * counting *every* question ever ticked would announce "Bronze Scholar
 * unlocked" over a card still showing that badge as locked, which is the exact
 * kind of quiet disagreement this file exists to prevent.
 *
 * It walks the year's bank on every call. That is roughly a thousand Set
 * lookups, which is nothing next to the render it feeds — and it is the same
 * walk ProgressScreen already does, so the two cannot answer differently.
 */
export function yearXp(year: YearKey): number {
  let total = 0;
  for (const subject of getSubjects(year)) {
    total += countDone(collectAllQuestions(subject.node));
  }
  return total;
}

/**
 * What, if anything, a tick was worth announcing beyond the XP itself.
 *
 * Read from the crossing rather than from a stored list of what has already
 * been announced. A count that only goes up crosses each threshold once, so
 * the crossing *is* the first time — no bookkeeping to keep in sync, and
 * nothing to re-announce on the next launch. Untick and retick and it says so
 * again, which is the honest answer: you did just cross it again.
 *
 * A badge beats a level when one tick crosses both. It is the rarer of the
 * two, and it is the one with a name worth reading.
 */
export function milestoneFor(
  before: number,
  after: number,
): { kind: 'badge' | 'level'; text: string } | null {
  for (const milestone of XP_MILESTONES) {
    if (before < milestone.xp && after >= milestone.xp) {
      return { kind: 'badge', text: `${milestone.label} unlocked` };
    }
  }
  const wasLevel = Math.floor(before / XP_PER_LEVEL);
  const nowLevel = Math.floor(after / XP_PER_LEVEL);
  if (nowLevel > wasLevel) {
    return { kind: 'level', text: `Level ${nowLevel + 1}` };
  }
  return null;
}
