// A question's note shows that question's diagram, or none at all.
//
// The reason this check exists is one screenshot. Opening
//
//     TCA cycle – definition, sequence of reaction, energetics, regulation***
//
// gave a note headed "High-Yield Visual Exam Diagram (1/3)" showing
// **Glycolysis**, then (2/3) showing **Gluconeogenesis**, and the TCA cycle
// third. Nothing was broken in a way any of the other checks could see: the
// pictures were real, they were the right subject, they were even the right
// chapter. They were somebody else's question.
//
// The cause was that the lookup was a search. Candidates were scored against
// "exclusive entity families" — word lists per pathway — and every biochemistry
// row that shared a word with the query came back, ranked and numbered. Two
// rounds of widening and narrowing those lists only moved *which* questions
// were wrong, because the premise is wrong: a question that mentions a pathway
// is not a question about it, and no amount of vocabulary tells them apart.
//
// `question_diagrams` already knows the answer exactly. Every row is one
// question and carries that question's own `question_id` — the app's own
// per-question key, `question-` plus the first 50 characters with whitespace
// dashed, which 849 of the 862 rows with a picture match character for
// character. So the number of diagrams a question has is the number of rows it
// has: usually one, sometimes none, never a neighbour's.
//
// This runs the real `findDiagramsForQuestion` against rows copied from
// production, so it fails if anyone reintroduces scoring, containment, or a
// keyword table. It also pins the three writers — first open, Regenerate, and
// "Fix notes with AI" — to the same rebuild, because the second bug in that
// screenshot was that the wrong pictures *survived* all three: they were
// explicitly pinned to the top of the note as something to be preserved.
//
//   node scripts/diagram-match-check.mjs
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');

const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};

/*
 * Rows as production has them. The four biochemistry pathways below are the
 * exact four the screenshot confused, and the two joint rows are the
 * hand-inserted kind whose `question_id` is a paraphrase rather than the key —
 * they are here so the fallback stays a normalised *equality* and never
 * quietly becomes a containment again.
 */
const ROWS = [
  {
    question_id: 'question-TCA-cycle-–-definition,-sequence-of-reaction,-ener',
    question_text:
      'TCA cycle – definition, sequence of reaction, energetics, regulation***',
    subject: 'Biochemistry',
    storage_path: 'biochemistry/tca_cycle_amphibolic_anaplerosis.jpg',
  },
  {
    question_id: 'question-Glycolysis-–-definition,-sequence-of-reaction,-ene',
    question_text:
      'Glycolysis – definition, sequence of reaction, energetics, regulation***',
    subject: 'Biochemistry',
    storage_path: 'biochemistry/glycolysis_pathway_energetics.jpg',
  },
  {
    question_id: 'question-Gluconeogenesis-–-definition,-sequence-of-reaction',
    question_text:
      'Gluconeogenesis – definition, sequence of reaction, energetics, regulation***',
    subject: 'Biochemistry',
    storage_path: 'biochemistry/gluconeogenesis_bypasses_cori_cycle.jpg',
  },
  {
    question_id: 'question-Anaplerotic-Reactions-***',
    question_text: 'Anaplerotic Reactions ***',
    subject: 'Biochemistry',
    storage_path: 'biochemistry/tca_cycle_amphibolic_anaplerosis.jpg',
  },
  {
    question_id: 'question-Cori\'s-cycle-and-Cahill-cycle-****',
    question_text: "Cori's cycle and Cahill cycle ****",
    subject: 'Biochemistry',
    storage_path: 'biochemistry/gluconeogenesis_bypasses_cori_cycle.jpg',
  },
  // Hand-inserted: the id is a slug, so only the text can reach it.
  {
    question_id: 'anat-types-of-synovial-joints',
    question_text: 'Types of synovial joint',
    subject: 'Anatomy',
    storage_path: 'anatomy/types_of_synovial_joints.jpg',
  },
  {
    question_id: 'anat-cartilaginous-joints',
    question_text: 'Cartilaginous joint',
    subject: 'Anatomy',
    storage_path: 'anatomy/cartilaginous_joints_primary_vs_secondary.jpg',
  },
];

const BUCKET =
  'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/';
for (const row of ROWS) {
  row.public_url = BUCKET + row.storage_path;
}

