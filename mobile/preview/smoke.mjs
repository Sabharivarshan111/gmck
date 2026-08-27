// Functional smoke test: drives the real screens and asserts nothing breaks.
//
// The screenshot harness only proves a screen renders. This one *uses* the app
// — toggles the theme, opens sheets, picks a year, searches, ticks a question,
// starts the timer, visits every tab — and fails if any of it throws or stops
// responding.
//
// It selects controls by their accessibility label, which means it doubles as a
// check that those labels exist and are meaningful. A control this script
// cannot find is a control TalkBack cannot announce.
//
// It is still react-native-web, not a device: it verifies wiring and state, not
// native rendering, gesture physics or animation timing.
//
//   node preview/smoke.mjs
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));

// Noise that is expected in this environment and is not an app fault: the
// sandbox blocks Supabase, and react-native-web forwards a `collapsable` prop
// React does not recognise.
const EXPECTED = [
  /ERR_TUNNEL_CONNECTION_FAILED/,
  /Failed to load resource/,
  /non-boolean attribute/,
  /collapsable/,
  /Failed to fetch/,
  /supabase/i,
];

const server = await createServer({
  configFile: path.join(here, 'vite.config.ts'),
  server: { port: 5202, strictPort: true },
  logLevel: 'error',
});
await server.listen();

async function findChromiumExecutable() {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }
  // Linux container path (Claude Code sandbox)
  try {
    const entries = await fs.readdir('/opt/pw-browsers');
    const [chromeDir] = entries
      .filter(entry => entry.startsWith('chromium-'))
      .sort()
      .reverse();
    if (chromeDir) {
      return `/opt/pw-browsers/${chromeDir}/chrome-linux/chrome`;
    }
  } catch {}

  // macOS / Linux standard paths
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
  }
  return undefined;
}

const executablePath = await findChromiumExecutable();
const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ['--no-sandbox', '--disable-gpu', '--headless=new'],
});
// hasTouch, so the app sees a touch device rather than a mouse — the resize
// step below dispatches real touch events and they need a context that accepts
// them.
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
/**
 * Start with a profile, the way a real second launch does.
 *
 * Without one the app shows its onboarding sheet, and that sheet is a
 * full-screen modal — so every control on every screen behind it is present in
 * the DOM, reported "visible" by Playwright, and completely unclickable. The
 * suite has been running against that: `progress screen renders` passed by
 * reading text through a modal nobody could touch, and the first flow that
 * actually tried to *tap* something on My Progress failed with a timeout that
 * looked like a missing button.
 *
 * Seeded before any script runs, in the web app's own key, because the two
 * apps deliberately share it.
 */
await context.addInitScript(() => {
  try {
    window.localStorage.setItem(
      'orbit-profile-v1',
      JSON.stringify({ display_name: 'Smoke', year: 'second' }),
    );
  } catch {}
});

const page = await context.newPage();
/** For dispatching touch events the mouse API cannot produce. */
const cdp = await context.newCDPSession(page);

const crashes = [];
page.on('pageerror', error => crashes.push(`uncaught: ${error.message}`));
page.on('console', message => {
  if (message.type() !== 'error') {
    return;
  }
  const text = message.text();
  if (!EXPECTED.some(rx => rx.test(text))) {
    crashes.push(`console.error: ${text.slice(0, 160)}`);
  }
});

const results = [];
let failed = 0;

async function step(name, fn) {
  try {
    await fn();
    results.push(['ok  ', name]);
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed++;
    const msg = `${name} — ${String(error.message).split('\n')[0].slice(0, 110)}`;
    results.push(['FAIL', msg]);
    console.log(`  FAIL ${msg}`);
  }
  // A step that failed mid-dialog would block every step after it, turning one
  // fault into a wall of red. Always leave the screen usable — a sheet counts
  // as well as a dialog, since its scrim blocks the header the next step needs.
  await declineAdPromptIfShown();
  await closeSheetIfOpen();
  await closeModalIfOpen();
}

/** The theme editor is a modal card, not a sheet; it closes with its X. */
async function closeModalIfOpen() {
  const close = page.locator('[aria-label="Close"]').first();
  if (await close.isVisible().catch(() => false)) {
    await close.click().catch(() => {});
    await page.waitForTimeout(600);
    await declineAdPromptIfShown();
    return true;
  }
  return false;
}

/**
 * Wait for a sheet to actually be gone.
 *
 * Its exit is a spring, not a fixed duration, and the scrim keeps swallowing
 * taps until it has finished. A `waitForTimeout(900)` was racing it: the theme
 * steps passed, then the next step's first tap reported "visible but blocked"
 * on a header button the closing sheet was still covering.
 */
async function waitForSheetClosed() {
  await page
    .locator('[aria-label="Done"]')
    .first()
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(150);
}

/** Dismiss a sheet left open, so its scrim does not eat the next step. */
async function closeSheetIfOpen() {
  const done = page.locator('[aria-label="Done"]').first();
  if (await done.isVisible().catch(() => false)) {
    await done.click().catch(() => {});
    await waitForSheetClosed();
    await declineAdPromptIfShown();
    return true;
  }
  return false;
}

const byLabel = label => page.locator(`[aria-label="${label}"]`).first();
/**
 * Names the control in the failure.
 *
 * Playwright's own message is "locator.click: Timeout 4000ms exceeded", which
 * says a click failed but not which one — and a step that taps six controls
 * then gives no clue where it stopped. It also reports whether the control was
 * missing or merely unclickable, which are different bugs: absent means a
 * label changed, present-but-blocked means something is covering it.
 */
const tap = async label => {
  try {
    await byLabel(label).click({ timeout: 4000 });
  } catch (error) {
    const count = await byLabel(label).count();
    const visible = count > 0 && (await byLabel(label).isVisible().catch(() => false));
    if (process.env.SMOKE_DEBUG) {
      await page.screenshot({ path: `/tmp/smoke-fail-${label.replace(/\W+/g, '-')}.png` });
      const top = await page.evaluate(l => {
        const el = document.querySelector(`[aria-label="${l}"]`);
        if (!el) return 'missing';
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        const path = [];
        for (let n = hit; n && path.length < 5; n = n.parentElement) {
          path.push(`${n.tagName}${n.getAttribute('aria-label') ? `[${n.getAttribute('aria-label')}]` : ''}`);
        }
        return path.join(' < ');
      }, label);
      process.stdout.write(`\nDEBUG hit-test at "${label}": ${top}\n`);
    }
    const why = String(error.message).split('\n').slice(0, 3).join(' | ');
    throw new Error(
      `could not tap "${label}" (${count === 0 ? 'no such label' : visible ? 'visible' : 'hidden'}) — ${why}`,
    );
  }
  await page.waitForTimeout(280);
};
/**
 * Bring a control into the viewport.
 *
 * `page.mouse.wheel` does nothing to a react-native-web ScrollView — it is a
 * div with its own overflow, and the wheel goes to the document instead. And
 * Playwright counts an off-screen node "visible", so a click on one fails with
 * a timeout that reads as a missing control rather than a distant one. This is
 * the only thing that actually moves it.
 */
const scrollTo = async locator => {
  await locator.waitFor({ timeout: 6000 });
  await locator.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
};

const seesText = async (text, timeout = 4000) => {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
};

/**
 * Changing the theme asks to play the day's rewarded ad, and that dialog's
 * scrim covers the screen until it is answered — so anything driving the app
 * has to answer it, exactly as a user would. This is designed behaviour ported
 * from the web app, not a defect; the test simply declines.
 */
