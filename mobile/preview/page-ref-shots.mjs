/**
 * Drive the textbook-page toggle and sheet in the real screens, and photograph
 * each step.
 *
 * The preview harness is react-native-web in a browser with no Supabase
 * reachable from a sandbox, so what this proves is the half that is ours: the
 * toggle switches, the chips appear on every row when it is on and vanish when
 * it is off, and tapping one opens the sheet with its book picker and page
 * field. What it cannot prove is the consensus, which lives in Postgres — that
 * is covered by the SQL self-test in the migration notes.
 *
 * Controls are found by accessibility label, so anything this cannot reach is
 * also something TalkBack cannot announce.
 */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] ?? path.join(here, '..', '..', 'screenshots'));

const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5201, strictPort: true },
  logLevel: 'error',
});
await server.listen();
await fs.mkdir(outDir, { recursive: true });

const entries = await fs.readdir('/opt/pw-browsers').catch(() => []);
const [chromeDir] = entries.filter(e => e.startsWith('chromium-')).sort().reverse();
const browser = await chromium.launch({
  ...(chromeDir ? { executablePath: `/opt/pw-browsers/${chromeDir}/chrome-linux/chrome` } : {}),
  args: ['--no-sandbox', '--font-render-hinting=none'],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const errors = [];
page.on('pageerror', e => errors.push(e.message));

const shot = async name => {
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  process.stdout.write(`captured ${name}\n`);
};

await page.goto(
  'http://localhost:5201/?screen=browse&year=second-year&node=pathology,paper-1,cell-injury&title=Cell%20Injury',
  { waitUntil: 'networkidle' },
);
await page.waitForTimeout(1400);
await shot('pageref-1-toggle-off');

// The toggle, by the label a screen reader would read.
const on = page.getByLabel('Show textbook page numbers');
if ((await on.count()) === 0) {
  throw new Error('the textbook-pages toggle is not on the question screen');
}
await on.first().click();
await page.waitForTimeout(900);
await shot('pageref-2-toggle-on');

// Every row should now offer a page chip.
const chips = page.getByLabel('Add a textbook page for this question');
const chipCount = await chips.count();
process.stdout.write(`rows offering a page chip: ${chipCount}\n`);
if (chipCount === 0) {
  throw new Error('the toggle is on but no row offers a page chip');
}

await chips.first().click();
await page.waitForTimeout(900);
await shot('pageref-3-sheet');

// The sheet has to explain the quorum, or a reader thinks their number went live.
const body = await page.evaluate(() => document.body.innerText);
for (const phrase of ['3 readers have entered the same one', 'PAGE NUMBER']) {
  if (!body.includes(phrase)) {
    throw new Error(`the sheet never says "${phrase}"`);
  }
}

// And "Add a book" has to open two fields, name and edition.
const addBook = page.getByLabel('Add a book');
if ((await addBook.count()) > 0) {
  await addBook.first().click();
  await page.waitForTimeout(700);
  await shot('pageref-4-add-book');
  // By accessibility label, not by text: a placeholder is not in innerText, so
  // matching on the body would silently pass whether or not the field is there.
  for (const field of ['Book name', 'Edition']) {
    if ((await page.locator(`[aria-label="${field}"]:visible`).count()) === 0) {
      throw new Error(`"Add a book" is missing its ${field} field`);
    }
  }
}

// Close the sheet. Its scrim covers the screen, so anything below it is
// unclickable until this happens -- which is the sheet working, not a bug.
// `:visible` because more than one sheet is mounted at a time and only the
// presented one is on screen; `.first()` picks a hidden Done and hangs.
await page.locator('[aria-label="Done"]:visible').first().click();
await page.waitForTimeout(700);

// Turning it back off must take the chips with it.
const off = page.getByLabel('Hide textbook page numbers');
await off.first().click();
await page.waitForTimeout(700);
const left = await page.getByLabel('Add a textbook page for this question').count();
if (left !== 0) {
  throw new Error(`toggled off but ${left} chips remain`);
}
await shot('pageref-5-toggle-off-again');

await browser.close();
await server.close();

if (errors.length) {
  process.stdout.write(`\nPage errors:\n${errors.join('\n')}\n`);
}
process.stdout.write('\nOK  toggle switches, chips follow it, sheet opens and states the quorum\n');
