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
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'Taking commissions', topic: 'Thermal Injuries', reference: 'Apr 2026', option: '(c) Taking commissions from pharmaceutical companies' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'Schwalbe', topic: 'Diseases of cornea', reference: 'Apr 2026', option: '(d) Descemet’s membrane' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'Corrected effective temperature', topic: 'Environment & Health', reference: 'Nov 2025', option: '(a) < 20℃' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'LAQSHYA', topic: 'Health Programmes', reference: 'Apr 2026', option: '(d) Quality of care in labor room and maternity operation theatres' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Aniridia', topic: 'Diseases of uveal tract', reference: 'Apr 2026', option: '(c) Absence of ciliary body' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'amiodarone', topic: 'Endocrinology', reference: 'May 2024', option: "(d) De Quervain's thyroiditis" },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Heart Failure', topic: 'Cardiology', reference: 'Apr 2026', option: 'Describe the aetiology, clinical features, investigation and management of Heart Failure.', section: 'Part B · Essay / Long Answer Questions' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Parkland Formula', topic: 'Shock, Burns and Trauma', reference: 'Apr 2026', option: '30 % deep burn surface area' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Colour Codes', topic: 'Shock, Burns and Trauma', reference: 'Jun 2025', option: '(a) 1-A, 2-C, 3-D, 4-B' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Intracapsular', topic: 'Trauma and fractures', reference: 'May 2024', option: '(1+1+1+2+3+2+3+2)', section: 'Part B · Essay / Long Answer Questions' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'Ponderal index', topic: 'Growth and development', reference: 'Apr 2026', option: '(d) Weight in gms / height in cm³' },
      { university: 'knruhs', year: 'final', yearKey: 'final-year', query: 'prepare for Resuscitation', topic: 'Newborn infants', reference: 'May/Jun 2024', option: '(7+8)' },
      { university: 'knruhs', year: 'third', yearKey: 'third-year', query: 'amikacin', topic: 'Ear', reference: 'Apr 2026', option: 'C) Outline the appropriate further management for this patient.' },
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
      if (fixture.option) await page.getByText(fixture.option, { exact: false }).filter({ visible: true }).first().waitFor();
      if (fixture.section) await page.getByText(fixture.section, { exact: false }).filter({ visible: true }).first().waitFor();
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
  assert.equal(await page.getByRole('radiogroup').filter({ visible: true }).getByRole('radio', { name: /Maharashtra University/ }).getAttribute('aria-disabled'), 'true');
  await page.getByRole('radiogroup').filter({ visible: true }).getByRole('radio', { name: /West Bengal University/ }).scrollIntoViewIfNeeded();
  await page.getByRole('radiogroup').filter({ visible: true }).getByRole('radio', { name: /West Bengal University/ }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('orbit-profile-v1') || '{}').university === 'wbuhs');
  await page.goto(`${base}/browse/second-year`);
  await page.getByText('WBUHS Question Bank', { exact: true }).waitFor();
  results.push({ width: 360, height: 640, scrollableUniversityPickerAndPersistence: 'passed' });
  await context.close();
} finally { await browser.close(); }
fs.mkdirSync('artifacts/university-import', { recursive: true });
fs.writeFileSync('artifacts/university-import/browser-results.json', JSON.stringify(results, null, 2));
console.log(`PASS ${results.length} emitted web bank/picker scenarios`);
