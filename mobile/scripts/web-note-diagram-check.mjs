// The web app's triple tap puts the question's own plate on the page.
//
// The native app has `check:single-note` for this. The web app had nothing,
// and that is exactly where the gap showed: the shared lookup was fixed, the
// component was fixed, both typechecked, both built — and the report was still
// "I am triple tapping a question and there are no images". Reading the code
// cannot answer that; only opening the screen can.
//
// So this builds the real web app, serves it, and drives the real
// `SingleQuestionNoteOverlay` — the thing a triple tap opens — by dispatching
// the same `orbit:single-note` event `QuestionCard` dispatches. Nothing inside
// the app is stubbed. Only the network is, because this sandbox is denied
// Supabase by policy, and the two responses are the real ones: a note with no
// diagram section (which is what the cache actually holds), and the production
// row for the brachial plexus question, verified in the database.
//
// It fails if the picture does not reach the DOM, whatever the code says.
//
//   node scripts/web-note-diagram-check.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');
const dist = path.join(repo, 'dist');

const QUESTION =
  "Formation, branches and clinical anatomy of brachial plexus /Erb's point. ***";
const PLATE =
  'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/anatomy/brachial_plexus_complete_scheme.jpg';

const fail = message => {
  process.stdout.write(`FAIL  web triple-tap diagram\n  - ${message}\n`);
  process.exit(1);
};

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { cwd: repo, stdio: 'ignore' });
    build.on('exit', code => (code === 0 ? resolve() : reject(new Error('vite build failed'))));
  });
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

// A plain static server with the SPA rewrite `vercel.json` configures, so the
// page under test is served the way the deployed one is.
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.join(dist, url.pathname);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(dist, 'index.html');
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const entries = fs.readdirSync('/opt/pw-browsers');
const [chrome] = entries.filter(e => e.startsWith('chromium-')).sort().reverse();
const browser = await chromium.launch({
  headless: true,
  executablePath: `/opt/pw-browsers/${chrome}/chrome-linux/chrome`,
  args: ['--no-sandbox', '--disable-gpu', '--headless=new'],
});
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });

const lookups = [];

// The note itself: cached, and deliberately carrying no diagram section, so
// the only way a picture can appear is the lookup putting it there.
await page.route('**/functions/v1/generate-handwritten-notes', route =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      content: {
        highYieldTip: 'Erb’s point is the junction of C5 and C6.',
        pyqYears: ['FEB 23'],
        sections: [
          {
            type: 'text',
            title: 'Formation',
            payload: { paragraph: 'Roots, trunks, divisions, cords, branches.' },
          },
        ],
      },
    }),
  }),
);

// The row, exactly as production holds it.
await page.route('**/rest/v1/question_diagrams*', route => {
  const url = route.request().url();
  lookups.push(url);
  const hit =
    decodeURIComponent(url).includes(QUESTION) ||
    decodeURIComponent(url).includes('question-Formation,-branches-and-clinical-anatomy-of-brachi');
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(
      hit ? [{ public_url: PLATE, question_text: QUESTION }] : [],
    ),
  });
});

// The plate itself — a 1x1 PNG, because what is being tested is whether the
// app asks for it, not whether Chromium can decode a JPEG.
await page.route(PLATE, route =>
  route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    ),
  }),
);

const consoleErrors = [];
page.on('console', m => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});

await page.goto(origin, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// A first visit opens the onboarding tour, which is a modal over everything.
// It does not block the note — the note opens behind it — but it does mean the
// screenshot this check leaves behind shows the tour instead of the evidence,
// which is exactly the kind of picture that gets presented as proof of the
// wrong thing.
for (const label of ['Skip tour', 'OK, continue']) {
  const button = page.getByText(label, { exact: true });
  if (await button.count()) {
    await button.first().click();
    await page.waitForTimeout(500);
  }
}

// The event `QuestionCard` dispatches on the third tap, with the same detail.
await page.evaluate(
  ({ question }) => {
    window.dispatchEvent(
      new CustomEvent('orbit:single-note', {
        detail: {
          question,
          rawQuestion: question,
          subject: 'Anatomy',
          subjectKey: 'anatomy',
          year: 'first-year',
        },
      }),
    );
  },
  { question: QUESTION },
);

let img = null;
try {
  img = await page.waitForSelector(`img[src="${PLATE}"]`, { timeout: 12000 });
} catch {
  /* reported below */
}

const shots = path.join(repo, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
await page.screenshot({ path: path.join(shots, 'web-note-diagram.png'), fullPage: false });

if (lookups.length === 0) {
  await browser.close();
  server.close();
  fail(
    'the note opened without ever querying question_diagrams — the overlay is not passing the question down to the diagram card',
  );
}

if (!img) {
  await browser.close();
  server.close();
  fail(
    `question_diagrams was queried ${lookups.length} time(s) and returned the row, but no <img> for it reached the page`,
  );
}

const box = await img.boundingBox();
if (!box || box.width < 40 || box.height < 40) {
  await browser.close();
  server.close();
  fail(`the plate is in the DOM but drawn at ${box ? `${box.width}x${box.height}` : 'no size'}`);
}

// The reader's own words: the picture, and the answer under it. The note body
// has to be below the plate on the page, not above it and not instead of it.
const bodyTop = await page.evaluate(() => {
  const el = [...document.querySelectorAll('p')].find(p =>
    p.textContent?.includes('Roots, trunks, divisions'),
  );
  return el ? el.getBoundingClientRect().top + window.scrollY : null;
});
if (bodyTop === null) {
  await browser.close();
  server.close();
  fail('the note text did not render at all');
}
if (bodyTop <= box.y) {
  await browser.close();
  server.close();
  fail(`the note text is at y=${Math.round(bodyTop)}, above the plate at y=${Math.round(box.y)} — the diagram goes first and the answer under it`);
}

await browser.close();
server.close();

process.stdout.write(
  `OK    the web triple tap draws the question's own plate, answer beneath it ` +
    `(${lookups.length} lookup(s), ${Math.round(box.width)}x${Math.round(box.height)}px)\n`,
);
if (consoleErrors.length > 0) {
  process.stdout.write(`      (${consoleErrors.length} unrelated console error(s))\n`);
}
