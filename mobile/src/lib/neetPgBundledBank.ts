import { createOfflineReader } from '@shared/neetPgOffline';
import type { InstalledReader } from '@shared/neetPgInstall';

let bundled: Promise<InstalledReader> | undefined;
export function loadBundledNeetBank(): Promise<InstalledReader> {
  return bundled ??= import('./neetPgBank.json').then(({ default: bank }) => ({
    file: { fileId: 'bundled-neet-pg-v1', name: 'NEET-PG', size: 0 },
    reader: createOfflineReader(bank),
  })).catch(error => { bundled = undefined; throw error; });
}
