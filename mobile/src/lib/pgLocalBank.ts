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
  offset?: number;
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
    (q.explanation.trim().length >= 20 ||
      (q.record_type === 'historical_dataset' && q.answer_reference?.includes('not independently') === true)) &&
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
  const limit = Math.max(1, Math.min(100, input.limit ?? 50));
  const offset = Math.max(0, Math.min(1000000, input.offset ?? 0));
  const query = input.search.trim().toLocaleLowerCase();
  // No-query browsing uses audited manifest counts. Do NOT deserialize hundreds
  // of thousands of questions on every page turn or first Notes open.
  if (!query) {
    const eligible = GENERATED_PG_PACKS.filter(pack =>
      matchesExam(pack.exam, input.exam) &&
      (input.year === null || pack.year === input.year));
    const total = eligible.reduce((n, pack) => n + pack.count, 0);
    const questions: PgQuestion[] = [];
    let cursor = 0;
    let scanned = 0;
    for (const pack of eligible) {
      const end = cursor + pack.count;
      if (end <= offset) { cursor = end; continue; }
      if (cursor >= offset + limit || questions.length >= limit) break;
      // A single pack is loaded at most once per visible page; bundler
      // code-splits the others for native Android and Safari/Vercel.
      const module = await pack.load();
      scanned++;
      for (let i = Math.max(0, offset - cursor);
        i < module.default.length && questions.length < limit; i++) {
        const q = module.default[i];
        if (!isValidQuestion(q)) continue;
        questions.push(q);
      }
      cursor = end;
    }
    return { questions, total, packsScanned: scanned };
  }
  const result: PgQuestion[] = [];
  const seen = new Set<string>();
  let total = 0;
  let packsScanned = 0;

  for (const pack of GENERATED_PG_PACKS) {
    if (!matchesExam(pack.exam, input.exam)) continue;
    if (input.year !== null && pack.year !== input.year) continue;

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
      if (total > offset && result.length < limit) result.push(q);
    }
  }
  return { questions: result, total, packsScanned };
}
