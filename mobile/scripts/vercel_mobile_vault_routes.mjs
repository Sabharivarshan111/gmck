/** Exercise the actual hosted Vault through normal mobile UI, without fixtures. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const out = resolve(process.argv[2] || 'artifacts/native-vault-routes');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const page = await context.newPage();
const passed = [], failures = [], captures = [];
const label = name => page.getByLabel(name, { exact: true });
async function tap(name) { await label(name).scrollIntoViewIfNeeded(); await label(name).click(); }
async function expect(text) { await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible' }); }
async function shot(name) {
  const viewport = await page.evaluate(() => [window.innerWidth, window.innerHeight]);
  if (viewport[0] !== 393 || viewport[1] !== 852 || new URL(page.url()).hostname !== 'orbitmbbs.vercel.app') throw Error('Reference is not the actual mobile Vercel page');
  await page.screenshot({ path: resolve(out, 'vault-vercel-' + name + '.png') });
  captures.push(name);
}
async function setup() {
  await page.goto('https://orbitmbbs.vercel.app/notes', { waitUntil: 'domcontentloaded' });
  await label('Continue').or(label('Display name')).or(label('Vault')).first().waitFor({ timeout: 60000 });
  // First-run splash and walkthrough mount after the app's first paint.
  await page.waitForTimeout(2000);
  if (await label('Continue').isVisible()) await tap('Continue');
  if (await label('Display name').isVisible()) {
    await label('Display name').fill('NativePreview');
    await page.getByRole('radio', { name: 'Final Year', exact: true }).click();
    await page.getByRole('radio', { name: 'Tamil Nadu Dr. M.G.R. Medical University (TNMGR)', exact: true }).click();
    await tap('Start studying');
    await page.waitForTimeout(2000);
  }
  for (const name of ['Dismiss install suggestion', 'Skip the walkthrough', 'Close the walkthrough']) {
    if (await label(name).isVisible()) { await tap(name); await page.waitForTimeout(500); }
  }
  if (await label('Vault').isVisible()) await tap('Vault');
  await expect('Your study space');
}
const suites = {
  notes: async () => {
    await shot('home'); await tap('Notes'); await expect('Handwritten Notes'); await shot('notes-years');
    await tap('1st Year, browse subjects'); await expect('Anatomy'); await shot('notes-subjects');
    await tap('Anatomy, see topics'); await expect('topics'); await shot('notes-anatomy-topics');
    await tap('Back'); await tap('Back'); await tap('Back'); await expect('Your study space');
  },
  proformas: async () => {
    await tap('Case proformas'); await expect('Clinical Case Proformas'); await shot('proforma-library');
    await page.getByRole('button', { name: /^Open Cardiovascular System/ }).click();
    await label('Proforma Guide').waitFor(); await shot('proforma-guide');
    await tap('Clerk Patient (Edit Mode)'); await shot('proforma-clerk');
    await tap('Professor Viva Q&A'); await shot('proforma-viva');
    await tap('Close proforma viewer'); await expect('Your study space');
  },
  pg: async () => {
    await tap('NEET-PG practice questions'); await label('Practice questions').waitFor(); await shot('pg-bank');
    await tap('Official exam information'); await shot('pg-exam-information');
    await tap('Close PG entrance bank'); await expect('Your study space');
  },
  flashcards: async () => {
    await tap('Anki flashcards'); await expect('Anki-style cards'); await shot('flashcard-hub');
    await tap('Your own decks, write and study your own cards');
    await label('Name for the new deck').fill('Android QA parity'); await tap('Create this deck');
    await label('Front of the card, the question').fill('Native QA question');
    await label('Back of the card, the answer').fill('Native QA answer'); await tap('Add this card');
    await expect('Native QA question'); await shot('flashcard-written'); await tap('Go back');
    await tap('Android QA parity, 1 cards, study'); await expect('Native QA question'); await shot('flashcard-study');
    await tap('Show answer'); await expect('Native QA answer'); await shot('flashcard-answer');
    await page.getByRole('button', { name: /^Good, next in/ }).click(); await expect('Nothing due right now'); await shot('flashcard-scheduled');
    await tap('Go back'); await tap('Delete Android QA parity'); await expect('No decks yet');
  },
  simulator: async () => {
    const popup = page.waitForEvent('popup');
    await tap('Simulator & Anatomy');
    const source = await popup;
    await source.getByRole('button', { name: 'Explore 3D anatomy', exact: true }).waitFor();
    if (new URL(source.url()).hostname !== 'orbitmbbs.vercel.app') throw Error('Simulator link did not open Vercel');
    await source.screenshot({ path: resolve(out, 'vault-vercel-simulator-studio.png') });
    captures.push('simulator-studio'); await source.close();
  },
};
try {
  for (const [name, run] of Object.entries(suites)) {
    try { await setup(); await run(); passed.push(name); }
    catch (error) { failures.push({ suite: name, error: error.message }); await page.screenshot({ path: resolve(out, 'vault-vercel-failure-' + name + '.png') }).catch(() => {}); }
    await writeFile(resolve(out, 'vault-vercel-route-checks.json'), JSON.stringify({ status: 'NOT_CERTIFIED', viewport: [393, 852], passed, failures, captures }, null, 2));
  }
  if (failures.length) throw Error('Actual Vercel Vault route failures: ' + JSON.stringify(failures));
} finally { await browser.close(); }
