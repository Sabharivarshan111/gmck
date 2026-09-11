/**
 * Nothing in a reel may be drawn under the caption, and the caption may not
 * grow out of its band.
 *
 * This exists because three components each carried the same measurements as
 * prose, quoting each other, and all three were correct about a layout that
 * had changed. The caption was a fragment one line tall when "the guide's feet
 * are at 470" and "its lower edge at ~1409 against a headline block whose top
 * edge is ~1465" were written down. Once the caption became the whole spoken
 * line it wrapped to two lines for 257 of 294 captions, grew upward from its
 * `bottom`, and went straight through the device and the mascot's feet.
 *
 * A comment cannot notice that. This recomputes it from the real scripts.
 *
 *   node scripts/reel-layout-check.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const load = (p) => import(pathToFileURL(path.join(root, p)).href);

const { ALL_SCRIPTS, SILENT_REELS } = await load('src/scripts/index.ts');
const band = await load('src/components/captionBand.ts');

const problems = [];
const check = (ok, message) => {
  if (!ok) problems.push(message);
};

/* ---- 1. Every caption fits its band, at whatever size it lands on ------- */
let shrunk = 0;
let widest = 0;
for (const script of [...ALL_SCRIPTS, ...SILENT_REELS]) {
  if (script.format !== 'reel') continue;

  // The flat ads draw their own typography full-frame and never use
  // `ReelHeadline`, so the band does not apply to them. They get their own
  // arithmetic below — checking them against a band they do not use would be
  // a check that passes for the wrong reason, which is the failure mode this
  // whole file exists to catch.
  if (script.look && script.look !== 'device') continue;

  for (const shot of script.shots) {
    // A voiced reel captions with the spoken line; a silent one with `text`.
    const caption = script.noVoice ? shot.text : shot.vo;
    if (!caption) continue;

    const fit = band.fitCaption(caption);
    widest = Math.max(widest, fit.height);
    if (fit.size < band.FIT_SIZES[0]) shrunk += 1;

    check(
      fit.height <= band.CAPTION_MAX_H,
      `${script.id} shot ${shot.n}: "${caption}" needs ${Math.round(fit.height)}px ` +
        `even at ${fit.size}px type, and the band is ${band.CAPTION_MAX_H}px. It would ` +
        'grow up through the device and the mascot.',
    );
  }
}


/* ---- 1b. The flat ads' own type fits its column ------------------------ */
//
// `SweptType` is given a `maxWidth` and wraps; `TypedLine` is one inline run
// with a caret and cannot be wrapped by flex, so it shrinks instead. Either
// way the question is the same: does the text fit the column it is given, at
// the size the composition asks for?
//
// The first typed line of the prompt ad is 39 characters, which at its 62px
// ceiling is 1,451px inside a 912px column. Without a fit it ran off the frame.
const FLAT_COLUMN = 1080 - 84 * 2;
const FLAT_MAX_LINES = 3;
for (const script of [...ALL_SCRIPTS, ...SILENT_REELS]) {
  if (!script.look || script.look === 'device') continue;
  for (const shot of script.shots) {
    const text = script.noVoice ? shot.text : (shot.text ?? shot.vo);
    if (!text) continue;

    // The sizes HyperAd asks for, largest first: the opening shot is bigger.
    const ceiling = shot.typed ? 62 : script.look === 'keynote' ? 112 : 96;
    const perChar = shot.typed ? 0.6 : 0.52;
    const lines = Math.ceil((text.length * ceiling * perChar) / FLAT_COLUMN);

    check(
      shot.typed || lines <= FLAT_MAX_LINES,
      `${script.id} shot ${shot.n}: "${text}" wraps to ${lines} lines at ${ceiling}px ` +
        `in a ${FLAT_COLUMN}px column, and ${FLAT_MAX_LINES} is the most a flat ad ` +
        'holds before the words stop being a headline. Shorten it.',
    );
  }
}

const hyper = await fs.readFile(path.join(root, 'src/components/HyperAd.tsx'), 'utf8');
check(
  /maxWidth=\{912\}/.test(hyper),
  'HyperAd no longer gives TypedLine a maxWidth, so a long prompt has nothing ' +
    'to shrink against and will run off the frame.',
);

/* ---- 2. Nothing else is placed below the floor ------------------------- */
//
// Read as TEXT, because the failure being caught is a component going back to
// a literal number instead of importing the band.
const mascot = await fs.readFile(path.join(root, 'src/components/MascotStage.tsx'), 'utf8');
check(
  /bottom: `\$\{CONTENT_FLOOR_BOTTOM\}px`/.test(mascot),
  'MascotStage no longer places its feet on CONTENT_FLOOR_BOTTOM. A literal ' +
    'here is how the mascot ended up standing inside the caption.',
);

const timeline = await fs.readFile(path.join(root, 'src/components/ShotTimeline.tsx'), 'utf8');
const lift = Number(/const REEL_DEVICE_LIFT = (-?\d+)/.exec(timeline)?.[1]);
const scale = Number(/const REEL_DEVICE_SCALE = ([\d.]+)/.exec(timeline)?.[1]);
check(Number.isFinite(lift) && Number.isFinite(scale), 'the reel device framing constants are gone');

// The widest zoom the engine reaches, and the device height there.
const WIDEST_DEVICE_H = 1024;
const deviceBottom = band.FRAME_H / 2 + (WIDEST_DEVICE_H * scale) / 2 + lift;
check(
  deviceBottom <= band.CONTENT_FLOOR,
  `at the widest zoom the device's lower edge is ${Math.round(deviceBottom)}, below the ` +
    `content floor of ${band.CONTENT_FLOOR}. It would sit behind the caption. ` +
    'Lower REEL_DEVICE_LIFT or REEL_DEVICE_SCALE.',
);

/* ---- 3. The headline reads the band rather than its own numbers -------- */
const headline = await fs.readFile(path.join(root, 'src/components/ReelHeadline.tsx'), 'utf8');
const headlineCode = headline
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');
check(
  /fitCaption\(/.test(headlineCode),
  'ReelHeadline no longer calls fitCaption, so its type cannot shrink to fit ' +
    'the band and a long line will overflow it again.',
);
check(
  !/fontSize: '\d+px'/.test(headlineCode),
  'ReelHeadline has a hardcoded fontSize again. A fixed size is what made a ' +
    'two-line caption taller than the frame budgeted for it.',
);

if (problems.length > 0) {
  console.error('reel layout check failed:\n');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `OK  every reel caption fits the ${band.CAPTION_MAX_H}px band (tallest ${Math.round(widest)}px, ` +
    `${shrunk} shrank below ${band.FIT_SIZES[0]}px), the device clears the floor at ` +
    `${Math.round(deviceBottom)} <= ${band.CONTENT_FLOOR}, and nothing is placed by a literal`,
);
