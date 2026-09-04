// Drives the built web app: Notes → Anki-style flashcards → year → subject →
// chapter list. Supabase is unreachable in this sandbox, so the study view
// (which calls the edge function) is not exercised past its loading state.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = '/home/user/gmck/dist';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const server = createServer(async (req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    const html = await readFile(path.join(root, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
});
await new Promise(r => server.listen(4321, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));

await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// Onboarding / profile may stand in front of the shell.
const shot = async name => page.screenshot({
  path: `/tmp/claude-0/-home-user-gmck/570d9403-d4a1-5a08-b039-8b722d9cd56a/scratchpad/${name}.png` });

async function click(selector, label) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 10000 });
  await el.click();
  await page.waitForTimeout(600);
  console.log('clicked:', label);
}

await shot('00-landing');
// The first-run walkthrough opens over everything. Dismiss it.
for (let i = 0; i < 8; i += 1) {
  const dialog = page.locator('[role="dialog"]');
  if (!(await dialog.count())) break;
  const skip = page.locator('button', { hasText: /ok, continue|skip|maybe later|not now|close|got it|start|finish|let's go/i }).first();
  if (await skip.count()) { await skip.click({ force: true }); await page.waitForTimeout(500); }
  else { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
}
await shot('00b-after-dialog');

// Skip whatever gate is showing, if any, then go to the Notes tab.
const notes = page.locator('[data-tour="nav-notes"]');
if (await notes.count()) {
  await click('[data-tour="nav-notes"]', 'Notes tab');
} else {
  console.log('no bottom nav visible — dumping body text');
  console.log((await page.locator('body').innerText()).slice(0, 600));
}
await shot('01-notes');

await click('[aria-label="Anki-style flashcards, browse decks by year"]', 'flashcards entry');
await shot('02-flashcards-hub');
console.log('hub text:', (await page.locator('body').innerText()).slice(0, 900));

await click('[aria-label="3rd Year, browse subjects"]', '3rd year');
await shot('03-subjects');

await click('[aria-label^="Forensic Medicine"]', 'Forensic Medicine');
await shot('04-chapters');
const chapters = await page.locator('button[aria-label*="cards, study flashcards"]').count();
console.log('chapters listed:', chapters);
console.log('first chapter label:',
  await page.locator('button[aria-label*="cards, study flashcards"]').first().getAttribute('aria-label'));

await page.locator('button[aria-label*="cards, study flashcards"]').first().click();
await page.waitForTimeout(1500);
await shot('05-study-loading');
console.log('study text:', (await page.locator('body').innerText()).slice(0, 500));

await page.waitForTimeout(6000);
await shot('06-study-after');
console.log('study text later:', (await page.locator('body').innerText()).slice(0, 500));

console.log('page errors:', errors);
await browser.close();
server.close();
