export type OfflineUniversity = 'muhs' | 'rguhs';
export type OfflineUniversityYear = 'first-year' | 'second-year' | 'third-year' | 'final-year';
export type OfflineUniversityQuestion = {
  id: string; university: OfflineUniversity; year: OfflineUniversityYear;
  subject: string; chapter: string; question_type: string; question_text: string;
  source_pdf: string; source_page: number | null; exam_dates: string[];
  quality_status: string;
};
export type OfflineUniversityPack = {
  id: string; university: OfflineUniversity; year: OfflineUniversityYear; subject: string;
  count: number; bytes: number; sha256: string;
};
export type OfflineUniversityManifest = {
  schema: number; sourceCounts: Record<string,number>; rawCount: number;
  duplicatesRemoved: number; totals: Record<OfflineUniversity,number>; packs: OfflineUniversityPack[];
};
