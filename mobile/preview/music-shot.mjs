// Open the music player on the Timer screen, add a track, and photograph it.
//
// This walks the flow a reader walks — tap the music button, watch the card
// grow in below it, add a track from the phone, play it — and asserts the
// things a screenshot alone cannot say: that the card really did animate
// rather than appear, that it sits between the controls and the presence box,
// that the cover art the file carried is on screen, and that the close button
// takes it away again.
//
//   node preview/music-shot.mjs [outDir]
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
  server: { port: 5222, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});
await fs.mkdir(outDir, { recursive: true });

/** '' for the stored default, or a preset key to seed before the app boots. */
const preset = process.env.MUSIC_SHOT_THEME ?? '';
const tag = preset ? `-${preset}` : '';

const problems = [];
const note = (ok, what) => {
  process.stdout.write(`${ok ? '  ok  ' : ' FAIL '}${what}\n`);
  if (!ok) problems.push(what);
};

if (preset) {
  await page.addInitScript(key => {
    window.localStorage.setItem('orbit:theme-preference', key);
  }, preset);
}

await page.goto('http://localhost:5222/?screen=timer', { waitUntil: 'networkidle' });
// The picker is opt-in in the shim, the same way a real one needs a tap.
await page.evaluate(() => {
  globalThis.__orbitPickFile = 'audio';
});
await page.waitForTimeout(900);

await page.screenshot({ path: path.join(outDir, `music${tag}-01-closed.png`) });
note(
  (await page.getByLabel('Show the music player').count()) === 1,
  'the music button is where the break button was',
);

/** How tall the reveal container is right now — 0 while it is closed. */
const revealHeight = () =>
  page.evaluate(() => {
    const card = document.querySelector('[aria-label="Close the music player"]');
    if (!card) return 0;
    let el = card;
    for (let i = 0; i < 8 && el.parentElement; i += 1) {
      el = el.parentElement;
      if (getComputedStyle(el).overflow === 'hidden') {
        return el.getBoundingClientRect().height;
      }
    }
    return -1;
  });

await page.getByLabel('Show the music player').first().click();
// Mid-flight: the card must be part-way, not already there.
await page.waitForTimeout(90);
const midway = await revealHeight();
await page.screenshot({ path: path.join(outDir, `music${tag}-02-opening.png`) });
await page.waitForTimeout(700);
const settled = await revealHeight();
await page.screenshot({ path: path.join(outDir, `music${tag}-03-open.png`) });

note(settled > 120, `the card is open (${Math.round(settled)}px tall)`);
note(
  midway > 0 && midway < settled - 20,
  `it grew rather than appeared (${Math.round(midway)}px of ${Math.round(settled)}px at 90ms)`,
);

/** Where each landmark sits down the page. */
const order = () =>
  page.evaluate(() => {
    const y = sel => {
      const el = document.querySelector(sel);
      return el ? el.getBoundingClientRect().top : null;
    };
    return {
      button: y('[aria-label*="the music player"]'),
      card: y('[aria-label="Close the music player"]'),
      presence: (() => {
        // The lowest element that still carries only this sentence — react
        // -native-web nests text, so matching on the outermost one would
        // return an ancestor that spans the whole screen.
        const all = [...document.querySelectorAll('*')].filter(
          n =>
            n.children.length === 0 &&
            /Studying with you right now|medical students studying/.test(n.textContent || ''),
        );
        const el = all[all.length - 1];
        return el ? el.getBoundingClientRect().top : null;
      })(),
    };
  });
const at = await order();
note(
  at.button != null && at.card != null && at.card > at.button,
  'the card is below the button that opened it',
);
note(
  at.presence != null && at.card != null && at.card < at.presence,
  'and above the study-session box',
);

// Add a track, the way the reader does: + opens the chooser, and the chooser
// has to say what the two options cost before either is picked.
await page.getByLabel('Add music from this phone').first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(outDir, `music${tag}-04-chooser.png`) });

const chooser = await page.evaluate(() => {
  const text = document.body.innerText;
  return {
    folderTip: /make one folder on your phone/i.test(text),
    copy: /Save a copy/.test(text) && /delete the original/i.test(text),
    link: /Just link it/.test(text) && /Uses no space/i.test(text),
    noUpload: /Nothing is uploaded either way/.test(text),
  };
});
note(chooser.folderTip, 'the chooser tells the reader to make one music folder first');
note(chooser.copy, 'and offers "Save a copy", with what it costs');
note(chooser.link, 'and "Just link it", with what it costs');
note(chooser.noUpload, 'and says neither one uploads anything');

await page
  .getByLabel(
    'Save a copy in Orbit. Uses phone space, and keeps playing if you delete the original',
  )
  .first()
  .click();
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(outDir, `music${tag}-05-track.png`) });

const track = await page.evaluate(() => {
  const text = document.body.innerText;
  const art = [...document.querySelectorAll('img')].find(i =>
    (i.getAttribute('src') || '').startsWith('data:image/png'),
  );
  const box = art ? art.getBoundingClientRect() : null;
  return {
    hasTitle: text.includes('Nocturne in E flat'),
    hasArtist: text.includes('Study Session'),
    hasDuration: /3:34/.test(text),
    art: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null,
  };
});
note(track.hasTitle, 'the track title comes from the file tags');
note(track.hasArtist, 'and the artist under it');
note(track.hasDuration, 'the duration the tags report spans the scrubber (3:34)');
note(
  !!track.art && track.art.w >= 40 && track.art.h >= 40 && track.art.w === track.art.h,
  `the cover art the file carried is drawn square (${track.art ? `${track.art.w}x${track.art.h}` : 'missing'})`,
);

await page.getByLabel('Play music').first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(outDir, `music${tag}-06-playing.png`) });
note(
  (await page.getByLabel('Pause music').count()) === 1,
  'pressing play offers pause',
);

await page.getByLabel('Close the music player').first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(outDir, `music${tag}-07-closed.png`) });
note(
  (await page.getByLabel('Close the music player').count()) === 0,
  'the close button puts it away',
);
note(
  (await page.getByLabel('Show the music player').count()) === 1,
  'and the button says it will come back',
);

await browser.close();
await server.close();

process.stdout.write(`\n${problems.length === 0 ? 'OK  the music player opens, plays and closes' : `${problems.length} problem(s)`}\n`);
process.exit(problems.length === 0 ? 0 : 1);
