/**
 * Daily home-screen motivation without an API call.
 *
 * 12 study-oriented stems x 20 endings = 240 distinct lines. The day index is
 * permuted with a coprime step so consecutive days walk through all 240 before
 * repeating. This keeps the Welcome card fresh for months without spending an
 * AI request, depending on network access, or adding another rate-limit path.
 */
const STEMS = [
  'One focused hour today',
  'A page understood deeply',
  'A difficult topic revisited',
  'One honest revision session',
  'A small study win today',
  'One question you truly understand',
  'A quiet hour of concentration',
  'A weak topic faced again',
  'One careful diagram drawn',
  'A concept explained in your own words',
  'One distraction-free session',
  'A little progress before bed',
] as const;

const ENDINGS = [
  'moves you closer to the doctor you want to become.',
  'beats waiting for perfect motivation.',
  'adds up faster than you think.',
  'is a vote for the future you are building.',
  'makes tomorrow’s revision lighter.',
  'is how confidence is built before the exam.',
  'turns a large syllabus into something manageable.',
  'matters more than a perfect plan you never start.',
  'becomes momentum when you repeat it tomorrow.',
  'is enough to make today count.',
  'strengthens the memory you will need on the ward.',
  'is progress even when the day feels ordinary.',
  'can be the difference between knowing and guessing.',
  'compounds into calm when exam day arrives.',
  'is a better target than trying to finish everything at once.',
  'keeps consistency stronger than mood.',
  'builds recall one retrieval at a time.',
  'brings the finish line closer without needing a dramatic day.',
  'is proof that discipline can be simple.',
  'deserves credit — keep going.',
] as const;

const COUNT = STEMS.length * ENDINGS.length;
const DAY_MS = 86_400_000;

/** Accepts the app's local YYYY-MM-DD study date. */
export function motivationForDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const dayNumber = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
    ? Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
    : Math.floor(Date.now() / DAY_MS);

  // 73 is coprime with 240, so all combinations appear before any repeat.
  const index = ((dayNumber * 73 + 19) % COUNT + COUNT) % COUNT;
  const stem = STEMS[Math.floor(index / ENDINGS.length)];
  const ending = ENDINGS[index % ENDINGS.length];
  return `${stem} ${ending}`;
}
