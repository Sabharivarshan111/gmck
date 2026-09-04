/**
 * Open the three real `.apkg` fixtures with the WEB reader.
 *
 * `check:apkg` already proves the format logic against a stock SQLite with no
 * `unicase`, which is the position Android is in. This proves the other host:
 * fflate for the zip, sql.js for the collection, fzstd for a v3 package. Three
 * libraries that could each be wired up wrongly while every type still checks.
 *
 * It runs in Node rather than a browser because `readApkg` needs only `File`,
 * `Blob` and those three libraries, all of which Node 22 has — so this is the
 * same code path the browser takes. What it therefore does NOT cover is the
 * two DOM-only ends: the `<input type=file>` that produces the File, and the
 * object-URL anchor in `downloadApkg`. Those are a few lines each and they are
 * the part a person sees immediately if they are wrong.
 *
 * The decoy is the thing to watch. Every v3 package also ships a complete,
 * valid, schema-11 `collection.anki2` holding one note reading "This file
 * requires a newer version of Anki". A reader that picks by filename finds it,
 * parses it, throws nothing, and hands back a one-card deck containing an error
 * message — which looks like success. So v3 returning ten cards is not a
 * detail, it is the whole test.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, 'fixtures', 'apkg');

// Bundled first, the same way `check:apkg` does it: the module imports
// './apkgFormat' without an extension, which every bundler resolves and Node's
// ESM loader does not. The three libraries stay external so this exercises the
// real fflate / fzstd / sql.js rather than a copy.
const esbuild = await import('esbuild');
const bundled = path.join(here, '.apkg-web-bundle.mjs');
await esbuild.build({
  entryPoints: [path.join(here, '..', '..', 'src', 'lib', 'apkgWeb.ts')],
  outfile: bundled,
  bundle: true,
  format: 'esm',
  platform: 'node',
  external: ['fflate', 'fzstd', 'sql.js'],
  logLevel: 'silent',
});
const { readApkg } = await import(bundled);

const failures = [];
for (const name of ['legacy1.apkg', 'legacy2.apkg', 'v3.apkg']) {
  const bytes = await fs.readFile(path.join(fixtures, name));
  const file = new File([bytes], name);
  let deck;
  try {
    deck = await readApkg(file);
  } catch (err) {
    failures.push(`${name}: ${err}`);
    process.stdout.write(`${name.padEnd(14)} FAILED  ${err}\n`);
    continue;
  }

  const firstField = String(deck.cards[0]?.flds ?? '').slice(0, 70);
  process.stdout.write(
    `${name.padEnd(14)} ${String(deck.cards.length).padStart(3)} cards  ` +
      `${deck.media.size} media  deck "${deck.deckName}"\n`,
  );

  if (deck.cards.length !== 10) {
    failures.push(`${name} gave ${deck.cards.length} cards, expected 10`);
  }
  if (/newer version of Anki/i.test(firstField)) {
    failures.push(`${name} read the DECOY collection, not the real one`);
  }
}

await fs.rm(bundled, { force: true });

if (failures.length) {
  process.stdout.write(`\n${failures.join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(
  '\nOK  the web reader opens all three package versions to the same ten cards,\n' +
    '    and takes the real collection rather than the v3 decoy\n',
);
