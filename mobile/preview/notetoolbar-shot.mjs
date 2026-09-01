// Press every button on the note toolbar, then look at the Live Preview.
//
// The report came with a photograph: a note reading
// `_**vvbmmkihggg**_**jjhyyyy******` with the complaint that the text is not
// bold and the italic button next to it does not work either.
//
// Both halves of that are checkable, and neither is checkable from the source.
// `parseInlineTokens` handles `**bold**` perfectly — which is why reading the
// code says the feature works. What it does not say is that `parseNote`, one
// level up, claimed **every line beginning with an asterisk as a bullet**, so
// `**bold**` arrived at the renderer as a bullet whose text was `*bold**` and
// came out as a bullet point with asterisks in it. Pressing Bold at the start
// of a line could never work.
//
// So this drives the real editor: types a sentence, selects a word, presses a
// button, reads the raw text back, then switches to Live Preview and asks the
// DOM what was actually drawn — the weight, the slant, the line through it,
// the highlight behind it. A marker still visible in the preview is a button
// that did not work.
//
//   node preview/notetoolbar-shot.mjs [outDir]
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
  server: { port: 5219, strictPort: true },
  logLevel: 'error',
});
await server.listen();

const browser = await chromium.launch({ executablePath: await findChromium() });
const page = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2,
});
await fs.mkdir(outDir, { recursive: true });

const URL = 'http://localhost:5219/?screen=usernotesdemo&mode=edit';

/** The editor's textarea — react-native-web renders a multiline input as one. */
const box = () => page.locator('textarea').first();

/**
 * Put the caret where a real selection would be.
 *
 * react-native-web turns the browser's `select` event into
 * `onSelectionChange`, which is what the toolbar reads, so setting the range
 * without firing it would have every button format the wrong span — the same
 * failure as a finger that selected nothing.
 */
async function select(from, to) {
  /*
   * Selected with the keyboard, not by setting `selectionStart`.
   *
   * React's `onSelect` — which is what react-native-web turns into
   * `onSelectionChange` — is driven by its own `selectionchange` listener on
   * the document, and it only fires when the selection differs from the one
   * React last saw. Assigning a range and dispatching a `select` Event by hand
   * satisfies neither, so the component went on believing the caret was at 0
   * and every button wrapped an empty span there. That is a harness bug that
   * looks exactly like the app bug being tested for, which is the reason to
   * drive it the way a finger would.
   */
  await box().click();
  await page.keyboard.press('Control+Home');
  for (let i = 0; i < from; i += 1) {
    await page.keyboard.press('ArrowRight');
  }
  if (to > from) {
    await page.keyboard.down('Shift');
    for (let i = from; i < to; i += 1) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.up('Shift');
  }
  await page.waitForTimeout(200);
}

async function setText(text) {
  await box().fill(text);
  await page.waitForTimeout(150);
}

const raw = () => box().inputValue();

/** Press one toolbar button by the label TalkBack would read out. */
async function press(label) {
  await page.getByLabel(label, { exact: true }).first().click();
  await page.waitForTimeout(200);
}

/**
 * What the Live Preview actually drew.
 *
 * Reads the computed style of every text node, so "bold" means the pixels are
 * bold rather than that a prop was passed.
 */
async function preview() {
  await page.getByLabel('Live preview mode').first().click();
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const seen = [];
    for (const el of document.querySelectorAll('div[dir], span')) {
      // Leaf nodes only, or every span is reported once per ancestor.
      const text = [...el.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent)
        .join('');
      if (!text.trim()) continue;
      const style = getComputedStyle(el);
      seen.push({
        text,
        bold: Number.parseInt(style.fontWeight, 10) >= 600,
        italic: style.fontStyle === 'italic',
        strike: (style.textDecorationLine || '').includes('line-through'),
        marked:
          style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent',
        size: Number.parseFloat(style.fontSize),
      });
    }
    return seen;
  });
}

const results = [];
const failures = [];

/**
 * One button, from a clean editor.
 *
 * The page is reloaded per case rather than the text reset, because a toolbar
 * carries state of its own — the highlighter's palette, the typeface list —
 * and a case that opened one would change what the next case is pressing.
 */
