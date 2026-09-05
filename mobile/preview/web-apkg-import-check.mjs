/**
 * Import an Anki package through the WEB APP's own screen, in a real browser.
 *
 * `check:apkg-web` already proves `readApkg` opens all three package layouts —
 * but it runs in Node, so it proves the reader and nothing around it. That is
 * exactly the gap this feature fell into: `apkgWeb.ts` was written, correct,
 * and passing its check, while the flashcards hub still showed a panel saying
 * "importing your own .apkg is on the Android app". The reader worked. Nothing
 * called it. No check could see that, because no check drove the screen.
 *
 * So this one does. It builds the app, serves `dist/`, opens the flashcards
 * hub, hands a real `.apkg` to the real `<input type=file>`, and then asserts
 * on what a reader would actually see: the deck appears, it opens, a card has
 * a question, revealing shows an answer, and grading it moves on.
 *
 * The package used is **v3** deliberately. Every v3 package also ships a
 * complete, valid, schema-11 `collection.anki2` holding one note reading "This
 * file requires a newer version of Anki". A reader that picks by filename
 * finds it, parses it, throws nothing, and hands back a one-card deck
 * containing an error message — the worst outcome available, because it looks
 * like it worked. Ten cards is the assertion that matters.
 *
 * Controls are found by accessibility label, so anything this cannot reach is
 * also something a screen reader cannot announce.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');
const dist = path.join(repo, 'dist');
const fixture = path.join(here, 'fixtures', 'apkg', 'v3.apkg');
const outDir = path.resolve(process.argv[2] ?? path.join(repo, 'screenshots', 'web-anki'));

const problems = [];
const check = (ok, message) => {
  if (!ok) problems.push(message);
};

if (!(await fs.stat(dist).catch(() => null))) {
  console.error('dist/ is not built. Run `npm run build` at the repo root first.');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

// A plain static server rather than vite: this has to be the built bundle,
// because the dynamic import of sql.js and its WASM is a build-time split and
// serving the source would exercise a different loader.
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.join(dist, url.pathname);
  if (!(await fs.stat(file).catch(() => null))?.isFile()) file = path.join(dist, 'index.html');
  const body = await fs.readFile(file);
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  res.end(body);
});
await new Promise((r) => server.listen(5233, r));
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

const shot = async (name) => {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  console.log(`captured ${name}`);
};

/**
 * Walk a first-time reader to the flashcards hub.
 *
 * The first-run tour stands in front of everything, and it is modal — a click
 * on the tab bar behind it does nothing. Dismissing it is not incidental setup:
 * a check that skipped it would be testing a screen no new reader can reach.
 */
async function openHub(page) {
  // The tour mounts after the first render, so looking for it immediately
  // finds nothing, and the Notes tab underneath then swallows the click. This
  // wait is the difference between the check passing and the check being a
  // race that fails on a slower machine.
  await page.waitForTimeout(1500);
  // Whatever is standing in front of the app today. There are several and they
  // are not all on the first load — the tour on a fresh profile, and a
  // "We fixed a few things" notice on the next one — so this dismisses by
  // pattern and repeats, rather than naming the two that happened to be
  // showing when it was written.
  for (let round = 0; round < 4; round += 1) {
    const dismiss = page
      .getByRole('button', { name: /^(Skip tour|OK, continue|OK, got it|Got it|Dismiss|Close)$/i })
      .first();
    if (await dismiss.count()) {
      await dismiss.click().catch(() => {});
      await page.waitForTimeout(450);
      continue;
    }
    break;
  }
  const notes = page.getByRole('button', { name: /^Notes$/ }).first();
  if (await notes.count()) await notes.click().catch(() => {});
  await page.waitForTimeout(700);
  const hub = page.getByRole('button', { name: /Anki-style flashcards/i }).first();
  if (await hub.count()) await hub.click().catch(() => {});
  await page.waitForTimeout(700);
}

