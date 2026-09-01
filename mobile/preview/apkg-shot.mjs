// Walk the Anki import the way a reader does, and photograph it.
//
// `npm run check:apkg` proves the reading: it opens real .apkg files in all
// three package versions, decompresses them, runs the app's own queries
// against a stock SQLite and checks the cards that come out. What it cannot
// show is the screens, and the screens are most of this feature — the part
// people get stuck on is not tapping Import, it is knowing where an .apkg
// comes from at all.
//
// So this opens Flashcards, finds the new row under "Decks you write", reads
// the instructions, picks a package and chooses a deck out of it.
//
//   node preview/apkg-shot.mjs [outDir]
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
  server: { port: 5225, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});
await fs.mkdir(outDir, { recursive: true });

const failures = [];
const steps = [];
const shot = async name => {
  const file = path.join(outDir, `apkg-${name}.png`);
  await page.screenshot({ path: file });
  return file;
};

await page.goto('http://localhost:5225/?screen=flashcards', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

/* --------------------------------------------------- the row on the hub */

const row = page.getByLabel('Import your Anki cards from an apkg file').first();
if ((await row.count()) === 0) {
  failures.push('there is no "Import your Anki cards" row on the flashcards hub');
} else {
  /*
   * It has to sit under "Decks you write", which is where it was asked for
   * and where it belongs: both are decks that are the reader's own rather
   * than ones this app made.
   */
  const order = await page.evaluate(() => {
    const own = document.querySelector('[aria-label^="Your own decks"]');
    const imported = document.querySelector('[aria-label^="Import your Anki cards"]');
    if (!own || !imported) return null;
    return {
      own: own.getBoundingClientRect().top,
      imported: imported.getBoundingClientRect().top,
    };
  });
  if (order && order.imported <= order.own) {
    failures.push('the import row is above "Decks you write" rather than under it');
  }
  steps.push({ name: 'hub', file: await shot('1-hub') });

  await row.click({ force: true });
  await page.waitForTimeout(900);

  /* ------------------------------------------------- the instructions */

  const text = await page.evaluate(() => document.body.innerText);
  for (const wanted of ['ankiweb.net', 'Downloads', 'Export', 'apkg']) {
    if (!text.includes(wanted)) {
      failures.push(`the instructions never mention ${wanted}`);
    }
  }
  // The honest part: what does not come across.
  if (!/fonts and colours are not kept|shown as text/i.test(text)) {
    failures.push('the screen does not say what an import loses');
  }
  steps.push({ name: 'instructions', file: await shot('2-instructions') });

  /* ------------------------------------------------------- picking one */

  await page.evaluate(() => {
    globalThis.__orbitPickApkg = true;
  });
  const choose = page.getByLabel('Choose an apkg file to import').first();
  if ((await choose.count()) === 0) {
    failures.push('there is no button to choose a file');
  } else {
    await choose.click({ force: true });
    await page.waitForTimeout(1200);

    const after = await page.evaluate(() => document.body.innerText);
    // The fixture is a three-deck package, so the chooser has to appear —
    // taking all thirty chapters of a shared deck is how a phone ends up with
    // thirty thousand cards nobody asked for.
    if (!after.includes('Upper Limb')) {
      failures.push('the decks inside the package are not listed');
    }
    if (!/612 cards|Import \d+ cards/.test(after)) {
      failures.push('the screen does not say how many cards would be imported');
    }
    steps.push({ name: 'chooser', file: await shot('3-chooser') });

    // Narrowing to one deck must change the count.
    const before = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[aria-label^="Import "]')].pop();
      return el ? el.getAttribute('aria-label') : null;
    });
    const thorax = page.getByLabel(/^Anatomy::Thorax/).first();
    if ((await thorax.count()) > 0) {
      await thorax.click({ force: true });
      await page.waitForTimeout(500);
      const now = await page.evaluate(() => {
        const el = [...document.querySelectorAll('[aria-label^="Import "]')].pop();
        return el ? el.getAttribute('aria-label') : null;
      });
      if (before && now && before === now) {
        failures.push(`unticking a deck did not change the count (${now})`);
      }
      steps.push({ name: 'narrowed', file: await shot('4-narrowed'), note: `${before} -> ${now}` });
    }
  }
  await page.evaluate(() => {
    globalThis.__orbitPickApkg = undefined;
  });
}

/* ------------------------------------------------ sharing a deck you wrote */

/*
 * The other direction. A deck somebody typed is stuck on their phone unless it
 * can be handed to somebody, and "export as .apkg" means nothing to a reader
 * who has never used Anki — so the button has to be findable and the screen
 * has to say what the file is.
 */
await page.goto('http://localhost:5225/?screen=flashcards', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.getByLabel('Your own decks, write and study your own cards').first().click({ force: true });
await page.waitForTimeout(800);

// A deck with a card in it, so the share button is reachable at all.
await page.getByPlaceholder(/Cranial nerves/i).first().fill('Cranial nerves');
await page.getByLabel('Create this deck').first().click({ force: true });
await page.waitForTimeout(900);
await page.getByPlaceholder(/front/i).first().fill('Which nerve is CN VII?');
await page.getByPlaceholder(/back/i).first().fill('The facial nerve');
await page.getByLabel('Add this card').first().click({ force: true });
await page.waitForTimeout(700);
await page.getByLabel('Back').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);

const shareButton = page.getByLabel(/^Share .* as an Anki file$/).first();
if ((await shareButton.count()) === 0) {
  failures.push('a deck with cards in it has no share button');
} else {
  const body = await page.evaluate(() => document.body.innerText);
  for (const wanted of ['.apkg', 'Anki', 'Import your Anki cards']) {
    if (!body.includes(wanted)) {
      failures.push(`the sharing explanation never mentions ${wanted}`);
    }
  }
  // The one fact people get wrong about sharing: it is a copy, not a link.
  if (!/sends a copy|send it again/i.test(body)) {
    failures.push('the screen does not say that sharing sends a copy');
  }
  steps.push({ name: 'share', file: await shot('5-share') });

  await shareButton.click({ force: true });
  await page.waitForTimeout(1200);
  const opened = await page.evaluate(() => globalThis.__orbitSharedApkg === true);
  if (!opened) {
    failures.push('pressing share never reached the share sheet');
  }
  steps.push({ name: 'shared', file: await shot('6-shared') });
}

await browser.close();
await server.close();

for (const step of steps) {
  process.stdout.write(`ok    ${step.name.padEnd(14)} ${step.file}${step.note ? `  (${step.note})` : ''}\n`);
}
if (failures.length > 0) {
  process.stdout.write(`\nFAIL ${failures.length} problem(s):\n`);
  for (const line of failures) {
    process.stdout.write(`  - ${line}\n`);
  }
  process.exit(1);
}
process.stdout.write('\nOK   the import screens are reachable and say where a deck comes from\n');