async function declineAdPromptIfShown() {
  const notNow = page.locator('[aria-label="Not now"]').first();
  if (await notNow.isVisible().catch(() => false)) {
    await notNow.click();
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

async function open(query) {
  await page.goto(`http://localhost:5202/?${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
}

// ---- Home -----------------------------------------------------------------
await open('screen=home');

await step('home renders the subject grid', () => seesText('Your Subjects'));

/**
 * Themes are an anchored menu now, matching the published app: tap the header
 * button, pick a row, the menu closes itself.
 */
async function pickTheme(label) {
  await tap('Themes');
  await tap(label);
  await page.waitForTimeout(500);
  return declineAdPromptIfShown();
}

const taglineColor = () =>
  page.evaluate(() => {
    const node = [...document.querySelectorAll('div,span')].find(
      n => n.children.length === 0 && n.textContent.trim() === 'Learn. Retain. Master.',
    );
    return node ? getComputedStyle(node).color : null;
  });

await step('theme menu switches between presets', async () => {
  await pickTheme('Light');
  const light = await taglineColor();
  await pickTheme('Dark');
  const dark = await taglineColor();
  if (!light || !dark || light === dark) {
    throw new Error(`text colour did not change between presets (${light} → ${dark})`);
  }
});

await step('Black Pink changes the accent but keeps the black base', async () => {
  /**
   * Asserted on the two things that actually distinguish it from Dark. An
   * earlier version read the same value twice and asserted they were equal,
   * which is true of any value and tested nothing.
   */
  const heroAccent = () =>
    page.evaluate(() => {
      const node = [...document.querySelectorAll('div,span')].find(
        n => n.children.length === 0 && n.textContent.trim() === 'Ask AI',
      );
      return node ? getComputedStyle(node).color : null;
    });

  await pickTheme('Dark');
  const darkAccent = await heroAccent();
  const darkText = await taglineColor();
  await pickTheme('Black Pink');
  const pinkAccent = await heroAccent();
  const pinkText = await taglineColor();

  if (!darkAccent || !pinkAccent || darkAccent === pinkAccent) {
    throw new Error(`accent did not change (${darkAccent} → ${pinkAccent})`);
  }
  if (darkText !== pinkText) {
    throw new Error(`text colour should be unchanged on a black base (${darkText} → ${pinkText})`);
  }
  await pickTheme('Dark');
});

await step('the theme editor builds and applies a theme', async () => {
  await tap('Themes');
  await tap('Create Your Own…');
  await seesText('Pick colors for your perfect look');

  // All four parts must open a picker, or this is not the editor asked for.
  for (const part of ['Background, Main page color', 'Text, Main text color', 'Accent, Buttons & highlights', 'Card, Cards & panels']) {
    await tap(part);
    await page.waitForTimeout(250);
    const picker = await page.locator('[aria-label$="colour picker"]').count();
    if (picker === 0) {
      throw new Error(`tapping "${part}" did not open a picker`);
    }
    /**
     * Dismiss by tapping the same slot again.
     *
     * Clicking the backdrop was the obvious move and closed the entire editor
     * — the popover's scrim and the modal's are both "outside the card" from a
     * click's point of view. Toggling on the slot is also what a user does.
     */
    await tap(part);
    await page.waitForTimeout(250);
  }

  // Reset has to actually restore, not just exist.
  await tap('Sunset');
  await page.waitForTimeout(300);
  const sunsetShot = await page.screenshot();
  await tap('Reset');
  await page.waitForTimeout(300);
  const resetShot = await page.screenshot();
  if (Buffer.compare(sunsetShot, resetShot) === 0) {
    throw new Error('Reset changed nothing');
  }

  await tap('Forest');
  await page.waitForTimeout(300);
  await tap('Apply Theme');
  await page.waitForTimeout(700);
  await declineAdPromptIfShown();

  // The applied theme should now be offered as My Theme.
  await tap('Themes');
  await seesText('My Theme');
  await tap('Dark');
  await page.waitForTimeout(500);
  await declineAdPromptIfShown();
});

await step('declining the ad prompt stops it re-asking on the next change', async () => {
  const askedAgain = await pickTheme('Light');
  const askedThrice = await pickTheme('Dark');
  if (askedAgain || askedThrice) {
    throw new Error('prompt returned during the decline cooldown');
  }
});

await step('text size slider resizes the app live, and snaps to 100%', async () => {
  await tap('Settings');
  await seesText('TEXT SIZE');

  // The sample in the sheet is real app text, so its computed size is the
  // check: a readout that says 115% while nothing grew is the bug worth
  // catching.
  const sampleSize = async () =>
    page.evaluate(() => {
      // The innermost match: react-native-web renders a Text as a div inside
      // several layout divs, and the ancestors report the document's default
      // 16px rather than the ramp's size.
      const nodes = [...document.querySelectorAll('div')].filter(el =>
        el.textContent?.startsWith('Bilirubin is conjugated'),
      );
      const node = nodes[nodes.length - 1];
      return node ? parseFloat(getComputedStyle(node).fontSize) : 0;
    });
  const readout = async () =>
    // By testID, not by shape: the settings sheet has more than one
    // percentage in it now, and "the last thing that looks like NN%" quietly
    // became the haptic strength.
    page.evaluate(() => {
      const node = document.querySelector('[data-testid="text-size-value"]');
      return node?.textContent ?? '';
    });

  const slider = page.locator('[role="slider"]').first();
  const box = await slider.boundingBox();
  if (!box) {
    throw new Error('no slider in the text size sheet');
  }
  const before = await sampleSize();

  // Drag to the maximum.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const grown = await sampleSize();
  if (!(grown > before)) {
    throw new Error(`dragging right did not enlarge the sample (${before} → ${grown})`);
  }
  if ((await readout()) !== '115%') {
    throw new Error(`readout says ${await readout()} at the right-hand end, expected 115%`);
  }

  // Re-measure. Committing 115% re-typesets the whole app including this
  // sheet, so it is taller than it was and the slider has moved — using the
  // position from before the first drag aims at empty space.
  const box2 = await slider.boundingBox();
  if (!box2) {
    throw new Error('the slider vanished after the first drag');
  }

  // Release a little short of the 100% tick: the detent is what makes the one
  // named value on the scale reachable exactly.
  const defaultX = box2.x + 14 + (box2.width - 28) * ((1 - 0.9) / (1.15 - 0.9));
  await page.mouse.move(box2.x + box2.width - 2, box2.y + box2.height / 2);
  await page.mouse.down();
  // Far enough past the tick to round to 101% on its own, close enough that
  // the detent should reel it in. Land it on 100% by luck and this asserts
  // nothing.
  await page.mouse.move(defaultX + 14, box2.y + box2.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  if ((await readout()) !== '100%') {
    throw new Error(`released near the 100% tick and got ${await readout()}`);
  }

  await tap('Done');
  // The exit is a spring, not a fixed duration — give it room to settle.
  await page.waitForTimeout(1200);
  if (await page.getByText('Haptics').first().isVisible().catch(() => false)) {
    throw new Error('sheet did not dismiss');
  }
});

await step('home blocks rearrange, and the order survives a reload', async () => {
  await open('screen=home');

  /** Vertical position of the block that contains a known piece of text. */
  const topOf = text =>
    page.evaluate(needle => {
      const nodes = [...document.querySelectorAll('div')].filter(el =>
        el.textContent?.includes(needle),
      );
      const node = nodes[nodes.length - 1];
      return node ? node.getBoundingClientRect().top : NaN;
    }, text);

  const heroFirst = (await topOf('Welcome to Orbit')) < (await topOf('Join our WhatsApp'));
  if (!heroFirst) {
    throw new Error('expected the hero above the WhatsApp block to start with');
  }

  await tap('Rearrange home screen');
  await seesText('Drag a block');
  await tap('Move WhatsApp community up');
  await tap('Move WhatsApp community up');
  // The blocks move on a spring, and the assertion is about where they end up.
  await page.waitForTimeout(700);
  if ((await topOf('Join our WhatsApp')) > (await topOf('Welcome to Orbit'))) {
    throw new Error('two moves up did not put the WhatsApp block above the hero');
  }

  await tap('Finish rearranging');
  await open('screen=home');
  if ((await topOf('Join our WhatsApp')) > (await topOf('Welcome to Orbit'))) {
    throw new Error('the new order did not survive a reload');
  }

  // Reset, so the rest of the run sees the layout it expects — and so the one
  // control that undoes all of this is covered too.
  await tap('Rearrange home screen');
  await tap('Reset home layout');
  await page.waitForTimeout(700);
  if ((await topOf('Welcome to Orbit')) > (await topOf('Join our WhatsApp'))) {
    throw new Error('Reset did not put the blocks back');
  }
  await tap('Finish rearranging');
});

await step('a block resizes with its grip, and the size survives a reload', async () => {
  await open('screen=home');

  /** The hero's drawn height. Resizing it is the whole point of the grip. */
  const heroHeight = () =>
    page.evaluate(() => {
      const node = [...document.querySelectorAll('div')].find(el =>
        el.textContent?.startsWith('Welcome to Orbit'),
      );
      return node ? Math.round(node.getBoundingClientRect().height) : 0;
    });

  /**
   * Drag a grip by `dy`, in steps, with **touch** events.
   *
   * Mouse events were what this used, and they are not the same test. A
   * PanResponder can pass under mousedown/mousemove and still lose the gesture
   * on a phone, where the strip is inside a scrolling page and a finger is
   * competing with it — which is exactly the shape of "it works in the preview
   * and not on my device". CDP dispatches the real thing.
   *
   * Stepped, because the responder reads movement: one jump from down to up is
   * a tap that happens to end somewhere else.
   */
  const dragGrip = async (label, dy) => {
    const box = await byLabel(label).boundingBox();
    if (!box) {
      throw new Error(`no resize grip for "${label}"`);
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const send = (type, ty) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints:
          type === 'touchEnd' ? [] : [{ x, y: ty, radiusX: 12, radiusY: 12, force: 1 }],
      });
    await send('touchStart', y);
    for (let i = 1; i <= 12; i += 1) {
      await send('touchMove', y + (dy * i) / 12);
      await page.waitForTimeout(16);
    }
    await send('touchEnd', y + dy);
    await page.waitForTimeout(400);
  };

  await tap('Rearrange home screen');
  const before = await heroHeight();

  await dragGrip('Resize Welcome card', 70);
  const grown = await heroHeight();
  if (!(grown > before + 20)) {
    throw new Error(`dragging the grip down grew the hero by only ${grown - before}px`);
  }

  await dragGrip('Resize Welcome card', -140);
  const shrunk = await heroHeight();
  if (!(shrunk < before - 20)) {
    throw new Error(`dragging the grip up shrank the hero by only ${before - shrunk}px`);
  }

  await tap('Finish rearranging');
  await open('screen=home');
  const reloaded = await heroHeight();
  if (Math.abs(reloaded - shrunk) > 32) {
    throw new Error(`the block size did not survive a reload (${shrunk} \u2192 ${reloaded})`);
  }

  // Put it back, so the rest of the run sees the layout it expects.
  await tap('Rearrange home screen');
  await tap('Reset home layout');
  await page.waitForTimeout(700);
  if (Math.abs((await heroHeight()) - before) > 24) {
    throw new Error('Reset did not put the hero back to its normal size');
  }
  await tap('Finish rearranging');
});

await step('a subject card can be dragged to another slot', async () => {
  await open('screen=home');

  const cards = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[aria-label]')]
        .filter(el => /% complete$/.test(el.getAttribute('aria-label') || ''))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { name: (el.getAttribute('aria-label') || '').split(',')[0], x: rect.x, y: rect.y };
        })
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map(card => card.name),
    );

  const before = await cards();
  if (before.length < 2) {
    throw new Error(`expected at least two subject cards, saw ${before.length}`);
  }

  await tap('Rearrange home screen');
  const first = page.locator(`[aria-label^="${before[0]}"]`).first();
  const box = await first.boundingBox();
  // Into the slot to its right. The card claims the gesture ahead of the
  // block it sits in; if that ever regresses, the whole block moves instead
  // and the card order comes back unchanged.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 1.5, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(800);

  const after = await cards();
  if (after[0] === before[0]) {
    throw new Error(`dragging "${before[0]}" right left it first: ${after.join(', ')}`);
  }
  if (after.length !== before.length) {
    throw new Error(`a card went missing: ${before.join(', ')} → ${after.join(', ')}`);
  }
  await tap('Finish rearranging');
});

await step('year picker opens and browses a year', async () => {
  await tap('View all years');
  await seesText('Choose the year you want to browse');
  await tap('1st Year');
  await tap('Browse 1st Year');
  await seesText('Question Bank');
});

// ---- Browse + search ------------------------------------------------------
await step('search returns matching questions', async () => {
  await open('screen=browse');
  const before = await page.locator('body').innerText();
  await page.locator('input').first().fill('cell');
  // 220ms debounce, plus the one-off search-index build on first use.
  await page.waitForTimeout(1500);
  const after = await page.locator('body').innerText();
  if (after === before) {
    throw new Error('typing a query changed nothing on screen');
  }
  if (!/cell/i.test(after)) {
    throw new Error('results do not contain the query term');
  }
});

// ---- Question list: ticking ------------------------------------------------
await step('a question row toggles done and back', async () => {
  // Pathology → Explore Questions → a topic → the question list. Three levels;
  // the checkboxes only exist at the last one.
  await open('screen=browse&year=second-year&node=pathology&title=Pathology');
  await page.getByText('Explore Questions').first().click({ timeout: 5000 });
  await page.waitForTimeout(800);
  // By label, not by text: the visible Text sits inside the pressable, and the
  // label is what a screen reader would use to get here too.
  await page.locator('[aria-label^="The Cell as a Unit"]').first().click({ timeout: 5000 });
  await page.waitForTimeout(900);
  // Opening a topic spends the "questions" bucket's daily ad, so the prompt
  // appears here too and has to be answered before anything is reachable.
  await declineAdPromptIfShown();

  // A topic can hold essays, short notes, or only one of the two — this one
  // has no essays at all, and lands on its empty state. Switch tabs when that
  // happens rather than assuming.
  if (await page.getByText('No essays here').first().isVisible().catch(() => false)) {
    await page.getByText('Short Notes').first().click({ timeout: 4000 });
    await page.waitForTimeout(700);
  }

  // The checkbox is its own control now — the row itself counts taps for
  // MCQs (2) and the written answer (3), matching the published app.
  const box = page.locator('[role="checkbox"]').first();
  await box.waitFor({ timeout: 5000 });
  const row = page.locator('[aria-label][role="button"]').filter({ has: box }).first();

  /**
   * Asserted on the row's own colours, not on aria-checked.
   *
   * The row does set `accessibilityState={{ checked }}`, which React Native
   * maps to TalkBack's checked state on Android — but react-native-web does
   * not mirror it to `aria-checked`, so it reads as null here. That is a gap
   * in the harness, not in the app, and not worth contorting app code to
   * satisfy a shim.
   *
   * This used to read the strikethrough, which was the rendered form of the
   * same state until a done question stopped being struck out — crossed-out
   * text says "discard this", and a question you have answered is exactly the
   * one you want to reread before an exam. The green card and the ticked box
   * carry it now, so that is what this reads: the row's border and fill.
   */
  const swatch = () =>
    row.evaluate(node => {
      const style = getComputedStyle(node);
      return `${style.borderTopColor}|${style.backgroundColor}`;
    });

  const before = await swatch();
  await box.click();
  await page.waitForTimeout(500);
  if ((await swatch()) === before) {
    throw new Error(`tapping the checkbox did not change its done state (stayed ${before})`);
  }

  /*
   * The tick says so.
   *
   * The web app has toasted every tick since XP existed and the phone had no
   * toast at all, so a tick fed a number you could only find by walking to My
   * Progress. Asserted here rather than in its own step because it has to fire
   * on the screen the tick happened on, which is this one.
   */
  await seesText('+1 XP', 3000);

  await box.click();
  await page.waitForTimeout(500);
  if ((await swatch()) !== before) {
    throw new Error('second tap did not restore the original state');
  }
});

/**
 * Ticking questions drives the topic's bar to the end, and the gradient inside
 * it is sized by the track rather than by the value.
 *
 * The second half is the regression guard, and it is the half this harness can
 * actually see. `GradientFill` is an `<Svg width="100%">`; on Android
 * react-native-svg paints the canvas at the size it measured and does not
 * repaint when its parent is merely resized, so a fill box whose *width* is the
 * percentage keeps painting the old percentage — tick the last question in a
 * topic and the bar stays where it was. A DOM svg reflows, so the bar looked
 * perfect here the whole time. Asserting the shape is what catches it, because
 * asserting the appearance never will.
 */
await step('the topic bar fills to the end, and its gradient is track-sized', async () => {
  await open('screen=browse&year=second-year&node=pathology&title=Pathology');
  await page.getByText('Explore Questions').first().click({ timeout: 5000 });
  await page.waitForTimeout(800);
  await page.locator('[aria-label^="The Cell as a Unit"]').first().click({ timeout: 5000 });
  await page.waitForTimeout(900);
  await declineAdPromptIfShown();
  if (await page.getByText('No essays here').first().isVisible().catch(() => false)) {
    await page.getByText('Short Notes').first().click({ timeout: 4000 });
    await page.waitForTimeout(700);
  }

  // The topmost screen's counter: React Navigation leaves the previous screen
  // mounted, and its counter matches the same pattern.
  const readBar = () =>
    page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('*')).filter(
        el => el.childElementCount === 0 && /^\d+ of \d+ done$/.test(el.textContent?.trim() ?? ''),
      );
      const node = labels[labels.length - 1];
      if (!node) {
        return null;
      }
      const stats = node.parentElement?.parentElement;
      const fill = stats?.querySelector('div[style*="%"]') ?? null;
      const track = fill?.parentElement ?? null;
      const gradientBox = fill?.firstElementChild ?? null;
      return {
        label: node.textContent.trim(),
        fillWidth: fill ? fill.style.width : null,
        trackPx: track ? Math.round(track.getBoundingClientRect().width) : null,
        gradientPx: gradientBox ? Math.round(gradientBox.getBoundingClientRect().width) : null,
      };
    });

  const boxes = page.locator('[role="checkbox"]');
  const count = await boxes.count();
  if (count < 2) {
    throw new Error(`this topic has ${count} question(s) — the step needs at least two`);
  }

  // All but one, so the bar is genuinely partial. That is the only state where
  // the two implementations differ: at 100% a value-sized gradient and a
  // track-sized one are the same width, and the check would pass on the bug.
  for (let index = 0; index < count - 1; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await boxes.nth(index).click();
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(450);
  }

  const partial = await readBar();
  if (!partial) {
    throw new Error('the topic counter disappeared while ticking questions');
  }
  if (partial.fillWidth === '100%') {
    throw new Error(`the bar is full at ${partial.label} — one question is still unticked`);
  }
  /*
   * The gradient is a fixed box the width of the track, revealed through the
   * fill. If it measures the same as the fill instead, it is being sized by the
   * value, which is the Android repaint bug: react-native-svg paints the canvas
   * at the size it measured and will not repaint it when the parent is resized.
   */
  if (partial.trackPx && partial.gradientPx && Math.abs(partial.trackPx - partial.gradientPx) > 2) {
    throw new Error(
      `at ${partial.label} the bar's gradient is ${partial.gradientPx}px inside a ` +
        `${partial.trackPx}px track — it is sized by the value, so Android paints a stale width`,
    );
  }

  await boxes.nth(count - 1).click();
  await page.waitForTimeout(450);
  const done = await readBar();
  if (!done) {
    throw new Error('the topic counter disappeared after ticking every question');
  }
  if (done.fillWidth !== '100%') {
    throw new Error(
      `every question is ticked and the bar reads ${done.label} at ${done.fillWidth} — it should be full`,
    );
  }
});

