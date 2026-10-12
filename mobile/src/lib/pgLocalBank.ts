import type { PgQuestion } from './pgEntranceBank';
export type PgOfflinePack = {
  id: string; exam: string; year: number | null; count: number;
  load: () => Promise<{ default: PgQuestion[] }>;
};
export type PgOfflineSearch = {
  exam: string; year: number | null; search: string; limit?: number; offset?: number;
};
/** Public distribution hold: no third-party corpus is imported by this module.
 * Online availability does not establish permission to redistribute questions.
 * Restore only records with documented permission and reviewed provenance.
 */
export function getPgOfflinePacks(): readonly PgOfflinePack[] { return []; }
export async function searchOfflinePgQuestions(_input: PgOfflineSearch):
  Promise<{ questions: PgQuestion[]; total: number; packsScanned: number }> {
  return { questions: [], total: 0, packsScanned: 0 };
}
