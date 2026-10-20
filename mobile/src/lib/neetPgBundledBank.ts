import { createOfflineReader } from '@shared/neetPgOffline';
import type { InstalledReader } from '@shared/neetPgInstall';

let bundled: Promise<InstalledReader> | undefined;
export function loadBundledNeetBank(): Promise<InstalledReader> {
  return bundled ??= Promise.all([import('./neetPgBank.json'), import('./neetPgImages0.json'), import('./neetPgImages1.json'), import('./neetPgImages2.json'), import('./neetPgImages3.json')]).then(([{ default: bank }, ...parts]) => ({
    file: { fileId: 'bundled-neet-pg-v1', name: 'NEET-PG', size: 0 },
    reader: createOfflineReader({ ...bank, images: Object.assign({}, ...parts.map(part => part.default)) }),
  })).catch(error => { bundled = undefined; throw error; });
}