/** The queries the lookup is allowed to make, recorded so the shape is pinned. */
const issued = [];

/*
 * A supabase stand-in that understands exactly the three calls the lookup
 * makes: `.eq` on a column, `.not('public_url','is',null)`, and `.ilike` on
 * subject. Anything else throws rather than silently returning everything,
 * because "returns everything" is the failure mode being tested for.
 */
function fakeSupabase() {
  return {
    from(table) {
      if (table !== 'question_diagrams') {
        return { select: () => ({ data: [], error: null }) };
      }
      const filters = [];
      const q = {
        select() {
          return q;
        },
        eq(col, value) {
          filters.push(row => row[col] === value);
          filters.kind = `eq:${col}`;
          return q;
        },
        /*
         * The chapter lookup asks for a whole chapter's keys at once. Still an
         * equality — a set membership test is `eq` repeated, not a search —
         * and still on an indexed column.
         */
        in(col, values) {
          const wanted = new Set(values);
          filters.push(row => wanted.has(row[col]));
          filters.kind = `in:${col}`;
          return q;
        },
        ilike(col, pattern) {
          const needle = pattern.replace(/%/g, '').toLowerCase();
          filters.push(row =>
            String(row[col] ?? '')
              .toLowerCase()
              .includes(needle),
          );
          filters.kind = filters.kind ?? `ilike:${col}`;
          return q;
        },
        not(col, op, value) {
          if (op !== 'is' || value !== null) {
            throw new Error(`unexpected .not(${col}, ${op})`);
          }
          filters.push(row => row[col] != null);
          return q;
        },
        then(resolve) {
          issued.push(filters.kind ?? 'unfiltered');
          resolve({ data: ROWS.filter(r => filters.every(f => f(r))), error: null });
        },
      };
      return q;
    },
  };
}

const out = await build({
  entryPoints: [path.join(root, 'src/lib/handwrittenNotes.ts')],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
  absWorkingDir: root,
  alias: { '@': path.join(root, 'src') },
  external: ['@react-native-async-storage/async-storage'],
  plugins: [
    {
      name: 'supabase-and-log',
      setup(builder) {
        builder.onResolve({ filter: /(^|\/)supabase$/ }, () => ({
          path: 'supabase-stub',
          namespace: 'inject',
        }));
        builder.onResolve({ filter: /(^|\/)log$/ }, () => ({
          path: 'log-stub',
          namespace: 'inject',
        }));
        builder.onResolve(
          { filter: /^@react-native-async-storage\/async-storage$/ },
          () => ({ path: 'async-stub', namespace: 'inject' }),
        );
        builder.onLoad({ filter: /.*/, namespace: 'inject' }, args => {
          if (args.path === 'supabase-stub') {
            return {
              contents: 'export const supabase = globalThis.__supabase;',
              loader: 'js',
            };
          }
          if (args.path === 'log-stub') {
            return { contents: 'export const warn = () => {};', loader: 'js' };
          }
          return {
            contents:
              'export default { getItem: async () => null, setItem: async () => {}, getAllKeys: async () => [], multiGet: async () => [], multiSet: async () => {}, removeItem: async () => {}, multiRemove: async () => {} };',
            loader: 'js',
          };
        });
      },
    },
  ],
});

