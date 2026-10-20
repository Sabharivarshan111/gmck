import { createOfflineReader, validateOfflineBank, type OfflineBank } from './neetPgOffline';

export type InstalledBank = { fileId: string; name: string; size: number };
export type BankInstallPort = {
  readPointer(): Promise<string | null>;
  writePointer(value: string): Promise<void>;
  pick(): Promise<InstalledBank | null>;
  read(fileId: string): Promise<string>;
  remove(fileId: string): Promise<void>;
};
export type InstalledReader = { file: InstalledBank; reader: ReturnType<typeof createOfflineReader> };

export function createBankInstaller(port: BankInstallPort, checkChapters: (bank: OfflineBank) => void | Promise<void>) {
  let busy = false;
  const pointer = async (): Promise<InstalledBank[]> => {
    const value: unknown = JSON.parse(await port.readPointer() ?? '[]');
    if (!Array.isArray(value) || value.length > 2 || value.some(v => !v || typeof v.fileId !== 'string' || !v.fileId || typeof v.name !== 'string' || !Number.isFinite(v.size) || v.size < 0)) throw new Error('Offline bank index is invalid.');
    return value;
  };
  const read = async (file: InstalledBank): Promise<InstalledReader> => {
    const bank: unknown = JSON.parse(await port.read(file.fileId));
    validateOfflineBank(bank);
    await checkChapters(bank);
    return { file, reader: createOfflineReader(bank) };
  };
  return {
    async load(): Promise<InstalledReader | null> {
      const files = await pointer();
      for (const file of files) {
        try { return await read(file); } catch { /* A previous complete installation can still be read. */ }
      }
      if (files.length) throw new Error('The installed bank cannot be read. Install a complete replacement to continue.');
      return null;
    },
    async install(): Promise<InstalledReader | null> {
      if (busy) throw new Error('A bank installation is already in progress.');
      busy = true;
      let picked: InstalledBank | null = null;
      let committed = false;
      try {
        const old = await pointer();
        picked = await port.pick();
        if (!picked) return null;
        if (old.some(file => file.fileId === picked!.fileId)) throw new Error('The picker must create a new private copy.');
        const loaded = await read(picked);
        let previous = old[0];
        for (const file of old) {
          try { await read(file); previous = file; break; } catch { /* Keep the readable fallback when the active file is damaged. */ }
        }
        // One small pointer write is the commit; never remove the old file first.
        await port.writePointer(JSON.stringify([picked, ...(previous ? [previous] : [])]));
        committed = true;
        for (const file of old.filter(item => item.fileId !== previous?.fileId)) await port.remove(file.fileId).catch(() => {});
        return loaded;
      } finally {
        if (picked && !committed) {
          // If the pointer cannot be reread, keep the copy: the commit might
          // have succeeded before a storage error was reported.
          const old = await pointer().catch(() => null);
          if (old && !old.some(file => file.fileId === picked!.fileId)) await port.remove(picked.fileId).catch(() => {});
        }
        busy = false;
      }
    },
  };
}
