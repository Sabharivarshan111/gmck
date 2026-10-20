/** Real production flow: bundled bank, then an original private-import fixture. */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const repo = path.resolve(import.meta.dirname, '../..');
const data = JSON.parse(await fs.readFile(path.join(repo, 'mobile/src/lib/neetPgStudyData.json'), 'utf8'));
const bundled = JSON.parse(await fs.readFile(path.join(repo, 'mobile/src/lib/neetPgBank.json'), 'utf8'));
const chapter = data.chapters.find(item => item.subject === 'anatomy');
const fixture = {
  schema: 1, id: 'original-browser-fixture', chapters: [chapter],
  images: { pixel: { alt: 'Original test pixel', dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC' } },
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
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'], executablePath: process.env.CHROME_PATH });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await context.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5237') ? route.continue() : route.abort());
await context.addInitScript(() => {
  localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Offline tester', year: 'first', university: 'tnmgr' }));
  localStorage.setItem('orbit:tour-v1', JSON.stringify({ seen: 1 }));
  localStorage.setItem('orbit:last-run-version', '28');
  localStorage.setItem('orbit:theme-preference', 'blackwhite');
});
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const label = name => page.getByLabel(name, { exact: true });
const importJson = async (control, value) => {
  await label('NEET PG appearance and bank settings').click();
  await page.getByRole('heading', { name: 'Your study space', exact: true }).waitFor();
  const chooser = page.waitForEvent('filechooser');
  await label(control).click();
  await (await chooser).setFiles({ name: 'offline-bank.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
};
const open = async () => {
  await page.goto('http://127.0.0.1:5237/notes');
  await label('NEET-PG practice questions').click();
};
const evidence = process.env.NEET_UI_EVIDENCE || '/tmp/orbit-neet-offline-evidence';
await fs.mkdir(evidence, { recursive: true });
const stable = async locator => {
  let previous; let still = 0;
  for (let attempt = 0; attempt < 35; attempt++) {
    const box = await locator.boundingBox();
    if (box && previous && ['x', 'y', 'width', 'height'].every(key => Math.abs(box[key] - previous[key]) < 0.25)) still++; else still = 0;
    if (still >= 3) return;
    previous = box; await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw Error('Layout did not settle');
};
const shot = async name => page.screenshot({ path: path.join(evidence, name + '.png') });
const closeSheet = async title => {
  await label('Done').click();
  await page.getByRole('heading', { name: title, exact: true }).waitFor({ state: 'hidden' });
};
const theme = async name => {
  await label('NEET PG appearance and bank settings').click();
  await label('Use ' + name + ' theme').click();
  await closeSheet('Your study space');
};
const fits = async (names, width) => {
  for (const name of names) {
    const control = label(name); const box = await control.boundingBox();
    assert.ok(box && box.x >= -0.5 && box.x + box.width <= width + 0.5, name + ' fits at ' + width);
    assert.ok(box.height >= 43.5, name + ' has a 44px touch target');
  }
};
try {
  await open(); await label('Search offline NEET PG questions').waitFor();
  await stable(label('Close offline NEET PG bank'));
  await page.getByText(bundled.records.length.toLocaleString(), { exact: true }).waitFor();
  assert.ok(!(await page.locator('body').innerText()).includes('dataset practice'));
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await stable(label('Search offline NEET PG questions'));
    await fits(['Search offline NEET PG questions', 'All years of study', '1st Year', 'Final Year', 'Start NEET PG practice'], width);
    if (width === 390) await shot('library-blackwhite-390');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ['Light', 'Liquid Glass', 'Dark', 'Black Pink', 'Black & White']) {
    await theme(name);
    await stable(label('Close offline NEET PG bank'));
    if (name === 'Light' || name === 'Liquid Glass') await shot('library-' + name.toLowerCase().replaceAll(' ', '-') + '-390');
  }
  await label('Search offline NEET PG questions').fill('aortic opening');
  await label('Open NEET PG question 1').click();
  await stable(label('Show answer and explanation'));
  const correctRow = bundled.records.find(row => row.question.toLowerCase().includes('aortic opening') && row.options.includes('Vagus'));
  assert.ok(correctRow, 'real aortic opening question exists');
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await stable(label('Ask ACEV about this question'));
    await fits(['Ask ACEV about this question', 'Show answer and explanation', 'Next NEET PG question', 'Previous NEET PG question'], width);
    for (const radio of await page.getByRole('radio').all()) {
      const box = await radio.boundingBox(); assert.ok(box.width <= width && box.height >= 44);
    }
    if (width === 390) await shot('question-blackwhite-390');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('radio').first().click();
  await label('Show answer and explanation').click();
  await page.getByText('Answer: ' + correctRow.sourceAnswer, { exact: true }).waitFor();
  await stable(page.getByTestId('neet-answer-explanation'));
  await shot('explanation-blackwhite-390');
  for (let i = 0; i < correctRow.options.length; i++) assert.ok((await page.getByRole('radio').nth(i).innerText()).includes(correctRow.options[i]));
  // Read-only options keep full contrast, rather than fading after reveal.
  for (const radio of await page.getByRole('radio').all()) assert.equal(await radio.evaluate(node => getComputedStyle(node).opacity), '1');
  await label('Ask ACEV about this question').click();
  await label('Ask about this NEET PG question').waitFor();
  await stable(label('Send question to ACEV'));
  await shot('acev-blackwhite-390');
  await page.setViewportSize({ width: 1365, height: 936 });
  await stable(label('Ask about this NEET PG question'));
  const desktopComposer = await label('Ask about this NEET PG question').boundingBox();
  assert.ok(desktopComposer.x >= 280 && desktopComposer.width <= 760, 'AI discussion stays in a readable centered column on desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await stable(label('Ask about this NEET PG question'));
  await closeSheet('Ask ACEV');
  await label('Return to NEET PG library').click();
  await label('Clear NEET PG search').click();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 120000 });
  await context.setOffline(true); await page.reload();
  await label('NEET-PG practice questions').click();
  await label('Start NEET PG practice').click();
  await label('Show answer and explanation').click();
  await page.getByText('Answer: ' + bundled.records[0].sourceAnswer, { exact: true }).waitFor();
  await label('Open question illustration').first().click();
  await label('Close the picture').click();
  await label('Close the picture').waitFor({ state: 'hidden' });
  await label('Return to NEET PG library').click();
  console.log('PASS original bundled bank opens offline with full illustration and unchanged answer; new reader fits 360/390/430 and all presets work.');

  await context.setOffline(false);
  await importJson('Replace offline bank', fixture);
  await page.getByText('31', { exact: true }).waitFor();
  await label('Search offline NEET PG questions').fill('abducens rectus');
  await page.getByText('31 matching questions', { exact: true }).waitFor();
  await label('Next offline question page').click();
  await label('Open NEET PG question 31').click();
  await page.getByText(fixture.records[30].question, { exact: true }).waitFor();
  await label('Return to NEET PG library').click();
  await label('Clear NEET PG search').click();
  await label('1st Year').click(); await label(chapter.names[0]).click();
  await label(chapter.name + ' (31)').click();
  await page.getByText(fixture.records[0].question, { exact: true }).waitFor();
  await page.getByRole('radio').nth(1).click(); await label('Show answer and explanation').click();
  await page.getByText('Answer: C', { exact: true }).waitFor();
  await page.getByText(fixture.records[0].explanation, { exact: true }).waitFor();
  await label('Save this NEET PG question').click();
  await label('Unsave this NEET PG question').waitFor();

  const aiRequests = []; let failNext = true;
  await context.route('**/functions/v1/ask-gemini', async route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info,x-supabase-client-platform,x-supabase-client-platform-version,x-supabase-client-runtime,x-supabase-client-runtime-version' } });
    aiRequests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, json: failNext ? { error: 'Connection unavailable. Try again.' } : { response: '[[anat:Question context received.]]' } });
    failNext = false;
  });
  await label('Ask ACEV about this question').click();
  await label('Compare the options').click();
  await label('Retry question discussion').waitFor();
  await label('Retry question discussion').click();
  await page.getByText('Question context received.', { exact: true }).waitFor();
  await label('Ask about this NEET PG question').fill('Why is the lateral rectus relevant?');
  await label('Send question to ACEV').click();
  await page.getByText('Question context received.', { exact: true }).nth(1).waitFor();
  assert.equal(aiRequests.length, 3);
  assert.ok(!(await page.locator('body').innerText()).includes('[[anat:'), 'semantic annotations render as readable words');
  for (const request of aiRequests) {
    assert.equal(request.isNeedingClarification, true, 'service includes question context');
    assert.equal(request.isMCQRequest, false);
    assert.ok(request.conversationHistory[0].content.includes(fixture.records[0].question));
    assert.ok(request.conversationHistory[0].content.includes('Stored answer: C'));
    for (const option of fixture.records[0].options) assert.ok(request.conversationHistory[0].content.includes(option));
  }
  assert.ok(aiRequests[2].conversationHistory.some(entry => entry.role === 'assistant' && entry.content === '[[anat:Question context received.]]'));
  await closeSheet('Ask ACEV');
  await page.getByText('Answer: C', { exact: true }).waitFor();
  await label('Next NEET PG question').click();
  await label('Ask ACEV about this question').click();
  assert.equal(await page.getByText('Question context received.', { exact: true }).count(), 0, 'new question has a separate discussion');
  await closeSheet('Ask ACEV');
  await label('Return to NEET PG library').click();
  await label('Show saved NEET PG questions').click();
  await page.getByText('1 matching questions', { exact: true }).waitFor();
  await label('Open NEET PG question 1').click();
  await page.getByText(fixture.records[0].question, { exact: true }).waitFor();
  await label('Return to NEET PG library').click();
  await importJson('Replace offline bank', { ...fixture, records: [{ ...fixture.records[0], options: [] }] });
  await page.getByText('Bank was not replaced', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await label('Close offline NEET PG bank').click();
  await context.setOffline(true); await page.reload();
  await label('NEET-PG practice questions').click();
  await label('Show saved NEET PG questions').click();
  await page.getByText('1 matching questions', { exact: true }).waitFor();
  await label('Open NEET PG question 1').click();
  await label('Show answer and explanation').click();
  await page.getByText('Answer: C', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  await context.setOffline(false);
  await label('Return to NEET PG library').click();
  await theme('Liquid Glass');
  await label('Close offline NEET PG bank').click();
  await label('NEET-PG practice questions').waitFor();
  await page.getByRole('tab', { name: 'Home', exact: true }).click();
  await page.getByTestId('glass-material').first().waitFor();
  await stable(page.getByTestId('glass-material').first());
  await shot('home-liquid-glass-390');
  await page.emulateMedia({ contrast: 'more' });
  await page.waitForFunction(() => !document.querySelector('[data-testid="glass-material"]'));
  assert.ok(await page.getByTestId('solid-material').count() > 0);
  await shot('home-reduced-transparency-390');
  await page.emulateMedia({ contrast: 'no-preference' });
  await page.getByTestId('glass-material').first().waitFor();
  await page.getByRole('tab', { name: 'Vault', exact: true }).click();
  await label('NEET-PG practice questions').click();
  await theme('Black & White');
  await label('Close offline NEET PG bank').click();
  await page.getByRole('tab', { name: 'Home', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.orbit-install-banner.orbit-install-mono'));
  assert.equal(await page.getByTestId('glass-material').count(), 0);
  await stable(page.getByTestId('solid-material').first());
  await shot('home-blackwhite-390');
  console.log('PASS glass uses an opaque fallback for increased contrast and restores the material when preference clears.');
  console.log('PASS private import, real chapter taxonomy, search pagination, saved-question restart persistence, failed-import preservation, and offline reload.');
  console.log('PASS per-question ACEV request includes the source question/options/key, preserves history, retries failures, and never replaces the stored answer (service responses stubbed).');
} catch (error) {
  await shot('failure');
  console.error((await page.locator('body').innerText()).slice(-4000));
  throw error;
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
