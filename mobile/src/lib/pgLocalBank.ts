import type { PgQuestion } from './pgEntranceBank';
import { GENERATED_PG_PACKS } from './pgPacks/generatedManifest';

export type PgOfflinePack = {
  id: string;
  exam: string;
  year: number | null;
  count: number;
  /** A literal dynamic import ensures Vite and Metro bundle the pack at build time. */
  load: () => Promise<{ default: PgQuestion[] }>;
};

export type PgOfflineSearch = {
  exam: string;
  year: number | null;
  search: string;
  limit?: number;
};

const HISTORIC_EXAMS: Record<string, readonly string[]> = {
  ALL: [],
  NEET_PG: ['NEET_PG', 'AIPGMEE'],
  INI_CET: ['INI_CET', 'AIIMS_PG', 'PGIMER_PG', 'JIPMER_PG'],
  FMGE: ['FMGE'],
};

function matchesExam(exam: string, selected: string): boolean {
  return selected === 'ALL' || exam === selected ||
    (HISTORIC_EXAMS[selected]?.includes(exam) ?? false);
}

function isValidQuestion(q: PgQuestion): boolean {
  return typeof q.id === 'string' && !!q.id &&
    typeof q.question === 'string' && q.question.trim().length > 8 &&
    Array.isArray(q.options) && q.options.length === 4 &&
    q.options.every(o => typeof o === 'string' && o.trim()) &&
    /^[ABCD]$/.test(q.answer) && typeof q.explanation === 'string' &&
    q.explanation.trim().length >= 20 &&
    typeof q.answer_reference === 'string' && q.answer_reference.trim().length > 0 &&
    typeof q.source_url === 'string' && q.source_url.trim().length > 0 &&
    ['historical_dataset', 'verified_pyq', 'recalled', 'original_exam_style'].includes(q.record_type || '');
}

export function getPgOfflinePacks(): readonly PgOfflinePack[] {
  return GENERATED_PG_PACKS;
}

/**
 * Local code/assets ONLY; no Supabase and no HTTP.
 *
 * The source archive is copied into the Android APK/Metro bundle and into
 * Vercel's static JS chunks during build. A request loads matching packs on
 * demand rather than putting every question in JS memory at Notes startup.
 *
 * The query counts all matching rows while holding at most "limit" results
 * in React state. This is important for eventual 100k+ local collections.
 */
export async function searchOfflinePgQuestions(input: PgOfflineSearch):
  Promise<{ questions: PgQuestion[]; total: number; packsScanned: number }> {
  const limit = Math.max(1, Math.min(250, input.limit ?? 60));
  const query = input.search.trim().toLocaleLowerCase();
  const result: PgQuestion[] = [];
  const seen = new Set<string>();
  let total = 0;
  let packsScanned = 0;

  for (const pack of GENERATED_PG_PACKS) {
    if (!matchesExam(pack.exam, input.exam)) continue;
    if (input.year !== null && pack.year !== null && input.year !== pack.year) continue;

    // Static import targets are enumerated in generatedManifest; app never
    // downloads arbitrary external JSON files or relies on a cloud database.
    const module = await pack.load();
    packsScanned += 1;
    for (const q of module.default || []) {
      if (!isValidQuestion(q)) continue;
      if (!matchesExam(q.exam, input.exam)) continue;
      if (input.year !== null && q.year !== input.year) continue;
      if (query && ![q.question, q.subject, q.explanation].join(' ').toLocaleLowerCase().includes(query)) continue;
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      total += 1;
      if (result.length < limit) result.push(q);
    }
  }
  return { questions: result, total, packsScanned };
}
