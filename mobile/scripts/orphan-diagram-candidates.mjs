/**
 * For each plate in the bucket that no row points at, propose the question it
 * probably belongs to — as *evidence for a human*, never as something the app
 * runs.
 *
 * This is the same rule `diagram-audit.mjs` uses and it inherits the same
 * warning: the filename is an auditor, not a matcher. It abstains on fewer than
 * two shared specific words and on a tie, and everything it prints has to be
 * read before it becomes a row. The fix for an orphaned plate is data — one row
 * carrying the bank's own question_id — and never a looser lookup.
 *
 *   node scripts/orphan-diagram-candidates.mjs orphans.json
 *
 * where orphans.json is a list of storage paths, dumped through the Supabase
 * MCP because the agent sandbox's proxy denies the project host:
 *
 *   with referenced as (
 *     select distinct substring(public_url from '/diagrams/(.*)$') as name
 *     from question_diagrams where public_url is not null)
 *   select o.name from storage.objects o
 *   where bucket_id='diagrams'
 *     and not exists (select 1 from referenced r where r.name=o.name);
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { imageTokens, questionTokens } from './diagram-audit.mjs';
import { bankQuestions } from './bank-strings.mjs';

const orphanFile = process.argv[2];
if (!orphanFile) {
  process.stdout.write('usage: node scripts/orphan-diagram-candidates.mjs orphans.json\n');
  process.exit(2);
}
const orphans = JSON.parse(await fs.readFile(orphanFile, 'utf8'));

// ---- Every question in the bank, with where it lives -----------------------
//
// Through the shared scanner, not a regex over the source: a hand-rolled one
// silently lost 631 questions here, which meant plates were reported as having
// "NO CANDIDATE" when their question was simply never read. See bank-strings.mjs.
const DATA = path.join(process.cwd(), '..', 'src', 'data', 'topics');
const questions = bankQuestions(DATA);
process.stdout.write(`${questions.length} questions in the bank\n\n`);

/** The app's own per-question key, matching getQuestionId in lib/progress.ts. */
function questionId(question) {
  return `question-${question.slice(0, 50).replace(/\s+/g, '-')}`;
}

// ---- Propose ---------------------------------------------------------------
let confident = 0;
let abstained = 0;

for (const storagePath of orphans) {
  const tokens = imageTokens(storagePath);
  const scored = [];
  for (const question of questions) {
    const q = questionTokens(question.text);
    const hits = tokens.filter(t => q.has(t));
    if (hits.length >= 2) {
      scored.push({ ...question, score: hits.length, hits });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  process.stdout.write(`\n${storagePath}\n  tokens: ${tokens.join(', ') || '(none specific)'}\n`);
  if (scored.length === 0) {
    abstained += 1;
    process.stdout.write('  NO CANDIDATE — needs a human to name the question\n');
    continue;
  }
  const tie = scored.length > 1 && scored[1].score === scored[0].score;
  if (tie) {
    abstained += 1;
    process.stdout.write('  TIED — more than one question fits equally well:\n');
  } else {
    confident += 1;
  }
  for (const candidate of scored.slice(0, 3)) {
    process.stdout.write(
      `  [${candidate.score}] ${candidate.subject}: ${candidate.text.slice(0, 110)}\n`,
    );
    if (candidate === scored[0] && !tie) {
      process.stdout.write(`       id: ${questionId(candidate.text)}\n`);
    }
  }
}

process.stdout.write(
  `\n${confident} plate(s) have one clear candidate, ${abstained} need a human.\n` +
    'Nothing here is a row until somebody has read it.\n',
);