await step('double tap a question opens Ask AI with the question text', async () => {
  // Same three levels as the step above. Re-navigating rather than reusing the
  // previous position keeps this step independent — a failure there should not
  // turn into a confusing failure here.
  await open('screen=browse&year=second-year&node=pathology&title=Pathology');
  await page.getByText('Explore Questions').first().click({ timeout: 5000 });
  await page.waitForTimeout(800);
  await page.locator('[aria-label^="The Cell as a Unit"]').first().click({ timeout: 5000 });
  await page.waitForTimeout(900);
  await declineAdPromptIfShown();
  if (await page.getByText('No essays here').first().isVisible().catch(() => false)) {
    await page.getByText('Short Notes').first().click({ timeout: 4000 });
    await page.waitForTimeout(700);
  }

  const box = page.locator('[role="checkbox"]').first();
  await box.waitFor({ timeout: 5000 });
  const row = page.locator('[aria-label][role="button"]').filter({ has: box }).first();
  const question = (await row.getAttribute('aria-label')) ?? '';

  // Two taps inside the 280ms window. Driven through page.mouse with
  // clickCount rather than two awaited .click() calls, because each awaited
  // click costs more than the window and the second would start a new count.
  const point = await row.boundingBox();
  await page.mouse.click(point.x + point.width / 2, point.y + 12, { clickCount: 2, delay: 40 });

  // The request itself cannot succeed here — the sandbox blocks Supabase — so
  // this asserts the routing and the prompt, which is what the change touched.
  // The failure bubble that follows is expected and is not what is checked.
  //
  // Keyed on the composer, not on the text "Ask AI": that string is also the
  // bottom-nav tab label, so it is already on screen before the tap and would
  // make this pass without ever navigating anywhere.
  await page
    .locator('[placeholder="Ask a medical question…"]')
    .waitFor({ state: 'visible', timeout: 6000 });

  // Only what is actually visible. React Navigation keeps the screens you came
  // from mounted, so reading every text node would also read the browse screens
  // still sitting behind this one.
  const shown = await page.evaluate(() =>
    [...document.querySelectorAll('div,span')]
      .filter(node => node.children.length === 0 && node.textContent.trim() && node.offsetParent)
      .map(node => node.textContent.trim()),
  );
  const joined = shown.join('   ');

  // The markers are machinery for the edge function; a user must never see one.
  if (/Triple-tapped:|Double-tapped:/.test(joined)) {
    throw new Error('a tap marker leaked into the transcript');
  }
  // Nor the JSON-forcing MCQ instructions that replace the prompt on the wire.
  if (/RESPOND WITH ONLY A VALID JSON ARRAY/.test(joined)) {
    throw new Error('the raw MCQ prompt was shown instead of the question');
  }
  // The question itself should be there. Compared on the leading words before
  // any bracket — the label carries PYQ markers ("Growth Factors (Feb 15;Feb
  // 08)") and comparing a punctuation-stripped stem against unstripped screen
  // text never matches.
  const stem = question.split('(')[0].trim();
  if (stem && !joined.includes(stem)) {
    throw new Error(`the question ("${stem}") did not reach the Ask AI transcript`);
  }
});

await step('in-topic filter narrows the list and keeps question numbers', async () => {
  // Straight to the largest topic in the bank — 67 short notes, 15 essays —
  // because the field only appears above a list long enough to need it.
  await open(
    'screen=browse&year=second-year&node=pharmacology,paper-2,anti-microbial-drugs&title=Anti-Microbial%20Drugs',
  );
  await declineAdPromptIfShown();

  const field = page.locator('[placeholder^="Filter"]');
  await field.waitFor({ state: 'visible', timeout: 5000 });

  const numbers = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('div,span')]
        .filter(n => n.children.length === 0 && /^\d+\./.test(n.textContent.trim()) && n.offsetParent)
        .map(n => Number(n.textContent.trim().split('.')[0])),
    );

  /**
   * Narrowing is asserted on the "N of M" counter, not on how many rows are on
   * screen. The list is virtualized, so the visible row count is whatever the
   * window happens to be rendering — comparing those two numbers had the test
   * reporting "13 → 14" for a filter that genuinely cut 15 rows to 10.
   */
  const counter = async () => {
    const text = await page.evaluate(() => {
      const hit = [...document.querySelectorAll('div,span')].find(
        n => n.children.length === 0 && /^\d+ of \d+$/.test(n.textContent.trim()) && n.offsetParent,
      );
      return hit ? hit.textContent.trim() : null;
    });
    return text;
  };

  const before = await numbers();
  if (before.length < 10) {
    throw new Error(`expected a long list, saw ${before.length} rows`);
  }

  // 10 of the 15 essays contain "anti", at positions 1-6, 10-12 and 15.
  await field.fill('anti');
  await page.waitForTimeout(500);
  if ((await counter()) !== '10 of 15') {
    throw new Error(`filter counter read "${await counter()}", expected "10 of 15"`);
  }

  /**
   * The number on a row is its position in the topic, not its position in the
   * filtered list — renumbering 1..n would mean "question 2" named a different
   * question depending on what was typed.
   *
   * Asserted as "strictly ascending, with at least one gap", which is what
   * preserved positions look like once a filter has skipped something. An
   * earlier version only checked that the first two rows were not 1 and 2;
   * giving every row the same index slipped straight past that, because then
   * no two consecutive rows read 1 and 2 either.
   */
  const after = await numbers();
  const ascending = after.every((n, i) => i === 0 || n > after[i - 1]);
  const hasGap = after.some((n, i) => i > 0 && n !== after[i - 1] + 1);
  if (!ascending) {
    throw new Error(`row numbers are not ascending after filtering: ${after.join(',')}`);
  }
  if (!hasGap) {
    throw new Error(`row numbers were renumbered 1..n by the filter: ${after.join(',')}`);
  }

  // A filtered list with no matches must not tell the user to switch tabs.
  await field.fill('zzzznope');
  await page.waitForTimeout(500);
  await page.getByText('No matches').first().waitFor({ state: 'visible', timeout: 4000 });
  if (await page.getByText('Switch the tab above').first().isVisible().catch(() => false)) {
    throw new Error('showed the wrong-tab empty state for a filter with no matches');
  }

  // Clearing restores everything.
  await page.locator('[aria-label="Clear filter"]').first().click();
  await page.waitForTimeout(500);
  // With no query there is nothing to count, so the counter goes away and the
  // full list is back.
  if ((await counter()) !== null) {
    throw new Error('the filter counter is still showing after clearing');
  }
  if ((await numbers()).length < 10) {
    throw new Error('clearing did not restore the full list');
  }
});

