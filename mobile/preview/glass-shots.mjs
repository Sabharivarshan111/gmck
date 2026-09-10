// Capture what the preview harness CAN show of the glass work.
//
// It is react-native-web in Chromium, so it renders GlassSurface's drawn bevel
// and every layout, and it renders the music player's controls. It cannot
// render the AGSL shader at all — there is no RuntimeShader in a browser — so
// the refraction fixes are not visible here and must not be claimed from these.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';

async function findChromium() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    const entries = await fs.readdir('/opt/pw-browsers');
    const [dir] = entries.filter(e => e.startsWith('chromium-')).sort().reverse();
    if (dir) return `/opt/pw-browsers/${dir}/chrome-linux/chrome`;
  } catch {}
  for (const c of ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome']) {
    try { await fs.access(c); return c; } catch {}
  }
  throw new Error('no Chromium found — set CHROME_PATH');
}

const here = '/home/user/gmck/mobile/preview';
const out = process.argv[2] ?? '/tmp/glassshots';

const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  root: here,
  server: { port: 5233 },
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

async function shot(name, { theme, screen, taps = [], settle = 1200 }) {
  await page.addInitScript(key => {
    try {
      window.localStorage.setItem('orbit:theme-preference', key);
      // Without a profile the app is on its onboarding screen, which is
      // correct and is not what any of these shots are of.
      window.localStorage.setItem(
        'orbit-profile-v1',
        JSON.stringify({ display_name: 'Orbit', year: 'second' }),
      );
    } catch {}
  }, theme);
  await page.goto(`http://localhost:5233/?screen=${screen}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { globalThis.__orbitPickFile = 'audio'; });
  await page.waitForTimeout(settle);
  for (const label of taps) {
    await page
      .locator(`[aria-label^="${label}"]`)
      .first()
      .click({ force: true, timeout: 15000 });
    await page.waitForTimeout(900);
  }
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('captured', name);
}

await shot('glass-01-home', { theme: 'liquidglass', screen: 'home' });
await shot('glass-02-timer', { theme: 'liquidglass', screen: 'timer' });
await shot('glass-03-music-open', {
  theme: 'liquidglass',
  screen: 'timer',
  taps: ['Show the music player'],
});
await shot('glass-04-music-dark', {
  theme: 'dark',
  screen: 'timer',
  taps: ['Show the music player'],
});
await shot('glass-05-progress', { theme: 'liquidglass', screen: 'progress' });

/*
 * The other half of the music fix: with a track loaded the play control FILLS.
 *
 * The bug was that both states used one control with a swapped background, so
 * with nothing to play it painted `primaryText` ink on a near-black disc — a
 * black triangle in a black hole. They are two controls now, and this is the
 * shot that shows the filled one is legible.
 */
await shot('glass-06-music-playing', {
  theme: 'liquidglass',
  screen: 'timer',
  taps: [
    'Show the music player',
    'Add music from this phone',
    // The chooser says what each option costs before either is picked.
    'Save a copy in Orbit',
  ],
});
await shot('glass-07-music-playing-dark', {
  theme: 'dark',
  screen: 'timer',
  taps: ['Show the music player', 'Add music from this phone', 'Save a copy in Orbit'],
});

await browser.close();
await server.close();
