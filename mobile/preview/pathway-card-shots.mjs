// A first-year pathway flashcard, front and back, on BOTH apps.
//
// What this proves, and what it cannot:
//
//   • It drives the real screens — `mobile/src/screens/FlashcardsScreen.tsx`
//     through react-native-web, and the built web app's
//     `src/components/flashcards/StudyView.tsx`. Nothing here is a mockup.
//   • The deck comes from `generate-flashcards`, which needs Supabase, and this
//     sandbox has no route to it: the egress policy answers 403 to CONNECT. So
//     the native side is driven through the preview's `?screen=pathwaydemo`
//     fixture and the web side through a stubbed edge-function response. Both
//     carry the SAME four cards, which is also the point — one payload, two
//     renderers, and the shots are how you see them agree.
//   • The plate's bytes are stubbed too, for the same reason. The image is a
//     stand-in, NOT the real glycolysis plate. What the screenshot proves is the
//     layout around it — the chip, the picture, the chain beneath it — never the
//     plate's own contents.
//   • It also drives the state where the plate does not arrive at all, because
//     that is the state the chain exists to survive, and it is the one a reader
//     on a bad connection actually gets.
//
// react-native-web is not Android: no native driver, no real gesture timing, no
// TalkBack. These pictures prove layout and copy.
//
// ## Why the back is shot at a tall viewport rather than with `fullPage`
//
// The first run of this harness produced two pictures that asserted more than
// they showed, and both were the screenshot's fault rather than the renderer's:
//
//   • On the native side `fullPage` captured exactly one viewport. The card
//     scrolls inside a react-native-web `ScrollView` — an `overflow: auto` box,
//     not the document — so the page has nothing to expand, and the shot ended
//     mid-way down step 6 with the HIGH-YIELD callout and the grading row
//     outside the frame. The assertions passed on `innerText`, which reads the
//     whole scroller. A capture that stops before the thing being proved is the
//     black `tca-note.png` failure in a different costume.
//   • On the web side `fullPage` *did* expand the document, and painted the
//     `position: fixed` bottom navigation straight across the middle of the
//     card — over step 6 and over the word HIGH-YIELD.
//
// So a back is captured at a viewport tall enough to hold the whole card, with
// `fullPage` off. Fixed furniture then sits where it belongs and no scroller
// has anything left to hide. The front is still shot at the real phone height,
// because that one is about what a reader sees before they tap.
//
//   node preview/pathway-card-shots.mjs [outDir]
import { chromium } from 'playwright-core';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? '/tmp/pathway-shots';
await mkdir(out, { recursive: true });

/**
 * A stand-in for the plate.
 *
 * Drawn rather than downloaded because the real one is behind an egress denial.
 * It is deliberately a *diagram-shaped* rectangle at the plate's own aspect, so
 * the layout below it is measured against something the right size — a solid
 * grey box would make the card look better than it is.
 */
const PLATE = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
  <rect width="900" height="620" fill="#f6f4ee"/>
  <text x="450" y="52" font-family="Georgia,serif" font-size="30" text-anchor="middle" fill="#1d2733">GLYCOLYSIS — EMBDEN-MEYERHOF PATHWAY</text>
  <text x="450" y="82" font-family="Georgia,serif" font-size="17" text-anchor="middle" fill="#7a6a52">(stand-in for the real plate — see the harness header)</text>
  ${[
    ['Glucose', '#1d5f8a'],
    ['Glucose-6-phosphate', '#1d5f8a'],
    ['Fructose-6-phosphate', '#1d5f8a'],
    ['Fructose-1,6-bisphosphate', '#a8341f'],
    ['Glyceraldehyde-3-phosphate', '#1d5f8a'],
    ['1,3-Bisphosphoglycerate', '#1d5f8a'],
    ['Phosphoenolpyruvate', '#1d5f8a'],
    ['Pyruvate', '#a8341f'],
  ]
    .map(([label, colour], i) => {
      const y = 120 + i * 60;
      return `<rect x="250" y="${y}" width="400" height="38" rx="8" fill="#fff" stroke="${colour}" stroke-width="2"/>
      <text x="450" y="${y + 25}" font-family="Helvetica,Arial" font-size="18" text-anchor="middle" fill="#1d2733">${label}</text>
      ${i < 7 ? `<line x1="450" y1="${y + 38}" x2="450" y2="${y + 60}" stroke="#8a7f6d" stroke-width="2"/><polygon points="445,${y + 56} 455,${y + 56} 450,${y + 62}" fill="#8a7f6d"/>` : ''}
      ${i === 3 ? `<text x="672" y="${y + 25}" font-family="Helvetica,Arial" font-size="15" fill="#a8341f">PFK-1 (rate limiting)</text>` : ''}
      ${i === 0 ? `<text x="672" y="${y + 25}" font-family="Helvetica,Arial" font-size="15" fill="#5a6b7a">hexokinase</text>` : ''}`;
    })
    .join('\n')}
