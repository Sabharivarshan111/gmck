// A note carrying a YouTube link, photographed.
//
// ## Why this capture had to exist before the ad could
//
// `noteLinks.ts` and `NoteLinkCard.tsx` ship, but every committed notes
// screenshot is a fresh note list with no link in it. So the walkthrough reel
// could not show the YouTube half at all — putting those lines over a generic
// notes screen is the exact mismatch `check:ad-truth` exists to catch, and the
// shots were left out rather than faked.
//
// The note is seeded into AsyncStorage before the app boots, which is how the
// other harnesses seed a profile. Nothing is fetched: `NoteLinkCard` draws the
// still from a static youtube-nocookie thumbnail URL and mounts the player
// only on a tap, so this photographs the real card in its real resting state.
//
//   node preview/note-link-shot.mjs [outDir]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { findChromium } from './find-chromium.mjs';

/** Spread into `launch`, so "not found" means Playwright's own browser. */
async function launchPath() {
  const executablePath = await findChromium();
  return executablePath ? { executablePath } : {};
}

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] ?? path.join(here, '..', '..', 'screenshots'));


const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5266, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ ...(await launchPath()) });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });

await page.addInitScript(() => {
  try {
    window.localStorage.setItem(
      'orbit-profile-v1',
      JSON.stringify({ display_name: 'Orbit', year: 'second' }),
    );
    window.localStorage.setItem(
      'orbit:user-notes:v1',
      JSON.stringify([
        {
          id: 'note_demo_link',
          title: 'Brachial plexus — lecture',
          content:
            'Roots C5 to T1. **Randy Travis Drinks Cold Beer** for roots, trunks, divisions, cords, branches.\n- Erb’s point is where the upper trunk forms\n- Klumpke’s palsy is the lower trunk',
          subject: 'Anatomy',
          chapterKey: null,
          chapterName: null,
          links: [
            {
              id: 'link_demo_1',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              title: 'Brachial plexus in ten minutes',
              videoId: 'dQw4w9WgXcQ',
            },
          ],
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 3600000,
        },
      ]),
    );
  } catch {}
});
await fs.mkdir(outDir, { recursive: true });

const problems = [];
const note = (ok, what) => {
  process.stdout.write(`${ok ? '  ok  ' : ' FAIL '}${what}\n`);
  if (!ok) problems.push(what);
};

await page.goto('http://localhost:5266/?screen=progress', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.getByLabel('Notes', { exact: true }).first().click();
await page.waitForTimeout(900);

note((await page.getByText('Brachial plexus — lecture').count()) >= 1, 'the seeded note is listed');
// The links are drawn in the reader, not on the card — the card only counts
// them. So open it, which is also what somebody following the ad would do.
await page.getByLabel('Read Brachial plexus — lecture').first().click();
await page.waitForTimeout(900);
note(
  (await page.getByText(/Brachial plexus in ten minutes/).count()) >= 1,
  'the YouTube link is drawn on the note, by its title',
);
/*
 * Nothing may be requested from youtube.com itself before a tap. The still is
 * a youtube-nocookie image URL; the player mounts only when asked, so nothing
 * tells YouTube which videos a student is studying from.
 */
const hits = [];
page.on('request', r => {
  if (/(^|\.)youtube\.com/.test(new URL(r.url()).hostname)) hits.push(r.url());
});
await page.waitForTimeout(600);
note(hits.length === 0, `no request reaches youtube.com before a tap (${hits.length})`);

await page.screenshot({ path: path.join(outDir, 'notelink-1-youtube.png'), fullPage: true });

await browser.close();
await server.close();

if (problems.length > 0) {
  process.stderr.write(`\n${problems.length} problem(s)\n`);
  process.exit(1);
}
process.stdout.write('\nOK  a note carrying a YouTube link, captured\n');
