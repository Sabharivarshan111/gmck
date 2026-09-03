// Dev-only screenshot harness.
//
// Renders the React Native screens through react-native-web (see
// preview/main.tsx) and captures them at handset size, so UI work can be
// reviewed without an emulator.
//
// This is NOT a device. It shares the app's components and styles, but not its
// native rendering — text metrics, shadows, ripples and gesture handling all
// differ. Treat what it produces as a layout check, never as proof that
// something works on a phone.
//
//   node preview/shoot.mjs [outDir]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] ?? path.join(here, '..', '..', 'screenshots'));

const SHOTS = [
  { name: 'home', query: 'screen=home' },
  // Long screens need their tail checked too — a footer that overlaps the tab
  // bar or a card clipped by the scroll container is invisible from the top.
  { name: 'home-bottom', query: 'screen=home', scroll: 'bottom' },
  { name: 'browse', query: 'screen=browse' },
  // Final year is the only year with six subjects, so it is the one browse
  // screen whose list fills the phone. The ads use it: second year has three
  // rows and then half a screen of black, which reads as an empty app in a
  // wide shot however true it is.
  { name: 'browse-final', query: 'screen=browse&year=final-year' },
  { name: 'notes', query: 'screen=notes' },
  { name: 'timer', query: 'screen=timer' },
  { name: 'askai', query: 'screen=askai' },
  { name: 'progress', query: 'screen=progress' },
  {
    name: 'questions',
    query: 'screen=browse&year=second-year&node=pathology&title=Pathology',
  },
  {
    name: 'questions-chapters',
    query: 'screen=browse&year=second-year&node=pathology,paper-1&title=Paper%201',
  },
  {
    name: 'questions-leaf',
    query: 'screen=browse&year=second-year&node=pathology,paper-1,cell-injury&title=Cell%20Injury',
  },
  // Both themes get captured. A palette change that only ever gets eyeballed
  // in dark is a palette change that breaks light.
  { name: 'notes-bottom', query: 'screen=notes', scroll: 'bottom' },
  // The handwritten-notes renderer against the fixture, top and bottom: the
  // top shows the diagram card, the bottom the regenerate button and the AI
  // edit box.
  { name: 'notes-renderer', query: 'screen=notesdemo' },
  { name: 'notes-renderer-bottom', query: 'screen=notesdemo', scroll: 'bottom' },
  // The flashcards walk, and the chat's new controls.
  { name: 'flashcards-decks', query: 'screen=flashcards' },
  // The daily limit and the pacing clock live below the fold.
  { name: 'flashcards-decks-bottom', query: 'screen=flashcards', scroll: 'bottom' },
  { name: 'chatdemo', query: 'screen=chatdemo' },
  { name: 'anki-study', query: 'screen=ankidemo' },
  { name: 'progress-bottom', query: 'screen=progress', scroll: 'bottom' },
  { name: 'timer-bottom', query: 'screen=timer', scroll: 'bottom' },
  { name: 'treegallery', query: 'screen=treegallery' },
  { name: 'treegallery-bottom', query: 'screen=treegallery', scroll: 'bottom' },
  { name: 'growthshowcase', query: 'screen=growthshowcase' },
  { name: 'usernotes-edit', query: 'screen=usernotesdemo&mode=edit' },
  { name: 'usernotes-preview', query: 'screen=usernotesdemo&mode=preview' },
  { name: 'usernotes-preview-light', query: 'screen=usernotesdemo&mode=preview&theme=light' },
  { name: 'home-edit', query: 'screen=homeedit' },
  { name: 'home-edit-bottom', query: 'screen=homeedit', scroll: 'bottom' },
  { name: 'home-resized', query: 'screen=homeresized' },
  { name: 'tca-note', query: 'screen=tcanote' },
  { name: 'tca-note-bottom', query: 'screen=tcanote', scroll: 'bottom' },
  { name: 'home-light', query: 'screen=home&theme=light' },
  { name: 'progress-light', query: 'screen=progress&theme=light' },
];

const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5199, strictPort: true },
  logLevel: 'error',
});
await server.listen();

await fs.mkdir(outDir, { recursive: true });

async function findChromiumExecutable() {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }
  // Linux container path (Claude Code sandbox)
  try {
    const entries = await fs.readdir('/opt/pw-browsers');
    const [chromeDir] = entries
      .filter(entry => entry.startsWith('chromium-'))
      .sort()
      .reverse();
    if (chromeDir) {
      return `/opt/pw-browsers/${chromeDir}/chrome-linux/chrome`;
    }
  } catch {}

  // macOS / Linux standard paths
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
  }
  return undefined;
}

const executablePath = await findChromiumExecutable();
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ['--no-sandbox', '--font-render-hinting=none'],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

/*
 * Seed a theme before the app boots, so a preset can be photographed without
 * driving the theme sheet on every shot. `SHOOT_THEME=liquidglass` is how the
 * glass material gets reviewed at all — it is the one preset whose surfaces
 * differ from every other, and a screenshot of the default says nothing about
 * it.
 */
const shootTheme = process.env.SHOOT_THEME ?? '';
if (shootTheme) {
  await page.addInitScript(key => {
    window.localStorage.setItem('orbit:theme-preference', key);
  }, shootTheme);
}

