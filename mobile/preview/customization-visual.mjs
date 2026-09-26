// The real native components, rendered in the React Native web preview.
// Drive touch events at a phone viewport and keep before/after screenshots.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(process.argv[2] ?? path.join(here, '..', '..', 'screenshots', 'customization'));
await fs.mkdir(output, { recursive: true });
const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5226, strictPort: true },
  logLevel: 'error',
});
await server.listen();
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    localStorage.setItem('orbit-profile-v1', JSON.stringify({ display_name: 'Preview', year: 'second' }));
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    localStorage.setItem('orbit:last-question-v1', JSON.stringify({ year: 'second-year', path: ['pathology'], title: 'Pathology', question: 'Describe the microscopic features of seminoma of the testis', type: 'essay' }));
    localStorage.setItem(`orbit:daily-study-v1:mcq:second-year:${date}`, JSON.stringify({
      subject: 'Pathology', sourceQuestion: 'Seminoma of testis',
      question: 'Which cell is characteristic of classical seminoma?',
      options: ['Clear cell with a central nucleus', 'Reed–Sternberg cell', 'Small oat cell', 'Signet ring cell'],
      correctIndex: 0, explanation: 'Classical seminoma has large cells with clear cytoplasm and central nuclei.',
    }));
    localStorage.setItem(`orbit:daily-study-v1:picture:second-year:${date}`, JSON.stringify({
      subject: 'Microbiology', sourceQuestion: 'Endospore structure',
      imageUrl: 'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/microbiology/bacterial_growth_curve_and_endospore_structure.jpg',
      question: 'Which structure provides endospores with heat resistance?',
      options: ['The spore core', 'The flagellum', 'The capsule', 'The cytoplasmic membrane'],
      correctIndex: 0, explanation: 'The spore core contains calcium dipicolinate and has very low water content.',
    }));
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const failures = [];
  page.on('pageerror', err => failures.push(err.message));

  const touchDrag = async (point, dx, dy) => {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }],
    });
    await page.waitForTimeout(320);
    for (let i = 1; i <= 14; i += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: point.x + dx * i / 14, y: point.y + dy * i / 14 }],
      });
      await page.waitForTimeout(18);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(450);
  };

  await page.goto('http://localhost:5226/?screen=homeedit', { waitUntil: 'networkidle' });
  await page.getByLabel('Move Welcome card down', { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, 'home-customization-before.png') });
  const minus = page.getByLabel('Make Welcome card smaller', { exact: true });
  await minus.click();
  await minus.click();
  const hero = page.getByLabel('Move Welcome card down', { exact: true });
  const box = await hero.boundingBox();
  if (!box) throw new Error('Could not find the Welcome section');
  // The open card between the header and footer controls, away from buttons.
  await touchDrag({ x: 75, y: box.y + box.height + 66 }, -42, 250);
  const savedHome = await page.evaluate(() => JSON.parse(localStorage.getItem('orbit:home-order-v1') || '{}'));
  if (!savedHome.order || savedHome.order[0] === 'hero') {
    await page.screenshot({ path: path.join(output, 'home-customization-after.png') });
    throw new Error(`Welcome section did not save the new order after touch drag: ${JSON.stringify(savedHome)}`);
  }
  await page.screenshot({ path: path.join(output, 'home-customization-after.png') });

  await page.goto('http://localhost:5226/?screen=pdf-tools-demo', { waitUntil: 'networkidle' });
  await page.getByLabel('Toggle editing toolbar').click();
  const handle = page.getByLabel('Move PDF editing tools');
  await handle.waitFor();
  await page.getByLabel('Add blank note page after this page').click();
  await page.screenshot({ path: path.join(output, 'pdf-tools-before.png') });
  const before = await handle.boundingBox();
  if (!before) throw new Error('PDF drag handle missing');
  await touchDrag({ x: before.x + before.width / 2, y: before.y + before.height / 2 }, -110, 105);
  const after = await handle.boundingBox();
  if (!after || Math.abs(after.x - before.x) < 45 || Math.abs(after.y - before.y) < 45) {
    throw new Error('PDF tools did not follow the drag on both axes');
  }
  await page.screenshot({ path: path.join(output, 'pdf-tools-moved.png') });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByLabel('Toggle editing toolbar').click();
  await page.waitForTimeout(350);
  const restored = await page.getByLabel('Move PDF editing tools').boundingBox();
  if (!restored || Math.abs(restored.x - after.x) > 15 || Math.abs(restored.y - after.y) > 15) {
    const stored = await page.evaluate(() => localStorage.getItem('orbit:pdf-tools-position-v1'));
    throw new Error(`PDF tools lost their saved position after reopening: after=${JSON.stringify(after)} restored=${JSON.stringify(restored)} stored=${stored}`);
  }
  await page.evaluate(() => localStorage.removeItem('orbit:home-order-v1'));
  await page.goto('http://localhost:5226/?screen=homeresized', { waitUntil: 'networkidle' });
  const homeHero = await page.getByLabel('Next home widget').boundingBox();
  if (!homeHero) throw new Error('Home widget pager is missing');
  const assertFixedHero = async label => {
    const current = await page.getByLabel('Next home widget').boundingBox();
    if (!current || Math.abs(current.y - homeHero.y) > 2) {
      throw new Error(`${label} changed the Welcome card height: ${homeHero.y} → ${current?.y}`);
    }
  };
  await page.getByLabel('Next home widget').click();
  await page.getByText('Which cell is characteristic of classical seminoma?').waitFor();
  await assertFixedHero('MCQ front');
  await page.screenshot({ path: path.join(output, 'home-daily-mcq.png') });
  await page.getByLabel('Select A: Clear cell with a central nucleus').click();
  await page.screenshot({ path: path.join(output, 'home-daily-mcq-selected.png') });
  await page.getByLabel('Reveal daily answer').click();
  await page.getByText('Full explanation →').waitFor();
  await assertFixedHero('MCQ answer');
  await page.screenshot({ path: path.join(output, 'home-daily-mcq-answer.png') });
  await page.getByLabel('Next home widget').click();
  await page.getByText('Which structure provides endospores with heat resistance?').waitFor();
  await page.getByRole('img', { name: 'Study diagram for Microbiology' }).waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector('img[alt="Study diagram for Microbiology"]');
    return image?.complete && image.naturalWidth > 0;
  }, { timeout: 15000 });
  await assertFixedHero('Picture front');
  await page.screenshot({ path: path.join(output, 'home-daily-picture.png') });
  await page.getByLabel('Reveal daily answer').click();
  await page.getByText('Full explanation →').waitFor();
  await assertFixedHero('Picture answer');
  await page.screenshot({ path: path.join(output, 'home-daily-picture-answer.png') });
  await page.getByLabel('Enlarge daily picture').click();
  await page.getByLabel('Close enlarged picture').waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector('img[alt="Enlarged study diagram for Microbiology"]');
    return image?.complete && image.naturalWidth > 0;
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(output, 'home-daily-picture-expanded.png') });
  await page.getByLabel('Close enlarged picture').click();
  await page.getByLabel('Next home widget').click();
  await page.getByText('RESUME WHERE YOU LEFT OFF').waitFor();
  await page.getByText('Describe the microscopic features of seminoma of the testis').waitFor();
  await page.screenshot({ path: path.join(output, 'home-widgets-resume.png') });
  await page.getByLabel('Next home widget').click();
  await page.getByText('complete', { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, 'home-widgets-progress.png') });
  await page.getByLabel('Next home widget').click();
  await page.getByText('STUDY TIME').waitFor();
  await page.screenshot({ path: path.join(output, 'home-widgets-study.png') });
  await page.getByLabel('Next home widget').click();
  await page.getByText('ATTENDANCE', { exact: true }).first().waitFor();
  await page.screenshot({ path: path.join(output, 'home-widgets-attendance.png') });
  await page.getByLabel('Next quick actions').click();
  await page.getByLabel('Reminders', { exact: true }).waitFor();
  for (const label of ['Bank', 'Posting', 'Alerts']) {
    const visible = page.getByText(label, { exact: true });
    await visible.waitFor();
    if (!(await visible.evaluate(element => element.scrollWidth <= element.clientWidth + 1))) {
      throw new Error(`Quick action label is clipped: ${label}`);
    }
  }
  await page.screenshot({ path: path.join(output, 'home-quick-page-two.png') });
  if (failures.length) throw new Error('Preview errors: ' + failures.slice(0, 3).join(' | '));
  console.log('Home and PDF toolbar screenshots saved to', output);
} finally {
  await browser?.close();
  await server.close();
}
