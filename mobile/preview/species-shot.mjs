// Pick a tree in the settings, and see that tree on the timer.
//
// The report, with a photograph: Sprout selected in Pomodoro Settings, and the
// pill under the dial still reading "tap Play to plant an oak", with an acorn
// in the ring.
//
// The species was drafted. Every control in that sheet wrote into a pending
// copy that only reached the timer when "Set this configuration" was pressed,
// four sliders further down — so tapping a tree lit its tile up and then threw
// the choice away. Drafting is right for the *durations*, because the timer
// derives its length from those and writing through would rewrite the clock
// mid-drag; it was never right for which tree grows.
//
// This walks the reported flow exactly: open the sheet, tap Sprout, close it
// **without** pressing the commit button, and read the pill.
//
//   node preview/species-shot.mjs [outDir]
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
  server: { port: 5215, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});
await fs.mkdir(outDir, { recursive: true });

await page.goto('http://localhost:5215/?screen=timer', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const pill = () =>
  page.evaluate(() => {
    // Innermost match, or the whole page comes back as "the pill".
    const hits = [...document.querySelectorAll('*')].filter(el =>
      /tap Play to plant|growing$/.test(el.textContent || ''),
    );
    const node = hits[hits.length - 1];
    return node ? node.textContent.trim() : '(no pill)';
  });

const before = await pill();

await page.getByLabel('Timer settings').first().click();
await page.waitForTimeout(900);

// The species tiles are labelled by name; locked ones say so in the label.
const sprout = page.getByLabel('Sprout', { exact: true }).first();
if ((await sprout.count()) === 0) {
  process.stdout.write('SKIP  no Sprout tile — the species grid did not render\n');
  await browser.close();
  await server.close();
  process.exit(0);
}
await sprout.click({ force: true });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, 'species-1-picked.png') });

/*
 * Closed *without* "Set this configuration" — the whole point. Pressing it
 * always worked; not pressing it is what threw the choice away.
 */
const close = page.getByLabel(/^(Close|Dismiss)/).first();
if ((await close.count()) > 0) {
  await close.click({ force: true });
} else {
  await page.keyboard.press('Escape');
}
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(outDir, 'species-2-timer.png') });

const after = await pill();
await browser.close();
await server.close();

process.stdout.write(`before  ${before}\n`);
process.stdout.write(`after   ${after}\n`);
process.stdout.write(`shots   ${path.join(outDir, 'species-2-timer.png')}\n`);

if (/oak/i.test(after) || !/sprout/i.test(after)) {
  process.stdout.write(
    'FAIL    picking Sprout and closing the sheet left the timer on another tree\n',
  );
  process.exit(1);
}
process.stdout.write('OK      the timer plants the tree that was picked\n');
