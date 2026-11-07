/**
 * WBUHS has a reviewed bank bundled in JS, plus second/third-year OCR rows in
 * Supabase. Cache successful OCR downloads for real subsequent offline access.
 * A failing network request never removes the reviewed, bundled questions.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { YearKey } from './questionBank';
import type { UniversityOcrQuestion } from './rguhsUnifiedBank';

const YEAR_SUBJECTS: Partial<Record<YearKey, readonly string[]>> = {
  'second-year': ['Pharmacology', 'Microbiology', 'Pathology'],
  'third-year': ['Community Medicine', 'Forensic Medicine'],
};

const CACHE_PREFIX = 'orbit:wbuhs-ocr:';
const PAGE = 250;
const MAX_ITEMS_PER_SUBJECT = 10000;

type WbuhsDbRow = {
  id: string;
  subject: string;
  chapter: string | null;
  question_type: string;
  question_text: string;
  source_pdf: string | null;
  source_page: number | null;
  quality_status: string | null;
  exam_dates: string[] | null;
};

export type WbuhsLoadResult = {
  rows: UniversityOcrQuestion[];
  failures: string[];
  cachedSubjects: number;
  downloadedSubjects: number;
};

function normalizeRows(year: YearKey, subject: string, rows: WbuhsDbRow[]): UniversityOcrQuestion[] {
  return rows.filter(row => row && typeof row.question_text === 'string' && row.question_text.trim())
    .map(row => ({
      id: row.id,
      university: 'wbuhs' as const,
      year,
      subject,
      chapter: row.chapter?.trim() || 'Other',
      question_type: row.question_type || 'unknown',
      question_text: row.question_text,
      source_pdf: row.source_pdf || '',
      source_page: row.source_page,
      exam_dates: Array.isArray(row.exam_dates) ? row.exam_dates : [],
      quality_status: row.quality_status || 'ocr_unverified',
    }));
}

async function getSaved(year: YearKey, subject: string): Promise<WbuhsDbRow[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + year + ':' + subject);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(row => !!row && typeof row.question_text === 'string')
      ? parsed as WbuhsDbRow[] : null;
  } catch { return null; }
}

async function downloadSubject(year: YearKey, subject: string): Promise<WbuhsDbRow[]> {
  const rows: WbuhsDbRow[] = [];
  for (let start = 0; start < MAX_ITEMS_PER_SUBJECT; start += PAGE) {
    const { data, error } = await supabase
      .from('wbuhs_second_third_questions')
      .select('id,subject,chapter,question_type,question_text,source_pdf,source_page,exam_dates,quality_status')
      .eq('university', 'WBUHS')
      .eq('study_year', year)
      .eq('subject', subject)
      .order('source_page')
      .order('id')
      .range(start, start + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as WbuhsDbRow[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return [...new Map(rows.map(row => [row.id, row])).values()];
}

export async function loadWbuhsOcrYear(year: YearKey, forceRefresh = false): Promise<WbuhsLoadResult> {
  const subjects = YEAR_SUBJECTS[year] ?? [];
  const outcomes = await Promise.all(subjects.map(async subject => {
    let cached = await getSaved(year, subject);
    if (cached && !forceRefresh) return { subject, rows: cached, fromCache: true, failure: '' };
    try {
      const fresh = await downloadSubject(year, subject);
      await AsyncStorage.setItem(CACHE_PREFIX + year + ':' + subject, JSON.stringify(fresh)).catch(() => undefined);
      return { subject, rows: fresh, fromCache: false, failure: '' };
    } catch (error) {
      // Use the last successful downloaded revision if refresh is offline.
      cached ??= await getSaved(year, subject);
      return {
        subject,
        rows: cached ?? [],
        fromCache: !!cached,
        failure: !cached ? subject + ': ' + (error instanceof Error ? error.message : 'unavailable') : '',
      };
    }
  }));
  return {
    rows: outcomes.flatMap(result => normalizeRows(year, result.subject, result.rows)),
    failures: outcomes.filter(result => result.failure).map(result => result.failure),
    cachedSubjects: outcomes.filter(result => result.fromCache).length,
    downloadedSubjects: outcomes.filter(result => !result.fromCache && !result.failure).length,
  };
}
