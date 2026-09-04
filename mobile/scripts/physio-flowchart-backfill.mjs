/**
 * Give every cached Physiology note a flowchart.
 *
 * Physiology is examined on mechanism — reflex arcs, feedback loops, conduction
 * pathways, cascades — so the sequence is the part a student writes down. The
 * notes function now guarantees one for this subject (see
 * `supabase/functions/generate-handwritten-notes/pending-deploy/index.ts`:
 * PHYSIOLOGY_FLOWCHART_RULE, then ensurePhysiologyFlowchart), but that
 * guarantee runs when a note is WRITTEN, and the function returns the cache
 * unless `regenerate` is set. Notes already in `handwritten_notes` therefore
 * never see it. This is the pass that walks them.
 *
 * **It does not regenerate anything.** A regeneration rewrites the whole note
 * with a paid model, throws away an answer that is already good, and can come
 * back worse. Instead it calls the function's `saveContent` path with the
 * note's OWN existing content, which is the function's cache-write boundary —
 * `ensurePhysiologyFlowchart` runs there, adds the one missing section, and
 * persists it. Same algorithm for an old note as for a new one, one targeted
 * model call each, and every other section is passed through byte for byte
 * because the script hands them back unchanged.
 *
 * That means THE FUNCTION MUST BE DEPLOYED FIRST. Against the currently
 * deployed v52 this script writes the note back exactly as it found it and
 * changes nothing — harmless, but pointless. `--run` refuses to start until it
 * has seen the guarantee take effect on the first note.
 *
 * The cache key is never computed here. Every request reuses the row's own
 * `subtopic_key`, `subject`, `year` and `subtopic_name`, so there is no way for
 * this to orphan a note by building a key that is one character off.
 *
 *   node scripts/physio-flowchart-backfill.mjs            # plan only, no calls
 *   node scripts/physio-flowchart-backfill.mjs --run      # do it
 *   node scripts/physio-flowchart-backfill.mjs --run --limit 1
 *   node scripts/physio-flowchart-backfill.mjs --subject anatomy   # any subject
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { createClient } from '@supabase/supabase-js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

const SUPABASE_URL = 'https://pmtgeydtqypwrypshhsx.supabase.co';
/** Public client key, already shipped in the APK and the web bundle. */
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdGdleWR0cXlwd3J5cHNoaHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4ODI2NzksImV4cCI6MjA1NjQ1ODY3OX0.wp6Ydx7oMy-_sMWd6YcxMaTtnyFBg15sH_3TMPw803U';

const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const value = name => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};

const RUN = flag('run');
const SUBJECT = (value('subject') ?? 'physiolog').toLowerCase();
const LIMIT = Number(value('limit') ?? Infinity);
/** Google AI Studio free tier is per-minute; do not machine-gun it. */
const GAP_MS = Number(value('gap') ?? 6000);

/**
 * The bar for "this note has a flowchart", identical to the one the edge
 * function applies in `hasUsableFlowchart`.
 *
 * Three labelled steps. Two boxes and an arrow is not a mechanism, and a
 * `flowchart` section with an empty `steps` array is what a model emits when it
 * is satisfying a rule rather than answering — counting that as a pass would
 * make the whole exercise self-defeating, here and in the function.
 */
const MIN_STEPS = 3;
function hasUsableFlowchart(content) {
  const sections = Array.isArray(content?.sections) ? content.sections : [];
  return sections.some(section => {
    if (section?.type !== 'flowchart') return false;
    const steps = Array.isArray(section?.payload?.steps) ? section.payload.steps : [];
    const labelled = steps.filter(step => {
      const label = typeof step?.label === 'string' ? step.label : step?.title;
      return typeof label === 'string' && label.trim().length > 0;
    });
    return labelled.length >= MIN_STEPS;
  });
}

// ---------------------------------------------------------------------------
// The question list for a row
// ---------------------------------------------------------------------------
//
// `handwritten_notes` stores `subtopic_name`, which for a triple-tap note is
// the question truncated to 80 characters and for a topic note is the topic's
// display name. The function uses `questions` to pull the right passage out of
// Sembulingam, so a topic row wants its real question list rather than the
// words "GENERAL PHYSIOLOGY". The bank is the only place that has them, and
// `flattenSubjectTopics` is the app's own key builder — reimplementing it here
// would be a second definition of the cache key, which is the one thing this
// script must never own.

