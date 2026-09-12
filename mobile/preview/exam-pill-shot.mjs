// The exam pill on the Timer: present with no exam, opens, and closes again.
//
// The strip this replaced only existed once a date had been set, and the only
// place to set one is a card in another tab. So the reader who had never set
// an exam saw nothing at all — the feature was invisible to exactly the person
// who needed telling it was there. The first assertion below is that one.
//
// The "grew rather than appeared" assertion is the same one `check:music`
// makes, because both now run through `components/Reveal.tsx`. A card that
// fades in on top of the content under it, instead of pushing it down, is the
// failure that looks like a rendering glitch.
//
//   node preview/exam-pill-shot.mjs [outDir]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import { findChromium } from './find-chromium.mjs';

/** Spread into `launch`, so "not found" means Playwright's own browser. */
async function launchPath() {
  const executablePath = await findChromium();
  return executablePath ? { executablePath } : {};
}
const here = '/home/user/gmck/mobile/preview';
const outDir = process.argv[2] ?? new URL('../../screenshots', import.meta.url).pathname;
const server = await createServer({ configFile: path.join(here, 'vite.config.ts'), server: { port: 5244, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ ...(await launchPath()) });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
await page.addInitScript(() => {
  try { window.localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Orbit', year: 'second' })); } catch {}
});
await fs.mkdir(outDir, { recursive: true });
const problems = [];
const note = (ok, what) => { process.stdout.write(`${ok ? '  ok  ' : ' FAIL '}${what}\n`); if (!ok) problems.push(what); };

await page.goto('http://localhost:5244/?screen=timer', { waitUntil: 'networkidle' });
await page.waitForTimeout(1100);

// With no exam set, the pill must still be there and must invite setting one.
note((await page.getByLabel('Set an exam date').count()) >= 1, 'the pill is present with no exam set');
await page.screenshot({ path: path.join(outDir, 'exam-01-collapsed.png'), fullPage: true });

const cardHeight = () => page.evaluate(() => {
  const el = document.querySelector('[aria-label="Minimise the exam date"]');
  if (!el) return 0;
  let n = el;
  for (let i = 0; i < 8 && n.parentElement; i += 1) {
    n = n.parentElement;
    if (getComputedStyle(n).overflow === 'hidden') return n.getBoundingClientRect().height;
  }
  return -1;
});

await page.getByLabel('Set an exam date').first().click();
await page.waitForTimeout(90);
const mid = await cardHeight();
await page.waitForTimeout(700);
const settled = await cardHeight();
note(settled > 80, `it opens (${Math.round(settled)}px)`);
note(mid > 0 && mid < settled - 15, `it grew rather than appeared (${Math.round(mid)}px of ${Math.round(settled)}px at 90ms)`);
note((await page.getByLabel(/Set an exam date|Change the exam date/).count()) >= 1, 'the real exam card is inside it');
await page.screenshot({ path: path.join(outDir, 'exam-02-open.png'), fullPage: true });

await page.getByLabel('Minimise the exam date').first().click();
await page.waitForTimeout(700);
note((await cardHeight()) === 0, 'the minimise button puts it away');
await page.screenshot({ path: path.join(outDir, 'exam-03-minimised.png'), fullPage: true });

await browser.close(); await server.close();
process.stdout.write(problems.length ? `\n${problems.length} problem(s)\n` : '\nall good\n');
process.exit(problems.length ? 1 : 0);
