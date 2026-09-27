// Phone-size interaction evidence for the four reports in the 2026-09-27 screenshots.
// React Native Web renders the actual components; Android keyboard and clipboard
// integration still require an installed device check.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(process.argv[2] ?? path.join(here, '..', '..', 'screenshots', 'friend-feedback'));
await fs.mkdir(output, { recursive: true });
const server = await createServer({ configFile: path.join(here, 'vite.config.ts'), server: { port: 5233, strictPort: true }, logLevel: 'error' });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, hasTouch: true });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:5233' });
  await context.addInitScript(() => {
    localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Preview', year: 'second' }));
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('http://localhost:5233/?screen=notesdemo', { waitUntil: 'networkidle' });
  const section = page.getByLabel('Copy entire Immediate management section');
  await section.waitFor();
  const title = (await section.getAttribute('aria-label')).replace(/^Copy entire /, '').replace(/ section$/, '');
  await section.click();
  await page.waitForFunction(title => navigator.clipboard.readText().then(text => text.includes(title) && text.includes('Airway, breathing, circulation')), title);
  await section.evaluate(element => element.scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: path.join(output, '01-full-section-copy.png') });
  console.log('OK section button copied its title and body:', title);
  const definition = page.getByLabel('Copy entire Definition section');
  await definition.click();
  await page.waitForFunction(() => navigator.clipboard.readText().then(text => text.includes('Definition') && text.includes('irreversible necrosis of heart muscle')));
  await page.screenshot({ path: path.join(output, '01b-red-definition-copy.png') });
  console.log('OK red definition button copied its title and body');

  await page.goto('http://localhost:5233/?screen=progress', { waitUntil: 'networkidle' });
  await page.getByLabel('Notes').first().click();
  await page.getByLabel('Create a new study note').click();
  const note = page.getByLabel('What the note says');
  await note.click();
  await page.getByLabel('Numbered point').click();
  await page.waitForFunction(() => document.querySelector('[aria-label="What the note says"]')?.selectionStart === 3);
  await note.pressSequentially('First point');
  console.log('Personal note before Enter:', JSON.stringify(await note.inputValue()));
  await note.press('Enter');
  await page.screenshot({ path: path.join(output, '02-notes-auto-number.png') });
  const noteValue = await note.inputValue();
  if (noteValue !== '1. First point\n2. ') throw new Error(`Personal note Enter produced ${JSON.stringify(noteValue)}`);
  console.log('OK personal note Enter continued 1 to 2');
  for (const [word, expected] of [['Second point', '3. '], ['Third point', '4. '], ['Fourth point', '5. ']]) {
    await note.pressSequentially(word);
    await note.press('Enter');
    if (!(await note.inputValue()).endsWith(expected)) {
      throw new Error(`Personal note stopped numbering after ${word}: ${JSON.stringify(await note.inputValue())}`);
    }
  }
  await page.screenshot({ path: path.join(output, '02b-notes-four-numbers.png') });
  await note.press('Enter');
  if ((await note.inputValue()).endsWith('5. ')) throw new Error('Empty numbered item did not end the list');
  await page.getByLabel('Bullet point').click();
  await note.pressSequentially('First bullet');
  for (const word of ['Second bullet', 'Third bullet', 'Fourth bullet']) {
    await note.press('Enter');
    await note.pressSequentially(word);
    if (!(await note.inputValue()).endsWith(`- ${word}`)) {
      throw new Error(`Personal note stopped adding bullets at ${word}: ${JSON.stringify(await note.inputValue())}`);
    }
  }
  await page.screenshot({ path: path.join(output, '02c-notes-four-bullets.png') });

  await page.goto('http://localhost:5233/?screen=pdf-tools-demo', { waitUntil: 'networkidle' });
  await page.getByLabel('Toggle editing toolbar').click();
  await page.getByLabel('Add blank note page after this page').click();
  const pdfNote = page.getByPlaceholder(/Type personal study points/);
  await pdfNote.click();
  await page.getByLabel('Numbered point').click();
  await page.waitForFunction(() => document.querySelector('textarea[placeholder^="Type personal study points"]')?.selectionStart === 3);
  await pdfNote.pressSequentially('First point');
  await pdfNote.press('Enter');
  await page.waitForFunction(() => document.querySelector('textarea[placeholder^="Type personal study points"]')?.value === '1. First point\n2. ');
  await page.getByLabel('Numbered point').waitFor();
  await page.screenshot({ path: path.join(output, '03-pdf-note-auto-number.png') });
  console.log('OK PDF note Enter continued 1 to 2 and formatting toolbar is visible');
  for (const [word, expected] of [['Second point', '3. '], ['Third point', '4. '], ['Fourth point', '5. ']]) {
    await pdfNote.pressSequentially(word);
    await pdfNote.press('Enter');
    if (!(await pdfNote.inputValue()).endsWith(expected)) throw new Error(`PDF note stopped numbering after ${word}`);
  }
  await page.screenshot({ path: path.join(output, '03b-pdf-note-four-numbers.png') });
  await pdfNote.press('Enter');
  await page.getByLabel('Bullet point').click();
  await pdfNote.pressSequentially('First bullet');
  for (const word of ['Second bullet', 'Third bullet', 'Fourth bullet']) {
    await pdfNote.press('Enter');
    await pdfNote.pressSequentially(word);
    if (!(await pdfNote.inputValue()).endsWith(`- ${word}`)) throw new Error(`PDF note stopped bullets at ${word}`);
  }
  await page.screenshot({ path: path.join(output, '03c-pdf-note-four-bullets.png') });

  await page.goto('http://localhost:5233/?screen=timer', { waitUntil: 'networkidle' });
  await page.evaluate(() => { globalThis.__orbitPickFile = 'audio'; globalThis.__orbitMusicDistinctTitles = true; });
  await page.getByLabel('Show the music player').click();
  for (let i = 0; i < 3; i++) {
    await page.getByLabel('Add music from this phone').click();
    await page.getByLabel(/^Save a copy in Orbit/).click();
    await page.getByLabel(new RegExp(`Choose a song from ${i + 1} tracks? in your playlist`)).waitFor();
  }
  await page.evaluate(() => { Math.random = () => 0; });
  await page.getByLabel('Shuffle off. Tap to turn on').click();
  await page.getByLabel('Shuffle on. Tap to turn off').waitFor();
  await page.screenshot({ path: path.join(output, '04a-music-shuffle-on.png') });
  await page.getByLabel('Next track').click();
  await page.getByText('Micro paper 1', { exact: true }).first().waitFor();
  await page.screenshot({ path: path.join(output, '04a-music-shuffled-next.png') });
  await page.getByLabel('Shuffle on. Tap to turn off').click();
  await page.getByLabel('Repeat off. Tap to change').click();
  await page.getByLabel('Repeat all. Tap to change').waitFor();
  await page.getByLabel('Repeat all. Tap to change').click();
  await page.getByLabel('Repeat one. Tap to change').waitFor();
  await page.screenshot({ path: path.join(output, '04b-music-repeat-one.png') });
  await page.getByLabel('Repeat one. Tap to change').click();
  await page.getByLabel('Repeat off. Tap to change').waitFor();
  await page.getByLabel('Choose a song from 3 tracks in your playlist').click();
  const choices = page.getByLabel(/^Play .* by Study Session$/);
  if (await choices.count() !== 3) throw new Error('Playlist did not show all three added tracks');
  await page.getByText('Your study music').waitFor();
  await page.waitForTimeout(700); // Let the sheet finish rising before photographing it.
  await page.screenshot({ path: path.join(output, '04-music-playlist.png') });
  const beforeIds = await page.evaluate(() => JSON.parse(localStorage.getItem('orbit:music:tracks') || '[]').map(track => track.id));
  await page.getByLabel('Move Skin care down in playlist').click();
  const reorderedIds = await page.evaluate(() => JSON.parse(localStorage.getItem('orbit:music:tracks') || '[]').map(track => track.id));
  if (reorderedIds[0] !== beforeIds[1] || reorderedIds[1] !== beforeIds[0]) throw new Error('Move down did not persist playlist order');
  await page.screenshot({ path: path.join(output, '04c-music-reordered.png') });
  await page.getByLabel('Move Skin care up in playlist').click();
  const restoredIds = await page.evaluate(() => JSON.parse(localStorage.getItem('orbit:music:tracks') || '[]').map(track => track.id));
  if (restoredIds.join() !== beforeIds.join()) throw new Error('Move up did not persist playlist order');
  await page.getByLabel('Remove Micro paper 1 from playlist').click();
  await page.getByLabel('Choose a song from 2 tracks in your playlist').waitFor();
  await page.screenshot({ path: path.join(output, '04d-music-one-removed.png') });
  await choices.first().click();
  await page.getByLabel('Pause music').waitFor();
  console.log('OK playlist exposed both tracks and selection started playback');

  if (errors.length) throw new Error(`Preview errors: ${errors.slice(0, 3).join(' | ')}`);
  console.log('Saved four phone-size screenshots to', output);
} finally {
  await browser?.close();
  await server.close();
}
