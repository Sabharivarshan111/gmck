// The rotation calendar, driven the way a student enters a posting.
//
// The attendance arithmetic is covered by `check:attendance`, which works
// entirely in numbers. This is the other half: that the numbers reach the
// screen, that the calendar actually sets the dates, and that ticking Sundays
// and a holiday moves the count the card is built from.
//
// It matters more here than on most screens. Telling somebody they can miss
// three more days when the answer is one is the difference between sitting an
// exam and repeating a year, and a working-day count that is right in a unit
// test and wrong in the form is indistinguishable from one that is simply
// wrong.
//
// Every number asserted below was worked out against a real calendar first:
// 2026-09-07 is a Monday, 28 days from it ends Sunday 2026-10-04, that span
// holds four Sundays, and 2026-10-02 is Gandhi Jayanti on a Friday.
//
//   node preview/attendance-shot.mjs [outDir]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] ?? path.join(here, '..', '..', 'screenshots'));

async function findChromium() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    const entries = await fs.readdir('/opt/pw-browsers');
    const [dir] = entries.filter(e => e.startsWith('chromium-')).sort().reverse();
    if (dir) return `/opt/pw-browsers/${dir}/chrome-linux/chrome`;
  } catch {}
  for (const c of ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome']) {
    try {
      await fs.access(c);
      return c;
    } catch {}
  }
  throw new Error('no Chromium found — set CHROME_PATH');
}

const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5233, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});

/*
 * With no stored profile the app boots into the year gate, which is a
 * full-screen panel — so every control below is behind it and Playwright times
 * out reporting that some onboarding heading intercepts the pointer. Forcing
 * the click is not the answer: it drives straight through the gate and
 * photographs the onboarding panel while the assertions pass.
 */
await page.addInitScript(() => {
  try {
    window.localStorage.setItem(
      'orbit-profile-v1',
      JSON.stringify({ display_name: 'Orbit', year: 'second' }),
    );
  } catch {}
});
await fs.mkdir(outDir, { recursive: true });

const problems = [];
const note = (ok, what) => {
  process.stdout.write(`${ok ? '  ok  ' : ' FAIL '}${what}\n`);
  if (!ok) problems.push(what);
};

/*
 * The working-day sentence under the calendar, which is the whole point.
 *
 * By testID rather than by its words: the empty state above it also contains
 * "days" and "working", so a text match read that card instead and every
 * assertion below compared against the wrong sentence.
 */
const summary = () => page.getByTestId('rotation-summary').first().innerText();

await page.goto('http://localhost:5233/?screen=progress', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

await page.getByLabel('Attendance', { exact: true }).first().click();
await page.waitForTimeout(500);
await page.getByLabel('Clinical postings').first().click();
await page.waitForTimeout(400);
await page.getByLabel('Add a posting').first().click();
await page.waitForTimeout(600);

note((await page.getByLabel('Set the rotation dates').count()) >= 1, 'the calendar is in the form');
note(
  (await page.getByText('How many days does it run?').count()) === 0,
  'and the question it replaced is gone',
);
await page.screenshot({ path: path.join(outDir, 'attendance-01-calendar.png'), fullPage: true });

// Monday 7 September to Sunday 4 October 2026.
await page.getByLabel('7 September 2026').first().click();
await page.waitForTimeout(250);
await page.getByLabel('Next month').first().click();
await page.waitForTimeout(250);
await page.getByLabel('4 October 2026').first().click();
await page.waitForTimeout(400);

const span = await summary();
note(/28 days/.test(span), `the span counts both ends — "${span}"`);
await page.screenshot({ path: path.join(outDir, 'attendance-02-range.png'), fullPage: true });

/*
 * Offered by name and NOT applied. Four fixed national holidays are all that
 * can honestly be known; everything else moves against the Gregorian calendar
 * or belongs to one college, and a calendar pre-filled with dates that are
 * wrong is worse than a blank one.
 */
note(
  (await page.getByLabel(/Gandhi Jayanti/).count()) === 1,
  'the one fixed holiday in range is offered by name',
);
note(
  (await page.getByLabel(/Republic Day|Independence Day|Christmas/).count()) === 0,
  'and the three outside it are not',
);
note(/28 days, all of them working/.test(span), 'nothing is marked off until it is accepted');

await page.getByLabel(/Gandhi Jayanti/).first().click();
await page.waitForTimeout(400);
const oneOff = await summary();
note(/27 of them working/.test(oneOff), `accepting it takes exactly one day off — "${oneOff}"`);

// 28 days, minus four Sundays, minus the holiday on a Friday, is 23.
await page.getByLabel('Sundays are not working days').first().click();
await page.waitForTimeout(400);
const both = await summary();
note(/23 of them working/.test(both), `Sundays and the holiday both come off — "${both}"`);
await page.screenshot({ path: path.join(outDir, 'attendance-03-holiday.png'), fullPage: true });

// The half no list could know: the reader's own college holidays.
await page.getByLabel('Mark days off inside the rotation').first().click();
await page.waitForTimeout(300);
await page.getByLabel('6 October 2026').first().click();
await page.waitForTimeout(400);
note(
  /23 of them working/.test(await summary()),
  'a day marked outside the range changes nothing',
);
await page.getByLabel('Previous month').first().click();
await page.waitForTimeout(250);
await page.getByLabel('30 September 2026').first().click();
await page.waitForTimeout(400);
const inside = await summary();
note(/22 of them working/.test(inside), `and one inside it comes off — "${inside}"`);
await page.screenshot({ path: path.join(outDir, 'attendance-04-marked.png'), fullPage: true });

await browser.close();
await server.close();

if (problems.length > 0) {
  process.stderr.write(`\n${problems.length} problem(s) on the attendance calendar\n`);
  process.exit(1);
}
process.stdout.write('\nOK  the rotation is set from a calendar, and days off come off the count\n');