// ---- Timer -----------------------------------------------------------------
await step('timer starts, pauses, resets, and opens its sheet', async () => {
  await open('screen=timer');
  await seesText('Focus Timer');
  await tap('Start timer');
  await byLabel('Pause timer').waitFor({ timeout: 4000 });
  await tap('Pause timer');
  await byLabel('Start timer').waitFor({ timeout: 4000 });
  await tap('Reset timer');
  await tap('Timer settings');
  await seesText('Pomodoro Settings');
});

/**
 * Every control in the Pomodoro sheet does something.
 *
 * The durations are drafted and only take effect on "Set this configuration",
 * so the dial must NOT move while a slider does — and must move once the
 * button is pressed. That ordering is the whole reason the sheet is built this
 * way: the timer derives its length from these, and writing straight through
 * would rewrite the clock mid-drag on a session the reader may not have meant
 * to touch.
 */
await step('the pomodoro sheet drafts durations and commits them', async () => {
  await open('screen=timer');
  await tap('Timer settings');
  await seesText('Pomodoro Settings');
  await seesText('DURATIONS');

  // .last(), because "Focus" is also the mode tab on the screen behind the
  // sheet. .first() finds that one and drags it instead, which looks exactly
  // like the slider silently doing nothing.
  const focus = page.locator('[aria-label="Focus"]').last();
  await focus.waitFor({ timeout: 5000 });
  const box = await focus.boundingBox();

  // Drag the Focus slider most of the way along its track.
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  if (!(await page.getByText('Pomodoro Settings').first().isVisible())) {
    throw new Error('dragging a slider dismissed the sheet');
  }

  const body = await page.locator('body').innerText();
  if (/\b25:00\b/.test(body) === false) {
    throw new Error('the dial changed before the configuration was set — durations are not drafted');
  }

  // The sheet scrolls, and the button is below the fold once the alert-sound
  // block is in it. Playwright counts it visible either way, so a click without
  // this reports a 4s timeout on a control that is simply further down.
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(500);
  await tap('Set this configuration');
  await page.waitForTimeout(600);
  const after = await page.locator('body').innerText();
  if (/\b25:00\b/.test(after)) {
    throw new Error('"Set this configuration" did not apply the drafted focus length');
  }
});

/** The alert-sound choices are real controls, and Off is one of them. */
/**
 * The reminder switch is off until someone turns it on, and says what it will
 * do before they do.
 *
 * A notification is the most intrusive thing this app can send. One that starts
 * arriving because the app was installed is one that gets the whole category
 * muted, permanently, along with anything genuinely useful later.
 */
await step('the daily reminder is off by default and explains itself', async () => {
  await open('screen=home');
  await tap('Settings');
  await page.waitForTimeout(700);

  const toggle = byLabel('Daily reminder (notifications)');
  await scrollTo(toggle);

  /*
   * On screen, not merely in the document.
   *
   * The sheet caps at 88% height and used to clip everything past it with no
   * way to scroll — so the sound presets and this switch existed, were
   * reported "visible", and could not be reached or tapped by anyone. That
   * shipped. Asserting the position is what tells the difference between a
   * control that is present and one that is usable.
   */
  const box = await toggle.boundingBox();
  const { height: viewport } = page.viewportSize();
  if (!box || box.y < 0 || box.y + box.height > viewport) {
    throw new Error(
      `the reminder switch is off screen at y=${box ? Math.round(box.y) : 'none'} — ` +
        'the settings sheet is clipping its content instead of scrolling',
    );
  }

  await seesText('Daily reminder', 5000);
  // Said in the words Android's own settings use, because "reminder" alone
  // did not tell the reader this was the notification switch.
  await seesText('NOTIFICATIONS', 5000);
  // The policy, in the sheet, not buried in a privacy page.
  await seesText('At most one a day', 4000);
  await seesText('already studied', 4000);

  /*
   * `=== 'false'`, not `!== 'true'`. This read `!== 'true'` while the attribute
   * was not emitted at all, so it passed on `null` — a check that could not
   * fail is not a check. Insisting on the string is what makes it one.
   */
  const checked = await toggle.evaluate(el => el.getAttribute('aria-checked'));
  if (checked !== 'false') {
    throw new Error(
      checked === 'true'
        ? 'the daily reminder is on before anyone asked for it'
        : `the reminder switch reports no checked state (aria-checked=${checked}) — ` +
          'TalkBack cannot say whether it is on',
    );
  }
});

/**
 * Turning the reminder on reveals what it may send, and each kind is its own
 * switch.
 *
 * This is the state that shipped broken and that nothing here could see. The
 * three sub-switches are gated on permission being held, the harness could
 * never hold it, so "only Daily reminder is there" was true on a phone and
 * invisible to every check. Asserting the *second* state is the point of this
 * step; asserting the first one proved nothing.
 */
await step('turning the reminder on reveals what it may send', async () => {
  await open('screen=home');
  await tap('Settings');
  await page.waitForTimeout(700);

  const toggle = byLabel('Daily reminder (notifications)');
  await scrollTo(toggle);
  await toggle.click();
  await page.waitForTimeout(500);

  await seesText('WHAT TO SEND', 4000);
  for (const kind of ['Exam countdown', 'Streak about to break', 'Revision due']) {
    const kindToggle = byLabel(kind).last();
    await scrollTo(kindToggle);
    const box = await kindToggle.boundingBox();
    const { height: viewport } = page.viewportSize();
    if (!box || box.y < 0 || box.y + box.height > viewport) {
      throw new Error(
        `"${kind}" is not on screen at y=${box ? Math.round(box.y) : 'none'} — ` +
          'the per-kind reminder switches are unreachable',
      );
    }
    // On by default: someone who asked for reminders asked for the useful
    // ones. A section that arrives with everything off is a section that does
    // nothing until it is configured, which is not what the switch promised.
    const checked = await kindToggle.evaluate(el => el.getAttribute('aria-checked'));
    if (checked !== 'true') {
      throw new Error(`"${kind}" is off after enabling reminders — it should default on`);
    }
  }

  // And each one is a real control, not a label.
  const exam = byLabel('Exam countdown').last();
  await exam.click();
  await page.waitForTimeout(300);
  const after = await exam.evaluate(el => el.getAttribute('aria-checked'));
  if (after === 'true') {
    throw new Error('"Exam countdown" did not turn off — the per-kind switches are dummies');
  }
  await exam.click();
});

/**
 * The reminder can be moved, and can be made to prove itself.
 *
 * Both halves answer the same complaint. The hour was a constant — 19:00 for
 * everyone, with `reminderHour` in the settings store and nothing that could
 * set it — and there was no way to see a reminder without waiting for the
 * evening, on a feature whose rules are almost all rules about *not* posting.
 * Working and completely broken looked identical from the outside.
 */
