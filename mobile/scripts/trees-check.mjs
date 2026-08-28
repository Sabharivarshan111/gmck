// The focus trees have to stay drawable, distinguishable and reachable.
//
// They are drawn from numbers rather than pictures, which is what keeps them
// small and theme-aware — and also what makes them easy to break in a way no
// screenshot of *one* tree would show. Three things this pins:
//
//   1. Every species names a crown the renderer actually draws. A typo here is
//      a tree that silently falls through to the last branch and comes out as
//      a cactus.
//   2. The unlock ladder only goes up, and starts at zero. A reward you cannot
//      reach on day one is a locked door, and an out-of-order ladder makes the
//      "N more minutes unlocks…" line in Settings say something untrue.
//   3. No two species are the same shape *and* the same colour. Twelve trees
//      that look like six is worse than six trees.
//
//   node scripts/trees-check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};

const source = fs.readFileSync(path.join(root, 'src/lib/trees.ts'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src/components/FocusTree.tsx'), 'utf8');

// The species table, read out of the source rather than imported: this file is
// TypeScript with no build step available here.
const species = [...source.matchAll(/\{\s*key: '([^']+)',\s*name: '([^']+)',\s*unlockAt: (\d+),\s*crown: '([^']+)',\s*hue: (-?\d+),/g)].map(
  match => ({
    key: match[1],
    name: match[2],
    unlockAt: Number(match[3]),
    crown: match[4],
    hue: Number(match[5]),
  }),
);

check(species.length >= 10, `only ${species.length} species parsed — the table's shape changed`);

// 1. Every crown is one the renderer handles.
const drawn = new Set(
  [...renderer.matchAll(/species\.crown === '([a-z]+)'/g)].map(match => match[1]),
);
// The final `else` draws pads, so that one is handled without being compared.
drawn.add('pad');
for (const one of species) {
  check(
    drawn.has(one.crown),
    `${one.name} asks for a '${one.crown}' crown, which FocusTree does not draw`,
  );
}

// 2. The ladder starts at zero and only climbs.
check(species[0].unlockAt === 0, 'the first species is not free — day one has no tree to plant');
check(
  species.filter(one => one.unlockAt === 0).length >= 2,
  'only one species is free; the picker opens with nothing to choose between',
);
for (let i = 1; i < species.length; i++) {
  check(
    species[i].unlockAt >= species[i - 1].unlockAt,
    `${species[i].name} unlocks before ${species[i - 1].name}, so Settings will promise the wrong one next`,
  );
}

// 3. No two are the same shape and the same colour.
const seen = new Map();
for (const one of species) {
  const signature = `${one.crown}:${one.hue}`;
  if (seen.has(signature)) {
    failures.push(
      `${one.name} and ${seen.get(signature)} are the same crown at the same hue — one of them is redundant`,
    );
  }
  seen.set(signature, one.name);
}

// The renderer must keep its colours from the theme, or a tree stops belonging
// to whatever palette is on — the same rule the subject cards follow.
check(
  /colors\.accent/.test(renderer),
  'FocusTree no longer derives its colours from the theme accent',
);
// And it must stay off the JS thread for the length of a session.
check(
  /useNativeDriver: true/.test(renderer),
  'the tree animates without the native driver — that is 25 minutes of JS-thread work',
);

if (failures.length > 0) {
  console.error('Tree check failed:\n');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`OK  ${species.length} focus trees, all drawable, ladder climbs`);
