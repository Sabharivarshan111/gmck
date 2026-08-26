// The flashcard scheduler must behave like Anki, because it says it does.
//
// Ported from ankitects/anki rslib/src/scheduler/states/ and the default deck
// config. Every assertion here is a behaviour Anki's own tests assert, so a
// change that breaks one is a change that stopped being Anki — at which point
// the name on the button is a lie about how the card will come back.
//
//   node scripts/anki-check.mjs
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundled = await build({
  entryPoints: [path.join(root, 'src/lib/anki.ts')],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
});
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);
const {
  newCard, answer, intervalLabel, dueQueue, counts, isLeech,
  LEARN_STEPS_MIN, GRADUATING_INTERVAL_GOOD, GRADUATING_INTERVAL_EASY,
  START_EASE, MIN_EASE, LEECH_THRESHOLD,
} = mod;

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const now = new Date('2026-03-01T09:00:00').getTime();

// --- Defaults, straight from DEFAULT_DECK_CONFIG_INNER ----------------------
check(JSON.stringify(LEARN_STEPS_MIN) === '[1,10]', 'learning steps are not Anki\'s [1m, 10m]');
check(GRADUATING_INTERVAL_GOOD === 1, 'graduating interval (good) is not 1 day');
check(GRADUATING_INTERVAL_EASY === 4, 'graduating interval (easy) is not 4 days');
check(START_EASE === 2.5, 'starting ease is not 2.5');
check(MIN_EASE === 1.3, 'minimum ease is not 1.3');
check(LEECH_THRESHOLD === 8, 'leech threshold is not 8');

// --- Learning ---------------------------------------------------------------
const fresh = newCard('q1', now);
check(fresh.type === 'new', 'a new card does not start as new');

// Good on a new card walks to the second step, it does not graduate.
const firstGood = answer(fresh, 'good', now);
check(firstGood.type === 'learning', 'Good on a new card graduated it — it must walk the steps first');
check(
  Math.round((firstGood.due - now) / MIN) === 10,
  `Good on step 1 should schedule the 10m step, got ${Math.round((firstGood.due - now) / MIN)}m`,
);

// Good on the last step graduates at 1 day.
const graduated = answer(firstGood, 'good', now);
check(graduated.type === 'review', 'Good on the last learning step did not graduate the card');
check(graduated.interval === 1, `graduating interval should be 1 day, got ${graduated.interval}`);

// Again jumps all the way back to step 1 — Anki asserts this explicitly.
const lapsedInLearning = answer(firstGood, 'again', now);
check(
  lapsedInLearning.type === 'learning' && Math.round((lapsedInLearning.due - now) / MIN) === 1,
  'Again during learning must jump back to the 1m step, not one rung down',
);

// Easy graduates immediately at 4 days, from any step.
const easyOut = answer(fresh, 'easy', now);
check(
  easyOut.type === 'review' && easyOut.interval === 4,
  `Easy on a new card should graduate at 4 days, got ${easyOut.type}/${easyOut.interval}`,
);

// Hard on the first step averages this step and the next: (1 + 10) / 2 = 5.5m.
const hardFirst = answer(fresh, 'hard', now);
check(
  Math.abs((hardFirst.due - now) / MIN - 5.5) < 0.01,
  `Hard on step 1 should be the average of 1m and 10m, got ${((hardFirst.due - now) / MIN).toFixed(2)}m`,
);

// --- Review -----------------------------------------------------------------
const review = { ...newCard('q2', now), type: 'review', interval: 10, ease: 2.5, due: now };

const good = answer(review, 'good', now);
check(good.interval === 25, `Good should be interval x ease (10 x 2.5 = 25), got ${good.interval}`);
check(good.ease === 2.5, 'Good must not change the ease');

const hard = answer(review, 'hard', now);
check(hard.interval === 12, `Hard should be interval x 1.2 (12), got ${hard.interval}`);
check(Math.abs(hard.ease - 2.35) < 1e-9, `Hard should drop the ease by 0.15, got ${hard.ease}`);

const easy = answer(review, 'easy', now);
check(easy.interval === 33, `Easy should be interval x ease x 1.3 (32.5 -> 33), got ${easy.interval}`);
check(Math.abs(easy.ease - 2.65) < 1e-9, `Easy should raise the ease by 0.15, got ${easy.ease}`);

// Again on a review card lapses it into relearning, not straight back to review.
const again = answer(review, 'again', now);
check(again.type === 'relearning', `Again on a review card should relearn, got ${again.type}`);
check(again.lapses === 1, 'Again did not count a lapse');
check(Math.abs(again.ease - 2.3) < 1e-9, `Again should drop the ease by 0.2, got ${again.ease}`);
check(
  Math.round((again.due - now) / MIN) === 10,
  'a lapsed card should come back on the 10m relearning step',
);

// Relearning returns to review, keeping the interval it earned back.
const backToReview = answer(again, 'good', now);
check(backToReview.type === 'review', 'Good in relearning did not return the card to review');

// The ease floor holds however many times a card is missed.
let battered = { ...review, ease: 1.4 };
for (let i = 0; i < 5; i += 1) {
  battered = { ...answer(battered, 'again', now), type: 'review', interval: 10 };
}
check(battered.ease >= MIN_EASE - 1e-9, `ease fell through the floor to ${battered.ease}`);
check(isLeech(battered) === false, 'five lapses should not be a leech yet (threshold is 8)');

// An interval must always grow on a pass, or a card is due for ever.
let low = { ...review, ease: 1.3, interval: 1 };
for (let i = 0; i < 4; i += 1) {
  const before = low.interval;
  low = answer(low, 'good', now);
  check(low.interval > before, `interval stood still at ${before} days with a low ease`);
  low = { ...low, type: 'review' };
}

// --- Queue order ------------------------------------------------------------
const queue = dueQueue(
  [
    newCard('new-1', now),
    { ...review, id: 'rev-1', due: now - DAY },
    { ...again, id: 'learn-1', due: now - MIN },
  ],
  now,
);
check(queue[0].id === 'learn-1', 'learning cards must come first — they are minutes overdue');
check(queue[queue.length - 1].id === 'new-1', 'new cards must come last');

const c = counts([newCard('a', now), { ...review, id: 'b', due: now - DAY }], now);
check(c.fresh === 1 && c.review === 1, `deck counts are wrong: ${JSON.stringify(c)}`);

// --- Button labels ----------------------------------------------------------
check(intervalLabel(fresh, 'again', now) === '1m', 'Again on a new card should read 1m');
check(intervalLabel(fresh, 'easy', now) === '4d', 'Easy on a new card should read 4d');
check(
  /^\d+mo$|^\d+\.\d+mo$/.test(intervalLabel({ ...review, interval: 60 }, 'good', now)),
  'a months-long interval should read in months, not days',
);

if (failures.length > 0) {
  for (const failure of failures) process.stdout.write(`  FAIL  ${failure}\n`);
  process.stdout.write(`\n${failures.length} problem(s) — the scheduler is not Anki any more.\n`);
  process.exit(1);
}
process.stdout.write('OK  learning steps, graduation, lapses, ease floor, queue order and labels all match Anki\n');