await step('the reminder can be retimed, and will send one on demand', async () => {
  await open('screen=home');
  await tap('Settings');
  await page.waitForTimeout(700);

  const toggle = byLabel('Daily reminder (notifications)');
  await scrollTo(toggle);
  if ((await toggle.evaluate(el => el.getAttribute('aria-checked'))) !== 'true') {
    await toggle.click();
    await page.waitForTimeout(500);
  }

  // The hour is a real slider over a real setting, and the label says the time
  // rather than the number — "19" is not a time anyone reads.
  const hour = byLabel('Reminder time');
  await scrollTo(hour);
  await seesText('Check for something to say at', 4000);
  const shown = await page
    .locator('text=/^\\d{1,2}:00 [ap]m$/')
    .first()
    .textContent();
  if (!shown || !/^\d{1,2}:00 [ap]m$/.test(shown.trim())) {
    throw new Error(`the reminder time reads "${shown}", not a clock time`);
  }

  // Dragged, the way a finger moves it. The keyboard is not a route here:
  // the control answers TalkBack's adjustable actions, not arrow keys.
  const before = await hour.evaluate(el => el.getAttribute('aria-valuetext'));
  const track = await hour.boundingBox();
  if (!track) {
    throw new Error('the reminder time slider is not on screen');
  }
  await page.mouse.move(track.x + track.width / 2, track.y + track.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + 16, track.y + track.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const moved = await hour.evaluate(el => el.getAttribute('aria-valuetext'));
  if (moved === before) {
    throw new Error(`the reminder hour did not move off ${before} — the slider is decoration`);
  }
  if (!/^\d{1,2}:00 [ap]m$/.test(moved ?? '')) {
    throw new Error(`the slider's spoken value is "${moved}", not a clock time`);
  }

  // And the button that makes one appear. The shim walks the same ladder the
  // receiver does, so "quiet" here is the real answer for a harness with no
  // exam, no streak and no revision — not a stub that always says yes.
  const send = byLabel('Send a reminder now');
  await scrollTo(send);
  await send.click();
  await page.waitForTimeout(900);
  await seesText('Notifications are reaching you', 5000);
});

/**
 * The subject heading is filled with a gradient, and the gradient moves.
 *
 * Worth a step of its own because the failure it guards is silent in both
 * directions. The heading shipped with an `Animated.loop` bound to nothing: it
 * drove the JS thread every frame, forever, and moved no pixels — and the
 * shimmer everyone could see in this harness came from a CSS class in
 * index.html that only ever existed on web. The preview agreed with the design
 * while the phone showed a still rainbow.
 *
 * So: assert the fill is a gradient reference (the text is not a flat colour),
 * and that the gradient's own coordinates are somewhere else a moment later.
 */
await step('the subject heading is filled with a gradient that moves', async () => {
  await open('screen=browse&year=second-year&node=pathology&title=Pathology');
  await page.waitForTimeout(1200);

  const heading = await page.evaluate(() => {
    const text = document.querySelector('svg text');
    if (!text) {
      return null;
    }
    const fill = text.getAttribute('fill') ?? '';
    const id = fill.match(/url\(#(.+)\)/)?.[1];
    const gradient = id ? document.getElementById(id) : null;
    return {
      content: text.textContent,
      fill,
      x1: gradient ? gradient.getAttribute('x1') : null,
    };
  });

  if (!heading) {
    throw new Error('the subject heading rendered no SVG text at all');
  }
  if (!heading.content) {
    throw new Error('the subject heading is an empty glyph run');
  }
  if (heading.x1 === null) {
    throw new Error(
      `the heading's fill is ${heading.fill} — it should reference a gradient, not a flat colour`,
    );
  }

  await page.waitForTimeout(1200);
  const moved = await page.evaluate(() => {
    const text = document.querySelector('svg text');
    const id = (text?.getAttribute('fill') ?? '').match(/url\(#(.+)\)/)?.[1];
    return id ? document.getElementById(id)?.getAttribute('x1') : null;
  });
  if (moved === heading.x1) {
    throw new Error(
      `the gradient sat at ${heading.x1} for over a second — the sweep is animating nothing`,
    );
  }
});

await step('the pomodoro sheet offers working alert sounds', async () => {
  await open('screen=timer');
  await tap('Timer settings');
  await seesText('ALERT SOUND', 5000);
  await tap('Test the alert sound');

  // Every duration slider is named and shows its value. Four anonymous tracks
  // is what this sheet looked like on a phone before anyone could see it here:
  // Slider draws only a track, and its `label` is for TalkBack.
  for (const name of ['Focus', 'Short break', 'Long break', 'Long break every']) {
    await seesText(name, 4000);
  }
  // Values, not specific numbers: the step before this one commits a new focus
  // length and it persists, so asserting "25 min" here fails for the right
  // feature working correctly.
  const sheet = await page.locator('body').innerText();
  const minutes = (sheet.match(/\b\d+ min\b/g) ?? []).length;
  if (minutes < 3) {
    throw new Error(`only ${minutes} duration sliders show a value — they should all be labelled`);
  }
  if (!/\b\d+ pomodoros\b/.test(sheet)) {
    throw new Error('the long-break interval shows no value');
  }
  // The rest is below the fold — the sheet scrolls now, so scroll it.
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(500);
  await seesText('Volume', 4000);

  await page.locator('[aria-label^="Digital"]').first().click({ timeout: 4000 });
  await page.waitForTimeout(300);
  await page.locator('[aria-label^="Off"]').first().click({ timeout: 4000 });
  await page.waitForTimeout(300);
  await byLabel('Reset the pomodoro cycle').waitFor({ timeout: 4000 });
});

/**
 * The affordance line has to tell the truth about what a triple tap does.
 *
 * It promised "handwritten note" on every row in every year, while the handler
 * sent all of them to Ask AI. Third year is the only year the notes function
 * has a textbook for — Community Medicine and Forensic Medicine — so it is the
 * only year the promise can be kept, which is the same gate the web app uses.
 */
/**
 * The handwritten note is offered wherever there is a textbook to ground it in,
 * which is a question about the subject and not the year.
 *
 * This step used to assert the opposite for second year — that the row must
 * *not* offer a note — and it was right when it was written, because Community
 * and Forensic were the only two books. Six more were added on the server and
 * nothing here noticed, so the assertion went on defending a gate that was
 * turning away first- and second-year students from an answer that already
 * existed. Final year is the year with genuinely no books, and it is what the
 * negative half checks now.
 */
await step('a row offers a handwritten note wherever there is a textbook', async () => {
  const offersNote = async (route) => {
    await open(route);
    await declineAdPromptIfShown();
    await page.waitForTimeout(700);
    // A topic can hold essays, short notes, or only one of the two. First-year
    // General Anatomy is short notes only and lands on an empty Essays tab, so
    // there are no rows to read the label off until the tab is switched.
    if (await page.getByText('No essays here').first().isVisible().catch(() => false)) {
      await page.getByText('Short Notes').first().click({ timeout: 4000 });
      await page.waitForTimeout(700);
    }
    return (await page.getByText('Triple tap → handwritten note').count()) > 0;
  };

  // Third year — Forensic, grounded in Vision. This half already worked.
  if (
    !(await offersNote(
      'screen=browse&year=third-year&node=forensic-medicine,mechanical-injuries&title=Mechanical%20Injuries',
    ))
  ) {
    throw new Error('third year lost its handwritten note');
  }

  // Second year — Pharmacology, grounded in KD Tripathi + Tara V Shanbhag.
  if (
    !(await offersNote(
      'screen=browse&year=second-year&node=pharmacology,paper-2,anti-microbial-drugs&title=Anti-Microbial%20Drugs',
    ))
  ) {
    throw new Error(
      'a second-year row offers no handwritten note, but the notes function has two pharmacology books',
    );
  }

  // First year — Anatomy, grounded in Vishram Singh + Langman's Embryology.
  if (
    !(await offersNote(
      'screen=browse&year=first-year&node=anatomy,paper-1,general-anatomy&title=General%20Anatomy',
    ))
  ) {
    throw new Error(
      'a first-year row offers no handwritten note, but the notes function has an anatomy book',
    );
  }

  /*
   * Final year is the year that genuinely has no textbook. It must send the
   * reader to Ask AI rather than promise a grounded note it cannot produce —
   * a note badged "handwritten" that is really the generic answer is worse
   * than no button, because nothing on screen says which one arrived.
   */
  if (
    await offersNote(
      'screen=browse&year=final-year&node=general-medicine,fundamentals-of-medicine&title=Fundamentals%20of%20Medicine',
    )
  ) {
    throw new Error(
      'a final-year row promises a handwritten note, but no textbook covers final year — it would be ungrounded',
    );
  }
  await seesText('Triple tap to ask AI', 6000);
});

// ---- The other tabs --------------------------------------------------------
await step('notes screen renders its year picker', async () => {
  await open('screen=notes');
  await seesText('SELECT YEAR');
});

/**
 * The diagram the notes function attaches arrives as image markdown inside an
 * ordinary prose payload, not as a 'diagram' section — so the only proof it
 * renders is that the picture is on screen and the markdown is not. Before
 * RichText, a note opened on a phone showed the reader
 * `![Parts of a 12-Gauge Shotgun Cartridge](https://…supabase.co/storage/…`.
 */
/**
 * The Notes tab's two extra cards, and the flashcard deck walk behind one of
 * them.
 *
 * The WhatsApp block that used to sit here is asserted *gone*: it was removed
 * on request, and a block that comes back because someone restored an old
 * version of this screen is exactly the kind of regression nothing else would
 * catch.
 */
/**
 * One study session, end to end, on the fixture route.
 *
 * The real screen needs a deck from Supabase and the harness has no route to
 * it, so without this every state past the error message is unreachable — the
 * card face, Show Answer, the four buttons, and the interval each one gives.
 *
 * The interval labels are the assertion that matters. They are Anki's numbers,
 * and they caught a real bug: measuring the wall clock to a midnight-aligned
 * due date made Easy read "3d" for a card scheduled four days out, and the
 * amount it was wrong by depended on the time of day the test ran.
 */
await step('a flashcard session shows a card, then Anki\'s four buttons', async () => {
  await open('screen=ankidemo');
  await page.waitForTimeout(1200);

  await seesText('Incubation period of typhoid fever', 5000);
  await seesText('3 new', 4000);
  // Face down until the reader has tried to recall it. An answer visible
  // beside the question turns a memory test into reading.
  if (await page.getByText('10–14 days').first().isVisible().catch(() => false)) {
    throw new Error('the answer is visible before Show Answer — the card is not face down');
  }

  await byLabel('Show answer').click();
  await page.waitForTimeout(500);
  await seesText('10–14 days', 4000);

  const labels = await page
    .locator('[aria-label^="Again,"], [aria-label^="Hard,"], [aria-label^="Good,"], [aria-label^="Easy,"]')
    .evaluateAll(els => els.map(el => el.getAttribute('aria-label')));
  const expected = [
    'Again, next in 1m',
    'Hard, next in 6m',
    'Good, next in 10m',
    'Easy, next in 4d',
  ];
  if (JSON.stringify(labels) !== JSON.stringify(expected)) {
    throw new Error(
      `the answer buttons read ${JSON.stringify(labels)}, not Anki's ${JSON.stringify(expected)}`,
    );
  }

  // Good on a new card walks to the 10m step; it must not vanish from the queue.
  await page.locator('[aria-label^="Good,"]').click();
  await page.waitForTimeout(700);
  await seesText('Current strategy of filaria control', 4000);
});

await step('notes offers flashcards and a locked case proforma, and no WhatsApp', async () => {
  await open('screen=notes');
  await page.waitForTimeout(900);

  const body = await page.locator('body').innerText();
  if (/whatsapp/i.test(body)) {
    throw new Error('the WhatsApp block is back on the Notes tab');
  }
  await seesText('Anki flashcards', 4000);
  await seesText('Case proforma', 4000);

  /*
   * Locked means no control at all, not a control that swallows presses. If
   * this ever becomes a Touchable it will announce itself to TalkBack as
   * something that can be activated, and it cannot.
   */
  if (await byLabel('Case proforma, coming soon').count()) {
    throw new Error('the locked proforma card is a pressable — it must not offer a press it cannot honour');
  }

  await byLabel('Anki flashcards, browse decks by year').click();
  await page.waitForTimeout(900);
  await seesText('Anki-style cards', 4000);
  await seesText('SELECT YEAR', 4000);
});

/**
 * Year → subject → chapter, and a deck that cannot be built says so.
 *
 * The harness has no route to Supabase, so the deck fetch always fails here.
 * That makes this the only place the *failure* path gets walked, and it is the
 * one a student on a train will meet: it has to offer a way back rather than a
 * spinner that never ends or a blank screen.
 */
/**
 * Writing your own deck, and studying it.
 *
 * These live in AsyncStorage and nowhere else, so this is the only path that
 * needs no network at all — which also makes it the one flashcard flow the
 * harness can walk end to end.
 */
await step('you can write your own deck, and study it', async () => {
  await open('screen=flashcards');
  await page.waitForTimeout(900);

  await byLabel('Your own decks, write and study your own cards').click();
  await page.waitForTimeout(700);
  // The trade is stated where the decision is made, not in a help page.
  await seesText('stay on this phone', 4000);

  await byLabel('Name for the new deck').fill('Cranial nerves');
  await byLabel('Create this deck').click();
  await page.waitForTimeout(800);

  await byLabel('Front of the card, the question').fill('Which nerve supplies the diaphragm?');
  await byLabel('Back of the card, the answer').fill('Phrenic nerve (C3, C4, C5).');
  await byLabel('Add this card').click();
  await page.waitForTimeout(700);
  await seesText('Phrenic nerve', 4000);

  await byLabel('Go back').first().click();
  await page.waitForTimeout(700);

  const study = page.locator('[aria-label*="1 card, study"], [aria-label*="1 cards, study"]');
  if ((await study.count()) === 0) {
    throw new Error('the new deck does not offer to be studied');
  }
  await study.first().click();
  await page.waitForTimeout(900);
  await seesText('Which nerve supplies the diaphragm?', 4000);

  /*
   * A deck you wrote has nothing to regenerate. The button would call the edge
   * function and replace your own cards with generated ones — which is not a
   * failure mode anyone would guess from its label.
   */
  if (await byLabel('Write this deck again').count()) {
    throw new Error('a hand-written deck offers to regenerate itself — that would discard your cards');
  }
});

/**
 * A card with a picture on it.
 *
 * The image half of the custom builder is the one path the harness could not
 * reach at all until the picker shim learned to hand back an asset on request.
 * What matters here is the rule the generated decks also follow: the picture
 * belongs on the **back**. A diagram shown before "Show answer" is the answer.
 */
/**
 * A slider with no number beside it.
 *
 * `Slider` draws no text of its own — `format` feeds the accessibility value
 * and nothing else — so every caller has to render the value itself. Both of
 * the Flashcards ones shipped without it: a bare track, and no way to tell what
 * it was set to. This is cheap to assert and the failure is invisible in code
 * review, which is exactly the pair of properties that earns a check.
 */
await step('the flashcard sliders say what they are set to', async () => {
  await open('screen=flashcards');
  await page.waitForTimeout(900);

  await seesText('New cards', 4000);
  await seesText('20 a day', 4000);
  await seesText('Time per card', 4000);
  await seesText('Off', 4000);

  // And the spoken value is there too, which is the other half of the contract.
  const daily = page.locator('[aria-label="New flashcards per day"]');
  if ((await daily.count()) === 0) {
    throw new Error('the daily limit slider is not reachable by label');
  }
});

/**
 * A note filed under a chapter turns up on that chapter.
 *
 * Filing is only worth doing if the note then appears where it was filed —
 * otherwise it is a label on a list nobody revisits. This walks the whole
 * round trip: write it, file it, then open the chapter from the Notes tab and
 * find it there.
 */
await step('a note filed under a chapter shows up on that chapter', async () => {
  await open('screen=progress');
  await page.waitForTimeout(900);

  await byLabel('Notes').first().click();
  await page.waitForTimeout(600);
  await byLabel('Create a new study note').click();
  await page.waitForTimeout(600);

  await byLabel('Note title').fill('Neoplasia mnemonics');

  // File it: subject, then chapter.
  await page.locator('[aria-label*="file it under"], [aria-label*="Not filed under a chapter"]')
    .first()
    .click();
  await page.waitForTimeout(600);
  await seesText('Not filed', 4000);

  const subject = page.locator('[aria-label*="choose a chapter"]').first();
  if ((await subject.count()) === 0) {
    throw new Error('the filing sheet offers no subjects');
  }
  const subjectLabel = (await subject.getAttribute('aria-label')) ?? '';
  const subjectName = subjectLabel.replace(', choose a chapter', '').trim();
  await subject.click();
  await page.waitForTimeout(700);

  const chapter = page.locator('[aria-label^="File this note under"]').first();
  if ((await chapter.count()) === 0) {
    throw new Error(`no chapters offered for ${subjectLabel}`);
  }
  const chapterName = ((await chapter.getAttribute('aria-label')) ?? '')
    .replace('File this note under ', '')
    .trim();
  await chapter.click();
  await page.waitForTimeout(700);

  // The row now says where it went, which is the whole point of it.
  await seesText(chapterName, 4000);

  await byLabel('Save note').click();
  await page.waitForTimeout(900);
  await seesText('Neoplasia mnemonics', 4000);

  // The half that matters: open that chapter and the note is under it.
  // Filing is a label on a list until this is true, and this is the half that
  // shipped unbuilt the first time.
  await open(
    `screen=chapternotes&year=second-year&subject=${encodeURIComponent(subjectName)}` +
      `&topic=${encodeURIComponent(chapterName)}`,
  );
  await page.waitForTimeout(900);
  await seesText('YOUR NOTES', 4000);
  await seesText('Neoplasia mnemonics', 4000);
});

/**
 * A saved note can be opened and read.
 *
 * The card carried a pencil and a bin and nothing else that looked like a
 * button. Tapping the title did open it — but a title looks like a title next
 * to two icons that look like controls, and the reader's report was that there
 * was no way to view a note at all. So the assertion is not "the reader exists"
 * but "the card says how to get into it, and the body is the way in".
 */
await step('a saved note can be opened and read without editing it', async () => {
  await open('screen=progress');
  await page.waitForTimeout(900);
  await byLabel('Notes').first().click();
  await page.waitForTimeout(600);
  await byLabel('Create a new study note').click();
  await page.waitForTimeout(600);

  await byLabel('Note title').fill('Reading this back');
  await byLabel('What the note says').fill('Nephrotic is protein, nephritic is blood.');
  await byLabel('Save note').click();
  await page.waitForTimeout(900);

  // The affordance, in words, on the card.
  await seesText('Read note', 4000);

  // And the body is a target, not just the title — that is where a finger goes.
  await byLabel('Read Reading this back').last().click();
  await page.waitForTimeout(800);
  await seesText('Nephrotic is protein', 4000);
  // Reading is not editing: the way to change it has to be asked for.
  await seesText('Edit this note', 4000);
});

/**
 * A note takes a recording, and the recording plays.
 *
 * The reader's report was "i cant see audio or video if I upload it". This is
 * the whole round trip in one step: attach through the picker, see the file
 * named and sized in the editor, save, open the note, and find a real
 * transport — a play button that toggles and a scrubber that reports a time
 * rather than a number.
 *
 * The shim hands back a genuine 0.4-second WAV. It is opt-in for the same
 * reason the image picker's is: a stub that invented a file on every call
 * would put the editor into a state no tap on a phone can produce.
 */
/**
 * Headings, subheadings and points — written by buttons, read as a list.
 *
 * The reader's friend compared it to a tablet note app with a formatting row
 * and asked why this was "like simply typing". The note is still stored as
 * plain text, which is what keeps it safe; the toolbar writes the markers and
 * the reader renders them, so nobody has to know that a hyphen makes a bullet.
 */
await step('the note toolbar writes headings and points, and they render', async () => {
  await open('screen=progress');
  await page.waitForTimeout(900);
  await byLabel('Notes').first().click();
  await page.waitForTimeout(600);
  await byLabel('Create a new study note').click();
  await page.waitForTimeout(700);

  await byLabel('Note title').fill('Enteric fever');

  const body = byLabel('What the note says');
  await body.fill('Antigens of S. Typhi');
  await page.waitForTimeout(300);
  await byLabel('Heading').click();
  await page.waitForTimeout(400);

  // The marker is written into the text, not hidden in some parallel format.
  const afterHeading = await body.inputValue();
  if (!afterHeading.startsWith('# ')) {
    throw new Error(`the heading button wrote "${afterHeading}", expected it to start with "# "`);
  }

  // Pressing it again takes it off: a button that only adds leaves the reader
  // deleting characters by hand.
  await byLabel('Heading').click();
  await page.waitForTimeout(400);
  if ((await body.inputValue()).startsWith('# ')) {
    throw new Error('the heading button does not toggle off');
  }
  await byLabel('Heading').click();
  await page.waitForTimeout(300);

  await body.fill('# Antigens of S. Typhi\n## O Antigen\nSomatic antigen\nPart of LPS');
  await page.waitForTimeout(300);

  await byLabel('Save note').click();
  await page.waitForTimeout(1000);
  await byLabel('Read Enteric fever').last().click();
  await page.waitForTimeout(900);

  // Read back as a note: the markers are gone and the text is there.
  await seesText('Antigens of S. Typhi', 4000);
  await seesText('O Antigen', 4000);
  await seesText('Somatic antigen', 4000);
  const shown = await page.locator('body').innerText();
  if (shown.includes('## O Antigen') || shown.includes('# Antigens')) {
    throw new Error('the reader is printing the markers instead of rendering them');
  }
});

await step('a note takes a recording, and the recording gets a player', async () => {
  await open('screen=progress');
  await page.waitForTimeout(900);
  await byLabel('Notes').first().click();
  await page.waitForTimeout(600);
  await byLabel('Create a new study note').click();
  await page.waitForTimeout(600);

  await byLabel('Note title').fill('Cardio lecture');

  await page.evaluate(() => {
    globalThis.__orbitPickFile = 'audio';
  });
  const attach = byLabel('Add a video, recording or PDF to this note');
  if ((await attach.count()) === 0) {
    throw new Error('the notes editor offers no way to attach a file');
  }
  await attach.click();
  await page.waitForTimeout(700);

  // The choice, and the consequence of each, said before either is taken.
  await seesText('Save it, or just link it?', 4000);
  await seesText('Save a copy', 4000);
  await seesText('Just link it', 4000);
  // One line each. Two paragraphs read as an essay and nobody read them.
  await seesText('Works even if you delete the original', 4000);
  await seesText('Stops working if you delete or move', 4000);

  await byLabel(
    'Save a copy in Orbit. Uses phone space, and keeps working if you delete the original',
  ).click();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    globalThis.__orbitPickFile = undefined;
  });
  await seesText('saved in Orbit', 4000);

  // Named, and sized — with no cap, the size is how the reader decides.
  await seesText('Lecture 3.wav', 4000);
  await seesText('Recording', 4000);
  await seesText('KB', 4000);

  await byLabel('Save note').click();
  await page.waitForTimeout(900);
  await seesText('1 recording', 4000);

  await byLabel('Read Cardio lecture').last().click();
  await page.waitForTimeout(1000);

  // A real transport: a button that changes state, and a scrubber that speaks
  // a time. Before this, an attachment was a filename and nothing else.
  const play = byLabel('Play Lecture 3.wav');
  if ((await play.count()) === 0) {
    throw new Error('the attached recording has no play control');
  }
  const scrub = byLabel('Position in Lecture 3.wav');
  const spoken = await scrub.evaluate(el => el.getAttribute('aria-valuetext'));
  if (!/^\d{1,2}:\d{2}/.test(spoken ?? '')) {
    throw new Error(`the scrubber speaks "${spoken}", not a time`);
  }

  await play.click();
  await page.waitForTimeout(600);
  if ((await byLabel('Pause Lecture 3.wav').count()) === 0) {
    throw new Error('pressing play did not turn the control into a pause');
  }
});

/**
 * Fullscreen keeps the controls.
 *
 * The library's own fullscreen on Android hands the surface to ExoPlayer's
 * dialog, which draws *its* built-in controls — and this app turns those off,
 * so a reader got a fullscreen with no play button, no scrubber, no time and
 * no volume, and only the back gesture to escape. Fullscreen is the app's own
 * modal now, sharing one transport with the inline player, and this is the
 * assertion that keeps every control in it.
 */
await step('fullscreen keeps the play, scrub, time and volume controls', async () => {
  await open('screen=progress');
  await page.waitForTimeout(900);
  await byLabel('Notes').first().click();
  await page.waitForTimeout(600);
  await byLabel('Create a new study note').click();
  await page.waitForTimeout(600);
  await byLabel('Note title').fill('Procedure clip');

  await page.evaluate(() => {
    globalThis.__orbitPickFile = 'video';
  });
  await byLabel('Add a video, recording or PDF to this note').click();
  await page.waitForTimeout(700);
  await byLabel(
    'Save a copy in Orbit. Uses phone space, and keeps working if you delete the original',
  ).click();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    globalThis.__orbitPickFile = undefined;
  });

  await byLabel('Save note').click();
  await page.waitForTimeout(900);
  await byLabel('Read Procedure clip').last().click();
  await page.waitForTimeout(1000);

  await byLabel('Play Procedure.mp4 full screen').click();
  await page.waitForTimeout(900);

  // Every control, still there — that is the whole point of the step.
  for (const label of [
    'Play Procedure.mp4',
    'Position in Procedure.mp4',
    'Volume for Procedure.mp4',
    'Leave full screen',
  ]) {
    if ((await byLabel(label).count()) === 0) {
      throw new Error(`fullscreen has no "${label}" control`);
    }
  }

  await byLabel('Leave full screen').click();
  await page.waitForTimeout(700);
  if ((await byLabel('Play Procedure.mp4 full screen').count()) === 0) {
    throw new Error('leaving fullscreen did not restore the inline player');
  }
});

/**
 * A linked file, the promise it makes, and the promise it breaks.
 *
 * Linking is the option that costs no space, and the price is that the file is
 * not ours: move or delete the original and the note cannot play it. That is
 * the deal rather than a bug, so what has to hold is that the note *says* so
 * and offers the way out — copy it in — rather than showing a dead player.
 */
await step('a linked file can break, says so, and can be copied in instead', async () => {
  await open('screen=progress');
  await page.waitForTimeout(900);
  await byLabel('Notes').first().click();
  await page.waitForTimeout(600);
  await byLabel('Create a new study note').click();
  await page.waitForTimeout(600);
  await byLabel('Note title').fill('Linked lecture');

  await page.evaluate(() => {
    globalThis.__orbitPickFile = 'audio';
  });
  await byLabel('Add a video, recording or PDF to this note').click();
  await page.waitForTimeout(700);
  await byLabel(
    'Just link it. Uses no space, and stops working if you delete or move the original',
  ).click();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    globalThis.__orbitPickFile = undefined;
  });
  // The editor says which of the two this is, so it is not a thing you learn
  // a month later when the file stops playing.
  await seesText('linked', 4000);

  await byLabel('Save note').click();
  await page.waitForTimeout(900);
  await byLabel('Read Linked lecture').last().click();
  await page.waitForTimeout(1000);

  // It plays, and offers to stop being a link.
  const adopt = page.locator('[aria-label^="Save a copy of"]').first();
  if ((await adopt.count()) === 0) {
    throw new Error('a linked attachment does not offer to become a copy');
  }
  await seesText('tap to save a copy', 4000);

  // Now delete the original, the way a file manager would, and reopen.
  await byLabel('Back to notes').first().click();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    globalThis.__orbitBreakLink = 'all';
  });
  await byLabel('Read Linked lecture').last().click();
  await page.waitForTimeout(900);
  // Said plainly, rather than a player that does nothing.
  await seesText('moved or deleted', 4000);

  // Put it back, and copy it in — which is the way out, and is one tap.
  await byLabel('Back to notes').first().click();
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    globalThis.__orbitBreakLink = undefined;
  });
  await byLabel('Read Linked lecture').last().click();
  await page.waitForTimeout(900);
  await page.locator('[aria-label^="Save a copy of"]').first().click();
  await page.waitForTimeout(1200);
  await seesText('Lecture 3.wav', 4000);
  if ((await page.locator('[aria-label^="Save a copy of"]').count()) > 0) {
    throw new Error('the attachment still offers to be copied after it was copied');
  }
});

