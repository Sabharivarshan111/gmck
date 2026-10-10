#!/usr/bin/env node
/**
 * Static integrity check of ORBIT's real shipped PG question inventory.
 * It never counts external research hyperlinks as imported solved questions.
 * It cannot prove answer correctness, copyright permission or APK size.
 */
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const source = read('mobile/src/lib/pgEntranceBank.ts');
const manifest = read('mobile/src/lib/pgPacks/generatedManifest.ts');
const reader = read('mobile/src/lib/pgLocalBank.ts');
const screen = read('mobile/src/components/PgEntranceBankModal.tsx');
const notes = read('mobile/src/screens/NotesScreen.tsx');

const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const extract = (regex, field) => {
  const match = source.match(regex);
  if (!match) throw new Error('Missing ' + field + ' array');
  const arr = JSON.parse(match[1]);
  if (!Array.isArray(arr)) throw new Error('Expected an array for ' + field);
  return arr;
};

const sources = extract(/PG_SOURCES: PgSource\[\] = (\[[\s\S]*?\]);\s*export const PG_ORIGINAL_PRACTICE/, 'sources');
const original = extract(/PG_ORIGINAL_PRACTICE: PgQuestion\[\] = (\[[\s\S]*?\]);\s*export const PG_SOURCE_REVIEW_DATE/, 'original practice');
const sourceIds = new Set();
for (const s of sources) {
  check(!sourceIds.has(s.id), 'Duplicate research source id ' + s.id);
  sourceIds.add(s.id);
  check(/^https:\/\//.test(s.url), 'Source has invalid link: ' + s.id);
  check(s.from >= 1991 && s.to <= 2026 && s.from <= s.to, 'Bad source year range: ' + s.id);
}
const originalIds = new Set();
for (const q of original) {
  check(!originalIds.has(q.id), 'Duplicate practice MCQ id ' + q.id);
  originalIds.add(q.id);
  check(q.exam === 'ORIGINAL' && q.year === null, 'Original mislabelled as PYQ: ' + q.id);
  check(Array.isArray(q.options) && q.options.length === 4, 'Options missing: ' + q.id);
  check(['A', 'B', 'C', 'D'].includes(q.answer), 'Answer not A-D: ' + q.id);
  check(typeof q.explanation === 'string' && q.explanation.trim().length >= 20, 'Explanation too short: ' + q.id);
}
check(!/from ['"]@\/lib\/supabase['"]/.test(screen), 'PG UI still imports Supabase');
check(!/\.from\(['"]pg_exam_questions['"]\)/.test(screen), 'PG UI still queries Supabase');
check(reader.includes('GENERATED_PG_PACKS') && reader.includes('pack.load()'), 'Local offline pack reader missing');
check(!/PG Entrance PYQ Bank/.test(screen+notes), 'Do not claim installed PYQs while packs are empty');
const placement = notes.indexOf('Case proformas');
const pgPlacement = notes.indexOf('PG Entrance Questions & Sources');
check(placement >= 0 && pgPlacement > placement, 'PG entry not below Case Proformas in Notes');

const packCount = (manifest.match(/load:\s*\(\)\s*=>\s*import\(/g) || []).length;
const hasEmptyManifest = /GENERATED_PG_PACKS:\s*PgOfflinePack\[\]\s*=\s*\[\s*\]/.test(manifest);
check(packCount > 0 || hasEmptyManifest, 'PG pack manifest is malformed');

let installedQuestions = 0;
let datasetLabelledQuestions = 0;
let recordsWithoutExplanation = 0;
const seenImported = new Set();
if (packCount > 0) {
  const row = /\{ id: "([^"]+)", exam: "([^"]+)", year: (null|\d+), count: (\d+), load: \(\) => import\('\.\/([^']+)'\) \}/g;
  const specs = Array.from(manifest.matchAll(row));
  check(specs.length === packCount, 'Manifest pack metadata is incomplete');
  for (const item of specs) {
    const id = item[1];
    const expectRows = Number(item[4]);
    const basename = item[5];
    check(id === basename, 'Manifest id mismatch: ' + id);
    const filename = 'mobile/src/lib/pgPacks/' + basename + '.ts';
    check(fs.existsSync(filename), 'Manifest pack is missing: ' + filename);
    if (!fs.existsSync(filename)) continue;
    const text = read(filename);
    const rows = text.match(/const ROWS: \(string \| number\)\[\]\[\] = (\[[\s\S]*?\]);/);
    const refs = text.match(/const REFERENCES = (\[[\s\S]*?\]);/);
    check(Boolean(rows && refs), 'Invalid packed module: ' + id);
    if (!rows || !refs) continue;
    const values = JSON.parse(rows[1]);
    const references = JSON.parse(refs[1]);
    check(values.length === expectRows, 'Mismatched row count in ' + id);
    for (const q of values) {
      installedQuestions++;
      if (seenImported.has(q[0])) errors.push('Duplicate bundled ID: ' + q[0]);
      seenImported.add(q[0]);
      check(typeof q[1] === 'string' && q[1].trim().length > 8, 'Bad question in ' + id);
      check(q.length === 14 && q.slice(2,6).every(x => typeof x === 'string' && x.trim()), 'Incomplete A-D options in ' + id);
      check(Number.isInteger(q[6]) && q[6] >= 0 && q[6] <= 3, 'Invalid dataset label in ' + id);
      if (typeof q[7] !== 'string' || q[7].trim().length < 20) recordsWithoutExplanation++;
      const evidence = references[q[11]];
      if (typeof evidence === 'string' && evidence.includes('not independently verified')) datasetLabelledQuestions++;
    }
  }
  const sizeReport = JSON.parse(read('mobile/src/lib/pgPacks/packing-report.json'));
  check(installedQuestions === sizeReport.total_questions, 'Reported PG question count differs from real files');
  check(sizeReport.chunk_count === packCount, 'Size report chunk count differs from manifest');
  check(sizeReport.fits_native_budget === true, 'Bundled question-pack source fails compressed-content budget');
}

const report = {
  audit_date: '2026-10-10',
  free_source_links: sources.length,
  original_practice_questions: original.length,
  installed_offline_pack_count: packCount,
  installed_offline_questions: installedQuestions,
  dataset_answer_labels_not_independently_verified: datasetLabelledQuestions,
  questions_with_missing_or_short_explanation: recordsWithoutExplanation,
  complete_historical_pyq_coverage_verified: false,
  offline_25mb_all_questions_verified: false,
  source_links_are_questions: false,
  full_dataset_source_audit: 'https://github.com/Sabharivarshan111/gmck/actions/runs/38033518459',
  note: 'Per-year/per-session PYQ inventory and independent clinical answer review are missing. A link is NOT an offline question.',
  errors
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (errors.length) process.exitCode = 1;
