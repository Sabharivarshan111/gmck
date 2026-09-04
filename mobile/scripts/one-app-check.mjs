// Two apps live in this repo. Only one of them is being built.
//
//   src/       the original Vite web app — still live, and frozen.
//              src/lib/ is ALSO the shared tree: modules both apps import live
//              there and mobile reaches them through its `@shared` alias.
//   mobile/    the React Native Android app — the product
//
// This check exists because a feature was once built twice: the native app
// already had Anki flashcards (screen, scheduler, deck loader, 38 smoke flows)
// when a second implementation appeared in the web app's Notes tab. Nothing
// failed. Nothing warned. The owner opened the app they were shown, saw an
// interface they had not asked for, and had no way to tell that the version
// they were looking at was not the one that had been built.
//
// The rule it guards is in .agents/rules/00-working-agreement.md, "Which app a
// change belongs in". The mechanical part is narrow on purpose: the web app is
// allowed to change — the owner sometimes asks for a fix in both — but it may
// not grow a *second copy of logic that already exists natively*, because two
// copies drift and only one of them is tested.
//
// Anki's scheduler is the case worth pinning. Its constants are distinctive
// enough to recognise and worthless to duplicate: the numbers come from
// ankitects/anki and are asserted against Anki's own behaviours by
// check:anki, which only ever runs against the native copy.
//
//   node scripts/one-app-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The one file each of these may live in. */
const SINGLE_HOME = [
  {
    what: "Anki's scheduler",
    home: 'src/lib/anki.ts',
    // Two of the three must appear together, so prose mentioning "leech" or a
    // component named after Anki does not trip it.
    markers: ['LEARN_STEPS', 'START_EASE', 'GRADUATING_INTERVAL', 'RELEARN_STEPS'],
    needed: 2,
    why: 'check:anki pins these to Anki\'s own behaviours, and it only reads the native copy',
  },
];

const SEARCH_DIRS = ['src', 'supabase'];
const CODE = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      yield* walk(full);
    } else if (CODE.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

const failures = [];

for (const rule of SINGLE_HOME) {
  if (!(await fs.stat(path.join(root, rule.home)).then(() => true, () => false))) {
    failures.push(`${rule.what} should live in ${rule.home}, which is missing`);
    continue;
  }
  const homeAbs = path.join(root, rule.home);
  for (const dir of SEARCH_DIRS) {
    for await (const file of walk(path.join(root, dir))) {
      // The home is inside a searched directory now, so it would otherwise be
      // reported as a second copy of itself. The rule is "exactly one copy",
      // not "none in src/" — the scheduler moved to src/lib/ because that is
      // where this repo keeps modules BOTH apps import (`@shared`), and the
      // web app could not be built without it: the Vercel build resolves the
      // nearest tsconfig to every file it compiles, and reaching into
      // mobile/ found mobile/tsconfig.json, which extends a package installed
      // only in mobile/node_modules. Three production deploys failed on it.
      if (file === homeAbs) continue;
      const body = await fs.readFile(file, 'utf8');
      const hits = rule.markers.filter(marker => body.includes(marker));
      if (hits.length >= rule.needed) {
        const rel = path.relative(root, file);
        failures.push(
          `${rel} looks like a second copy of ${rule.what} (${hits.join(', ')}).\n` +
            `          It belongs only in ${rule.home} — ${rule.why}.\n` +
            `          See .agents/rules/00-working-agreement.md, "Which app a change belongs in".`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} duplicate implementation(s) — the web app is frozen.\n`);
  process.exit(1);
}

process.stdout.write(
  `OK  ${SINGLE_HOME.length} feature(s) still have exactly one home; ${SEARCH_DIRS.join(', ')} carry no copy\n`,
);
