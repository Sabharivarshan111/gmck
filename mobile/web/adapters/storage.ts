// IndexedDB holds study data and large decks. Existing web localStorage keys
// remain readable; write failures propagate rather than pretending to persist.
export const DB_NAME = 'orbit-browser-v1';
let database: Promise<IDBDatabase> | undefined;
export function openDatabase() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('strings');
      request.result.createObjectStore('files');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function transaction<T>(store: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = operation(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Browser storage is unavailable.'));
  });
}
const storage = {
  async getItem(key: string) {
    const saved = await transaction('strings', 'readonly', store => store.get(key));
    if (typeof saved === 'string') return saved;
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    await transaction('strings', 'readwrite', store => store.put(value, key));
    // Small shared records remain visible to the unchanged simulator shell.
    if (value.length < 100_000) try { localStorage.setItem(key, value); } catch { /* IDB is authoritative */ }
  },
  async removeItem(key: string) {
    await transaction('strings', 'readwrite', store => store.delete(key));
    localStorage.removeItem(key);
  },
  async getMany(keys: string[]) { return Object.fromEntries(await Promise.all(keys.map(async key => [key, await storage.getItem(key)]))); },
  async setMany(values: Record<string, string>) {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('strings', 'readwrite');
      for (const [key, value] of Object.entries(values)) tx.objectStore('strings').put(value, key);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  },
  async removeMany(keys: string[]) { await Promise.all(keys.map(key => storage.removeItem(key))); },
  async getAllKeys() { return [...new Set([...(await transaction('strings', 'readonly', store => store.getAllKeys())).map(String), ...Object.keys(localStorage)])]; },
  async clear() { await transaction('strings', 'readwrite', store => store.clear()); localStorage.clear(); },
};
export default storage;