await step('a card you write can carry a picture, revealed with the answer', async () => {
  await open('screen=flashcards');
  await page.waitForTimeout(900);
  await byLabel('Your own decks, write and study your own cards').click();
  await page.waitForTimeout(700);

  await byLabel('Name for the new deck').fill('Visual deck');
  await byLabel('Create this deck').click();
  await page.waitForTimeout(800);

  // Only this step gets a picture out of the picker. See the shim.
  await page.evaluate(() => {
    globalThis.__orbitPickImage = true;
  });
  await byLabel('Front of the card, the question').fill('Identify the structure arrowed.');
  await byLabel('Add a picture to this card').click();
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    globalThis.__orbitPickImage = false;
  });

  if ((await byLabel('Remove the attached picture').count()) === 0) {
    throw new Error('the picture did not attach — nothing offers to remove it');
  }

  // A visual card may leave the answer blank: the diagram answers it.
  await byLabel('Add this card').click();
  await page.waitForTimeout(800);
  await seesText('Identify the structure arrowed', 4000);

  await byLabel('Go back').first().click();
  await page.waitForTimeout(700);
  const study = page.locator('[aria-label*="1 card, study"], [aria-label*="1 cards, study"]');
  if ((await study.count()) === 0) {
    throw new Error('a deck with one visual card does not offer to be studied');
  }
  await study.first().click();
  await page.waitForTimeout(900);

  // The front must NOT show the picture.
  const imagesBefore = await page.locator('img').count();
  await byLabel('Show answer').click();
  await page.waitForTimeout(600);
  const imagesAfter = await page.locator('img').count();
  if (imagesAfter <= imagesBefore) {
    throw new Error(
      'revealing the answer added no picture — a visual card must show its diagram on the back',
    );
  }
});

