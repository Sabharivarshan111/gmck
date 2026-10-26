export type CollectedUniversity = 'rguhs' | 'knruhs' | 'muhs' | 'ntruhs' | 'wbuhs';

export interface ReviewedUniversityQuestion {
  id: string;
  university: CollectedUniversity;
  year: 'first' | 'second' | 'third' | 'final';
  subjectKey: string;
  topicKey: string;
  /** Legacy navigation bucket; originalSection/questionFormat retain the actual exam format. */
  kind: 'essay' | 'short-notes';
  questionFormat?: 'mcq' | 'long-answer' | 'short-answer' | 'very-short-answer';
  options?: { label: string; text: string }[];
  question: string;
  examRefs: string[];
  pdfPage: number;
  sourceSha256: string;
  sourceQuestion: string;
  marks: number;
  originalSection: string;
  paperNumber?: string;
}
