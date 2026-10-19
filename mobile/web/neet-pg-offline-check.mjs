/** Real production browser flow; all test questions are original fixtures. */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const repo = path.resolve(import.meta.dirname, '../..');
const data = JSON.parse(await fs.readFile(path.join(repo, 'mobile/src/lib/neetPgStudyData.json'), 'utf8'));
const chapter = data.chapters.find(item => item.subject === 'anatomy');
const fixture = {
  schema: 1, id: 'original-browser-fixture', chapters: [chapter],
  images: { pixel: { alt: 'Original test pixel', dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7GQAAAAASUVORK5CYII=' } },
  records: Array.from({ length: 31 }, (_, index) => ({
    id: `test-${index}`, chapterId: chapter.id,
    question: `Original fixture ${index + 1}: Which nerve supplies lateral rectus?`,
    options: ['Oculomotor', 'Trochlear', 'Abducens', 'Optic'], answerIndex: 2, sourceAnswer: 'C',
    explanation: 'The abducens nerve supplies lateral rectus and abducts the eye.',
    requiresImage: true, imageIds: ['pixel'],
  })),
};
const server = http.createServer(async (req, res) => {
  try {
    let relative = new URL(req.url, 'http://localhost').pathname;
    if (!path.extname(relative)) relative = '/index.html';
    const file = path.join(repo, 'dist', relative);
    res.setHeader('Content-Type', ({ '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' })[path.extname(file)] || 'application/octet-stream');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(5237, '127.0.0.1', resolve));
const browser = await chromium.launch({ args: ['--no-sandbox'], executablePath: process.env.CHROME_PATH });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await context.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5237') ? route.continue() : route.abort());
await context.addInitScript(() => {
  localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Offline tester', year: 'first', university: 'tnmgr' }));
  localStorage.setItem('orbit:tour-v1', JSON.stringify({ seen: 1 }));
  localStorage.setItem('orbit:last-run-version', '27');
});
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const label = name => page.getByLabel(name, { exact: true });
const importJson = async (control, value) => {
  const chooser = page.waitForEvent('filechooser');
  await label(control).click();
  await (await chooser).setFiles({ name: 'offline-bank.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
};
const open = async () => {
  await page.goto('http://127.0.0.1:5237/notes');
  await label('NEET-PG practice questions').click();
};
try {
  await open();
  await importJson('Install complete offline NEET PG bank', fixture);
  await label('Search offline NEET PG questions').waitFor();
  assert.ok((await page.locator('body').innerText()).includes('31 questions · stored offline'));
  await label('Show answer and explanation').first().click();
  await page.getByText('Source answer: C', { exact: true }).waitFor();
  await page.getByText(fixture.records[0].explanation, { exact: true }).waitFor();
  const search = label('Search offline NEET PG questions');
  await search.fill('abducens rectus');
  assert.equal(await search.inputValue(), 'abducens rectus');
  await page.getByText('31 matching questions', { exact: true }).waitFor();
  await label('1st Year').click();
  await label(chapter.names[0]).click();
  await label(`${chapter.name} (31)`).click();
  await page.getByText('31 matching questions', { exact: true }).waitFor();
  await label('Next offline question page').click();
  await page.getByText(fixture.records[30].question, { exact: true }).waitFor();
  // An incomplete replacement must not change the installed bank.
  await importJson('Replace offline bank', { ...fixture, records: [{ ...fixture.records[0], options: [] }] });
  await page.getByText('Bank was not replaced', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await label('Search offline NEET PG questions').waitFor();
  await label('Close offline NEET PG bank').click();
  // Wait until the real service worker has finished caching the built shell.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await context.setOffline(true);
  await page.reload();
  await label('NEET-PG practice questions').click();
  await label('Search offline NEET PG questions').waitFor();
  assert.ok((await page.locator('body').innerText()).includes('31 questions · stored offline'));
  await label('Show answer and explanation').first().click();
  await page.getByText('Source answer: C', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS real browser: private import, embedded image decoding, source key reveal, chapter filters, pagination, failed replacement, and network-disabled reload.');
} catch (error) {
  await fs.mkdir('/tmp/orbit-neet-offline-evidence', { recursive: true });
  await page.screenshot({ path: '/tmp/orbit-neet-offline-evidence/failure.png' });
  console.error((await page.locator('body').innerText()).slice(0, 3500));
  throw error;
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
