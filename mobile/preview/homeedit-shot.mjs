// Drive Home's edit mode and photograph what it does.
//
// The report was two screenshots of a phone: subject cards drawn on top of the
// Welcome card, the WhatsApp strip through the middle of the subject grid, a
// screen-high void above "Your Subjects", and every floating toolbar sitting
// across the block below it. None of that is visible in a diff, and
// `check:smoke` only asserts that the reorder *state* changed — which it did,
// while the pixels were wrong.
//
// So this presses the real controls in the real screen and screenshots each
// step: the resting edit mode, after moving a block down, after moving it back
// up, and after Reset.
//
//   node preview/homeedit-shot.mjs [outDir]
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.argv[2] ?? path.join(here, '..', '..', 'screenshots'));

async function findChromium() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    const entries = await fs.readdir('/opt/pw-browsers');
    const [dir] = entries.filter(e => e.startsWith('chromium-')).sort().reverse();
    if (dir) return `/opt/pw-browsers/${dir}/chrome-linux/chrome`;
  } catch {}
  for (const c of ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome']) {
    try {
      await fs.access(c);
      return c;
    } catch {}
  }
  throw new Error('no Chromium found — set CHROME_PATH');
}

const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5211, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});
await fs.mkdir(outDir, { recursive: true });

await page.goto('http://localhost:5211/?screen=homeedit', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const shot = async name => {
  await page.screenshot({ path: path.join(outDir, `homeedit-${name}.png`) });
  return path.join(outDir, `homeedit-${name}.png`);
};

/**
 * Every block's box, so overlap can be measured rather than eyeballed.
 *
 * A block is found by the accessibility label of its own "Move … up" button,
 * whose row is the block — the same handle a TalkBack user would reach for.
 */
async function boxes() {
  const labels = [
    'Welcome card',
    'Quick actions',
    'WhatsApp community',
    'Your subjects',
    'Study stats',
  ];
  const out = [];
  for (const label of labels) {
    const control = page.getByLabel(`Move ${label} up`, { exact: true }).first();
    if ((await control.count()) === 0) continue;
    // The block is the row that owns the control; walk up to the positioned row.
    const box = await control.evaluate(el => {
      let node = el;
      for (let i = 0; i < 8 && node.parentElement; i += 1) {
        node = node.parentElement;
        const r = node.getBoundingClientRect();
        if (r.height > 60) {
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        }
      }
      const r = node.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    });
    out.push({ label, ...box });
  }
  return out;
}

/** Vertical overlap between blocks that are supposed to be stacked. */
function overlaps(list) {
  const sorted = [...list].sort((a, b) => a.top - b.top);
  const bad = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i].top - sorted[i - 1].bottom;
    if (gap < -4) {
      bad.push(`${sorted[i - 1].label} and ${sorted[i].label} overlap by ${Math.round(-gap)}px`);
    }
    if (gap > 240) {
      bad.push(`${Math.round(gap)}px of dead space between ${sorted[i - 1].label} and ${sorted[i].label}`);
    }
  }
  return bad;
}

const report = [];
const record = async (name, note) => {
  const file = await shot(name);
  const found = overlaps(await boxes());
  report.push({ name, note, file, found });
  return found;
};

await record('1-resting', 'edit mode as it opens');

// Move the Welcome card down one, which is what the up/down arrows are for.
await page.getByLabel('Move Welcome card down', { exact: true }).first().click();
await page.waitForTimeout(900);
await record('2-moved-down', 'after one press of "Move Welcome card down"');

await page.getByLabel('Move Welcome card up', { exact: true }).first().click();
await page.waitForTimeout(900);
await record('3-moved-back', 'after moving it back up');

// Shrink a block with the minus button, then reset.
const minus = page.getByLabel(/^Make .* smaller$/).first();
if ((await minus.count()) > 0) {
  await minus.click();
  await minus.click();
  await page.waitForTimeout(700);
  await record('4-smaller', 'after two presses of the shrink button');
}

/*
 * The height axis, which is the one that did nothing. Both the bottom bar and
 * the side bar used to write the same width value, so dragging the bar drawn
 * across the bottom edge made the block *narrower*. Drag it down and the block
 * has to get taller.
 */
const heightGrip = page.getByLabel('Height of Welcome card', { exact: true }).first();
if ((await heightGrip.count()) > 0) {
  const before = await heightGrip.evaluate(el => {
    const card = el.parentElement;
    return card ? card.getBoundingClientRect().height : 0;
  });
  const box = await heightGrip.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 120, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(700);
  }
  const after = await heightGrip.evaluate(el => {
    const card = el.parentElement;
    return card ? card.getBoundingClientRect().height : 0;
  });
  const found = await record('5-taller', 'after dragging the bottom bar down 120px');
  if (after <= before + 20) {
    found.push(
      `dragging the height bar down changed the card from ${Math.round(before)}px to ${Math.round(after)}px — the bottom bar does not resize height`,
    );
  } else {
    process.stdout.write(`   height ${Math.round(before)}px -> ${Math.round(after)}px\n`);
  }
}

/*
 * The picture button on a subject card. It only exists in edit mode, and edit
 * mode is exactly when ReorderLockContext turned every Touchable inside a block
 * into a no-op — so this button could never be pressed at all, which is what
 * was reported as "I press the plus icon and cannot upload any image".
 */
const upload = page.getByLabel(/^Upload picture for /).first();
if ((await upload.count()) > 0) {
  const label = await upload.getAttribute('aria-label');
  await page.evaluate(() => {
    globalThis.__orbitPickImage = true;
  });
  /*
   * `force`, because HoloCard's foil drifts on its own forever and Playwright
   * will not click an element it never sees hold still. A finger has no such
   * rule — this is the harness being careful, not the button being unreachable.
   */
  await upload.click({ force: true });
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    globalThis.__orbitPickImage = undefined;
  });
  const shown = await page.evaluate(
    () => [...document.querySelectorAll('img')].filter(el => (el.src || '').startsWith('data:image')).length,
  );
  const found = await record('7-picture', `after ${label}`);
  if (shown === 0) {
    found.push('the picked picture is not on the card — the gradient is still showing');
  } else {
    process.stdout.write(`   picture on ${shown} card(s)\n`);
  }
}

const reset = page.getByLabel('Reset home layout', { exact: true }).first();
if ((await reset.count()) > 0) {
  await reset.click();
  await page.waitForTimeout(900);
  await record('8-reset', 'after Reset home layout');
}

await browser.close();
await server.close();

let bad = 0;
for (const step of report) {
  process.stdout.write(`${step.name}  ${step.note}\n   ${step.file}\n`);
  for (const line of step.found) {
    bad += 1;
    process.stdout.write(`   FAIL ${line}\n`);
  }
}
process.stdout.write(
  bad === 0
    ? '\nOK   blocks stay stacked, with no overlap and no dead space\n'
    : `\nFAIL ${bad} layout problem(s) — the blocks are not stacking\n`,
);
process.exit(bad === 0 ? 0 : 1);
