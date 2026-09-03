/**
 * How many questions in each year carry a repeat count, and which subjects
 * carry none at all.
 *
 * This exists because "the circle showing how many times a question repeated
 * does not appear in Final Year" was reported as a rendering bug, and it is
 * not: `countStars` works identically on every year. The circle is absent
 * because the marker is absent from the bank.
 *
 * The numbers, measured here rather than remembered:
 *
 *   first-year   ~56% of questions carry a marker
 *   second-year  ~80%
 *   third-year   ~87%
 *   final-year   ~21%   -- and General Medicine is 0 of 660
 *
 * A question is marked either with asterisks ("Necrosis ****") or with a list
 * of years it was asked ("(Feb 22;Feb 11;Aug 06)"). Final-year subjects were
 * transcribed with a page number and neither of those, so there is nothing to
 * count. The fix is the marked-up source for those subjects, not code -- and
 * inventing counts would be telling students which questions repeat based on
 * nothing.
 *
 * So this does not fail on a low percentage. It fails only if a subject that
 * HAS markers today loses them, which would be a real regression, and it prints
 * the table so the gap stays a number somebody can act on.
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA = path.join(process.cwd(), '..', 'src', 'data', 'topics');

const STAR = /[*★☆⭐]/g;
const DATES =
  /\(((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2,4}[,;]?\s*)+)\)/i;

/** Mirrors countStars in src/lib/questionText.ts. */
function countStars(question) {
  const stars = question.match(STAR);
  if (stars && stars.length > 0) {
    return stars.length;
  }
  const dates = question.match(DATES);
  if (dates && dates[1]) {
    return dates[1].split(/[;,]/).filter(part => part.trim()).length;
  }
  return 0;
}

const YEARS = {
  'first-year': ['anatomy', 'physiology', 'biochemistry'],
  'second-year': ['pharmacology', 'pathology', 'microbiology'],
  'third-year': ['forensicMedicine', 'communityMedicine'],
  'final-year': [
    'generalMedicine',
    'obstetricsGynaecology',
    'generalSurgery',
    'orthopaedics',
    'paediatrics',
    'ent',
    'ophthalmology',
  ],
};

/**
 * Subjects known to carry no marker at all today.
 *
 * Listing them is the point: a subject that drops OFF this list has gained
 * markers (good, remove it), and one that appears without being added has lost
 * them, which is the regression this check is for.
 */
const KNOWN_UNMARKED = new Set(['generalMedicine']);

function tsFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out = out.concat(tsFiles(full));
    } else if (entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Question strings, not the object keys and structure around them. */
function questionsIn(file) {
  const source = fs.readFileSync(file, 'utf8');
  const found = [];
  for (const match of source.matchAll(/"((?:[^"\\]|\\.){25,})"/g)) {
    const text = match[1];
    if (!/[a-z]/i.test(text)) continue;
    if (/^\s*[,{]|questions:|subtopics:|name:/.test(text)) continue;
    found.push(text);
  }
  return found;
}

const failures = [];
const rows = [];

for (const [year, subjects] of Object.entries(YEARS)) {
  let total = 0;
  let marked = 0;
  for (const subject of subjects) {
    const files = [
      path.join(DATA, `${subject}.ts`),
      ...tsFiles(path.join(DATA, subject)),
    ];
    let subTotal = 0;
    let subMarked = 0;
    for (const file of files) {
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
      for (const question of questionsIn(file)) {
        subTotal += 1;
        if (countStars(question) > 0) subMarked += 1;
      }
    }
    total += subTotal;
    marked += subMarked;

    if (subTotal > 0 && subMarked === 0 && !KNOWN_UNMARKED.has(subject)) {
      failures.push(
        `${subject} has ${subTotal} questions and not one carries a repeat ` +
          `marker. If that is intentional, add it to KNOWN_UNMARKED with a note.`,
      );
    }
    if (subMarked > 0 && KNOWN_UNMARKED.has(subject)) {
      failures.push(
        `${subject} now has ${subMarked} marked questions — take it out of ` +
          `KNOWN_UNMARKED so the check protects it.`,
      );
    }
  }
  rows.push({ year, total, marked });
}

for (const { year, total, marked } of rows) {
  const pct = total ? ((marked / total) * 100).toFixed(0) : '0';
  process.stdout.write(
    `${year.padEnd(12)} ${String(marked).padStart(5)}/${String(total).padEnd(5)} ` +
      `carry a repeat count  (${pct}%)\n`,
  );
}

if (failures.length) {
  process.stdout.write(`\n${failures.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(
  '\nOK  every subject that had repeat markers still has them.\n' +
    '    Low coverage is a gap in the source data, not a rendering bug —\n' +
    '    the badge is drawn wherever a marker exists.\n',
);
