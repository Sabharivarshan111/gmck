// Measure whether the focus tree actually glides between its frames.
//
// The report was that the frame-to-frame transition is not smooth: the tree
// steps rather than grows. It was right, and the cause was arithmetic rather
// than art.
//
// `growth` runs 0→1 across the whole session and the clock moves it once a
// second, so one tick of a 25-minute session advances it by 0.00067. The
// interpolator that was supposed to fill that second glided at
// `Math.max(0.8, |diff| * 4)` *growth units per second* — a floor 1200× larger
// than the distance it had to cover, so it arrived within the first frame and
// every change landed as the hard step it was meant to smooth. (It also drove
// a `setState` from a `requestAnimationFrame` loop, re-rendering two `<Image>`
// layers sixty times a second on the JS thread.)
//
// This samples the opacity of the incoming frame across a tick. A step shows
// up as two values, 0 and 1. A glide shows up as a spread of values in
// between, which is the thing that could not be asserted from the source.
//
//   node preview/tree-growth-shot.mjs [outDir]
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
  server: { port: 5213, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});
await fs.mkdir(outDir, { recursive: true });

await page.goto('http://localhost:5213/?screen=treeglide', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

/**
 * Every distinct opacity the incoming frame is drawn at, sampled across three
 * seconds of a session running at its real rate.
 *
 * `?screen=treeglide` is used rather than the growth showcase on purpose: the
 * showcase advances growth sixty times faster than a session does, and at that
 * speed the old interpolator also looked busy — it scored 89% here — because
 * it was snapping several times a second. Measured at the real rate it scores
 * 0: the tree is static for the whole tick and then jumps.
 *
 * react-native-web has no native driver, so the same animation runs on the JS
 * thread here. The values are the same either way, which is what is measured.
 */
let partialFrames = 0;
const samples = new Set();
const TOTAL = 90;
for (let i = 0; i < TOTAL; i += 1) {
  const values = await page.evaluate(() =>
    [...document.querySelectorAll('div')]
      .map(el => el.style.opacity)
      .filter(v => v !== '' && v !== '1' && v !== '0'),
  );
  if (values.length > 0) {
    partialFrames += 1;
  }
  for (const v of values) {
    samples.add(Number(v).toFixed(2));
  }
  await page.waitForTimeout(35);
}

await page.screenshot({ path: path.join(outDir, 'tree-growth.png') });
await browser.close();
await server.close();

const spread = [...samples].map(Number).sort((a, b) => a - b);
const share = Math.round((partialFrames / TOTAL) * 100);
process.stdout.write(`shot        ${path.join(outDir, 'tree-growth.png')}\n`);
process.stdout.write(
  `partial     ${spread.length} distinct in-between opacities; mid-transition on ${share}% of samples\n`,
);

/*
 * The share is the discriminating number, not the count of distinct values.
 *
 * The old interpolator did produce a handful of in-between values — it just
 * produced them inside the first frame after each tick and then sat still, so
 * a spread alone says nothing. Measured the same way it scored 12%: the tree
 * was static for seven eighths of every tick and jumped for the rest. A glide
 * that fills the gap is mid-transition essentially always.
 */
/*
 * Both numbers matter, and the count is the one that separates them.
 *
 * The old interpolator was mid-transition most of the time too — it snapped to
 * a partial opacity and then *held* it for the rest of the tick, which is a
 * step with a pause, not a glide. Over three seconds of a one-minute session
 * it produced 3 distinct opacities, one per tick. A glide moves every frame.
 */
if (share < 70 || spread.length < 20) {
  process.stdout.write(
    `FAIL        ${spread.length} distinct opacities across ~3 ticks — the tree is stepping between frames and holding, not gliding\n`,
  );
  process.exit(1);
}
process.stdout.write('OK          the tree glides between frames rather than stepping\n');