async function loadBankTopics() {
  const stub = {
    name: 'stub-native-imports',
    setup(b) {
      // flattenSubjectTopics needs the bank and nothing else. The Supabase
      // client, the progress store and the logger all reach for React Native.
      b.onResolve({ filter: /^(\.\/supabase|\.\/progress|@\/lib\/log)$/ }, a => ({
        path: a.path,
        namespace: 'stub',
      }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
        contents:
          'export const supabase = {}; export const warn = () => {}; ' +
          'export const getQuestionId = () => "";',
        loader: 'ts',
      }));
    },
  };
  const bundled = await build({
    entryPoints: [path.join(root, 'src/lib/handwrittenNotes.ts')],
    bundle: true,
    format: 'esm',
    write: false,
    platform: 'neutral',
    absWorkingDir: root,
    plugins: [stub],
    alias: {
      '@data': path.join(root, '..', 'src', 'data'),
      '@shared': path.join(root, '..', 'src', 'lib'),
      '@': path.join(root, 'src'),
    },
  });
  const notes = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
  );
  const bankBundle = await build({
    entryPoints: [path.join(root, 'src/lib/questionBank.ts')],
    bundle: true,
    format: 'esm',
    write: false,
    platform: 'neutral',
    absWorkingDir: root,
    alias: { '@data': path.join(root, '..', 'src', 'data') },
  });
  const bank = await import(
    `data:text/javascript;base64,${Buffer.from(bankBundle.outputFiles[0].text).toString('base64')}`
  );

  /** subtopic_key → questions, for every leaf topic in every subject. */
  const byKey = new Map();
  for (const year of Object.values(bank.QUESTION_BANK_DATA ?? {})) {
    // A year node is `{ name, subtopics: { <subjectKey>: <subject node> } }`.
    for (const [subjectKey, node] of Object.entries(year?.subtopics ?? {})) {
      if (!node || typeof node !== 'object') continue;
      let topics = [];
      try {
        topics = notes.flattenSubjectTopics(subjectKey, node);
      } catch {
        continue;
      }
      for (const topic of topics) byKey.set(topic.key, topic.questions);
    }
  }
  return byKey;
}

/**
 * What to send as `questions`.
 *
 * A triple-tap row's own 80-character `subtopic_name` IS the question, near
 * enough — it is the first 80 characters of it, which is what the textbook
 * retrieval keys on anyway. A topic row gets its real list from the bank.
 */
function questionsFor(row, byKey) {
  const fromBank = byKey.get(row.subtopic_key);
  if (Array.isArray(fromBank) && fromBank.length > 0) return fromBank.slice(0, 400);
  return [String(row.subtopic_name ?? '').slice(0, 1000) || row.subtopic_key];
}

// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const rows = [];
{
  /*
   * `--offline <file>` reads the rows from a JSON dump instead of the network.
   *
   * The sandboxes this repo is worked on from cannot reach
   * pmtgeydtqypwrypshhsx.supabase.co at all — the egress gateway refuses the
   * host — so without this the plan could only ever be run from a GitHub
   * runner. An agent holding the Supabase MCP connector can dump the rows with
   * one `select` and then plan against them here. `--run` still needs a real
   * route, because it has to call the function.
   */
  const offline = value('offline');
  if (offline) {
    const dump = JSON.parse(await fs.readFile(path.resolve(offline), 'utf8'));
    rows.push(...(Array.isArray(dump) ? dump : (dump.rows ?? [])));
  } else {
    // `handwritten_notes` is world-readable ("Anyone can read handwritten
    // notes"), so the anon key is enough and no secret belongs in this script.
    const { data, error } = await supabase
      .from('handwritten_notes')
      .select('subtopic_key, subject, year, subtopic_name, content, updated_at')
      .ilike('subject', `%${SUBJECT}%`);
    if (error) {
      process.stdout.write(
        `could not read handwritten_notes: ${error.message}\n` +
          'If this is an agent sandbox, dump the rows with the Supabase connector and ' +
          'pass --offline <file>.\n',
      );
      process.exit(1);
    }
    rows.push(...(data ?? []));
  }
}

const missing = rows.filter(row => !hasUsableFlowchart(row.content));
const byKey = await loadBankTopics();

process.stdout.write(`\nhandwritten_notes matching subject ~ "${SUBJECT}"\n`);
process.stdout.write(`  cached          ${rows.length}\n`);
process.stdout.write(`  with flowchart  ${rows.length - missing.length}\n`);
process.stdout.write(`  without         ${missing.length}\n\n`);

if (missing.length === 0) {
  process.stdout.write('Nothing to do.\n');
  process.exit(0);
}

for (const row of missing) {
  const qs = questionsFor(row, byKey);
  const sections = Array.isArray(row.content?.sections) ? row.content.sections.length : 0;
  process.stdout.write(
    `  ${row.subtopic_key}\n` +
      `      ${String(row.subtopic_name).slice(0, 78)}\n` +
      `      ${sections} sections, ${qs.length} question(s) ` +
      `${byKey.has(row.subtopic_key) ? 'from the bank' : 'from the row itself'}\n`,
  );
}

