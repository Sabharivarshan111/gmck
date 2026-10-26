import { REVIEWED_UNIVERSITY_QUESTIONS } from './reviewedBatch01';
import type { CollectedUniversity, ReviewedUniversityQuestion } from './types';

type Node = { name: string; questions?: string[]; subtopics?: Record<string, Node> };
const YEARS = { first: 'first-year', second: 'second-year', third: 'third-year', final: 'final-year' } as const;
const YEAR_NAMES = { first: 'First Year', second: 'Second Year', third: 'Third Year', final: 'Final Year' } as const;
const SUBJECT_NAMES: Record<string, string> = {
  anatomy: 'Anatomy', biochemistry: 'Biochemistry', pathology: 'Pathology',
};
const TOPIC_NAMES: Record<string, string> = {
  'upper-limb': 'Upper Limb', neuroanatomy: 'Neuroanatomy', thorax: 'Thorax',
  embryology: 'Embryology', 'head-and-neck': 'Head and Neck', histology: 'Histology',
  'general-anatomy': 'General Anatomy', bioenergetics: 'Bioenergetics', vitamins: 'Vitamins',
  haemoglobin: 'Haemoglobin', 'carbohydrate-metabolism': 'Carbohydrate Metabolism',
  'lipid-metabolism': 'Lipid Metabolism', nutrition: 'Nutrition',
  haematology: 'Haematology', 'general-pathology': 'General Pathology',
};

/** Only page-reviewed rows enter this offline payload. Draft extraction never feeds it. */
export function buildCollectedBank(university: CollectedUniversity, rows = REVIEWED_UNIVERSITY_QUESTIONS): Record<string, Node> {
  const bank: Record<string, Node> = Object.fromEntries(Object.entries(YEARS)
    .map(([year, key]) => [key, { name: YEAR_NAMES[year as keyof typeof YEARS], subtopics: {} }]));
  for (const row of rows) {
    if (row.university !== university) continue;
    const subjects = bank[YEARS[row.year]].subtopics!;
    const subject = subjects[row.subjectKey] ??= { name: SUBJECT_NAMES[row.subjectKey] ?? row.subjectKey, subtopics: {} };
    const topic = subject.subtopics![row.topicKey] ??= {
      name: TOPIC_NAMES[row.topicKey] ?? row.topicKey,
      subtopics: {
        essay: { name: 'Essays', questions: [] },
        'short-notes': { name: 'Short Notes', questions: [] },
      },
    };
    topic.subtopics![row.kind].questions!.push(`PYQ[${row.id}] ${row.question}`);
  }
  return bank;
}

export const COLLECTED_UNIVERSITIES: CollectedUniversity[] = ['rguhs', 'knruhs', 'muhs', 'ntruhs', 'wbuhs'];
export const COLLECTED_BANKS = Object.fromEntries(COLLECTED_UNIVERSITIES
  .map(university => [university, buildCollectedBank(university)])) as Record<CollectedUniversity, Record<string, Node>>;
export const COLLECTED_QUESTION_COUNTS = Object.fromEntries(COLLECTED_UNIVERSITIES
  .map(university => [university, REVIEWED_UNIVERSITY_QUESTIONS.filter(row => row.university === university).length])) as Record<CollectedUniversity, number>;
const SOURCES = new Map<string, ReviewedUniversityQuestion>(REVIEWED_UNIVERSITY_QUESTIONS.map(row => [row.id, row]));
export function collectedQuestionSource(question: string): ReviewedUniversityQuestion | undefined {
  const id = question.match(/^PYQ\[([a-z0-9-]+)\]\s/)?.[1];
  return id ? SOURCES.get(id) : undefined;
}