try {
  await page.goto('http://localhost:5233/', { waitUntil: 'networkidle' });

  await openHub(page);

  const importer = page.getByLabel('Choose an Anki package to import');
  check(await importer.count() > 0, 'the flashcards hub offers no way to import a package');
  if (await importer.count() === 0) throw new Error('no import control');

  const body = await page.evaluate(() => document.body.innerText);
  check(
    !/importing your own \.apkg is on the android app/i.test(body),
    'the hub still tells the reader that importing is Android-only',
  );
  check(
    /nothing is uploaded/i.test(body),
    'the import panel does not say the deck stays in this browser',
  );
  await shot('web-anki-1-import-panel');

  await importer.setInputFiles(fixture);

  // The first import downloads ~1.5MB of SQLite WASM and then parses a
  // database, so this waits on the outcome rather than on a duration.
  await page.waitForFunction(
    () => /show answer|nothing due right now/i.test(document.body.innerText),
    null,
    { timeout: 90_000 },
  );
  await page.waitForTimeout(300);
  await shot('web-anki-2-first-card');

  const studying = await page.evaluate(() => document.body.innerText);

  // The decoy check. A reader that picked `collection.anki2` by filename gets
  // one card whose text is an error message.
  check(
    !/requires a newer version of anki/i.test(studying),
    'the v3 decoy collection was imported instead of the real one',
  );
  const of = studying.match(/(\d+)\s+of\s+(\d+)/);
  check(of !== null, 'the study screen does not say how many cards are queued');
  if (of) {
    check(
      Number(of[2]) === 10,
      `the queue holds ${of[2]} cards; the v3 fixture has 10 (a queue of 1 is the decoy)`,
    );
  }

  const showAnswer = page.getByRole('button', { name: /show the answer/i });
  check(await showAnswer.count() > 0, 'there is no way to reveal a card');
  await showAnswer.click();
  await page.waitForTimeout(200);
  await shot('web-anki-3-answer');

  const revealed = await page.evaluate(() => document.body.innerText);
  check(/ANSWER/.test(revealed), 'revealing a card shows no answer');

  // Grading has to move the session on. Four buttons, each announcing its own
  // interval, because that is what tells a reader what "Good" costs them.
  const good = page.getByRole('button', { name: /^Good, next in /i });
  check(await good.count() > 0, 'the grade buttons do not announce their intervals');
  if (await good.count()) {
    await good.click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.body.innerText);
    check(
      /show answer/i.test(after) || /nothing due right now/i.test(after),
      'grading a card did not move the session on',
    );
    check(!/ANSWER/.test(after), 'the next card opened with its answer already showing');
  }
  await shot('web-anki-4-after-grading');

  // The deck has to survive a reload — it is in IndexedDB, and the list that
  // names it is in localStorage. Two stores that have to agree.
  await page.goto('http://localhost:5233/', { waitUntil: 'networkidle' });
  await openHub(page);

  const back = await page.evaluate(() => document.body.innerText);
  check(/10 cards/.test(back), 'the imported deck did not survive a reload');
  await shot('web-anki-5-after-reload');

  const studyAgain = page.getByRole('button', { name: /^Study .*10 cards$/i });
  check(await studyAgain.count() > 0, 'the imported deck cannot be reopened from the list');

  const remove = page.getByRole('button', { name: /^Delete /i });
  check(await remove.count() > 0, 'an imported deck cannot be deleted');
  if (await remove.count()) {
    await remove.first().click();
    await page.waitForTimeout(600);
    const gone = await page.evaluate(() => document.body.innerText);
    check(!/10 cards/.test(gone), 'deleting the deck left it in the list');
  }
  await shot('web-anki-6-deleted');
} finally {
  await browser.close();
  server.close();
}

if (problems.length > 0) {
  console.error('\nFAIL');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  '\nOK  the web app imports a real v3 package through its own file input,\n' +
    '    takes the real collection rather than the decoy, studies and grades a\n' +
    '    card, survives a reload, and deletes the deck again',
);
