export type CollectedUniversity = 'rguhs' | 'knruhs' | 'muhs' | 'ntruhs' | 'wbuhs';

export interface ReviewedUniversityQuestion {
  id: string;
  university: CollectedUniversity;
  year: 'first' | 'second' | 'third' | 'final';
  subjectKey: string;
  topicKey: string;
  kind: 'essay' | 'short-notes';
  question: string;
  examRefs: string[];
  pdfPage: number;
  sourceSha256: string;
  sourceQuestion: string;
  marks: number;
  originalSection: string;
}