/*
 * Cost. One call each, and it is the small kind: the model is asked for ONE
 * flowchart section, not for the note. Input is the topic's textbook passage
 * (capped at 12,000 characters ≈ 3k tokens) plus the questions; output is 4–8
 * steps ≈ 500 tokens. Nothing is regenerated, so no note pays for its own
 * rewrite.
 */
const inTokens = missing.length * 3_200;
const outTokens = missing.length * 550;
process.stdout.write(
  `\ncost: ${missing.length} call(s) to gemini-3.1-flash-lite, ` +
    `~${inTokens.toLocaleString()} input + ~${outTokens.toLocaleString()} output tokens total.\n` +
    `      Paced ${GAP_MS}ms apart; on a free-tier key the per-minute limit is the ` +
    `binding constraint, not the price.\n`,
);

if (!RUN) {
  process.stdout.write('\nPlan only. Re-run with --run to apply.\n');
  process.exit(0);
}
if (value('offline')) {
  process.stdout.write('\n--run needs a live route to Supabase; --offline can only plan.\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

const targets = missing.slice(0, Number.isFinite(LIMIT) ? LIMIT : missing.length);

const backupPath = path.join(root, `physio-flowchart-backup-${Date.now()}.json`);
await fs.writeFile(backupPath, `${JSON.stringify(targets, null, 2)}\n`);
process.stdout.write(`\nbackup of ${targets.length} row(s) written to ${backupPath}\n`);
process.stdout.write('(restore with a saveContent call carrying the same subtopic_key)\n\n');

let added = 0;
let declined = 0;
let failed = 0;
let guaranteeSeen = false;

for (const [i, row] of targets.entries()) {
  if (i > 0) await new Promise(r => setTimeout(r, GAP_MS));
  const label = `${row.subtopic_key}`;
  try {
    const { data, error } = await supabase.functions.invoke('generate-handwritten-notes', {
      body: {
        subtopicKey: row.subtopic_key,
        year: row.year,
        subject: row.subject,
        subtopicName: row.subtopic_name,
        questions: questionsFor(row, byKey),
        // The note's own content, unchanged. The function's cache-write
        // boundary is what adds the flowchart; nothing else is touched.
        saveContent: true,
        content: row.content,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));

    /*
     * Read the row back rather than trusting the response. The guarantee is
     * the function's, and what matters is what is now in the cache — that is
     * what every reader gets.
     */
    const { data: after } = await supabase
      .from('handwritten_notes')
      .select('content')
      .eq('subtopic_key', row.subtopic_key)
      .maybeSingle();

    const before = Array.isArray(row.content?.sections) ? row.content.sections.length : 0;
    const now = Array.isArray(after?.content?.sections) ? after.content.sections.length : 0;

    if (hasUsableFlowchart(after?.content)) {
      guaranteeSeen = true;
      added += 1;
      process.stdout.write(`  ADDED     ${label}  (${before} → ${now} sections)\n`);
    } else if (now < before) {
      failed += 1;
      process.stdout.write(
        `  SHRANK    ${label}  (${before} → ${now} sections) — restore from the backup\n`,
      );
    } else {
      declined += 1;
      process.stdout.write(
        `  NO CHART  ${label}  — the function judged a flowchart meaningless here, ` +
          'or is not deployed with the guarantee yet\n',
      );
    }
  } catch (e) {
    failed += 1;
    process.stdout.write(`  FAILED    ${label}  ${String(e?.message ?? e).slice(0, 140)}\n`);
  }

  /*
   * Stop after the first note if nothing happened to it.
   *
   * The overwhelmingly likely cause is that the function has not been deployed
   * with the guarantee, and every remaining call would then be a no-op that
   * still costs a round trip and rewrites an `updated_at`. Better to say so
   * once than to walk the whole list quietly achieving nothing.
   */
  if (i === 0 && !guaranteeSeen && declined === 1) {
    process.stdout.write(
      '\nThe first note came back without a flowchart. Confirm the deployed function\n' +
        'contains ensurePhysiologyFlowchart (get_edge_function generate-handwritten-notes)\n' +
        'before spending the rest. Re-run to continue.\n',
    );
    break;
  }
}

process.stdout.write(
  `\n${added} note(s) gained a flowchart, ${declined} declined, ${failed} failed.\n`,
);
if (declined > 0) {
  process.stdout.write(
    'A decline is a real answer: a question with no sequence in it gets no flowchart,\n' +
      'because an invented one is a wrong answer the student copies onto paper.\n',
  );
}
process.exit(failed > 0 ? 1 : 0);
