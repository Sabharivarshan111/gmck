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

const wallpaperUri = await (await import('node:fs/promises')).readFile('/tmp/wallpaper.b64', 'utf8');

async function shot(name, { theme, screen, taps = [], settle = 1200, wallpaper = false }) {
  await page.addInitScript(
    ([key, uri]) => {
      try {
        window.localStorage.setItem('orbit:theme-preference', key);
        // Without a profile the app is on its onboarding screen, which is
        // correct and is not what any of these shots are of.
        window.localStorage.setItem(
          'orbit-profile-v1',
          JSON.stringify({ display_name: 'Orbit', year: 'second' }),
        );
        if (uri) {
          // A data: URI rather than a file, because the harness is a browser
          // and a file:// wallpaper would never load. The app only cares that
          // `uri` is something <Image> can take.
          window.localStorage.setItem(
            'orbit:wallpaper',
            JSON.stringify({ uri, kind: 'image', dim: 0.55 }),
          );
        } else {
          window.localStorage.removeItem('orbit:wallpaper');
        }
      } catch {}
    },
    [theme, wallpaper ? wallpaperUri : null],
  );
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

/*
 * With a wallpaper, which is the case the material was designed for.
 *
 * Translucency over a flat colour gives back the flat colour; there is nothing
 * behind a card to show through. A picture is the one thing four picked colours
 * could never supply, which is why the shader gates on one and why Apple
 * demonstrates this material over photographs.
 */
await shot('glass-08-wallpaper-home', { theme: 'liquidglass', screen: 'home', wallpaper: true });
await shot('glass-09-wallpaper-progress', {
  theme: 'liquidglass',
  screen: 'progress',
  wallpaper: true,
});
await shot('glass-10-wallpaper-music', {
  theme: 'liquidglass',
  screen: 'timer',
  wallpaper: true,
  taps: ['Show the music player', 'Add music from this phone', 'Save a copy in Orbit'],
});


await shot('unlock-01-card', { theme: 'dark', screen: 'unlockdemo' });
await shot('unlock-02-card-glass', { theme: 'liquidglass', screen: 'unlockdemo' });

await browser.close();
await server.close();
