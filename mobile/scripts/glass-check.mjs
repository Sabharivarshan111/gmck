// Turning up the glass must never make text unreadable.
//
// A glass card is the card colour at partial alpha over whatever is behind it,
// and behind it on the Home screen is a wallpaper under a scrim — so what text
// actually sits on is a two-step blend, not the card colour the palette
// promised. The obvious worry is that raising the alpha eats the contrast.
//
// It does not, and finding that out is why this exists. The scrim is solved
// from the *theme background*, so the more of the wallpaper a surface lets
// through, the more of it has already been blended towards that background —
// the two effects pull against each other and text stays safe even at 98%.
// That is a real invariant of how the scrim and the glass compose, and it is
// worth locking down: it holds only while the scrim keeps being solved
// against the theme, and someone will eventually be tempted to skip that.
//
// So this sweeps the whole range rather than checking one constant. It means
// MAX_TRANSLUCENCY is a limit on *form* — past it a card stops reading as a
// card, its border and its lift disappear into the picture — and not on
// legibility. Saying otherwise in a comment would be inventing a measurement.
//
//   node scripts/glass-check.mjs
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

const { paletteFrom, PRESETS, MAX_TRANSLUCENCY } = await load('src/theme/presets.ts');
const { contrast, mix } = await load('src/theme/color.ts');
const { minimumDim, TARGET_CONTRAST } = await load('src/lib/wallpaperReadability.ts');

/** Wallpapers, as their sampled representative colour. */
const WALLPAPERS = [
  { name: 'night sky', color: '#0A1020' },
  { name: 'beach noon', color: '#F0E2C8' },
  { name: 'forest', color: '#25402A' },
  { name: 'neon poster', color: '#FF00E5' },
  { name: 'white wall', color: '#FFFFFF' },
  { name: 'black frame', color: '#000000' },
];

const BASES = [
  ...PRESETS.filter(p => p.palette).map(p => ({ name: p.name, palette: p.palette })),
];

let failures = 0;
let worst = { ratio: Infinity, where: '' };

// The whole range, not just the shipped ceiling: the claim being tested is
// that translucency cannot break readability at all, so testing one value
// would leave the interesting half untested.
const STEPS = [0, 0.25, 0.5, MAX_TRANSLUCENCY, 0.75, 0.9, 1];

for (const base of BASES) {
  for (const alpha of STEPS) {
  const colors = paletteFrom(base.palette, 'glass', alpha, true);
  for (const paper of WALLPAPERS) {
    // The scrim the app would actually choose for this pairing. Null means
    // even a full scrim cannot save it, which the wallpaper code handles by
    // flipping the text colour — out of scope here.
    const dim = minimumDim(paper.color, colors.background, colors.text, TARGET_CONTRAST);
    if (dim === null) {
      continue;
    }
    // What is behind the card: wallpaper blended towards the theme background
    // by the scrim.
    const behind = mix(paper.color, colors.background, dim);
    // The card itself, at the alpha GlassSurface would use.
    const surface = mix(behind, colors.card, 1 - colors.translucency);
    const ratio = contrast(colors.text, surface);
    if (ratio < TARGET_CONTRAST) {
      failures += 1;
      process.stdout.write(
        `FAIL  ${base.name} / ${paper.name} @ ${Math.round(alpha * 100)}%: ` +
          `text on glass ${ratio.toFixed(2)}:1 < ${TARGET_CONTRAST}\n`,
      );
    } else if (ratio < worst.ratio) {
      worst = { ratio, where: `${base.name} / ${paper.name} @ ${Math.round(alpha * 100)}%` };
    }
  }
  }
}

if (!failures) {
  process.stdout.write(
    `ok   every base over every wallpaper, glass from 0% to 100%\n` +
      `     tightest: ${worst.where} at ${worst.ratio.toFixed(2)}:1\n`,
  );
}
process.stdout.write(failures ? `\n${failures} FAILED\n` : '\nOK\n');
process.exitCode = failures ? 1 : 0;
