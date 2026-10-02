export interface StringStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Serialize per-key migration/refresh/sign-out so an old read cannot resurrect a session. */
export function createSecureStorage(secure: StringStorage, legacy: StringStorage): StringStorage {
  const pending = new Map<string, Promise<unknown>>();
  function ordered<T>(key: string, work: () => Promise<T>): Promise<T> {
    const next = (pending.get(key) ?? Promise.resolve()).catch(() => undefined).then(work);
    pending.set(key, next);
    void next.finally(() => {
      if (pending.get(key) === next) pending.delete(key);
    }).catch(() => undefined);
    return next;
  }
  return {
    getItem: key => ordered(key, async () => {
      const encrypted = await secure.getItem(key);
      if (encrypted !== null) {
        // Retry cleanup if an earlier successful migration could not remove the old copy.
        await legacy.removeItem(key).catch(() => undefined);
        return encrypted;
      }
      const previous = await legacy.getItem(key);
      if (previous === null) return null;
      try {
        await secure.setItem(key, previous);
        if (await secure.getItem(key) !== previous) throw new Error('Encrypted storage verification failed');
      } catch {
        // This slot was empty before migration. Remove an incomplete/new bad
        // copy, retaining the original session for a later migration retry.
        await secure.removeItem(key).catch(() => undefined);
        // Keep an existing session usable if migration fails; retry next read.
        // New sessions and refreshed tokens never fall back to plaintext writes.
        return previous;
      }
      await legacy.removeItem(key).catch(() => undefined);
      return previous;
    }),
    setItem: (key, value) => ordered(key, async () => {
      await secure.setItem(key, value);
      if (await secure.getItem(key) !== value) throw new Error('Encrypted storage verification failed');
      await legacy.removeItem(key);
    }),
    removeItem: key => ordered(key, async () => {
      // Delete old plaintext first so sign-out cannot remigrate it on a later read.
      await legacy.removeItem(key);
      await secure.removeItem(key);
    }),
  };
}