async function run({ name, text, from, to, button, before, expectRaw, expect, shot }) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await setText(text);
  await select(from, to);
  if (before) {
    await press(before);
  }
  await press(button);

  const after = await raw();
  if (expectRaw && after !== expectRaw) {
    failures.push(`${name}: the text became ${JSON.stringify(after)}, expected ${JSON.stringify(expectRaw)}`);
  }

  if (shot) {
    await page.screenshot({ path: path.join(outDir, `notetoolbar-${shot}-edit.png`) });
  }
  const drawn = await preview();
  if (shot) {
    await page.screenshot({ path: path.join(outDir, `notetoolbar-${shot}-preview.png`) });
  }

  const problem = expect(drawn, after);
  results.push({ name, after, ok: !problem });
  if (problem) {
    failures.push(`${name}: ${problem}`);
  }
}

/** Find a drawn run containing `word`, and say what style it carries. */
const find = (drawn, word) => drawn.find(node => node.text.includes(word));

/** No marker may survive into the preview — that is the whole point of it. */
const noMarkers = drawn => {
  const all = drawn.map(node => node.text).join(' ');
  const leaked = ['**', '~~', '==', '##'].filter(marker => all.includes(marker));
  return leaked.length > 0 ? `${leaked.join(' and ')} is still visible in the preview` : null;
};

const SENTENCE = 'The mitral valve is bicuspid';

await run({
  name: 'Bold, at the start of a line',
  text: SENTENCE,
  // "The" — the case that could never work, because the line then began with
  // an asterisk and the block parser took the whole line for a bullet.
  from: 0,
  to: 3,
  button: 'Bold',
  expectRaw: '**The** mitral valve is bicuspid',
  shot: 'bold',
  expect: drawn => {
    const hit = find(drawn, 'The');
    if (!hit) return 'the word is not in the preview at all';
    if (!hit.bold) return 'the word was not drawn bold';
    return noMarkers(drawn);
  },
});

await run({
  name: 'Bold, mid-line',
  text: SENTENCE,
  from: 4,
  to: 10,
  button: 'Bold',
  expectRaw: 'The **mitral** valve is bicuspid',
  expect: drawn => {
    const hit = find(drawn, 'mitral');
    if (!hit?.bold) return 'the selected word was not drawn bold';
    return noMarkers(drawn);
  },
});

await run({
  name: 'Italic',
  text: SENTENCE,
  from: 4,
  to: 10,
  button: 'Italic',
  expectRaw: 'The _mitral_ valve is bicuspid',
  shot: 'italic',
  expect: drawn => {
    const hit = find(drawn, 'mitral');
    if (!hit?.italic) return 'the selected word was not drawn slanted';
    return noMarkers(drawn);
  },
});

await run({
  name: 'Italic, at the start of a line',
  text: SENTENCE,
  from: 0,
  to: 3,
  button: 'Italic',
  expectRaw: '_The_ mitral valve is bicuspid',
  expect: drawn => {
    const hit = find(drawn, 'The');
    if (!hit?.italic) return 'the first word was not drawn slanted';
    return noMarkers(drawn);
  },
});

await run({
  name: 'Bold and italic together',
  text: SENTENCE,
  from: 4,
  to: 10,
  button: 'Italic',
  before: 'Bold',
  expectRaw: 'The _**mitral**_ valve is bicuspid',
  shot: 'both',
  expect: drawn => {
    const hit = find(drawn, 'mitral');
    if (!hit) return 'the word is not in the preview';
    if (!hit.bold || !hit.italic) {
      return `two styles on one word did not both land (bold ${hit.bold}, italic ${hit.italic})`;
    }
    return noMarkers(drawn);
  },
});

await run({
  name: 'Highlight',
  text: SENTENCE,
  from: 4,
  to: 10,
  button: 'Yellow highlight',
  before: 'Highlight',
  expectRaw: 'The ==mitral== valve is bicuspid',
  shot: 'highlight',
  expect: drawn => {
    const hit = find(drawn, 'mitral');
    if (!hit?.marked) return 'the selected word has no highlight behind it';
    return noMarkers(drawn);
  },
});

