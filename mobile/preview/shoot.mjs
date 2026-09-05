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
  //
  // `plates=real` and the plate assertion are load-bearing on BOTH of these,
  // for the same reason they are on the two diagram screens below. These two
  // PNGs are what the ad renderer draws for every note shot in every one of
  // the nine ads, and the fixture's diagram section used to point at a
  // Supabase storage URL — unreachable from a sandbox, and gone from the
  // bucket in any case — so the capture quietly contained "This diagram could
  // not be loaded". It shipped in a published cut and was reported twice,
  // because nothing here was looking at what the diagram card actually drew.
  { name: 'notes-renderer', query: 'screen=notesdemo&plates=real', plates: 1 },
  {
    name: 'notes-renderer-bottom',
    query: 'screen=notesdemo&plates=real',
    plates: 1,
    scroll: 'bottom',
  },
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
  /*
   * The two note screens that carry a medical plate.
   *
   * `plates=real` makes them ask for the downloaded plates rather than the
   * harness's drawn stand-ins. They used to be captured by hand and committed
   * to `screenshots/`, and the ads copied those committed files in — which is
   * how a white rectangle reading "Types of synovial joint" and a "this
   * diagram could not be loaded" placeholder both ended up in a finished cut.
   * Captured here, they are rebuilt on every render like every other screen.
   *
   * With no plates on disk the harness falls back to the stand-ins, so this
   * still produces a usable screen locally.
   */
  /*
   * Scrolled, because this screen's diagrams sit at the end of the note.
   * `applyTopicDiagrams` is given no question order here, so none of the three
   * plates can be placed against a heading and all three fall to the trailing
   * append — correct behaviour, and it means the top of this screen is the
   * note's text. An ad frame of it has to reach the pictures.
   */
  { name: 'chapter-diagrams', query: 'screen=chapterdiagrams&plates=real', plates: 3, scroll: 'bottom' },
  { name: 'single-note-diagram', query: 'screen=diagramdemo&plates=real', plates: 1 },
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
/**
 * Screens that promised a real plate and did not get one.
 *
 * Collected rather than thrown, so one missing plate does not cost the whole
 * run of screens — but the process still exits non-zero at the end, because a
 * capture that silently substitutes a stand-in is exactly how this reached a
 * published advertisement.
 */
const plateProblems = [];

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  /*
   * Photograph the app with its motion stood down, and the reason is not
   * taste — it is that a screenshot of a moving screen is a coin toss.
   *
   * The home hero rotates every six seconds and cross-fades its headline and
   * quote on every change. A capture that lands in that window gets a large
   * empty card with the CREATED BY chip floating in it, and the committed
   * `glass-home.png` the ads use IS that frame: no headline, no quote. It went
   * out in a finished advertisement.
   *
   * `prefers-reduced-motion: reduce` is a mode this app already supports
   * properly — react-native-web maps the media query onto
   * `AccessibilityInfo.isReduceMotionEnabled`, `useReducedMotion()` reads it,
   * and every primitive honours it. Nothing is hidden by it: sheets and
   * breakdowns start fully open instead of animating in, the hero pins at full
   * opacity and stops rotating, the trees stop swaying and still draw. Every
   * screen ends up in its settled state, which is the state worth
   * photographing anyway.
   */
  reducedMotion: 'reduce',
});
const page = await context.newPage();

/*
 * Seed a theme before the app boots, so a preset can be photographed without
 * driving the theme sheet on every shot. `SHOOT_THEME=liquidglass` is how the
 * glass material gets reviewed at all — it is the one preset whose surfaces
 * differ from every other, and a screenshot of the default says nothing about
 * it.
 */
/*
 * Seed a profile, or every shot is the first-run gate.
 *
 * `FirstRun` is a full-screen Modal shown whenever the profile store has
 * hydrated with nothing in it, which on a fresh browser is every launch. It is
 * correct behaviour and it would silently replace all 33 screenshots with the
 * same welcome panel — the screenshots being the one thing here that can see
 * native-ish layout at all.
 *
 * One shot deliberately wants it. `SHOOT_FIRST_RUN=1` leaves the storage empty
 * so the gate itself can be photographed and reviewed.
 */
if (!process.env.SHOOT_FIRST_RUN) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'orbit-profile-v1',
        JSON.stringify({ display_name: 'Orbit', year: 'second' }),
      );
    } catch {}
  });
}

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
  /*
   * A screen that promises a diagram has to have loaded one.
   *
   * This is the check that was missing, and its absence is why an ad shipped
   * showing a white rectangle captioned "Types of synovial joint" and another
   * showing "this diagram could not be loaded". Both screens rendered
   * perfectly — the layout was right, the caption was right, the section was
   * in the right place — and the picture inside was a stand-in or a failure.
   * Nothing looking at the DOM would have noticed, because nothing looked.
   *
   * `naturalWidth` is the honest question: it is 0 for an image that has not
   * decoded, whatever its src says, so this catches a 404, a blocked host and
   * a zero-byte file alike. The src check catches the other half — a screen
   * that quietly fell back to the drawn stand-in, which decodes perfectly.
   */
  if (shot.plates) {
    const found = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .map(img => ({ src: img.currentSrc || img.src, w: img.naturalWidth }))
        .filter(i => i.src.includes('/plates/')),
    );
    const loaded = found.filter(i => i.w > 0);
    if (loaded.length < shot.plates) {
      plateProblems.push(
        `${shot.name}: wanted ${shot.plates} real plate(s), got ${loaded.length} ` +
          `loaded of ${found.length} referenced. ` +
          (found.length === 0
            ? 'None were even asked for — the harness fell back to the drawn stand-in, ' +
              'so the plates are not in preview/public/plates/.'
            : 'Referenced but not decoded — the files are missing or truncated.'),
      );
    }
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

if (plateProblems.length) {
  process.stdout.write(
    '\nA screen that promises a diagram did not photograph one:\n' +
      plateProblems.map(p => `  - ${p}`).join('\n') +
      '\n\nThese screens go into the ads. A stand-in or a broken image here is\n' +
      'what put a white rectangle captioned "Types of synovial joint", and a\n' +
      '"this diagram could not be loaded" placeholder, into a published cut.\n' +
      'Run `npm run plates` in remotion-ad/ first, or capture without\n' +
      '`plates=real` if you only want the layout.\n',
  );
  process.exitCode = 1;
}
