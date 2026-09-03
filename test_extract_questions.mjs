import { build } from 'esbuild';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

const rootDir = process.cwd();
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-extract-'));
const entry = path.join(tmpDir, 'entry.ts');
const out = path.join(tmpDir, 'out.mjs');

await fs.writeFile(
  entry,
  `
  import { QUESTION_BANK_DATA } from '${path.join(rootDir, 'src/data/questionBankData.ts')}';
  import { collectQuestions } from '${path.join(rootDir, 'src/lib/question-progress.ts')}';

  export function getSubjectQuestions(yearKey, subjectKey) {
    const yearNode = QUESTION_BANK_DATA[yearKey];
    if (!yearNode || !yearNode.subtopics) return [];
    const subjectNode = yearNode.subtopics[subjectKey];
    if (!subjectNode) return [];
    const essays = collectQuestions(subjectNode, 'essay') || [];
    const shorts = collectQuestions(subjectNode, 'short-notes') || [];
    const unique = Array.from(new Set([...essays, ...shorts])).filter(Boolean);
    return {
      subjectName: subjectNode.name || subjectKey,
      yearName: yearNode.name || yearKey,
      questions: unique,
    };
  }
  `
);

await build({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
});

const { getSubjectQuestions } = await import(out);

const med = getSubjectQuestions('final-year', 'general-medicine');
const surg = getSubjectQuestions('final-year', 'general-surgery');

console.log(`General Medicine: ${med.questions.length} questions`);
console.log(`General Surgery: ${surg.questions.length} questions`);

await fs.rm(tmpDir, { recursive: true, force: true });
