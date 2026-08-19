// The subject cards have to belong to the theme, stay apart from each other,
// and stay readable.
//
// All three are easy to lose, and only the third one fails loudly. The first
// version of the custom-theme tint pulled the app's *built-in* hues 45% of the
// way towards the accent, which sounds like a lot and is not: a violet card
// mixed 45% with orange is still a violet card, so on a warm theme five cards
// in six looked untouched and the feature read as broken. Fanning the hues out
// from the accent instead fixes that — and immediately risks the opposite
// failure, six cards so close together that Pathology and Pharmacology are the
// same colour, or a fan so wide that one card lands on the far side of the
// wheel from the theme.
//
// The numbers below are the guard rails for that trade. The readability check
// composites each gradient stop over the page, because the stops are
// translucent and the alpha is where a card quietly turns into a low-contrast
// one.
//
//   node scripts/subject-cards-check.mjs
import { build } from 'esbuild';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const load = async entry => {
  const out = await build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    format: 'esm',
    write: false,
    platform: 'neutral',
    absWorkingDir: root,
    alias: { '@': path.join(root, 'src') },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`
  );
};

const { PRESETS, QUICK_PRESETS, paletteFrom } = await load('src/theme/presets.ts');
const { themedGradient, SUBJECT_GRADIENT, CARD_TINTS } = await load('src/theme/subjectCards.ts');
const { contrast, hexToHsv } = await load('src/theme/color.ts');

/** Text on a card has to clear AA, same as text anywhere else. */
const MIN_CONTRAST = 4.5;
/** Two cards closer than this are the same colour at a glance. */
const MIN_HUE_APART = 12;
/** A card further than this from the accent has stopped belonging to it. */
const MAX_HUE_FROM_ACCENT = 70;

const parse = value => {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const parts = match[1].split(',').map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }
  const hex = value.replace('#', '');
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: 1,
  };
};
const toHex = ({ r, g, b }) =>
  `#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
/** What the eye actually sees: a translucent stop over the page. */
const composite = (stop, background) => {
  const f = parse(stop);
  const b = parse(background);
  return toHex({
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
  });
};
/** Shortest way round the wheel. */
const hueGap = (a, b) => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

const failures = [];

// The named presets keep the gradients the published app shipped with, so
// those are checked as they are rather than through themedGradient.
const darkPalette = paletteFrom(PRESETS.find(preset => preset.key === 'dark').palette);
for (const [subject, stops] of Object.entries(SUBJECT_GRADIENT)) {
  for (const stop of stops) {
    const seen = composite(stop, darkPalette.background);
    const ratio = contrast(darkPalette.text, seen);
    if (ratio < MIN_CONTRAST) {
      failures.push(`built-in ${subject} card: text on ${seen} is ${ratio.toFixed(2)}:1`);
    }
  }
}

// Every theme somebody can build from the editor's starting points.
const customs = [
  ...QUICK_PRESETS.map(preset => ({ name: preset.name, palette: preset.palette })),
  // The two built-in palettes are reachable as a custom theme too — the
  // editor opens on whatever is applied — and they are the extremes of light
  // and dark, so they are the cases most likely to break the floors.
  ...PRESETS.filter(preset => preset.palette).map(preset => ({
    name: `${preset.name} (as custom)`,
    palette: preset.palette,
  })),
];

for (const { name, palette } of customs) {
  const colors = paletteFrom(palette);
  const accentHue = hexToHsv(colors.accent).h;
  const hues = [];

  for (let index = 0; index < CARD_TINTS.length; index += 1) {
    const stops = themedGradient(colors, index);
    hues.push(hexToHsv(composite(stops[0], colors.background)).h);

    for (const stop of stops) {
      const seen = composite(stop, colors.background);
      const ratio = contrast(colors.text, seen);
      if (ratio < MIN_CONTRAST) {
        failures.push(`${name} card ${index}: text on ${seen} is ${ratio.toFixed(2)}:1`);
      }
    }
  }

  for (let index = 0; index < CARD_TINTS.length; index += 1) {
    const drift = hueGap(accentHue + CARD_TINTS[index].hue, accentHue);
    if (drift > MAX_HUE_FROM_ACCENT) {
      failures.push(`${name} card ${index} sits ${drift.toFixed(0)}° from the accent`);
    }
    for (let other = index + 1; other < hues.length; other += 1) {
      const gap = hueGap(hues[index], hues[other]);
      if (gap < MIN_HUE_APART) {
        failures.push(
          `${name} cards ${index} and ${other} are ${gap.toFixed(0)}° apart — the same colour at a glance`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s).\n`);
  process.exit(1);
}

process.stdout.write(
  `OK  ${customs.length} themes × ${CARD_TINTS.length} cards: on-theme, distinct, and readable\n`,
);