/**
 * Console noise that is a property of the harness, not of the app.
 *
 * These are ignored with a reason rather than by widening the check, because
 * the check is worth keeping: an uncaught exception (`pageerror`) is always
 * fatal, and so is any console error not listed here.
 *
 * This list did not exist while nothing ran shoot.mjs on a machine with real
 * network. The ad-video pipeline does, and it failed on its first green
 * capture of all 33 screens — the runner reached Supabase, got the 401 a
 * session-less harness must get, and the run died with every screenshot
 * already correct on disk.
 */
const IGNORED = [
  {
    // react-native-web forwards RN's `collapsable` prop to the DOM, where it is
    // not a boolean attribute. Unconditional, on every screen, forever.
    match: /non-boolean attribute|collapsable/i,
    why: 'react-native-web forwards RN’s collapsable prop to the DOM',
  },
  {
    // The harness never signs in, so every authenticated Supabase call is a
    // 401 by design. On a sandbox with no egress these never fire at all,
    // which is why this only ever failed on a runner.
    match: /status of 401/i,
    why: 'the preview harness has no session; authenticated calls must 401',
  },
  {
    // Chromium asks for /favicon.ico on its own and the harness has none.
    // Scoped to that one path, so any other 404 is still a failure.
    match: /favicon\.ico/i,
    why: 'the browser asks for a favicon the preview harness does not ship',
  },
  {
    // The agent sandboxes route through a proxy that refuses Supabase, so the
    // same calls fail before they get a status. On a CI runner, which has
    // egress, these become the 401 above. Either way it is the environment
    // answering, not the app — and the failing URLs are printed regardless.
    match: /ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY|ERR_NAME_NOT_RESOLVED|ERR_ABORTED/i,
    why: 'no egress to Supabase from this environment',
  },
];

const errors = [];
const ignored = [];

/** Records the URL behind a bare "Failed to load resource", which never said. */
const failedUrls = [];
page.on('response', response => {
  if (response.status() >= 400) {
    failedUrls.push(`${response.status()} ${response.url()}`);
  }
});
// A request that never got a response has no status — a blocked host, DNS, a
// refused proxy. Those are exactly the ones the console describes as a bare
// "Failed to load resource" with no clue which resource.
page.on('requestfailed', request => {
  failedUrls.push(
    `${request.failure()?.errorText ?? 'failed'} ${request.url()}`,
  );
});

function record(text) {
  const excuse = IGNORED.find(entry => entry.match.test(text));
  if (excuse) {
    ignored.push(excuse.why);
  } else {
    errors.push(text);
  }
}

// An uncaught exception is never excused.
page.on('pageerror', error => errors.push(`uncaught: ${error.message}`));
page.on('console', message => {
  if (message.type() !== 'error') {
    return;
  }
  // A "Failed to load resource" carries no URL in its text, and a request that
  // is served a 404 by a worker or another frame never reaches the listeners
  // above. The console message's own location does know which one it was.
  const where = message.location?.()?.url;
  record(where ? `${message.text()}  <- ${where}` : message.text());
});

for (const shot of SHOTS) {
  if (shot.name === 'home-resized') {
    await page.goto(`http://localhost:5199/?${shot.query}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.localStorage.setItem(
        'orbit:home-order-v1',
        JSON.stringify({
          order: ['hero', 'quick', 'whatsapp', 'subjects', 'stats'],
          scales: { hero: 0.55, quick: 0.65, whatsapp: 0.75, subjects: 1.0, stats: 0.65 },
        }),
      );
    });
    await page.reload({ waitUntil: 'networkidle' });
  } else {
    await page.goto(`http://localhost:5199/?${shot.query}`, { waitUntil: 'networkidle' });
  }
  // Let springs settle and fonts swap in.
  await page.waitForTimeout(1200);
  if (shot.scroll === 'bottom') {
    // react-native-web renders ScrollView as an overflow container, so the
    // window does not scroll — find the scroller and drive it directly.
    await page.evaluate(() => {
      // Pick the *deepest, tallest* overflowing element. Taking the first
      // match walks into an ancestor that barely overflows and moves nothing.
      const candidates = [...document.querySelectorAll('div')]
        .filter(node => node.scrollHeight > node.clientHeight + 40)
        .sort(
          (a, b) =>
            b.scrollHeight - b.clientHeight - (a.scrollHeight - a.clientHeight),
        );
      for (const node of candidates) {
        node.scrollTop = node.scrollHeight;
      }
    });
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(outDir, `${shot.name}.png`) });
  process.stdout.write(`captured ${shot.name}\n`);
}

await browser.close();
await server.close();

if (ignored.length) {
  const counts = new Map();
  for (const why of ignored) {
    counts.set(why, (counts.get(why) ?? 0) + 1);
  }
  process.stdout.write('\nIgnored, with reason:\n');
  for (const [why, n] of counts) {
    process.stdout.write(`  ${String(n).padStart(3)} x ${why}\n`);
  }
}

if (errors.length) {
  process.stdout.write(`\nRuntime errors seen while capturing:\n${errors.join('\n')}\n`);
  // A bare "Failed to load resource" never said which one. Now it can.
  if (failedUrls.length) {
    process.stdout.write(`\nRequests that failed:\n  ${failedUrls.join('\n  ')}\n`);
  }
  process.exitCode = 1;
}