globalThis.__supabase = fakeSupabase();
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`
);

const {
  findDiagramsForQuestion,
  applyQuestionDiagrams,
  findDiagramsForTopic,
  applyTopicDiagrams,
  buildTopicDiagramSections,
} = mod;
check(
  typeof findDiagramsForQuestion === 'function',
  'handwrittenNotes no longer exports findDiagramsForQuestion — the lookup was renamed or removed',
);
check(
  typeof applyQuestionDiagrams === 'function',
  'handwrittenNotes no longer exports applyQuestionDiagrams — the rebuild was renamed or removed',
);

// Without both, nothing below can run — report rather than stack-trace.
if (failures.length > 0) {
  process.stdout.write('FAIL  diagram matching\n');
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exit(1);
}

const names = list => list.map(d => d.url.slice(BUCKET.length)).sort();

// ---------------------------------------------------------------- behaviour

/** The screenshot. Three diagrams where the question has one. */
const tca = await findDiagramsForQuestion(
  'TCA cycle – definition, sequence of reaction, energetics, regulation***',
  'biochemistry',
  'Biochemistry',
);
check(
  tca.length === 1 &&
    names(tca)[0] === 'biochemistry/tca_cycle_amphibolic_anaplerosis.jpg',
  `the TCA cycle question got ${tca.length} diagram(s): ${names(tca).join(', ') || 'none'} — it has exactly one row, and Glycolysis and Gluconeogenesis are different questions`,
);

/** The other two, from their own side. */
const glyco = await findDiagramsForQuestion(
  'Glycolysis – definition, sequence of reaction, energetics, regulation***',
  'biochemistry',
  'Biochemistry',
);
check(
  glyco.length === 1 &&
    names(glyco)[0] === 'biochemistry/glycolysis_pathway_energetics.jpg',
  `the Glycolysis question got ${names(glyco).join(', ') || 'nothing'}`,
);

const gluco = await findDiagramsForQuestion(
  'Gluconeogenesis – definition, sequence of reaction, energetics, regulation***',
  'biochemistry',
  'Biochemistry',
);
check(
  gluco.length === 1 &&
    names(gluco)[0] === 'biochemistry/gluconeogenesis_bypasses_cori_cycle.jpg',
  `the Gluconeogenesis question got ${names(gluco).join(', ') || 'nothing'}`,
);

/**
 * Two questions may legitimately share one picture — "Anaplerotic Reactions"
 * is the TCA plate. That is the row saying so, not the matcher guessing.
 */
const anaplerotic = await findDiagramsForQuestion(
  'Anaplerotic Reactions ***',
  'biochemistry',
  'Biochemistry',
);
check(
  anaplerotic.length === 1 &&
    names(anaplerotic)[0] === 'biochemistry/tca_cycle_amphibolic_anaplerosis.jpg',
  'a question that shares a plate with another must still get exactly that plate',
);

/** No row is an answer. A plausible neighbour is not. */
const none = await findDiagramsForQuestion(
  'Respiratory quotient**',
  'biochemistry',
  'Biochemistry',
);
check(
  none.length === 0,
  `a question with no diagram row got ${names(none).join(', ')} — it must get nothing rather than something adjacent`,
);

/**
 * The hand-inserted rows, reached by normalised text. The stars differ between
 * the bank and the row, and that is the only difference allowed to be ignored.
 */
const synovial = await findDiagramsForQuestion(
  'Types of synovial joint **',
  'anatomy',
  'Anatomy',
);
check(
  synovial.length === 1 &&
    names(synovial)[0] === 'anatomy/types_of_synovial_joints.jpg',
  `"Types of synovial joint **" got ${names(synovial).join(', ') || 'nothing'} — the star count is the only thing normalisation may drop`,
);

const cartilaginous = await findDiagramsForQuestion(
  'Cartilaginous joint *',
  'anatomy',
  'Anatomy',
);
check(
  cartilaginous.length === 1 &&
    names(cartilaginous)[0] ===
      'anatomy/cartilaginous_joints_primary_vs_secondary.jpg',
  `"Cartilaginous joint *" got ${names(cartilaginous).join(', ') || 'nothing'} — it must not also collect the synovial plate`,
);

/**
 * Containment is the trap the old matcher fell into. "Joint" is in both of the
 * rows above, so a lookup that ever answers this one is scoring again.
 */
const bareJoint = await findDiagramsForQuestion('Joint', 'anatomy', 'Anatomy');
check(
  bareJoint.length === 0,
  `a bare word matched ${names(bareJoint).join(', ')} — the lookup is matching by containment again, which is exactly how the TCA note collected three diagrams`,
);

// ----------------------------------------------------------- rebuild, not top up

const body = [
  { type: 'definition', title: 'Definition', payload: { text: 'The TCA cycle…' } },
  { type: 'list', title: 'Energetics', payload: { items: [] } },
];
const stale = {
  sections: [
    {
      type: 'definition',
      title: 'High-Yield Visual Exam Diagram (1/3)',
      icon: '🎨',
      payload: { text: `![Glycolysis](${BUCKET}biochemistry/glycolysis_pathway_energetics.jpg)` },
    },
    {
      type: 'definition',
      title: 'High-Yield Visual Exam Diagram (2/3)',
      icon: '🎨',
      payload: {
        text: `![Gluconeogenesis](${BUCKET}biochemistry/gluconeogenesis_bypasses_cori_cycle.jpg)`,
      },
    },
    ...body,
  ],
  diagramUrl: `${BUCKET}biochemistry/glycolysis_pathway_energetics.jpg`,
};

const healed = applyQuestionDiagrams(stale, tca, 'TCA cycle – definition…');
const healedDiagrams = healed.sections.filter(s => s.icon === '🎨');
check(
  healedDiagrams.length === 1,
  `a note cached with two wrong diagrams kept ${healedDiagrams.length} after the rebuild — the rebuild replaces, it does not top up, or a wrong picture survives every regenerate`,
);
check(
  healedDiagrams[0]?.payload?.text?.includes('tca_cycle_amphibolic_anaplerosis'),
  'the rebuilt diagram is not the question\'s own',
);
check(
  healed.diagramUrl === tca[0].url,
  'diagramUrl still points at the stale picture',
);
check(
  healed.sections.slice(1).map(s => s.title).join('|') ===
    body.map(s => s.title).join('|'),
  'the rebuild disturbed the note body — only diagram sections may be touched',
);

/** A question with no diagram loses the section entirely rather than keeping one. */
const stripped = applyQuestionDiagrams(stale, [], 'Respiratory quotient**');
check(
  stripped.sections.every(s => s.icon !== '🎨') &&
    stripped.diagramUrl === undefined,
  'a note whose question has no diagram row kept a diagram section',
);

/** A single diagram is not numbered "(1/1)". */
check(
  healedDiagrams[0]?.title === 'High-Yield Visual Exam Diagram',
  `one diagram was titled "${healedDiagrams[0]?.title}" — the count only belongs there when there is more than one`,
);

// ------------------------------------------------------------- the chapter
//
// The Notes tab shows a whole chapter, built out of every question in it, and
// it showed **no pictures at all** — in any year, for any subject — while
// triple-tapping one of those same questions showed them. Nothing in the
// chapter path ever asked for a diagram.
//
// A chapter's diagrams are its questions' diagrams, so the rule that holds for
// one question has to hold for the set: identity only, and a picture belonging
// to a question that is not in this chapter can never appear.

check(
  typeof findDiagramsForTopic === 'function',
  'handwrittenNotes no longer exports findDiagramsForTopic — the Notes tab has no diagrams again',
);

issued.length = 0;
const chapter = await findDiagramsForTopic(
  [
    'TCA cycle – definition, sequence of reaction, energetics, regulation***',
    'Anaplerotic Reactions ***',
    // In the chapter, with no row of its own. It must contribute nothing
    // rather than borrow a neighbour's plate.
    'Respiratory quotient**',
  ],
  'biochemistry',
  'Biochemistry',
);

check(
  chapter.length === 1,
  `a chapter of three questions returned ${chapter.length} diagrams — TCA and Anaplerotic share one plate and the third has none`,
);
check(
  chapter.every(d => /tca_cycle_amphibolic/.test(d.url)),
  `the chapter picked up ${chapter.map(d => d.url.split('/').pop()).join(', ')}`,
);
/*
 * The two that made the original bug visible. Glycolysis and Gluconeogenesis
 * are in the same subject and share almost every word with the TCA question;
 * neither is in this chapter, so neither may come back.
 */
check(
  !chapter.some(d => /glycolysis|gluconeogenesis/.test(d.url)),
  'a chapter picked up a plate belonging to a question that is not in it — the exact failure the single-question lookup was rewritten to stop',
);
check(
  chapter.every(d => typeof d.question === 'string' && d.question.length > 0),
  'a chapter diagram came back without the question it belongs to, so it cannot be captioned',
);
check(
  issued.length > 0 && !issued.includes('unfiltered'),
  `the chapter lookup pulled the table down unfiltered (${issued.join(', ')})`,
);

/** Every question in the chapter, and one query per key kind rather than per question. */
issued.length = 0;
const wholeChapter = await findDiagramsForTopic(
  ROWS.filter(r => r.subject === 'Biochemistry').map(r => r.question_text),
  'biochemistry',
  'Biochemistry',
);
check(
  wholeChapter.length === 3,
  `a chapter holding all five biochemistry questions returned ${wholeChapter.length} pictures, expected 3 distinct plates`,
);
check(
  new Set(wholeChapter.map(d => d.url)).size === wholeChapter.length,
  'the same picture came back twice — two questions sharing a plate must not print it twice',
);
check(
  issued.filter(kind => kind.startsWith('in:')).length <= 4,
  `the chapter lookup issued ${issued.filter(k => k.startsWith('in:')).length} membership queries — it must batch, not ask per question`,
);

/** The hand-inserted rows, whose ids are slugs, are reachable from a chapter too. */
const anatomyChapter = await findDiagramsForTopic(
  ['Types of synovial joint **', 'Cartilaginous joint'],
  'anatomy',
  'Anatomy',
);
check(
  anatomyChapter.length === 2,
  `the anatomy chapter found ${anatomyChapter.length} of its 2 hand-inserted diagrams`,
);

/** And a chapter of questions nobody drew gets nothing at all. */
const emptyChapter = await findDiagramsForTopic(
  ['Respiratory quotient**', 'Define enzyme'],
  'biochemistry',
  'Biochemistry',
);
check(
  emptyChapter.length === 0,
  `a chapter with no diagrams returned ${emptyChapter.length} — a plausible neighbour is worse than a blank`,
);

/** Captions name the question, not "(2/40)", which would say nothing. */
const chapterSections = buildTopicDiagramSections(wholeChapter);
check(
  chapterSections.every(s => !/\(\d+\/\d+\)/.test(s.title)),
  'a chapter diagram is numbered out of the chapter total, which tells the reader nothing about what it shows',
);

/** Replace, not top up — the same rule that makes the single-note path heal. */
const staleChapter = {
  sections: [
    { type: 'definition', title: 'High-Yield Visual Exam Diagram', icon: '🎨', payload: { text: 'old' } },
    { type: 'definition', title: 'Axilla', payload: { text: 'kept' } },
  ],
};
const rebuilt = applyTopicDiagrams(staleChapter, wholeChapter);
check(
  rebuilt.sections.filter(s => s.icon === '🎨').length === wholeChapter.length,
  'the chapter rebuild kept a diagram section that is no longer this chapter\'s',
);
check(
  rebuilt.sections.some(s => s.title === 'Axilla'),
  'the chapter rebuild dropped the note body',
);
check(
  applyTopicDiagrams(staleChapter, []).sections.every(s => s.icon !== '🎨'),
  'a chapter with no diagrams kept a stale diagram section',
);

// -------------------------------------------------------------------- source

const read = file => fs.readFile(path.join(root, file), 'utf8').catch(() => null);
const lib = await read('src/lib/handwrittenNotes.ts');
const editBox = await read('src/components/NotesAiEditBox.tsx');

check(
  lib !== null && editBox !== null,
  'the note source files are missing',
);

if (lib) {
  check(
    /\.eq\('question_id'/.test(lib),
    'the lookup no longer joins on question_id — that key is the whole matcher',
  );
  check(
    !/EXCLUSIVE_ENTITIES|DIAGRAM_STOP_WORDS/.test(lib),
    'the entity/stop-word tables are back in handwrittenNotes.ts — scoring by vocabulary is what attached Glycolysis to the TCA cycle note',
  );
  check(
    !/score\s*[:+]/.test(lib),
    'the diagram lookup is scoring candidates again — it is an identity join, and a ranked list means the second-best is on screen',
  );
}

if (editBox) {
  check(
    /resolveQuestionDiagrams|applyQuestionDiagrams/.test(editBox),
    '"Fix notes with AI" no longer rebuilds the diagrams — an accepted edit would keep whatever picture the note already had, including a wrong one',
  );
  check(
    !/s\.icon === '🎨' \|\|/.test(editBox),
    'NotesAiEditBox is preserving existing diagram sections by hand again — that is how the wrong picture survived every correction the reader made',
  );
}

// ---------------------------------------------------------------------- report

if (failures.length > 0) {
  process.stdout.write('FAIL  diagram matching\n');
  for (const failure of failures) {
    process.stdout.write(`  - ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write(
  `OK    a question gets its own diagram or none (${ROWS.length} rows, ${issued.length} queries, no scoring)\n`,
);
