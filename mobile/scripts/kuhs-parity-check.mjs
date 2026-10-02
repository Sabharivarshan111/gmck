import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const repoRoot = path.join(root, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const readRepo = p => fs.readFileSync(path.join(repoRoot, p), 'utf8');

async function bundle(entry) {
  const out = await build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    alias: {
      '@': path.join(root, 'src'),
      '@data': path.join(repoRoot, 'src/data'),
      '@shared': path.join(repoRoot, 'src/lib'),
    },
  });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
}

const bank = await bundle('src/lib/questionBank.ts');
const rowsMod = await bundle('../src/data/kuhs/verifiedQuestions.ts');
const textMod = await bundle('src/lib/questionText.ts');
const { VERIFIED_KUHS_QUESTIONS: rows } = rowsMod;

assert.ok(rows.length >= 6900, `KUHS expanded bank unexpectedly small: ${rows.length}`);
assert.ok(rows.some(r => r.examRefs.includes('RGU')), 'No RGU refs survived the bank build');
assert.ok(rows.some(r => r.examRefs.includes('TU')), 'No TU refs survived the bank build');

for (const year of bank.YEAR_KEYS) {
  const subjects = bank.getSubjects(year, 'kuhs');
  assert.ok(subjects.length > 0, `${year} has no KUHS subjects`);
  const count = subjects.reduce((n, s) => n + bank.collectAllQuestions(s.node).length, 0);
  assert.ok(count > 0, `${year} has no KUHS questions`);
}

const acute = rows.filter(r => r.year === 'final' && r.subjectKey === 'general-medicine' &&
  r.topicKey === 'acute-medicine-critical-illness');
assert.equal(acute.filter(r => r.kind === 'essay').length, 3, 'Acute Medicine must contain 3 RGU/TU essays');
assert.equal(acute.filter(r => r.kind === 'short-notes').length, 24, 'Acute Medicine must contain 24 short notes');

const marker = 'KUHS[kuhs-4-med-p150-99] Septic shock. **';
assert.equal(textMod.getCleanQuestionText(marker), 'Septic shock.');
assert.equal(textMod.noteQuestionText(marker), 'Septic shock. **');

const questionRow = read('src/components/QuestionRow.tsx');
assert.match(questionRow, /doubleTapPrompt\(getCleanQuestionText\(question\)\)/,
  'Double-tap MCQ must use cleaned KUHS question text');
assert.match(questionRow, /onNote\(noteQuestionText\(question\),\s*question\)/,
  'Triple-tap note must send cleaned note key plus raw KUHS question');
assert.match(questionRow, /Printed exams:\s*\{kuhsSource\.examRefs\.join/,
  'KU/RGU/TU printed exam refs must render on KUHS rows');

const browse = read('src/screens/BrowseNodeScreen.tsx');
assert.match(browse, /availableBankUniversity\(university\)/,
  'Browse must select the profile university');
assert.match(browse, /rememberQuestion\(\{ university: bankUniversity/,
  'Resume pointer must remember KUHS vs TNMGR');

const progress = read('src/lib/progress.ts');
assert.match(progress, /const kuhsId = kuhsQuestionId\(question\)/,
  'Progress must use stable KUHS IDs');

const pageRefs = read('src/lib/pageRefs.ts');
assert.match(pageRefs, /getQuestionId\(question\)/,
  'Page refs must use the same stable progress/question identity');


const notesScreen = read('src/screens/NotesScreen.tsx');
assert.match(notesScreen, /getSubjects\(YEAR_TO_KEY\[year\], university\)/,
  'Notes tab must browse subjects from the selected university');
assert.match(notesScreen, /getSubjects\(YEAR_TO_KEY\[current\.year\], bankUniversity\)/,
  'Notes back-navigation must resolve the selected university tree');

const progressNotes = read('src/components/ProgressNotesTab.tsx');
assert.match(progressNotes, /getSubjects\(year, university\)/,
  'Progress Notes filing must browse the selected university');
assert.match(progressNotes, /university=\{bankUniversity\}/,
  'Progress Notes filing sheet must receive the selected university');

const flashcards = read('src/lib/flashcards.ts');
assert.match(flashcards, /university: University = 'tnmgr'/,
  'Deck identity must accept a university');
assert.match(flashcards, /university === 'kuhs' \? `kuhs::\$\{base\}` : base/,
  'KUHS generated decks must have a separate cache key');
assert.match(flashcards, /map\(stripKuhsQuestionMarker\)/,
  'KUHS internal markers must be stripped before flashcard generation');

const flashScreen = read('src/screens/FlashcardsScreen.tsx');
assert.match(flashScreen, /getSubjects\(YEAR_TO_KEY\[year\], university\)/,
  'Flashcard browser must browse the selected university');
assert.match(flashScreen, /decksForChapter\(all, topic\.key, university\)/,
  'Filed custom decks must not leak between university banks');

const customDecks = read('src/lib/customDecks.ts');
assert.match(customDecks, /\(deck\.chapter\?\.university \?\? 'tnmgr'\) === university/,
  'Custom deck chapter lookup must be university-scoped');

const resume = read('src/lib/homeResume.ts');
assert.match(resume, /orbit:last-question-v2:\$\{university\}/,
  'Resume storage must be university-scoped');

const daily = read('src/lib/dailyStudy.ts');
assert.match(daily, /orbit:daily-study-v2:\$\{university\}/,
  'Daily-card local cache must be university-scoped');
assert.match(daily, /body: \{ kind, university, year, date, sourceQuestions: compact \}/,
  'Daily-card request must identify the university and carry its source sample');

const home = read('src/screens/HomeScreen.tsx');
assert.match(home, /dailyRequestScope = `\$\{bankUniversity\}:\$\{year\}:\$\{dailyDate\}`/,
  'Daily-card in-flight scope must change when university changes');
assert.match(home, /readLastQuestion\(bankUniversity\)/,
  'Home resume must read from the selected university only');

const flashFn = readRepo('supabase/functions/generate-flashcards/index.ts');
assert.match(flashFn, /university: z\.enum\(\["tnmgr", "kuhs"\]\)/,
  'Flashcard Edge Function must validate university');
assert.match(flashFn, /university === "kuhs" \? `kuhs::\$\{baseDeckKey\}` : baseDeckKey/,
  'Flashcard Edge Function must namespace KUHS shared cache');

const dailyFn = readRepo('supabase/functions/daily-study-card/index.ts');
assert.match(dailyFn, /const identity = \{ university, year, kind, slot \}/,
  'Daily-card shared cache must be university-scoped');
assert.match(dailyFn, /university === 'kuhs' && kind === 'mcq' && sourceQuestions\.length > 0/,
  'KUHS daily MCQ must select from KUHS source questions');

const searchHits = bank.allSearchHits('kuhs');
assert.ok(searchHits.length >= rows.length,
  `KUHS search index too small: ${searchHits.length} for ${rows.length} rows`);

console.log(
  `OK KUHS parity: ${rows.length} questions; browse/search/progress/source refs, triple-tap notes, chapter notes, double-tap MCQs, Anki, resume, custom decks and daily cards are university-scoped. Acute Medicine = 3 essays + 24 short notes.`,
);
