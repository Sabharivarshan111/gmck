import {createOfflineReader} from '@shared/neetPgOffline';
import type {InstalledReader} from '@shared/neetPgInstall';

export type RecallExam = 'aiims-pg' | 'ini-cet';
const pending: Partial<Record<RecallExam, Promise<InstalledReader>>> = {};
export function loadBundledRecallBank(exam: RecallExam): Promise<InstalledReader> {
  const cached = pending[exam];
  if (cached) return cached;
  const data = exam === 'aiims-pg' ? import('./aiimsPgBank.json') : import('./iniCetBank.json');
  const result = data.then(({default: bank}) => ({
    file: {fileId: bank.id, name: exam === 'aiims-pg' ? 'AIIMS PG' : 'INI-CET', size: 0},
    reader: createOfflineReader(bank),
  })).catch(error => {delete pending[exam]; throw error;});
  pending[exam] = result;
  return result;
}