await run({
  name: 'Bullet point',
  text: SENTENCE,
  from: 0,
  to: 0,
  button: 'Bullet point',
  expectRaw: `- ${SENTENCE}`,
  shot: 'bullet',
  expect: drawn => {
    if (!drawn.some(node => node.text.includes('•'))) return 'no bullet was drawn';
    if (find(drawn, '- The')) return 'the dash is still printed as text';
    return noMarkers(drawn);
  },
});

await run({
  name: 'Numbered point',
  text: SENTENCE,
  from: 0,
  to: 0,
  button: 'Numbered point',
  expectRaw: `1. ${SENTENCE}`,
  expect: drawn => {
    if (!drawn.some(node => node.text.trim() === '1.')) return 'no number was drawn';
    return noMarkers(drawn);
  },
});

await run({
  name: 'Heading',
  text: SENTENCE,
  from: 0,
  to: 0,
  button: 'Heading',
  expectRaw: `# ${SENTENCE}`,
  shot: 'heading',
  expect: drawn => {
    const hit = find(drawn, 'mitral');
    if (!hit) return 'the heading is not in the preview';
    if (!hit.bold) return 'the heading was not drawn bold';
    if (hit.size < 18) return `the heading is only ${hit.size}px — it is not bigger than body text`;
    return noMarkers(drawn);
  },
});

await run({
  name: 'Subheading',
  text: SENTENCE,
  from: 0,
  to: 0,
  button: 'Subheading',
  expectRaw: `## ${SENTENCE}`,
  expect: drawn => {
    const hit = find(drawn, 'mitral');
    if (!hit?.bold) return 'the subheading was not drawn bold';
    return noMarkers(drawn);
  },
});

/*
 * The caret inside a word, with nothing selected — which is what produced the
 * stray `****` in the report's screenshot. It used to leave an empty pair at
 * the caret; it takes the word now.
 */
await run({
  name: 'Bold with only a caret, inside a word',
  text: SENTENCE,
  from: 7,
  to: 7,
  button: 'Bold',
  expectRaw: 'The **mitral** valve is bicuspid',
  shot: 'caret',
  expect: drawn => {
    const hit = find(drawn, 'mitral');
    if (!hit?.bold) return 'the word the caret was in was not bolded';
    return noMarkers(drawn);
  },
});

/*
 * With no word anywhere near the caret the open pair is still the right
 * answer — there is nothing else it could do. Two spaces, caret between them:
 * a caret merely *touching* a word takes that word, which is why this needs a
 * gap rather than the space after "The".
 */
await run({
  name: 'Bold with the caret on empty space',
  text: 'The  valve',
  from: 4,
  to: 4,
  button: 'Bold',
  expectRaw: 'The **** valve',
  expect: () => null,
});

/*
 * The exact string from the report, rendered. Every marker in it has to be
 * gone from the preview and the words have to carry the styles it asked for.
 */
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await setText('_**vvbmmkihggg**_**jjhyyyy**');
const reported = await preview();
await page.screenshot({ path: path.join(outDir, 'notetoolbar-reported.png') });
const first = find(reported, 'vvbmmkihggg');
const second = find(reported, 'jjhyyyy');
if (!first?.bold || !first?.italic) {
  failures.push("the report's own text: the bold-inside-italic run did not get both styles");
}
if (!second?.bold) {
  failures.push("the report's own text: the second run is not bold");
}
results.push({ name: 'The reported note, rendered', after: '_**…**_**…**', ok: !!first?.bold });

await browser.close();
await server.close();

for (const row of results) {
  process.stdout.write(`${row.ok ? 'ok  ' : 'FAIL'}  ${row.name.padEnd(32)} ${row.after}\n`);
}
process.stdout.write(`\nshots  ${outDir}/notetoolbar-*.png\n`);

if (failures.length > 0) {
  process.stdout.write(`\nFAIL ${failures.length} problem(s):\n`);
  for (const line of failures) {
    process.stdout.write(`  - ${line}\n`);
  }
  process.exit(1);
}
process.stdout.write('\nOK   every toolbar button draws what it says it does\n');
