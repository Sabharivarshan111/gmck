/**
 * One RGUHS index for the existing page-reviewed questions and checksum-pinned
 * offline PDF packs. Never add the two raw counters: they overlap.
 *
 * Exact normalized text is the only automatic deduplication allowed here.
 * Fuzzy clinical matching can silently remove genuinely different questions.
 */
import { allSearchHits, getSubjects, type YearKey } from './questionBank';
import { getCleanQuestionText } from './questionText';
import { isQuestionDone } from './progress';
import { isUniversityMcq } from '@data/universityPapers/presentation';
import type { OfflineUniversityQuestion } from './universityOfflineTypes';

export type RguhsKind = 'essay' | 'short-notes' | 'mcq' | 'other';

export type RguhsRow = {
  id: string;
  year: YearKey;
  subjectName: string;
  subjectKey: string;
  chapter: string;
  kind: RguhsKind;
  /** Original source string: do not rewrite; progress, notes and metadata depend on it. */
  question: string;
  offline?: OfflineUniversityQuestion;
  reviewedQuestion?: string;
};

export function rguhsSubjectIdentity(name: string): string {
  return name.normalize('NFKC').toLowerCase().replace(/&/g, ' and ')
    .replace(/\band\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function rguhsQuestionIdentity(question: string): string {
  return getCleanQuestionText(question).normalize('NFKC').toLowerCase()
    .replace(/^pyq\[[^\]]+\]\s*/i, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[.!?;:]+$/, '').replace(/\s+/g, ' ').trim();
}

export function isRguhsSourceChecked(row: OfflineUniversityQuestion): boolean {
  return ['verified', 'source_page_reviewed', 'reviewed_against_pdf']
    .includes(row.quality_status);
}

function offlineKind(questionType: string): RguhsKind {
  const value = (questionType || '').toLowerCase();
  if (/mcq|multiple.choice|objective/.test(value)) return 'mcq';
  if (/essay|long.answer/.test(value)) return 'essay';
  if (/short|brief|very.short/.test(value)) return 'short-notes';
  return 'other';
}

function rowIdentity(year: YearKey, subject: string, kind: RguhsKind, question: string): string {
  return [year, rguhsSubjectIdentity(subject), kind === 'mcq' ? 'mcq' : 'written',
    rguhsQuestionIdentity(question)].join('|');
}

/**
 * The reviewed bank exists inside the JS bundle; the offline packs are read
 * from native assets only when needed. This also works when an APK pack is
 * missing: reviewed rows remain accessible and the screen reports the error.
 */
export function mergeRguhsQuestions(
  year: YearKey,
  bundled: readonly OfflineUniversityQuestion[],
): RguhsRow[] {
  const map = new Map<string, RguhsRow>();
  const subjects = getSubjects(year, 'rguhs');
  const subjectByName = new Map(subjects.map(subject =>
    [rguhsSubjectIdentity(subject.name), subject]));
  for (const row of bundled) {
    if (row.university !== 'rguhs' || row.year !== year || !row.question_text.trim()) continue;
    const match = subjectByName.get(rguhsSubjectIdentity(row.subject));
    const kind = offlineKind(row.question_type);
    const id = rowIdentity(year, row.subject, kind, row.question_text);
    const existing = map.get(id);
    // A repeated extraction is one question, but prefer a source-checked
    // occurrence or a previously completed one when selecting its identity.
    if (existing) {
      // Verification and completion are independent. The best source record
      // need not carry the same raw wording/ID as the completed question.
      const betterSource = !!existing.offline &&
        isRguhsSourceChecked(row) && !isRguhsSourceChecked(existing.offline);
      const preserveCompletion =
        isQuestionDone(row.question_text) && !isQuestionDone(existing.question);
      if (betterSource || preserveCompletion) {
        map.set(id, {
          ...existing,
          question: preserveCompletion ? row.question_text : existing.question,
          offline: betterSource ? row : existing.offline,
        });
      }
      continue;
    }
    map.set(id, {
      id, year, subjectName: match?.name ?? row.subject,
      subjectKey: match?.key ?? rguhsSubjectIdentity(row.subject).replace(/\s+/g, '-'),
      chapter: row.chapter?.trim() || 'Other', kind,
      question: row.question_text, offline: row,
    });
  }

  for (const hit of allSearchHits('rguhs')) {
    if (hit.year !== year || !hit.question.trim()) continue;
    const kind: RguhsKind = isUniversityMcq(hit.question) ? 'mcq' : hit.type;
    const id = rowIdentity(year, hit.subjectName, kind, hit.question);
    const existing = map.get(id);
    if (existing) {
      // Keep an offline completion if the student already ticked it.
      // Otherwise prefer the reviewed identifier, preserving the old bank's
      // cloud progress and its source/MCQ/repetition metadata.
      const keepOfflineDone = isQuestionDone(existing.question) && !isQuestionDone(hit.question);
      map.set(id, {
        ...existing,
        subjectKey: hit.subjectKey,
        subjectName: hit.subjectName,
        chapter: existing.chapter === 'Other' ? hit.topicName : existing.chapter,
        kind,
        question: keepOfflineDone ? existing.question : hit.question,
        reviewedQuestion: hit.question,
      });
    } else {
      map.set(id, {
        id, year, subjectName: hit.subjectName, subjectKey: hit.subjectKey,
        chapter: hit.topicName, kind, question: hit.question,
        reviewedQuestion: hit.question,
      });
    }
  }
  return [...map.values()];
}
