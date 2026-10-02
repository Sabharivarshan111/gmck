/**
 * Offline KUHS bank assembled only from rows checked against the supplied PDFs.
 * TXT transfer is checked separately from OCR source accuracy. No PDF or answer
 * is uploaded with these strings; answers follow the existing on-tap cache.
 */
import { VERIFIED_KUHS_QUESTIONS, kuhsRepeatCount, type VerifiedKuhsQuestion } from './verifiedQuestions';

export function kuhsBankQuestion(row: VerifiedKuhsQuestion): string {
  return `KUHS[${row.id}] ${row.question} ${'*'.repeat(kuhsRepeatCount(row))}`;
}

type Leaf = { name: string; questions: string[] };
type Topic = { name: string; subtopics: Record<'essay' | 'short-notes', Leaf> };
type Subject = { name: string; subtopics: Record<string, Topic> };
type Year = { name: string; subtopics: Record<string, Subject> };

const YEAR_KEY = { first: 'first-year', second: 'second-year', third: 'third-year', final: 'final-year' } as const;
const YEAR_NAME = { first: 'First Year', second: 'Second Year', third: 'Third Year', final: 'Final Year' } as const;
const SUBJECT_NAME: Record<string, string> = {
  anatomy: 'Anatomy', physiology: 'Physiology', biochemistry: 'Biochemistry',
  pharmacology: 'Pharmacology', pathology: 'Pathology', microbiology: 'Microbiology',
  'forensic-medicine': 'Forensic Medicine', 'community-medicine': 'Community Medicine',
  'general-medicine': 'General Medicine', 'general-surgery': 'General Surgery',
  'obstetrics-gynaecology': 'Obstetrics & Gynaecology', paediatrics: 'Paediatrics',
  ent: 'ENT', ophthalmology: 'Ophthalmology',
};

export function buildKuhsBank(rows: readonly VerifiedKuhsQuestion[]): Record<string, Year> {
  const bank: Record<string, Year> = Object.fromEntries(
    Object.entries(YEAR_KEY).map(([year, key]) => [key, { name: YEAR_NAME[year as keyof typeof YEAR_NAME], subtopics: {} }]),
  );
  for (const row of rows) {
    const subjects = bank[YEAR_KEY[row.year]].subtopics;
    const subject = subjects[row.subjectKey] ??= {
      name: SUBJECT_NAME[row.subjectKey] ?? row.subjectKey,
      subtopics: {},
    };
    const topic = subject.subtopics[row.topicKey] ??= {
      name: row.topicKey.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
      subtopics: {
        essay: { name: 'Essays', questions: [] },
        'short-notes': { name: 'Short Notes', questions: [] },
      },
    };
    topic.subtopics[row.kind].questions.push(kuhsBankQuestion(row));
  }
  return bank;
}

/** Bundled locally; never fetched from Supabase to browse questions. */
export const KUHS_REVIEW_BANK_DATA = buildKuhsBank(VERIFIED_KUHS_QUESTIONS);
