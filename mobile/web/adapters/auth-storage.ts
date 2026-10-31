type AsyncStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

/** Both browser bundles must see the same rotating refresh token. IndexedDB
 * is only a migration/fallback source, never a second authoritative copy.
 * The marker also prevents an old IDB token resurrecting after legacy logout.
 */
export function createBrowserAuthStorage(browser: () => Storage, previous: AsyncStore): AsyncStore {
  const marker = (key: string) => `orbit:auth-local-v1:${key}`;
  return {
    async getItem(key) {
      try {
        const value = browser().getItem(key);
        if (value !== null) {
          browser().setItem(marker(key), '1');
          return value;
        }
        if (browser().getItem(marker(key))) return null;
      } catch { return previous.getItem(key); }
      const old = await previous.getItem(key);
      if (old !== null) {
        // No token existed in localStorage: migrate an IDB-only installation.
        // Recheck after the async read so another tab's sign-in wins.
        try {
          const current = browser().getItem(key);
          if (current !== null || browser().getItem(marker(key))) return current;
          browser().setItem(key, old);
          browser().setItem(marker(key), '1');
        } catch { /* IDB remains the durable fallback. */ }
      }
      return old;
    },
    async setItem(key, value) {
      try {
        browser().setItem(key, value);
        browser().setItem(marker(key), '1');
      } catch { await previous.setItem(key, value); }
    },
    async removeItem(key) {
      let removed = false;
      try {
        browser().removeItem(key);
        browser().setItem(marker(key), '1');
        removed = true;
      } catch { /* Try the durable fallback. */ }
      try { await previous.removeItem(key); }
      catch (error) { if (!removed) throw error; }
    },
  };
}

export const isBrowserAuthKey = (key: string) => /^sb-.+-auth-token(?:$|-)/.test(key);