/**
 * The "+" in a chapter's corner, and where a deck is filed.
 *
 * The generate half needs Supabase and cannot run here. What is checkable is
 * that the affordance exists, that it offers both routes, and that the writing
 * route lands in a builder that can file the deck somewhere.
 */
await step('a chapter offers to add your own deck, and a deck can be filed', async () => {
  await open('screen=flashcards');
  await page.waitForTimeout(900);
  await page.locator('[aria-label^="3rd Year"]').first().click();
  await page.waitForTimeout(800);
  await page.locator('[aria-label^="Community Medicine"]').first().click();
  await page.waitForTimeout(900);
  await page.locator('[aria-label*="study flashcards"]').first().click();
  await page.waitForTimeout(2500);

  await byLabel('Add a deck to this chapter').click();
  await page.waitForTimeout(700);
  await seesText('Generate a deck with AI', 4000);
  await seesText('Write your own deck', 4000);

  await byLabel('Write your own deck for this chapter').click();
  await page.waitForTimeout(900);

  // It arrives filed under the chapter it was made from.
  const filing = page.locator('[aria-label^="Filed under"]');
  if ((await filing.count()) === 0) {
    throw new Error('a deck written from a chapter is not filed under it');
  }
  await filing.first().click();
  await page.waitForTimeout(700);
  await seesText('My decks', 4000);
});

await step('a flashcard chapter opens, and a deck that cannot build offers a retry', async () => {
  await open('screen=notes');
  await page.waitForTimeout(700);
  await byLabel('Anki flashcards, browse decks by year').click();
  await page.waitForTimeout(800);

  await page.locator('[aria-label^="3rd Year"]').first().click();
  await page.waitForTimeout(800);
  await page.locator('[aria-label^="Community Medicine"]').first().click();
  await page.waitForTimeout(900);

  const chapters = await page.locator('[aria-label*="study flashcards"]').count();
  if (chapters < 5) {
    throw new Error(`only ${chapters} chapters listed for Community Medicine — the walk is broken`);
  }

  /*
   * The row promises a deck size, not a question count.
   *
   * They are different numbers — an essay question is worth several cards — and
   * the row used to show the question count, so a chapter listed as "15
   * questions" opened as a deck of some other size and looked broken. Whatever
   * the row says, it has to be the number of cards, and never below the floor.
   */
  const firstLabel = await page.locator('[aria-label*="study flashcards"]').first().getAttribute('aria-label');
  const promised = Number(/,\s*(\d+)\s+cards,/.exec(firstLabel ?? '')?.[1]);
  if (!Number.isFinite(promised)) {
    throw new Error(`a chapter row does not promise a card count: ${firstLabel}`);
  }
  if (promised < 20) {
    throw new Error(`a chapter promises ${promised} cards, below the 20-card floor`);
  }

  const abortRoute = route => route.abort();
  await page.route('**/functions/v1/generate-flashcards', abortRoute);
  await page.locator('[aria-label*="study flashcards"]').first().click();
  await page.waitForTimeout(2500);

  const retryCount = await byLabel('Try building this deck again').count();
  await page.unroute('**/functions/v1/generate-flashcards', abortRoute);

  if (retryCount === 0) {
    throw new Error(
      'a deck that could not be built left no way forward — it must explain itself and offer a retry',
    );
  }
});

await step('a diagram in prose renders as a picture, not as markdown', async () => {
  await open('screen=notesdemo');
  await seesText('High-Yield Visual Exam Diagram');
  const raw = await page.getByText('](http', { exact: false }).count();
  if (raw > 0) {
    throw new Error('raw image markdown is visible in the rendered note');
  }
  // The card, not the bitmap: react-native-web only writes the URL into the DOM
  // once the fetch succeeds, and the sandbox has no route to Supabase Storage.
  // What is verifiable offline is that the markdown became a DiagramCard and
  // the prose that followed it survived the split.
  await byLabel('Enlarge diagram image').waitFor({ timeout: 6000 });
  await seesText('High-Yield Continuous Visual Mnemonic');
});

/**
 * The box that changes a note has to ask before it changes it.
 *
 * Nothing is written until the reader says yes, and saying yes then asks how —
 * add to what is there, or replace the lot. The sandbox cannot reach the edge
 * function, so what is provable here is that the box mounts, its controls are
 * reachable by label, and a failed request lands as a message instead of an
 * empty screen.
 */
