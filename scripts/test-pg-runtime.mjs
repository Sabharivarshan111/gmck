#!/usr/bin/env node
/** Execute the production TypeScript search module against independently decoded assets.
 * Checks pagination/counts after quarantine, pack-boundary offsets, search and year filters.
 * No cloud, model calls, or source answers are printed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'mobile/package.json'));
const ts = require('typescript');
const bankDir = path.join(root, 'mobile/src/lib');
const quarantineReport = JSON.parse(fs.readFileSync(path.join(root, 'docs/PG_CORPUS_QUARANTINE_20261011.json'), 'utf8'));
const excluded = new Set(quarantineReport.rows.map(r => r.id));
const manifestSource = fs.readFileSync(path.join(bankDir, 'pgPacks/generatedManifest.ts'), 'utf8');
const entries = [...manifestSource.matchAll(/id: "([^"]+)", exam: "([^"]+)", year: (null|\d+), count: (\d+)/g)].map(m => ({ id: m[1], exam: m[2], year: m[3] === 'null' ? null : Number(m[3]), count: Number(m[4]) }));
const decoded = new Map();
const independentlyExpected = [];
for (const entry of entries) {
  const source = fs.readFileSync(path.join(bankDir, 'pgPacks', entry.id + '.ts'), 'utf8');
  const rows = JSON.parse(source.match(/const ROWS[^=]*= (.*?);\nconst EXAM/s)[1]);
  const table = name => JSON.parse(source.match(new RegExp(`const ${name} = (.*?);\\n`))[1]);
  const subjects = table('SUBJECTS');
  const topics = table('TOPICS');
  const urls = table('URLS');
  const references = table('REFERENCES');
  const recordTypes = table('RECORD_TYPES');
  const sessions = table('SESSIONS');
  const questions = rows.map(r => ({ id: r[0], exam: entry.exam, year: entry.year, question: r[1], options: r.slice(2, 6), answer: 'ABCD'[r[6]], explanation: r[7], subject: subjects[r[8]], topic: topics[r[9]], source_url: urls[r[10]], answer_reference: references[r[11]], record_type: recordTypes[r[12]], exam_session: sessions[r[13]] }));
  assert.equal(questions.length, entry.count);
  const packAudit = JSON.parse(fs.readFileSync(path.join(root, 'docs/PG_CORPUS_AUDIT_20261011.json'), 'utf8')).packs.find(p => p.id === entry.id);
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'), packAudit.asset_sha256, 'asset audit fingerprint');
  decoded.set(entry.id, { __esModule: true, default: questions });
  const eligible = questions.filter(q => !excluded.has(q.id));
  assert.equal(eligible.length, quarantineReport.eligible_pack_counts[entry.id], 'independent eligible count');
  independentlyExpected.push(...eligible);
}
const moduleCache = new Map();
function loadModule(filename) {
  const resolved = path.extname(filename) ? filename : filename + '.ts';
  const packId = path.basename(resolved, '.ts');
  if (decoded.has(packId)) return decoded.get(packId);
  if (moduleCache.has(resolved)) return moduleCache.get(resolved).exports;
  const source = fs.readFileSync(resolved, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; moduleCache.set(resolved, module);
  const localRequire = specifier => specifier.startsWith('.') ? loadModule(path.resolve(path.dirname(resolved), specifier)) : require(specifier);
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename: resolved })(localRequire, module, module.exports);
  return module.exports;
}
const { searchOfflinePgQuestions } = loadModule(path.join(bankDir, 'pgLocalBank.ts'));
const runtimeGate = loadModule(path.join(bankDir, 'pgQuarantine.ts'));
assert.equal(runtimeGate.PG_QUARANTINED_TOTAL, excluded.size);
assert.equal(runtimeGate.PG_STRUCTURALLY_ELIGIBLE_TOTAL, independentlyExpected.length);
assert.deepEqual([...runtimeGate.PG_QUARANTINED_IDS].sort(), [...excluded].sort());
function expected(input) {
  const exams = { NEET_PG: ['NEET_PG', 'AIPGMEE'], INI_CET: ['INI_CET', 'AIIMS_PG', 'PGIMER_PG', 'JIPMER_PG'], FMGE: ['FMGE'] };
  const query = input.search.trim().toLocaleLowerCase();
  return independentlyExpected.filter(q => (input.exam === 'ALL' || q.exam === input.exam || exams[input.exam]?.includes(q.exam)) && (input.year === null || q.year === input.year) && (!query || [q.question, q.subject, q.explanation].join(' ').toLocaleLowerCase().includes(query)));
}
let cases = 0;
async function check(input) {
  const all = expected(input);
  const result = await searchOfflinePgQuestions(input);
  assert.equal(result.total, all.length, `total ${JSON.stringify(input)}`);
  assert.deepEqual(result.questions.map(q => q.id), all.slice(input.offset || 0, (input.offset || 0) + (input.limit || 50)).map(q => q.id), `page ${JSON.stringify(input)}`);
  assert.ok(result.questions.every(q => !excluded.has(q.id)));
  if (!input.search.trim()) assert.ok(result.packsScanned <= 2, 'no-query browsing remains lazy');
  cases++;
}
for (const exam of ['ALL', 'GENERAL_MEDICAL', 'NEET_PG', 'FMGE', 'INI_CET']) {
  const total = expected({ exam, year: null, search: '' }).length;
  for (const offset of [0, 40, Math.max(0, total - 47), total, total + 10]) await check({ exam, year: null, search: '', limit: 40, offset });
}
let offset = 0;
for (const entry of entries) {
  offset += quarantineReport.eligible_pack_counts[entry.id];
  await check({ exam: 'ALL', year: null, search: '', limit: 40, offset: Math.max(0, offset - 7) });
}
for (const exam of ['ALL', 'NEET_PG']) {
  for (const search of ['lateral rectus', 'rosacea', 'nonexistent-orbit-corpus-token']) {
    await check({ exam, year: null, search, limit: 40, offset: 0 });
    await check({ exam, year: null, search, limit: 40, offset: 40 });
  }
}
for (const year of [1991, 2002, 2022, 2023, 2024, 2025, 2026]) await check({ exam: 'ALL', year, search: '', limit: 40, offset: 0 });
console.log(`PG runtime: ${cases} count/page/search cases passed; ${independentlyExpected.length} structurally eligible, ${excluded.size} quarantined. Medical accuracy was not tested.`);
