import { QUESTION_BANK_DATA } from './questionBankData';
import { KUHS_REVIEW_BANK_DATA } from './kuhs/questionBankData';
import { COLLECTED_BANKS } from './universityPapers/questionBankData';
import { stripKuhsQuestionMarker } from '../lib/university';

type Node = { name?: string; questions?: string[]; subtopics?: Record<string, Node> };
let cached: Record<string, Node> | undefined;
/** Full stems/options must match. Never merge a clinical value or choice away.
 * Original banks and provenance-bearing question IDs remain unchanged. */
export function mergedQuestionIdentity(question: string): string {
  return stripKuhsQuestionMarker(question).replace(/^\d+\.\s*/, '')
    .replace(/[*★☆⭐]/g, '').replace(/\((?:Pg\.No|Page No):[^)]*\)/gi, '')
    .replace(/\(((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2,4}[,;]?\s*)+)\)/gi, '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}
export function getOtherUniversityBank(): Record<string, Node> {
  if (cached) return cached;
  const out: Record<string, Node> = {};
  const seen = new Set<string>();
  function merge(target: Node, source: Node, path: string[]) {
    target.name ??= source.name;
    if (source.questions) {
      target.questions ??= [];
      for (const question of source.questions) {
        const key = path.slice(0, 2).join('/') + '/' + path.at(-1) + '/' + mergedQuestionIdentity(question);
        if (!seen.has(key)) { seen.add(key); target.questions.push(question); }
      }
    }
    for (const [key, child] of Object.entries(source.subtopics ?? {})) {
      target.subtopics ??= {};
      merge(target.subtopics[key] ??= {}, child, [...path, key]);
    }
  }
  for (const bank of [QUESTION_BANK_DATA, COLLECTED_BANKS.rguhs, KUHS_REVIEW_BANK_DATA]) {
    for (const [year, node] of Object.entries(bank)) merge(out[year] ??= {}, node as Node, [year]);
  }
  cached = out;
  return out;
}