</svg>`;

const DIAGRAM_GLOB = '**/storage/v1/object/public/diagrams/**';

/** The same four cards the native fixture carries. One payload, two renderers. */
const CARDS = [
  {
    id: 'pathway::0',
    kind: 'image',
    mode: 'pathway',
    front:
      'Trace the pathway: Glycolysis – definition, sequence of reaction, energetics, regulation\n\nName the steps in order, the enzyme at each, and where it is blocked.',
    back: 'Cytoplasmic oxidation of glucose to pyruvate; net 2 ATP and 2 NADH per glucose.',
    imageUrl:
      'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/biochemistry/glycolysis_pathway_energetics.jpg',
    pathway: {
      steps: [
        { label: 'Glucose → Glucose-6-phosphate', detail: 'Hexokinase (glucokinase in liver). 1 ATP spent.' },
        { label: 'F6P → Fructose-1,6-bisphosphate', detail: 'PFK-1 — rate-limiting, irreversible. 1 ATP spent.' },
        { label: 'F1,6-BP → G3P + DHAP', detail: 'Aldolase splits the 6-carbon chain in two.' },
        { label: 'G3P → 1,3-BPG', detail: 'G3P dehydrogenase. The only NADH-yielding step.' },
        { label: '1,3-BPG → 3-phosphoglycerate', detail: 'Phosphoglycerate kinase. 2 ATP, substrate-level.' },
        { label: 'PEP → Pyruvate', detail: 'Pyruvate kinase. 2 ATP, irreversible.' },
      ],
      caption:
        'Net 2 ATP and 2 NADH per glucose. PFK-1 is the rate-limiting step, and the one every regulation question turns on.',
    },
    tags: ['diagram', 'biochemistry', 'flowchart'],
  },
  {
    id: 'pathway::1',
    kind: 'theory',
    mode: 'reasoning',
    front:
      'When the Rapoport-Luebering cycle operates in the red cell there is no net ATP generation. Why?',
    back: '1,3-BPG is diverted to 2,3-BPG, bypassing phosphoglycerate kinase — the ATP-yielding step is skipped.',
    hint: 'Which step is being bypassed?',
    tags: ['glycolysis', 'rbc'],
  },
  {
    id: 'pathway::2',
    kind: 'theory',
    mode: 'applied',
    front:
      'A 52-year-old man has total cholesterol 465 mg/dL and LDL 178 mg/dL. He is started on atorvastatin — what is its mechanism of action?',
    back: 'Competitive inhibition of HMG-CoA reductase, the rate-limiting enzyme of cholesterol synthesis; hepatic LDL receptors are upregulated.',
    tags: ['lipids', 'statin'],
  },
  {
    id: 'pathway::3',
    kind: 'theory',
    mode: 'recall',
    front: 'Rate-limiting enzyme of glycolysis, and its main allosteric activator?',
    back: 'Phosphofructokinase-1, activated by fructose-2,6-bisphosphate.',
    tags: ['glycolysis', 'regulation'],
  },
];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

const problems = [];
const seen = [];

/** The phone the front is judged at, and the height a whole revealed card needs. */
const PHONE = 980;
const TALL = 2000;

/**
 * Capture, and say honestly which of the two frames it is.
 *
 * `tall` raises the viewport for the shot and puts it back afterwards, so the
 * screen is re-laid-out at a height that fits the card rather than cropped to
 * one that does not. Never `fullPage` — see the header.
 */
async function shot(page, file, { tall = false, mustShow = [] } = {}) {
  const size = page.viewportSize();
  const height = tall ? TALL : size.height;
  if (tall) {
    await page.setViewportSize({ width: size.width, height: TALL });
    await page.waitForTimeout(450);
  }
  /*
   * The guard the first run needed: a piece of text can be in the DOM, satisfy
   * every assertion made against `innerText`, and still be below the bottom of
   * the frame. Anything named here has to be inside the rectangle that is about
   * to be written to disk.
   */
  for (const [selector, what] of mustShow) {
    const box = await page.locator(selector).first().boundingBox();
    if (!box) {
      problems.push(`${path.basename(file)}: "${what}" is not drawn at all`);
    } else if (box.y < 0 || box.y + box.height > height) {
      problems.push(
        `${path.basename(file)}: "${what}" is outside the captured frame ` +
          `(${Math.round(box.y)}..${Math.round(box.y + box.height)} of ${height})`,
      );
    }
  }
  await page.screenshot({ path: file });
  if (tall) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
  }
}

// ---------------------------------------------------------------------------
// 1. The native app, through react-native-web.
// ---------------------------------------------------------------------------
const vite = await createViteServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5209, strictPort: true },
  logLevel: 'error',
});
await vite.listen();

{
  const page = await browser.newPage({ viewport: { width: 412, height: PHONE }, deviceScaleFactor: 2 });
  page.on('pageerror', e => problems.push(`native page error: ${e}`));

  const servePlate = route =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: PLATE });
  await page.route(DIAGRAM_GLOB, servePlate);

  const go = async () => {
    await page.goto('http://localhost:5209/?screen=pathwaydemo&theme=dark', {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(1400);
  };
  await go();

  const front = await page.locator('body').innerText();
  seen.push(['native front', front.split('\n').slice(0, 10).join(' | ')]);
  if (!/PATHWAY/.test(front)) problems.push('native: the mode chip is missing on the front');
  if (/Hexokinase/.test(front)) problems.push('native: the chain is visible BEFORE Show answer');
  await shot(page, `${out}/native-1-front.png`, {
    mustShow: [['[aria-label="Show answer"]', 'Show answer']],
  });

  await page.locator('[aria-label="Show answer"]').first().click();
  await page.waitForTimeout(700);
  const back = await page.locator('body').innerText();
  seen.push(['native back', back.replace(/\n+/g, ' | ').slice(0, 420)]);
  for (const needed of ['Hexokinase', 'PFK-1', 'Pyruvate kinase', 'HIGH-YIELD', 'Net 2 ATP']) {
    if (!back.includes(needed)) problems.push(`native back is missing "${needed}"`);
  }
  if (back.includes('[object Object]')) problems.push('native: a step was stringified');
  if (!(await page.locator('[aria-label^="Step 1 of 6"]').count())) {
    problems.push('native: the steps carry no spoken ordinal — TalkBack would read fragments');
  }
  await shot(page, `${out}/native-2-back.png`, {
    tall: true,
    mustShow: [
      ['[aria-label^="Step 1 of 6"]', 'step 1'],
      ['[aria-label^="Step 6 of 6"]', 'step 6'],
      ['text=HIGH-YIELD', 'the HIGH-YIELD callout'],
      ['[aria-label^="Good,"]', 'the Good grade button'],
    ],
  });

  // The reasoning card, one grade on.
  await page.locator('[aria-label^="Good,"]').first().click();
  await page.waitForTimeout(700);
  await page.locator('[aria-label="Show answer"]').first().click();
  await page.waitForTimeout(500);
  const second = await page.locator('body').innerText();
  seen.push(['native card 2', second.replace(/\n+/g, ' | ').slice(0, 320)]);
  if (!/WHY|CLINICAL|RECALL/.test(second)) {
    problems.push('native: the second card shows no mode chip');
  }
  await shot(page, `${out}/native-3-reasoning.png`, {
    mustShow: [['[aria-label^="Good,"]', 'the Good grade button']],
  });

  // And the state the chain exists for: no plate.
  await page.unroute(DIAGRAM_GLOB, servePlate);
  await page.route(DIAGRAM_GLOB, route => route.abort());
  await go();
  await page.locator('[aria-label="Show answer"]').first().click();
  await page.waitForTimeout(900);
  const degraded = await page.locator('body').innerText();
  seen.push(['native no plate', degraded.replace(/\n+/g, ' | ').slice(0, 360)]);
  if (!degraded.includes('steps above are the answer')) {
    problems.push('native: a plate that failed to load does not say the steps still answer the card');
  }
  if (!degraded.includes('PFK-1')) problems.push('native: the chain vanished with the plate');
  await shot(page, `${out}/native-4-no-plate.png`, {
    tall: true,
    mustShow: [
      ['[aria-label^="Step 6 of 6"]', 'step 6'],
      ['text=HIGH-YIELD', 'the HIGH-YIELD callout'],
      ['text=steps above are the answer', 'the line that says the chain still answers it'],
    ],
  });
  await page.close();
}
await vite.close();

// ---------------------------------------------------------------------------
// 2. The web app, from dist/.
// ---------------------------------------------------------------------------
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2',
};
const distRoot = path.resolve(here, '..', '..', 'dist');
const httpd = createServer(async (req, res) => {
  const file = path.join(distRoot, decodeURIComponent(req.url.split('?')[0]));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(await readFile(path.join(distRoot, 'index.html')));
  }
});
await new Promise(r => httpd.listen(4329, r));

{
  const page = await browser.newPage({ viewport: { width: 430, height: PHONE }, deviceScaleFactor: 2 });
  page.on('pageerror', e => problems.push(`web page error: ${e}`));
  /*
   * The plate is served, or refused, depending on this flag rather than on a
   * re-route: `page.unroute` after a navigation has already been made is
   * fiddly, and the degraded run wants the same handler with the opposite
   * answer.
   */
  let platesLoad = true;
  await page.route(DIAGRAM_GLOB, route =>
    platesLoad
      ? route.fulfill({ status: 200, contentType: 'image/svg+xml', body: PLATE })
      : route.abort());
  await page.route('**/functions/v1/generate-flashcards', route =>
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        cached: true,
        deckKey: '1st Year::Biochemistry::carbohydrate-metabolism',
        cards: CARDS,
      }),
    }));

  const click = async (selector, what) => {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    await el.click();
    await page.waitForTimeout(800);
    seen.push(['web click', what]);
  };

  /**
   * Load the app and walk to the deck, from nothing.
   *
   * It is a function because the degraded run needs the same walk a second
   * time from a cleared store — the first run grades a card, and a card in
   * learning is not the one the queue hands back next.
   *
   * The chapter is named. The first version of this took whichever chapter came
   * first, which was MOLECULAR AND FUNCTIONAL ORGANISATION OF CELL — the stub
   * answers with the glycolysis deck whatever is opened, so the picture had one
   * chapter in its header and another chapter's cards under it. A screenshot
   * that contradicts itself is not evidence of anything.
   */
  const openDeck = async () => {
    await page.goto('http://localhost:4329/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    for (let i = 0; i < 8; i += 1) {
      if (!(await page.locator('[role="dialog"]').count())) break;
      const skip = page
        .locator('button', { hasText: /ok, continue|skip|maybe later|not now|close|got it|start|finish|let's go/i })
        .first();
      if (await skip.count()) { await skip.click({ force: true }); await page.waitForTimeout(400); }
      else { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
    }
    await click('[data-tour="nav-notes"]', 'Notes');
    await click('[aria-label="Anki-style flashcards, browse decks by year"]', 'Flashcards');
    await click('[aria-label^="1st Year"]', '1st Year');
    await click('[aria-label^="Biochemistry"]', 'Biochemistry');
    await click(
      'button[aria-label*="CARBOHYDRATE METABOLISM"][aria-label*="study flashcards"]',
      'CARBOHYDRATE METABOLISM',
    );
    await page.waitForTimeout(1500);
  };

  await openDeck();

  const front = await page.locator('body').innerText();
  seen.push(['web front', front.replace(/\n+/g, ' | ').slice(0, 320)]);
  if (!/PATHWAY/.test(front)) problems.push('web: the mode chip is missing on the front');
  if (/Hexokinase/.test(front)) problems.push('web: the chain is visible BEFORE Show answer');
  if (!/CARBOHYDRATE METABOLISM/i.test(front)) {
    problems.push('web: the deck opened is not the one the cards belong to');
  }
  await shot(page, `${out}/web-1-front.png`, {
    mustShow: [['button:has-text("Show answer")', 'Show answer']],
  });

  await page.locator('button', { hasText: 'Show answer' }).first().click();
  await page.waitForTimeout(800);
  const back = await page.locator('body').innerText();
  seen.push(['web back', back.replace(/\n+/g, ' | ').slice(0, 420)]);
  for (const needed of ['Hexokinase', 'PFK-1', 'Pyruvate kinase', 'HIGH-YIELD', 'Net 2 ATP']) {
    if (!back.includes(needed)) problems.push(`web back is missing "${needed}"`);
  }
  if (back.includes('[object Object]')) problems.push('web: a step was stringified');
  await shot(page, `${out}/web-2-back.png`, {
    tall: true,
    mustShow: [
      ['[aria-label^="Step 1 of 6"]', 'step 1'],
      ['[aria-label^="Step 6 of 6"]', 'step 6'],
      ['text=HIGH-YIELD', 'the HIGH-YIELD callout'],
      ['button[aria-label^="Good,"]', 'the Good grade button'],
    ],
  });

  await page.locator('button[aria-label^="Good,"]').first().click();
  await page.waitForTimeout(700);
  await page.locator('button', { hasText: 'Show answer' }).first().click();
  await page.waitForTimeout(600);
  const second = await page.locator('body').innerText();
  seen.push(['web card 2', second.replace(/\n+/g, ' | ').slice(0, 320)]);
  if (!/WHY|CLINICAL|RECALL/.test(second)) problems.push('web: the second card shows no mode chip');
  await shot(page, `${out}/web-3-reasoning.png`, {
    mustShow: [['button[aria-label^="Good,"]', 'the Good grade button']],
  });

  // And the same state the native side is driven into: the plate never arrives.
  platesLoad = false;
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await openDeck();
  await page.locator('button', { hasText: 'Show answer' }).first().click();
  await page.waitForTimeout(900);
  const webDegraded = await page.locator('body').innerText();
  seen.push(['web no plate', webDegraded.replace(/\n+/g, ' | ').slice(0, 360)]);
  if (!webDegraded.includes('steps above are the answer')) {
    problems.push('web: a plate that failed to load does not say the steps still answer the card');
  }
  if (!webDegraded.includes('PFK-1')) problems.push('web: the chain vanished with the plate');
  await shot(page, `${out}/web-4-no-plate.png`, {
    tall: true,
    mustShow: [
      ['[aria-label^="Step 6 of 6"]', 'step 6'],
      ['text=HIGH-YIELD', 'the HIGH-YIELD callout'],
      ['text=steps above are the answer', 'the line that says the chain still answers it'],
    ],
  });
  await page.close();
}

httpd.close();
await browser.close();

for (const [what, text] of seen) process.stdout.write(`  ${what}: ${text}\n`);
if (problems.length > 0) {
  process.stdout.write('\n');
  for (const p of problems) process.stdout.write(`  FAIL  ${p}\n`);
  process.stdout.write(`\n${problems.length} problem(s). Shots in ${out}\n`);
  process.exit(1);
}
process.stdout.write(`\nOK  a first-year pathway card draws on both apps, front and back, with and without its plate. Shots in ${out}\n`);
