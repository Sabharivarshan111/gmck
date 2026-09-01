// Photograph every state of the avatar, on every theme that changes it.
//
// The engine's own check proves what it computes; this is the half no
// assertion covers — whether six states read as six expressions of one face,
// and whether the eyes survive an accent they were not designed against.
//
// That second one is the real risk and it is why this sweeps themes rather
// than shooting one. The reference is a dark body with white eyes. Here the
// body is the theme's accent, and an amber or cyan accent needs *black* eyes —
// `onColor` decides, and a screenshot is the only thing that shows it did.
//
//   node preview/bot-shot.mjs [outDir]
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
  server: { port: 5231, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
await fs.mkdir(outDir, { recursive: true });

const problems = [];
const note = (ok, what) => {
  process.stdout.write(`${ok ? '  ok  ' : ' FAIL '}${what}\n`);
  if (!ok) problems.push(what);
};

const STATES = ['idle', 'thinking', 'wide', 'wink', 'exclaim', 'sleep'];

for (const theme of ['dark', 'blackpink', 'liquidglass', 'light']) {
  const page = await browser.newPage({ viewport: { width: 412, height: 480 }, deviceScaleFactor: 2 });
  await page.addInitScript(key => {
    window.localStorage.setItem('orbit:theme-preference', key);
  }, theme);
  await page.goto('http://localhost:5231/?screen=botdemo', { waitUntil: 'networkidle' });
  // Past every morph, so what is photographed is each state at rest rather
  // than six frames of the same transition.
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(outDir, `bot-${theme}.png`) });

  const drawn = await page.evaluate(states => {
    const out = {};
    for (const state of states) {
      const host = document.querySelector(`[data-testid="bot-${state}"]`);
      const svg = host ? host.querySelector('svg') : null;
      if (!svg) {
        out[state] = null;
        continue;
      }
      const circle = svg.querySelector('circle');
      const paths = [...svg.querySelectorAll('path')];
      out[state] = {
        body: circle ? circle.getAttribute('fill') : null,
        r: circle ? Number(circle.getAttribute('r')) : 0,
        eyes: paths.length,
        eyeFill: paths[0] ? paths[0].getAttribute('fill') : null,
        // The composed transform is what carries the sphere; two states whose
        // eyes sit identically are two states that look the same.
        placement: paths.map(p => p.parentElement.getAttribute('transform')).join('|'),
      };
    }
    return out;
  }, STATES);

  const seen = new Map();
  for (const state of STATES) {
    const it = drawn[state];
    note(!!it, `${theme}: ${state} rendered`);
    if (!it) continue;
    note(it.eyes === 2 && it.r > 0, `${theme}: ${state} has a body and two eyes`);
    note(
      !!it.body && !!it.eyeFill && it.body.toLowerCase() !== it.eyeFill.toLowerCase(),
      `${theme}: ${state} eyes (${it.eyeFill}) are not the body colour (${it.body})`,
    );
    const twin = seen.get(it.placement);
    note(!twin, `${theme}: ${state} looks different from ${twin ?? 'the others'}`);
    seen.set(it.placement, state);
  }

  await page.close();
}

await browser.close();
await server.close();

process.stdout.write(
  `\n${problems.length === 0 ? 'OK  6 states, 4 themes, every face distinct and every eye visible' : `${problems.length} problem(s)`}\n`,
);
process.exit(problems.length === 0 ? 0 : 1);
