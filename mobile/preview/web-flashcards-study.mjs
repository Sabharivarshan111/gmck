// Drives the web app's study view with the edge function stubbed, because the
// sandbox cannot reach Supabase. Everything past the network call is ours: the
// card, the reveal, the four buttons and their interval previews, the schedule
// written to localStorage, and the queue re-ordering after a grade.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = '/home/user/gmck/dist';
const out = '/tmp/claude-0/-home-user-gmck/570d9403-d4a1-5a08-b039-8b722d9cd56a/scratchpad';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const server = createServer(async (req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(await readFile(path.join(root, 'index.html')));
  }
});
await new Promise(r => server.listen(4322, r));

const CARDS = [
  { id: 'a1', kind: 'theory', front: 'Rigor mortis — when does it appear?', back: 'Starts 1-2 h after death, complete by 12 h.', hint: 'Think in hours.', tags: ['forensic'] },
  { id: 'a2', kind: 'theory', front: 'Define postmortem lividity.', back: 'Purplish discolouration from gravitational settling of blood.', tags: ['forensic'] },
  { id: 'a3', kind: 'theory', front: 'Commonest site of a contrecoup injury?', back: 'Frontal and temporal poles.', tags: ['forensic'] },
];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));

await page.route('**/functions/v1/generate-flashcards', route =>
  route.fulfill({
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ cached: true, deckKey: '3rd Year::Forensic Medicine::legal-procedures', cards: CARDS }),
  }));

await page.goto('http://localhost:4322/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
for (let i = 0; i < 8; i += 1) {
  if (!(await page.locator('[role="dialog"]').count())) break;
  const skip = page.locator('button', { hasText: /ok, continue|skip|maybe later|not now|close|got it|start|finish|let's go/i }).first();
  if (await skip.count()) { await skip.click({ force: true }); await page.waitForTimeout(400); }
  else { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
}
const go = async (sel, what) => {
  await page.locator(sel).first().click();
  await page.waitForTimeout(700);
  console.log('clicked:', what);
};
await go('[data-tour="nav-notes"]', 'Notes');
await go('[aria-label="Anki-style flashcards, browse decks by year"]', 'Flashcards');
await go('[aria-label="3rd Year, browse subjects"]', '3rd Year');
await go('[aria-label^="Forensic Medicine"]', 'Forensic Medicine');
await go('button[aria-label*="cards, study flashcards"]', 'first chapter');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/10-study-front.png` });
console.log('--- front ---');
console.log((await page.locator('body').innerText()).split('\n').slice(0, 12).join('\n'));

await page.locator('button', { hasText: 'Show answer' }).first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/11-study-back.png` });
console.log('--- revealed, grade buttons ---');
for (const g of ['Again', 'Hard', 'Good', 'Easy']) {
  const label = await page.locator(`button[aria-label^="${g},"]`).first().getAttribute('aria-label');
  console.log(' ', label);
}

await page.locator('button[aria-label^="Good,"]').first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/12-after-grade.png` });
console.log('--- after Good ---');
console.log((await page.locator('body').innerText()).split('\n').slice(0, 8).join('\n'));

const stored = await page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k.startsWith('orbit:anki')) out[k] = localStorage.getItem(k);
  }
  return out;
});
console.log('--- localStorage ---');
console.log(JSON.stringify(stored, null, 1));

// Back out to the hub: the deck should now show up as started.
await page.locator('button[aria-label="Back to all decks"]').first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/13-hub-started.png` });
console.log('--- hub after studying ---');
console.log((await page.locator('body').innerText()).split('\n').slice(0, 14).join('\n'));

console.log('page errors:', errors);
await browser.close();
server.close();