await step('the notes AI edit box mounts and fails into a message', async () => {
  await open('screen=notesdemo');
  await seesText('Fix these notes with AI');
  const box = byLabel('Ask for a change to these notes');
  await box.waitFor({ timeout: 5000 });
  await box.fill('The Anaemia Mukt Bharat strategy is 6x6x6, please fix it.');
  await tap('Send');
  // Either the lookup line or the error it turns into — both mean the box ran.
  await page
    .getByText(/reference textbook|Couldn't|could not|Failed|Request failed/i)
    .first()
    .waitFor({ timeout: 15000 });
});

/**
 * The way out of a topic's notes must not scroll away with them.
 *
 * A generated topic is several screens long and the back button used to live
 * at the top of it, so leaving meant scrolling the whole page up first. This
 * asserts the button is still on screen after scrolling, and in the same
 * place — a button that merely exists somewhere below the fold is the bug.
 */
await step('the notes back button stays put while the page scrolls', async () => {
  await open('screen=notes');
  await tap('3rd Year, browse subjects');
  await declineAdPromptIfShown();
  await tap('Forensic Medicine, see topics');

  const back = byLabel('Back');
  await back.waitFor({ timeout: 6000 });

  // Inside the viewport, not merely somewhere in the document. Comparing two
  // positions is not enough on its own: a button laid out below the scroll
  // area never moves either, so an unfloated one passed a same-position check
  // while sitting off the bottom of the screen the whole time.
  const { height: viewport } = page.viewportSize();
  // Near the top, on screen, both times.
  //
  // Two weaker versions of this passed on a button that was not floating at
  // all. "Did not move" passes on one laid out below the scroll area, and
  // "on screen and did not move" passes on one the flex column pins to the
  // bottom — neither of which is a back button you can reach. Where it is
  // matters as much as that it stays.
  const TOP_THIRD = viewport / 3;
  const parked = async where => {
    const box = await back.boundingBox();
    if (!box || box.y < 0 || box.y + box.height > viewport) {
      throw new Error(`the back button is not on screen ${where} (y=${box ? Math.round(box.y) : 'none'}, viewport=${viewport})`);
    }
    if (box.y > TOP_THIRD) {
      throw new Error(`the back button is at y=${Math.round(box.y)} ${where} — it belongs at the top, where the header's own button sits`);
    }
    return box;
  };

  const before = await parked('before scrolling');
  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(600);
  const after = await parked('after scrolling');

  if (Math.abs(after.y - before.y) > 2) {
    throw new Error(`the back button moved ${Math.round(after.y - before.y)}px while scrolling`);
  }
});

/**
 * A search has to be able to take you to what it found.
 *
 * Before this, a result named the year and subject and stopped there — you
 * still had to find the topic by hand. The path now comes from the search
 * index, and check:search-index proves every one of those paths resolves back
 * to a topic containing that exact question.
 */
await step('a search result switches to its chapter and lights the question', async () => {
  await open('screen=browse');
  await page.locator('input').first().fill('Shotgun');
  await page.waitForTimeout(1600);
  await seesText('Switch to this chapter', 6000).catch(() => {
    throw new Error('no "Switch to this chapter" row appeared for the search');
  });

  const before = await page.locator('body').innerText();
  if (!/Forensic Medicine/.test(before)) {
    throw new Error('the result does not say which subject the question is in');
  }

  await page.locator('[aria-label^="Switch to "]').first().click();
  await page.waitForTimeout(1200);
  await declineAdPromptIfShown();

  /*
   * .last(), not .first().
   *
   * React Navigation keeps the screen you came from mounted underneath the one
   * it pushed, so the search result's copy of this question is still in the
   * DOM — hidden, with no bounding box. .first() finds that one and waits
   * forever for it to become visible, reporting "not on the chapter it
   * switched to" about a question that is plainly on screen.
   */
  const landed = page.getByText('Define Firearm', { exact: false }).last();
  await landed.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {
    throw new Error('the searched question is not on the chapter it switched to');
  });

  // And it was scrolled to, not merely present: it is the fourth of five
  // essays, so an unscrolled list leaves it below the fold.
  const box = await landed.boundingBox();
  const { height: viewport } = page.viewportSize();
  if (!box || box.y < 0 || box.y > viewport) {
    throw new Error(
      `the searched question is off screen at y=${box ? Math.round(box.y) : 'none'} — ` +
        'switching to the chapter did not scroll to it',
    );
  }
});

/** The year bar under the box narrows the search, and "All" restores it. */
await step('the search year filter narrows results to one year', async () => {
  await open('screen=browse');
  await page.locator('input').first().fill('cell');
  await page.waitForTimeout(1600);
  const all = await page.locator('[aria-label^="Switch to "]').count();
  if (all === 0) {
    throw new Error('searching "cell" across all years returned nothing');
  }

  await tap('Search 3rd Year only');
  await page.waitForTimeout(900);
  const third = await page.locator('[aria-label^="Switch to "]').count();
  if (third >= all) {
    throw new Error(`filtering to 3rd year did not narrow anything (${all} → ${third})`);
  }

  await tap('Search every year');
  await page.waitForTimeout(900);
  const restored = await page.locator('[aria-label^="Switch to "]').count();
  if (restored !== all) {
    throw new Error(`"All" did not restore the full result set (${all} → ${restored})`);
  }
});

/**
 * The dictation visualiser moves by transform, and redraws nothing.
 *
 * Checked on the chat demo rather than the composer: `listen()` rejects at once
 * in a browser with no recogniser, so `listening` never holds long enough for
 * the real one to appear. The first version of this advanced a `useState` from
 * requestAnimationFrame — a React re-render and a fresh SVG path string sixty
 * times a second, on the JS thread, while the speech recogniser is already on
 * it. Asserting the path is *unchanged* while the transform moves is what tells
 * the two implementations apart.
 */
await step('the dictation visualiser drifts by transform, not by redrawing', async () => {
  await open('screen=chatdemo');
  await page.waitForTimeout(1200);

  const read = () =>
    page.evaluate(() => {
      const host = document.querySelector('[aria-label="Listening"]');
      if (!host) {
        return null;
      }
      const strip = host.querySelector('div');
      const svg = host.querySelector('svg');
      return {
        transform: strip?.style?.transform ?? null,
        path: svg?.querySelector('path')?.getAttribute('d') ?? null,
      };
    });

  const before = await read();
  if (!before) {
    throw new Error('the listening visualiser did not render');
  }
  if (!before.path) {
    throw new Error('the visualiser drew no wave');
  }
  if (!before.transform || !before.transform.includes('translateX')) {
    throw new Error(`the strip has no translate (${before.transform}) — it is not drifting at all`);
  }

  await page.waitForTimeout(700);
  const after = await read();
  if (after.transform === before.transform) {
    throw new Error('the strip did not move — the drift is animating nothing');
  }
  if (after.path !== before.path) {
    throw new Error(
      'the wave path changed between frames — the visualiser is recomputing its geometry ' +
        'per frame instead of translating a drawn one',
    );
  }
});

await step('ask ai screen renders and accepts input', async () => {
  await open('screen=askai');
  const box = page.locator('textarea, input').first();
  await box.fill('What is myocardial infarction?');
  await byLabel('Send').waitFor({ timeout: 4000 });
});

/**
 * A heatmap tile has to answer the question it raises.
 *
 * "Forensic Medicine 0%" says where you are behind and nothing about what to
 * do next. Tapping it lists every topic with its own count, so the answer is
 * "Postmortem Changes, 15 questions" rather than "study more".
 */
/**
 * The chat's expand button expands, and comes back.
 *
 * It was a decorative icon in a bordered box for a while — the shape of a
 * control with nothing behind it. Now that it does something, the half worth
 * checking is the *return*: a fullscreen toggle with no way out is a screen
 * someone is stuck on.
 */
await step('the chat expands to fullscreen and comes back', async () => {
  await open('screen=askai');
  await page.waitForTimeout(700);

  const expand = byLabel('Expand to fullscreen chat');
  await expand.waitFor({ timeout: 5000 });
  await expand.click();
  await page.waitForTimeout(500);

  // The heading is what fullscreen gives up for room.
  const title = page.getByText('Your instant medical study companion');
  if (await title.first().isVisible().catch(() => false)) {
    throw new Error('fullscreen kept the header — it did not expand');
  }

  const exit = byLabel('Exit fullscreen chat');
  if ((await exit.count()) === 0) {
    throw new Error('fullscreen offers no way out');
  }
  await exit.click();
  await page.waitForTimeout(500);
  await seesText('Your instant medical study companion', 4000);
});

await step('a heatmap tile opens its subject breakdown', async () => {
  await open('screen=progress');
  // Opening My Progress spends the day's ad, and the dialog's scrim covers the
  // screen until it is answered — a control under it is "visible" and
  // unclickable, which reads as a missing control. It appears *after* open()'s
  // settle wait, so this has to wait for it rather than ask once and move on.
  await page.waitForTimeout(1200);
  await declineAdPromptIfShown();
  await declineAdPromptIfShown();
  await seesText('Weak-topic heatmap', 8000);
  // The heatmap is well down a long screen. Playwright counts an off-screen
  // node visible, so a click without scrolling times out on something that is
  // simply further down.
  const tile = page.locator('[aria-label*="percent done"]').first();
  await scrollTo(tile);
  await tile.click({ timeout: 6000 });
  await page.waitForTimeout(900);
  await seesText('SUBTOPICS', 6000);
  await seesText('Overall', 4000);
  // Real counts, not placeholders.
  const body = await page.locator('body').innerText();
  if (!/\b\d+ \/ \d+\b/.test(body)) {
    throw new Error('the breakdown shows no question counts');
  }
});

/** The exam countdown takes a name and a date, and both persist. */
await step('the exam countdown accepts a name and a date', async () => {
  await open('screen=progress');
  await page.waitForTimeout(1200);
  await declineAdPromptIfShown();
  await declineAdPromptIfShown();
  await seesText('Exam countdown', 8000);
  await scrollTo(byLabel('Set an exam date'));
  await tap('Set an exam date');
  await page.waitForTimeout(600);

  await byLabel('Exam name').fill('Forensic Paper 1');
  // The picker is a month grid drawn in-app, so a day is a real control with
  // a real label rather than a native dialog the harness cannot see.
  await tap('Next month');
  const day = page.locator('[aria-label^="15 "]').first();
  await day.click({ timeout: 5000 });
  await tap('Save the exam date');
  await page.waitForTimeout(700);

  await seesText('Forensic Paper 1', 5000);
  const body = await page.locator('body').innerText();
  if (!/days to go/.test(body)) {
    throw new Error('the countdown shows no day count after saving');
  }
});

/** Spaced revision exists and reports its queue honestly. */
await step('spaced revision reports its queue', async () => {
  await open('screen=progress');
  await declineAdPromptIfShown();
  await seesText('Spaced revision', 8000);
  const body = await page.locator('body').innerText();
  if (!/due|caught up|Tick a question/.test(body)) {
    throw new Error('the revision card says nothing about its queue');
  }
});

await step('progress screen renders', async () => {
  await open('screen=progress');
  await seesText('YOUR YEAR', 6000);
});

// ---- Report ----------------------------------------------------------------
await browser.close();
await server.close();

process.stdout.write('\n');
for (const [status, name] of results) {
  process.stdout.write(`  ${status}  ${name}\n`);
}

if (crashes.length) {
  process.stdout.write(`\n  ${crashes.length} runtime error(s):\n`);
  for (const crash of [...new Set(crashes)].slice(0, 10)) {
    process.stdout.write(`    - ${crash}\n`);
  }
}

const bad = failed + crashes.length;
process.stdout.write(bad ? `\nFAIL (${failed} step(s), ${crashes.length} runtime error(s))\n` : '\nOK\n');
process.exitCode = bad ? 1 : 0;
