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
  const storedHome = () => page.evaluate(() => JSON.parse(localStorage.getItem('orbit:home-order-v1') || '{}'));
  const dragControl = async (label, dx, dy) => {
    const control = page.getByLabel(label, { exact: true });
    await control.evaluate(element => element.scrollIntoView({ block: 'center' }));
    const bounds = await control.boundingBox();
    if (!bounds) throw new Error(`${label} has no touch target`);
    await touchDrag({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }, dx, dy);
  };
  const tapControl = async label => {
    const control = page.getByLabel(label, { exact: true });
    await control.scrollIntoViewIfNeeded();
    const bounds = await control.boundingBox();
    if (!bounds) throw new Error(`${label} has no touch target`);
    const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
  };
  const minus = page.getByLabel('Make Welcome card smaller', { exact: true });
  await minus.click();
  await minus.click();
  const smallerWidth = (await storedHome()).scales?.hero;
  if (smallerWidth >= 1) throw new Error('Smaller button did not save width');
  await page.getByLabel('Make Welcome card bigger', { exact: true }).click();
  if ((await storedHome()).scales?.hero <= smallerWidth) throw new Error('Bigger button did not save width');
  await page.getByLabel('Move Welcome card left', { exact: true }).click();
  if ((await storedHome()).aligns?.hero >= 0.5) throw new Error('Move left did not save placement');
  await page.getByLabel('Move Welcome card right', { exact: true }).click();
  if ((await storedHome()).aligns?.hero < 0.5) throw new Error('Move right did not save placement');
  await page.screenshot({ path: path.join(output, 'home-customization-size-and-place.png') });
  await dragControl('Height of Welcome card', 0, 95);
  if ((await storedHome()).heights?.hero <= 1) throw new Error('Bottom height grip did not grow Welcome card');
  await dragControl('Height of Welcome card', 0, -150);
  if ((await storedHome()).heights?.hero >= 1) throw new Error('Bottom height grip did not shrink Welcome card');
  await page.getByLabel('Expand Welcome card', { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, 'home-customization-height-reduced.png') });
  await page.getByLabel('Expand Welcome card', { exact: true }).click();
  if ((await storedHome()).heights?.hero !== 1) throw new Error('Expand did not restore Welcome card');
  const widthBefore = (await storedHome()).scales.hero;
  await dragControl('Width of Welcome card', -65, 0);
  if ((await storedHome()).scales?.hero >= widthBefore) throw new Error('Side width grip did not shrink Welcome card');
  const cornerBefore = await storedHome();
  await dragControl('Width and height of Welcome card', -25, 50);
  const cornerAfter = await storedHome();
  if (cornerAfter.scales?.hero >= cornerBefore.scales.hero || cornerAfter.heights?.hero <= cornerBefore.heights.hero) {
    throw new Error('Corner grip did not change both width and height');
  }
  await page.screenshot({ path: path.join(output, 'home-customization-grips.png') });
  await tapControl('Height of Your subjects');
  if ((await storedHome()).heights?.subjects !== 0.35) throw new Error('Tapping circled subject bar did not minimise grid');
  await page.getByLabel('Expand Your subjects', { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, 'home-subjects-minimised.png') });
  await page.getByLabel('Expand Your subjects', { exact: true }).click();
  if ((await storedHome()).heights?.subjects !== 1) throw new Error('Subject grid did not expand again');
  await page.screenshot({ path: path.join(output, 'home-subjects-expanded.png') });

  // Check both directions on every section, plus its corner and move buttons.
  // Previous checks only grew Welcome, so a grow-only height clamp passed while
  // the reported "minimise" interaction remained broken for every widget.
  for (const [id, label, moveDirection] of [
    ['hero', 'Welcome card', 'down'],
    ['quick', 'Quick actions', 'down'],
    ['whatsapp', 'WhatsApp community', 'down'],
    ['subjects', 'Your subjects', 'down'],
    ['stats', 'Study stats', 'up'],
  ]) {
    await page.getByLabel('Reset home layout', { exact: true }).click();
    const size = () => page.getByLabel(`Height of ${label}`, { exact: true }).evaluate(element => {
      const card = element.parentElement?.getBoundingClientRect();
      return { height: card?.height ?? 0, width: card?.width ?? 0 };
    });
    const original = await size();
    await dragControl(`Height of ${label}`, 0, 70);
    const taller = await size();
    if (taller.height <= original.height + 15 || (await storedHome()).heights?.[id] <= 1) {
      throw new Error(`${label} did not visibly grow with downward drag: ${original.height} → ${taller.height}`);
    }
    await page.screenshot({ path: path.join(output, `height-${id}-larger.png`) });
    await dragControl(`Height of ${label}`, 0, -70);
    const shorter = await size();
    if (shorter.height >= taller.height - 15) throw new Error(`${label} did not reduce with upward drag`);
    await dragControl(`Height of ${label}`, 0, -70);
    if ((await storedHome()).heights?.[id] >= 1) throw new Error(`${label} cannot minimise below natural height`);
    await page.screenshot({ path: path.join(output, `height-${id}-smaller.png`) });
    await page.getByLabel(`Expand ${label}`, { exact: true }).click();
    if ((await storedHome()).heights?.[id] !== 1) throw new Error(`${label} Expand did not restore height`);

    await dragControl(`Width of ${label}`, -65, 0);
    const narrow = await size();
    if (narrow.width >= original.width - 20 || (await storedHome()).scales?.[id] >= 1) {
      throw new Error(`${label} did not get narrower when dragging left`);
    }
    await page.screenshot({ path: path.join(output, `width-${id}-narrower.png`) });
    await dragControl(`Width of ${label}`, 65, 0);
    if ((await size()).width <= narrow.width + 20) throw new Error(`${label} did not widen when dragging right`);

    await dragControl(`Width and height of ${label}`, -35, -45);
    const cornerSmall = await storedHome();
    if (cornerSmall.scales?.[id] >= 1 || cornerSmall.heights?.[id] >= 1) throw new Error(`${label} corner did not shrink both axes`);
    await dragControl(`Width and height of ${label}`, 35, 45);
    const cornerLarge = await storedHome();
    if (cornerLarge.scales?.[id] <= cornerSmall.scales[id] || cornerLarge.heights?.[id] <= cornerSmall.heights[id]) {
      throw new Error(`${label} corner did not grow both axes`);
    }
    const beforeMove = (await storedHome()).order.join();
    await page.getByLabel(`Move ${label} ${moveDirection}`, { exact: true }).click();
    if ((await storedHome()).order.join() === beforeMove) throw new Error(`${label} did not move ${moveDirection}`);
    await page.screenshot({ path: path.join(output, `moved-${id}.png`) });
    await page.getByLabel(`Move ${label} ${moveDirection === 'down' ? 'up' : 'down'}`, { exact: true }).click();
    if ((await storedHome()).order.join() !== beforeMove) throw new Error(`${label} did not move back`);
  }
  await page.getByLabel('Reset home layout', { exact: true }).click();
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
  await page.getByLabel('Move Welcome card up', { exact: true }).click();
  await page.getByLabel('Remove Quick actions', { exact: true }).click();
  if ((await storedHome()).order?.includes('quick')) throw new Error('Remove block did not hide it');
  await page.screenshot({ path: path.join(output, 'home-customization-removed.png') });
  await page.getByLabel('Reset home layout', { exact: true }).click();
  if (!(await storedHome()).order?.includes('quick')) throw new Error('Reset did not restore hidden block');
  await page.screenshot({ path: path.join(output, 'home-customization-reset.png') });
  const firstSubject = page.getByLabel(/^Move .* later$/).first();
  await firstSubject.evaluate(element => element.scrollIntoView({ block: 'center' }));
  const beforeSubject = await page.evaluate(() => localStorage.getItem('orbit:subject-order-v1'));
  await firstSubject.click({ force: true });
  const movedSubject = await page.evaluate(() => localStorage.getItem('orbit:subject-order-v1'));
  if (!movedSubject || movedSubject === beforeSubject) throw new Error('Move subject later did not save order');
  await page.waitForTimeout(500);
  const firstName = page.getByText('PHARMACOLOGY', { exact: true });
  const secondName = page.getByText('PATHOLOGY', { exact: true });
  const movedFirstBox = await firstName.boundingBox();
  const movedSecondBox = await secondName.boundingBox();
  if (!movedFirstBox || !movedSecondBox || movedFirstBox.x <= movedSecondBox.x) throw new Error('Subject order saved but cards did not visibly move');
  await page.screenshot({ path: path.join(output, 'home-subject-reordered.png') });
  await page.getByLabel('Move Pharmacology earlier', { exact: true }).click({ force: true });
  await page.waitForTimeout(500);
  const restoredFirstBox = await firstName.boundingBox();
  const restoredSecondBox = await secondName.boundingBox();
  if (!restoredFirstBox || !restoredSecondBox || restoredFirstBox.x >= restoredSecondBox.x) throw new Error('Move subject earlier did not visibly restore order');
  await page.screenshot({ path: path.join(output, 'home-subject-restored.png') });
  await page.evaluate(() => { globalThis.__orbitPickImage = true; });
  const upload = page.getByLabel(/^Upload picture for /).first();
  await upload.evaluate(element => element.scrollIntoView({ block: 'center' }));
  const photoBounds = await upload.boundingBox();
  if (!photoBounds) throw new Error('Subject photo button is missing');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: photoBounds.x + photoBounds.width / 2, y: photoBounds.y + photoBounds.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => !!localStorage.getItem('orbit:subject-backgrounds-v1'));
  await page.screenshot({ path: path.join(output, 'home-subject-picture-added.png') });
  const removePhoto = page.getByLabel(/^Remove picture for /).first();
  await removePhoto.click({ force: true });
  if (await page.getByLabel(/^Remove picture for /).count()) throw new Error('Remove subject picture did not clear it');
  await page.screenshot({ path: path.join(output, 'home-subject-picture-removed.png') });
  const uploadButtons = page.getByLabel(/^Upload picture for /);
  for (let index = 0; index < await uploadButtons.count(); index += 1) {
    const button = uploadButtons.nth(index);
    const label = await button.getAttribute('aria-label');
    const subject = label.replace('Upload picture for ', '');
    await button.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await button.click({ force: true });
    const remove = page.getByLabel(`Remove picture for ${subject}`, { exact: true });
    await remove.waitFor();
    await page.screenshot({ path: path.join(output, `home-subject-picture-${index + 1}.png`) });
    await remove.click({ force: true });
    await remove.waitFor({ state: 'detached' });
  }

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
