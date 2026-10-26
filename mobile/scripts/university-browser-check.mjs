/** Exercise the emitted native web app, with no real accounts or provider calls. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.ORBIT_UNIVERSITY_BASE_URL || 'http://127.0.0.1:4184';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const results = [];
try {
  for (const width of [360, 430]) {
    for (const fixture of [
      { university: 'rguhs', year: 'first', yearKey: 'first-year', query: 'Ulnar', topic: 'Upper Limb', reference: '24 Sep 2025' },
      { university: 'knruhs', year: 'first', yearKey: 'first-year', query: 'Brachial', topic: 'Upper Limb', reference: 'Jul 2019' },
      { university: 'ntruhs', year: 'first', yearKey: 'first-year', query: 'respiratory chain', topic: 'Bioenergetics', reference: 'Oct/Nov 2018' },
      { university: 'wbuhs', year: 'second', yearKey: 'second-year', query: 'osteolytic', topic: 'Haematology', reference: '2017' },
    ]) {
      const context = await browser.newContext({ viewport: { width, height: 780 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
      await context.addInitScript(f => {
        if (!localStorage.getItem('orbit-profile-v1')) localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Import test', year: f.year, university: f.university }));
        localStorage.setItem('orbit:tour-v1', JSON.stringify({ seen: 1 }));
      }, fixture);
      const page = await context.newPage();
      const errors = [];page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/browse/${fixture.yearKey}`);
      await page.getByText(`${fixture.university.toUpperCase()} Question Bank`, { exact: true }).waitFor();
      await page.getByPlaceholder('Search all questions…').fill(fixture.query);
      const switcher = page.getByLabel(`Switch to ${fixture.topic}`, { exact: true });
      await switcher.waitFor();await switcher.click();
      await page.getByText(fixture.reference, { exact: false }).filter({ visible: true }).first().waitFor();
      assert.ok(!(await page.locator('body').innerText()).includes('PYQ['), 'Internal source marker leaked into UI');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Horizontal overflow');
      assert.deepEqual(errors, []);
      results.push({ width, university: fixture.university, searchAndChapterAndReference: 'passed' });
      console.log('PASS chapter/reference', width, fixture.university);
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('orbit-profile-v1')) localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Picker test', year: 'first', university: 'rguhs' }));
    localStorage.setItem('orbit:tour-v1', JSON.stringify({ seen: 1 }));
  });
  const page = await context.newPage();await page.goto(base);
  await page.getByLabel('Settings', { exact: true }).click();
  const radios = page.getByRole('radiogroup').filter({ visible: true }).getByRole('radio');await radios.first().waitFor();
  assert.equal(await radios.count(), 7);
  assert.equal(await radios.filter({ has: page.getByText('MUHS', { exact: true }) }).getAttribute('aria-disabled'), 'true');
  await radios.filter({ has: page.getByText('WBUHS', { exact: true }) }).scrollIntoViewIfNeeded();
  await radios.filter({ has: page.getByText('WBUHS', { exact: true }) }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('orbit-profile-v1') || '{}').university === 'wbuhs');
  await page.goto(`${base}/browse/second-year`);
  await page.getByText('WBUHS Question Bank', { exact: true }).waitFor();
  results.push({ width: 360, height: 640, scrollableUniversityPickerAndPersistence: 'passed' });
  await context.close();
} finally { await browser.close(); }
fs.mkdirSync('artifacts/university-import', { recursive: true });
fs.writeFileSync('artifacts/university-import/browser-results.json', JSON.stringify(results, null, 2));
console.log(`PASS ${results.length} emitted web bank/picker scenarios`);
