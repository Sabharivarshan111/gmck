// Find rows in `question_diagrams` whose picture is not the question's.
//
// The filename is evidence. Every diagram in the bucket is named for what it
// draws — `tca_cycle_amphibolic_anaplerosis.jpg`, `hodgkin_lymphoma_reed_
// sternberg_cell.jpg` — so a question that shares two or more of a filename's
// *specific* words with no other file coming as close is very probably that
// file's question. Run over the 851 rows that already carry a picture, it
// first agreed with the stored mapping 196 times and disagreed 19; reading
// those 19 by hand found eleven genuinely wrong rows — "Megaloblastic Anaemia"
// filed under a bilirubin plate, "Echinococcus granulosus" under the same one,
// "Peptic Ulcer Disease" under serum protein electrophoresis. With those
// repaired it now reads 206 agree, 9 disagree, and those nine are rows where
// the stored plate is the better one.
//
// **This is an auditor, not the matcher.** It deliberately does not run in the
// app, and `check:diagrams` fails if anything like it ever does. Those nine
// are the reason: it puts "Cerebellum — external and
// internal features" on `right_atrium_internal_features.jpg` and "Median
// nerve" on `facial_nerve_complete_course.jpg`, because "internal features"
// and "nerve course" are words two different questions share. That is the
// exact failure that was reported — a TCA cycle note opening with a Glycolysis
// diagram — and no vocabulary list fixes it, because the premise is wrong.
// What decides on screen is `question_diagrams.question_id`, which is the row
// the diagram was generated for.
//
// So: use this after uploading new diagrams, or when a picture looks wrong.
// It prints disagreements for a human to judge; it changes nothing.
//
//   node scripts/diagram-audit.mjs           # needs a reachable Supabase
//   node scripts/diagram-audit.mjs rows.json # or a dump of the table
//
// The sandbox cannot reach Supabase (the agent proxy denies CONNECT to the
// project host), so from there, dump the rows through the Supabase MCP and
// pass the file:
//
//   select question_id, subject, question_text, storage_path
//   from question_diagrams where public_url is not null;
import fs from 'node:fs/promises';

/*
 * Words that appear in filenames but say nothing about which question a plate
 * belongs to. Without this list "Anti-hypertensive drugs" scores two against
 * `antifungal_drugs_sites_of_action.jpg` on "drugs" and "action", and the
 * audit reports 47 disagreements instead of 19 — most of them its own fault.
 */
const GENERIC = new Set([
  'drugs', 'drug', 'action', 'sites', 'site', 'cycle', 'cycles', 'pathway',
  'pathways', 'mechanism', 'mechanisms', 'disease', 'diseases', 'syndrome',
  'structure', 'types', 'type', 'complete', 'comparative', 'histology',
  'plate', 'diagram', 'exam', 'scheme', 'stages', 'test', 'view', 'cross',
  'section', 'with', 'and', 'the', 'metabolism', 'synthesis', 'regulation',
  'inhibitors', 'factors', 'changes', 'normal', 'acute', 'chronic', 'blood',
  'cell', 'cells', 'body', 'system', 'markers', 'curve', 'reactions',
  'formation',
]);

/** A filename's specific words: `biochemistry/tca_cycle_x.jpg` → tca, x. */
export function imageTokens(storagePath) {
  const base = (storagePath || '').split('/').pop()?.replace(/\.[a-z]+$/i, '') ?? '';
  return [
    ...new Set(
      base
        .split('_')
        .map(t => t.toLowerCase())
        .filter(t => t.length >= 4 && !GENERIC.has(t)),
    ),
  ];
}

/** A question's words. Whole words only — "aml" must never match "amlodipine". */
export function questionTokens(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(' '),
  );
}

/**
 * The best-matching image for a question, or null when the evidence is thin.
 *
 * Abstains on fewer than two shared specific words, and on a tie — two files
 * that fit equally well are two files this rule cannot choose between, and
 * guessing is the behaviour being audited for.
 */
export function guessImage(questionText, images) {
  const q = questionTokens(questionText);
  let best = null;
  let bestScore = 0;
  let tied = false;
  for (const image of images) {
    const score = imageTokens(image).filter(t => q.has(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = image;
      tied = false;
    } else if (score === bestScore && score > 0 && image !== best) {
      tied = true;
    }
  }
  return bestScore >= 2 && !tied ? best : null;
}

async function loadRows() {
  const file = process.argv[2];
  if (file) {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  }
  const url = 'https://pmtgeydtqypwrypshhsx.supabase.co';
  const lib = await fs.readFile(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8');
  // The declaration wraps onto its own line, so the newline has to be allowed.
  const key = lib.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/)?.[1];
  if (!key) {
    throw new Error('could not read the anon key out of src/lib/supabase.ts');
  }
  const res = await fetch(
    `${url}/rest/v1/question_diagrams?select=question_id,subject,question_text,storage_path&public_url=not.is.null`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) {
    throw new Error(`Supabase said ${res.status} — pass a dumped rows.json instead`);
  }
  return res.json();
}

let rows;
try {
  rows = await loadRows();
} catch (err) {
  process.stdout.write(`SKIP  ${err.message}\n`);
  process.exit(0);
}

const images = [...new Set(rows.map(r => r.storage_path).filter(Boolean))];
const disagreements = [];
let agreed = 0;
let abstained = 0;

for (const row of rows) {
  const guess = guessImage(row.question_text, images);
  if (!guess) {
    abstained += 1;
  } else if (guess === row.storage_path) {
    agreed += 1;
  } else {
    disagreements.push({ ...row, guess });
  }
}

process.stdout.write(
  `${rows.length} rows: ${agreed} agree, ${disagreements.length} disagree, ${abstained} no opinion\n\n`,
);

for (const d of disagreements) {
  process.stdout.write(`${d.subject} — ${d.question_text.split('\n')[0].slice(0, 62)}\n`);
  process.stdout.write(`   stored: ${d.storage_path}\n`);
  process.stdout.write(`   named:  ${d.guess}\n\n`);
}

process.stdout.write(
  disagreements.length === 0
    ? 'Nothing to read. Every stored picture is the one its filename points at.\n'
    : 'Read each of these. The stored row wins about as often as the filename does —\n' +
      'the filename is a prompt to look, never an answer to apply.\n',
);
