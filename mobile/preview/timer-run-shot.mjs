// Run a real one-minute focus session and photograph the tree the whole way.
//
// Not the growth showcase and not a fixture: this drives the actual Timer
// screen, sets a custom one-minute session the way a reader does, presses
// Play, and photographs the dial across the whole minute — then reports which
// frame is drawn at each point and how far the fade into the next one has got.
//
// A minute is the honest length to test at. It is what was reported from, and
// it is the hardest case: growth covers 1/60 per tick, about 38% of a whole
// frame interval, so every second has to carry a third of a frame's worth of
// fade. A 25-minute session moves 25 times slower and would hide a step.
//
//   node preview/timer-run-shot.mjs [outDir]
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
  server: { port: 5217, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});
await fs.mkdir(outDir, { recursive: true });

await page.goto('http://localhost:5217/?screen=timer', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// A one-minute session, set the way a reader sets one.
await page.getByLabel('Set custom time').first().click();
await page.waitForTimeout(400);
await page.keyboard.type('1');
await page.getByLabel('Apply custom time').first().click();
await page.waitForTimeout(600);

/** The dial, so the frames can be read side by side rather than page by page. */
const dialBox = async () => {
  const box = await page.evaluate(() => {
    const node = document.querySelector('[aria-label*="grown"], [aria-label*="Plant a"]');
    let el = node;
    for (let i = 0; i < 6 && el?.parentElement; i += 1) {
      el = el.parentElement;
      const r = el.getBoundingClientRect();
      if (r.width > 220 && r.height > 220) {
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
    }
    return null;
  });
  return box;
};

/** Which frames are stacked, and how far the incoming one has faded in. */
const state = () =>
  page.evaluate(() => {
    const dial = document.querySelector('[aria-label*="grown"]');
    const label = dial ? dial.getAttribute('aria-label') : '(no tree)';
    const layers = dial
      ? [...dial.querySelectorAll('img')].map(img => {
          const file = (img.getAttribute('src') || '').split('/').pop() || '';
          /*
           * Walk up to whichever ancestor actually carries the inline opacity.
           * The animated wrapper is not always the image's direct parent, and
           * reading the wrong one reports every layer as fully opaque — which
           * looks exactly like a tree that snaps between frames.
           */
          let opacity = '1';
          let el = img.parentElement;
          for (let i = 0; i < 4 && el; i += 1) {
            if (el.style && el.style.opacity !== '') {
              opacity = el.style.opacity;
              break;
            }
            el = el.parentElement;
          }
          return { file, opacity };
        })
      : [];
    const clock = [...document.querySelectorAll('*')]
      .map(el => el.textContent || '')
      .filter(t => /^\d{2}:\d{2}$/.test(t.trim()))
      .pop();
    return { label, layers, clock: (clock || '').trim() };
  });

await page.getByLabel('Start timer').first().click();
await page.waitForTimeout(600);

const shots = [];
const rows = [];
const box = await dialBox();

/* Eight points across the minute — enough to see the shape of the growth. */
for (let i = 0; i < 8; i += 1) {
  const now = await state();
  const file = path.join(outDir, `timer-run-${String(i + 1).padStart(2, '0')}.png`);
  await page.screenshot({ path: file, clip: box ?? undefined });
  shots.push(file);
  rows.push({ clock: now.clock, label: now.label, layers: now.layers });
  await page.waitForTimeout(7000);
}

await page.screenshot({ path: path.join(outDir, 'timer-run-full.png') });
await browser.close();
await server.close();

process.stdout.write('\nclock  grown  frames on screen (incoming opacity)\n');
for (const r of rows) {
  const pct = /(\d+) per cent/.exec(r.label || '')?.[1] ?? '?';
  const layers = r.layers
    .map(l => `${l.file}${l.opacity === '1' ? '' : ` @${Number(l.opacity).toFixed(2)}`}`)
    .join('  +  ');
  process.stdout.write(`${(r.clock || '--:--').padEnd(7)}${String(pct).padStart(3)}%   ${layers}\n`);
}

const frames = new Set(rows.flatMap(r => r.layers.map(l => l.file)));
const faded = rows.filter(r => r.layers.some(l => l.opacity !== '1' && l.opacity !== '0'));
process.stdout.write(`\nshots  ${shots.length} of the dial in ${outDir}\n`);
process.stdout.write(
  `frames ${frames.size} distinct across the session; ${faded.length}/${rows.length} samples caught mid-fade\n`,
);

if (frames.size < 3) {
  process.stdout.write('FAIL   the tree barely changed frame across a whole session\n');
  process.exit(1);
}
process.stdout.write('OK     the tree advanced through its frames during the session\n');
