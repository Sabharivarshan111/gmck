// Real browser zip/SQLite/zstd operations behind the native import interface.
// Card interpretation and scheduling continue to use the native/shared code.
import { pickFile, keepFile, fileUrl, removeFile } from './files';
import { transaction } from './storage';
import { readApkg, setSqlWasmUrl, downloadApkg } from '@shared/apkgWeb';
import { mediaMap, type ExportPackage } from '@shared/apkgExport';
import { SCHEMA } from './apkg-schema';
import type { ApkgCollection } from '@shared/apkgFormat';
import wasmUrl from '../../../node_modules/sql.js/dist/sql-wasm-browser.wasm?url';

setSqlWasmUrl(wasmUrl);
const packages = new Map<string, { file: File; entries: Record<string, Uint8Array>; collection: ApkgCollection; zstd: boolean }>();
const exports = new Map<string, { bytes: Uint8Array; name: string }>();
function base64(bytes: Uint8Array) { let text = ''; for (let index = 0; index < bytes.length; index += 8192) text += String.fromCharCode(...bytes.subarray(index, index + 8192)); return btoa(text); }
function legacy(collection: ApkgCollection) {
  const models = Object.fromEntries(collection.notetypes.map(type => [type.id, { id: type.id, name: type.name, type: type.cloze ? 1 : 0,
    flds: type.fields.map((name, ord) => ({ name, ord })), tmpls: type.templates.map((template, ord) => ({ ...template, ord })) }]));
  const decks = Object.fromEntries(collection.decks.map(deck => [deck.id, deck]));
  return { legacyModels: JSON.stringify(models), legacyDecks: JSON.stringify(decks) };
}
function get(path: string) { const pkg = packages.get(path); if (!pkg) throw new Error('Choose the Anki package again.'); return pkg; }
async function decode(bytes: Uint8Array, zstd: boolean) { return zstd ? (await import('fzstd')).decompress(bytes) : bytes; }

export default {
  async pick() {
    const file = await pickFile('.apkg,.colpkg'); if (!file) return '';
    const path = crypto.randomUUID();
    const { unzipSync } = await import('fflate');
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const { collection } = await readApkg(file);
    packages.set(path, { file, entries, collection, zstd: !!entries['collection.anki21b'] });
    return JSON.stringify({ path, name: file.name, size: file.size });
  },
  takeLaunchFile: async () => '',
  async survey(path: string) {
    const pkg = get(path); return JSON.stringify({ entries: Object.entries(pkg.entries).map(([name, bytes]) => ({ name, size: bytes.length })), meta: pkg.entries.meta ? base64(pkg.entries.meta) : null });
  },
  async readEntry(path: string, entry: string, zstd: boolean) { const bytes = get(path).entries[entry]; return bytes ? base64(await decode(bytes, zstd)) : ''; },
  async surveyCollection(path: string) {
    const collection = get(path).collection; const counts: Record<string, number> = {};
    for (const card of collection.cards) counts[card.did] = (counts[card.did] ?? 0) + 1;
    return JSON.stringify({ modern: false, notetypes: legacy(collection), decks: collection.decks, deckCounts: counts });
  },
  async readCollection(path: string, _entry: string, _zstd: boolean, deckIds: string, limit: number) {
    const collection = get(path).collection; const selected = new Set(deckIds.split(',').filter(Boolean));
    return JSON.stringify({ schema: collection.schema, notetypes: legacy(collection), decks: collection.decks,
      cards: collection.cards.filter(card => !selected.size || selected.has(card.did)).slice(0, limit) });
  },
  async extractMedia(path: string, deckId: string, plan: string, zstd: boolean) {
    const pkg = get(path); let written = 0; let bytes = 0; let missing = 0;
    const files: Record<string, string> = {};
    for (const item of JSON.parse(plan) as { index: number | string; name: string }[]) {
      const raw = pkg.entries[String(item.index)]; if (!raw) { missing++; continue; }
      const decoded = await decode(raw, zstd);
      const extension = item.name.split('.').pop()?.toLowerCase();
      const mime = ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', mp3: 'audio/mpeg', wav: 'audio/wav' } as Record<string, string>)[extension ?? ''] ?? 'application/octet-stream';
      const name = `media-${item.index}.${extension?.replace(/[^a-z0-9]/g, '') || 'bin'}`;
      await keepFile(new Blob([decoded as BlobPart], { type: mime }), item.name, `anki-${deckId}/${name}`);
      files[item.index] = name; written++; bytes += decoded.length;
    }
    return JSON.stringify({ written, bytes, missing, dir: fileUrl(`anki-${deckId}`), files });
  },
  mediaDir: (deckId: string) => fileUrl(`anki-${deckId}`),
  mediaBytes: () => 0,
  forget(deckId: string) {
    void transaction('files', 'readonly', store => store.getAllKeys()).then(keys => Promise.all(keys.filter(key => String(key).startsWith(`anki-${deckId}/`)).map(key => removeFile(String(key)))));
  },
  discard(path: string) { packages.delete(path); },
  async exportDeck(payload: string) {
    const pkg = JSON.parse(payload) as ExportPackage;
    const [init, { zipSync, strToU8 }] = await Promise.all([import('sql.js'), import('fflate')]);
    const SQL = await init.default({ locateFile: () => wasmUrl }); const db = new SQL.Database();
    try {
      for (const statement of SCHEMA) db.run(statement);
      const now = Date.now();
      db.run("INSERT INTO col VALUES (1,?,?,?,11,0,0,0,?,?,?,?,'{}')", [pkg.crt, now, now, pkg.conf, pkg.models, pkg.decks, pkg.dconf]);
      db.run('BEGIN');
      for (const note of pkg.notes) db.run("INSERT INTO notes VALUES (?,?,?,?,-1,?,?,?,?,0,'')", [note.id, note.guid, note.mid, note.mod, note.tags, note.flds, note.sfld, note.csum]);
      for (const card of pkg.cards) db.run("INSERT INTO cards VALUES (?,?,?,?,?,-1,0,0,?,0,0,0,0,0,0,0,0,'')", [card.id, card.nid, card.did, card.ord, card.mod, card.due]);
      db.run('COMMIT');
      const entries: Record<string, Uint8Array> = { 'collection.anki2': db.export(), media: strToU8(mediaMap(pkg)) };
      for (const item of pkg.media) entries[item.index] = Uint8Array.from(atob(item.base64), character => character.charCodeAt(0));
      const path = crypto.randomUUID(); exports.set(path, { bytes: zipSync(entries), name: pkg.fileName.replace(/\.apkg$/i, '') }); return path;
    } finally { db.close(); }
  },
  async share(path: string) { const item = exports.get(path); if (!item) return false; downloadApkg(item.bytes, item.name); exports.delete(path); return true; },
};
