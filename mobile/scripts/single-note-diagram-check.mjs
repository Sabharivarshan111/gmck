// The triple-tap note reader must put a question's diagram on the page.
//
// `notesdemo` proves the *renderer* can turn image markdown into a picture.
// That is not the same claim. This drives `SingleQuestionNote` itself — the
// screen a triple tap opens — through its own `fetchSingleQuestionNote`,
// `ensureSingleNoteDiagram`, `findDiagramsForQuestion` and
// `applyQuestionDiagrams`. Nothing inside the app is stubbed.
//
// Only the network is, and only because this sandbox is denied Supabase by
// policy. The two responses below are the real ones: the note is a note with no
// diagram section (which is what the cache actually holds for this question),
// and the row is the row that exists in production, verified byte for byte
// against the key the app computes.
//
// It exists because that question had a correct row, a real file, a public
// bucket and anon read access, and still showed nothing — and no test in the
// repo covered the path between "the row is right" and "the picture is on
// screen".
//
//   node scripts/single-note-diagram-check.mjs
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const QUESTION =
  'Brachial plexus - Formation, variation (pre and post fixed), branches and applied anatomy. ***';
const DIAGRAM_URL =
  'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/anatomy/brachial_plexus_complete_scheme.jpg';

/** A note with NO diagram section — exactly what the cache holds. */
const NOTE = {
  content: {
    highYieldTip: "Erb's point is the most frequently asked clinical site.",
    pyqYears: ['2023', '2021', '2019'],
    sections: [
      {
        type: 'definition',
        title: 'Definition',
        icon: '📌',
        payload: { text: 'The brachial plexus is formed by the ventral rami of C5-T1.' },
      },
    ],
  },
};

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const server = await createServer({
  configFile: path.join(root, 'preview/vite.config.ts'),
  server: { port: 5231, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const entries = await fs.readdir('/opt/pw-browsers');
const [chrome] = entries.filter(e => e.startsWith('chromium-')).sort().reverse();
const browser = await chromium.launch({
  headless: true,
  executablePath: `/opt/pw-browsers/${chrome}/chrome-linux/chrome`,
  args: ['--no-sandbox', '--disable-gpu', '--headless=new'],
});
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });

let diagramQueries = 0;

// The edge function that returns the note.
await page.route('**/functions/v1/generate-handwritten-notes', route =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(NOTE) }),
);

// The diagram row. Answers only the identity query, and records what was asked
// so a lookup that quietly stopped querying cannot pass this test.
await page.route('**/rest/v1/question_diagrams*', route => {
  const url = route.request().url();
  diagramQueries += 1;
  const wantsThisQuestion =
    decodeURIComponent(url).includes('question-Brachial-plexus---Formation,-variation-(pre-and-po') ||
    decodeURIComponent(url).includes(QUESTION);
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(
      wantsThisQuestion ? [{ public_url: DIAGRAM_URL, question_text: QUESTION }] : [],
    ),
  });
});

// The picture itself — a 1x1 png, so the test does not depend on the network.
await page.route('**/storage/v1/object/public/diagrams/**', route =>
  route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    ),
  }),
);

await page.goto('http://localhost:5231/?screen=singlenote', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const body = await page.locator('body').innerText();
const cards = await page.locator('[aria-label="Enlarge diagram image"]').count();
const rawMarkdown = await page.getByText('](http', { exact: false }).count();

check(diagramQueries > 0, 'SingleQuestionNote never asked question_diagrams for this question');
check(cards > 0, 'the note rendered with no diagram, though the lookup returned a row for it');
check(rawMarkdown === 0, 'the image markdown leaked onto the page as text instead of becoming a picture');
check(
  /High-Yield Visual Exam Diagram/.test(body),
  'the diagram section lost its heading',
);
check(/Brachial plexus/.test(body), 'the note body did not render');

await page.screenshot({ path: path.join(root, '..', 'screenshots', 'single-note-diagram.png') });

await browser.close();
await server.close();

if (failures.length > 0) {
  process.stdout.write('FAIL  the triple-tap note and its diagram\n');
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exit(1);
}
process.stdout.write(
  `OK    SingleQuestionNote puts the question's own diagram on the page (${diagramQueries} lookup(s), ${cards} card)\n`,
);
