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
const textFixture = path.join(here, 'fixtures', 'anki-text', 'html-fields.txt');
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

  const importer = page.getByLabel('Choose an Anki deck or text export to import');
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

  // The second supported route: Anki's UTF-8 text importer with HTML enabled
  // inside fields. This deliberately uses a real file input rather than
  // calling parseAnkiText directly, so picker -> parser -> IndexedDB -> study
  // view is one exercised path.
  const textImporter = page.getByLabel('Choose an Anki deck or text export to import');
  check(await textImporter.count() > 0, 'the text/CSV route disappeared after deleting an APKG');
  if (await textImporter.count()) {
    await textImporter.setInputFiles(textFixture);
    await page.waitForFunction(
      () => /Most common cause of myocardial infarction\?/i.test(document.body.innerText),
      null,
      { timeout: 30_000 },
    );
    await page.waitForTimeout(250);
    await shot('web-anki-7-html-text-card');

    const textStudy = await page.evaluate(() => document.body.innerText);
    check(/1\s+of\s+2/.test(textStudy), 'the two-card HTML text fixture did not import as two cards');
    check(
      /Most common cause of myocardial infarction\?/i.test(textStudy),
      'HTML tags were not flattened into readable front text',
    );

    const textAnswer = page.getByRole('button', { name: /show the answer/i });
    check(await textAnswer.count() > 0, 'HTML text card has no answer control');
    if (await textAnswer.count()) {
      await textAnswer.click();
      await page.waitForTimeout(150);
      const shown = await page.evaluate(() => document.body.innerText);
      check(/Atherosclerotic plaque/i.test(shown), 'HTML text answer lost its first line');
      check(/rupture & thrombosis/i.test(shown), 'HTML entity or line-break handling is wrong');
    }
    await shot('web-anki-8-html-text-answer');

    await page.goto('http://localhost:5233/', { waitUntil: 'networkidle' });
    await openHub(page);
    const persistedText = await page.evaluate(() => document.body.innerText);
    check(/Orbit HTML Import Test/i.test(persistedText), 'text-imported deck did not survive reload');
    check(/2 cards/.test(persistedText), 'text-imported deck card count was not persisted');

    const deleteText = page.getByRole('button', { name: /^Delete Orbit HTML Import Test$/i });
    check(await deleteText.count() > 0, 'text-imported deck cannot be deleted');
    if (await deleteText.count()) {
      await deleteText.click();
      await page.waitForTimeout(350);
    }
    await shot('web-anki-9-html-text-deleted');
  }
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
  '\nOK  the web app imports both a real v3 APKG and an HTML-enabled Anki text export,\n' +
    '    studies them through the real file input, persists them, and deletes them again',
);
