// A theme the app generated has no excuse for being unreadable.
//
// Four colours a *person* picks can produce white-on-white — that is a
// property of the custom-theme feature, and the editor makes the consequence
// visible rather than forbidding the choice. Colours the app derives from a
// photo are different: nobody chose them, so nobody can be blamed for them,
// and "your wallpaper made the app unreadable" is a bug.
//
// So this walks a set of images chosen to be hostile — a whiteout, a black
// frame, a flat grey, a neon poster — and asserts every theme that comes out
// clears the same WCAG bar check:contrast holds the built-in themes to, all
// the way through paletteFrom's derived colours.
//
//   node scripts/theme-from-image-check.mjs
import { build } from 'esbuild';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');

async function load(entry) {
  const bundled = await build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    format: 'esm',
    write: false,
    platform: 'neutral',
    absWorkingDir: root,
    alias: { '@': path.join(root, 'src') },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
  );
}

const { themeFromImage } = await load('src/lib/themeFromImage.ts');
const { paletteFrom } = await load('src/theme/presets.ts');
const { contrast } = await load('src/theme/color.ts');

// Same rules, same numbers as scripts/contrast-check.mjs.
const RULES = [
  { name: 'text on background', a: 'text', b: 'background', min: 4.5 },
  { name: 'text on card', a: 'text', b: 'card', min: 4.5 },
  { name: 'muted on background', a: 'textMuted', b: 'background', min: 3 },
  { name: 'accent on background', a: 'accent', b: 'background', min: 3 },
  { name: 'label on accent', a: 'onAccent', b: 'accent', min: 4.5 },
  { name: 'card vs background', a: 'card', b: 'background', min: 1.05 },
];

/**
 * Each case is what react-native-image-colors would report for one photo.
 * The interesting ones are the degenerate images, because those are where a
 * derived palette collapses: every channel the same, or every channel at an
 * extreme, leaves nothing to build a contrast out of.
 */
const IMAGES = [
  {
    name: 'night sky',
    palette: { average: '#0A1020', dominant: '#0B1428', vibrant: '#3A6DF0', darkVibrant: '#050A14', lightVibrant: '#8FB4FF', darkMuted: '#0C1220', lightMuted: '#7A8AA8' },
  },
  {
    name: 'beach noon',
    palette: { average: '#F0E2C8', dominant: '#EFE0C0', vibrant: '#22A7D3', darkVibrant: '#1A5670', lightVibrant: '#BFE6F5', darkMuted: '#8A7B60', lightMuted: '#F5EEDC' },
  },
  {
    name: 'forest',
    palette: { average: '#25402A', dominant: '#1E3622', vibrant: '#4CAF50', darkVibrant: '#0F2412', lightVibrant: '#A5D6A7', darkMuted: '#2A3B2C', lightMuted: '#9CB29E' },
  },
  {
    name: 'neon poster',
    palette: { average: '#2A0A3C', dominant: '#FF00E5', vibrant: '#FF00E5', darkVibrant: '#4A0060', lightVibrant: '#FF9CF2', darkMuted: '#3A1048', lightMuted: '#C08ACC' },
  },
  {
    name: 'sunset',
    palette: { average: '#C25A2E', dominant: '#E0702A', vibrant: '#FF8C1A', darkVibrant: '#5A2410', lightVibrant: '#FFC98A', darkMuted: '#6E3A26', lightMuted: '#D8A88C' },
  },
  // ---- degenerate: nothing to build a palette out of --------------------
  { name: 'whiteout', palette: { average: '#FFFFFF', dominant: '#FFFFFF', vibrant: '#FFFFFF', darkVibrant: '#FFFFFF', lightVibrant: '#FFFFFF', darkMuted: '#FFFFFF', lightMuted: '#FFFFFF' } },
  { name: 'black frame', palette: { average: '#000000', dominant: '#000000', vibrant: '#000000', darkVibrant: '#000000', lightVibrant: '#000000', darkMuted: '#000000', lightMuted: '#000000' } },
  { name: 'flat grey', palette: { average: '#808080', dominant: '#808080', vibrant: '#808080', darkVibrant: '#808080', lightVibrant: '#808080', darkMuted: '#808080', lightMuted: '#808080' } },
  { name: 'mid grey, warm tint', palette: { average: '#7A7268', dominant: '#7A7268', vibrant: '#8A7A60', darkVibrant: '#6A6258', lightVibrant: '#9A9288', darkMuted: '#70685E', lightMuted: '#8A8278' } },
  // Only `average` reported — the sampler's own minimum.
  { name: 'average only', palette: { average: '#3C4A5E' } },
  { name: 'nothing reported', palette: {} },
];

let failures = 0;
for (const image of IMAGES) {
  const custom = themeFromImage(image.palette);
  const colors = paletteFrom(custom);
  const bad = [];
  for (const rule of RULES) {
    const ratio = contrast(colors[rule.a], colors[rule.b]);
    if (ratio < rule.min) {
      bad.push(`${rule.name} ${ratio.toFixed(2)}:1 < ${rule.min}`);
    }
  }
  if (bad.length) {
    failures += bad.length;
  }
  process.stdout.write(
    `${bad.length ? 'FAIL ' : 'ok   '} ${image.name.padEnd(20)} ` +
      `bg ${custom.background} text ${custom.text} accent ${custom.accent} ` +
      (bad.length
        ? `— ${bad.join('; ')}`
        : `(text ${contrast(colors.text, colors.background).toFixed(1)}:1, ` +
          `accent ${contrast(colors.accent, colors.background).toFixed(1)}:1)`) +
      '\n',
  );
}

process.stdout.write(failures ? `\n${failures} FAILED\n` : '\nOK\n');
process.exitCode = failures ? 1 : 0;
