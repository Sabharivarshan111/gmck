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

const report = {
  audit_date: '2026-10-10',
  free_source_links: sources.length,
  original_practice_questions: original.length,
  installed_approved_pyq_packs: packCount,
  complete_historical_pyq_coverage_verified: false,
  offline_25mb_all_questions_verified: false,
  source_links_are_questions: false,
  full_dataset_source_audit: 'https://github.com/Sabharivarshan111/gmck/actions/runs/38033518459',
  note: 'Per-year/per-session PYQ inventory and independent clinical answer review are missing. A link is NOT an offline question.',
  errors
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (errors.length) process.exitCode = 1;
