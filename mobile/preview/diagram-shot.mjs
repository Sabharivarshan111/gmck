// Screenshot the top of the TCA cycle note — the screen the bug was reported on.
//
// The report was a photograph of the phone: "High-Yield Visual Exam Diagram
// (1/3)" showing a **Glycolysis** plate, "(2/3)" showing **Gluconeogenesis**,
// and the TCA cycle's own diagram third. This captures the same screen after
// the lookup was changed from a keyword search to an identity join on
// `question_diagrams.question_id`.
//
// The sandbox is firewalled from the storage bucket (the agent proxy answers
// 403 to CONNECT for pmtgeydtqypwrypshhsx.supabase.co), so the JPEG itself
// cannot be fetched here. Rather than leave a broken image and call it a
// screenshot, the request is intercepted and answered with a card naming the
// exact file the app asked for — so the picture in the shot is honest about
// being a stand-in, and still shows *which* diagram was chosen.
//
//   node preview/diagram-shot.mjs [outDir]
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

/** A stand-in that says what it is standing in for. */
const placeholder = file => `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="660">
  <rect width="880" height="660" fill="#ffffff"/>
  <rect x="10" y="10" width="860" height="640" fill="none" stroke="#c8ccd4" stroke-width="2" stroke-dasharray="10 8"/>
  <text x="440" y="270" text-anchor="middle" font-family="monospace" font-size="27" fill="#0f172a">${file}</text>
  <text x="440" y="330" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#64748b">the diagram this question resolved to</text>
  <text x="440" y="374" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#94a3b8">image bytes not fetched: the sandbox cannot reach the storage bucket</text>
</svg>`;

const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5209, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});

const requested = [];
await page.route('**/storage/v1/object/public/diagrams/**', route => {
  const file = route.request().url().split('/diagrams/')[1];
  requested.push(file);
  route.fulfill({ contentType: 'image/svg+xml', body: placeholder(file) });
});

await fs.mkdir(outDir, { recursive: true });
await page.goto('http://localhost:5209/?screen=diagramdemo', {
  waitUntil: 'networkidle',
});
await page.waitForTimeout(900);

const shot = path.join(outDir, 'tca-note-diagram.png');
await page.screenshot({ path: shot });

/*
 * The assertion the screenshot is evidence for: one diagram card, not three,
 * and it is this question's. A shot nobody reads proves nothing, so the count
 * is checked here too.
 */
const cards = await page.getByText(/High-Yield Visual Exam Diagram/).count();
const numbered = await page.getByText(/Visual Exam Diagram \(\d+\/\d+\)/).count();

await browser.close();
await server.close();

process.stdout.write(`shot   ${shot}\n`);
const distinct = [...new Set(requested)];
process.stdout.write(`images ${distinct.join(', ') || '(none requested)'}\n`);
process.stdout.write(`cards  ${cards} diagram card(s), ${numbered} numbered\n`);

if (cards !== 1 || numbered !== 0 || distinct.length !== 1) {
  process.stdout.write(
    'FAIL   the note should carry exactly one diagram card, unnumbered, for one image\n',
  );
  process.exit(1);
}
if (!distinct[0].includes('tca_cycle')) {
  process.stdout.write(`FAIL   the diagram on screen is ${distinct[0]}\n`);
  process.exit(1);
}
process.stdout.write('OK     one diagram, and it is the TCA cycle plate\n');
