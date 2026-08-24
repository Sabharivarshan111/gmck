// Every search hit's path must lead back to that question.
//
// "Switch to this chapter" navigates by the `path` the search index recorded,
// and the screen it lands on lists questions with findTypeQuestions(). Those
// are two different walkers over the same tree, written at different times,
// and nothing forces them to agree. When they disagree the failure is silent
// and specific: the search finds the question, the card names the right topic,
// and tapping it opens a chapter the question is not in.
//
// So this walks the whole bank and proves the round trip for every question:
//
//   index → path → resolveNode(year, path) → findTypeQuestions → question
//
// It also proves the index is *complete*, by counting it against
// collectQuestions() — the flattening walker every counter uses. A path-aware
// walker that quietly skipped a shape would otherwise pass the round trip for
// everything it did happen to find.
//
//   node scripts/search-index-check.mjs
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
    alias: { '@': path.join(root, 'src'), '@data': path.join(root, '../src/data') },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`
  );
};

const bank = await load('src/lib/questionBank.ts');
const {
  YEAR_KEYS,
  getSubjects,
  resolveNode,
  findTypeQuestions,
  collectQuestions,
  allSearchHits,
} = bank;

const failures = [];

// The index itself, not a search over it: searchQuestions() needs a two-letter
// query, so there is no query that means "everything".
const everything = allSearchHits();

let checked = 0;
const seen = new Set();
for (const hit of everything) {
  const key = `${hit.year}|${hit.path.join('/')}|${hit.type}|${hit.question}`;
  if (seen.has(key)) {
    continue;
  }
  seen.add(key);

  if (!Array.isArray(hit.path) || hit.path.length === 0) {
    failures.push(`"${hit.question.slice(0, 48)}…" has no path — it cannot be navigated to`);
    continue;
  }
  const node = resolveNode(hit.year, hit.path);
  if (!node) {
    failures.push(`${hit.year}/${hit.path.join('/')} does not resolve to a node`);
    continue;
  }
  const there = findTypeQuestions(node, hit.type);
  if (!there.includes(hit.question)) {
    failures.push(
      `${hit.year}/${hit.path.join('/')} (${hit.type}) does not contain the question the ` +
        `index filed under it: "${hit.question.slice(0, 48)}…"`,
    );
    continue;
  }
  if (!hit.topicName) {
    failures.push(`${hit.year}/${hit.path.join('/')} has no topic name for its breadcrumb`);
  }
  checked += 1;
  if (failures.length > 8) {
    break;
  }
}

// Completeness: the index must hold every question the counters can see.
for (const year of YEAR_KEYS) {
  for (const subject of getSubjects(year)) {
    for (const type of ['essay', 'short-notes']) {
      const flat = collectQuestions(subject.node, type);
      const indexed = everything.filter(
        h => h.year === year && h.subjectKey === subject.key && h.type === type,
      );
      const missing = flat.filter(q => !indexed.some(h => h.question === q));
      if (missing.length > 0) {
        failures.push(
          `${year}/${subject.key} (${type}): ${missing.length} question(s) the index never ` +
            `found, e.g. "${missing[0].slice(0, 48)}…"`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures.slice(0, 10)) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) — search would send readers to the wrong chapter.\n`);
  process.exit(1);
}
process.stdout.write(
  `OK  ${checked} search hits resolve back to a topic that contains them, index complete\n`,
);
