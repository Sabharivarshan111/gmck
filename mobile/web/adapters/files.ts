import { transaction } from './storage';
export interface StoredFile { blob: Blob; name: string; size: number; mime: string }
const records = new Map<string, StoredFile>();
const urls = new Map<string, string>();
export async function hydrateFiles() {
  const keys = await transaction('files', 'readonly', store => store.getAllKeys());
  for (const key of keys) {
    const record = await transaction('files', 'readonly', store => store.get(key)) as StoredFile;
    records.set(String(key), record);
  }
}
export function pickFile(accept = ''): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept; input.style.display = 'none'; document.body.append(input);
    const done = (file: File | null) => { input.remove(); resolve(file); };
    input.onchange = () => done(input.files?.[0] ?? null);
    input.addEventListener('cancel', () => done(null), { once: true });
    input.click();
  });
}
export async function keepFile(blob: Blob, name: string, id: string = crypto.randomUUID()): Promise<string> {
  const record = { blob, name, size: blob.size, mime: blob.type };
  await transaction('files', 'readwrite', store => store.put(record, id));
  records.set(id, record);
  return id;
}
export function fileUrl(id: string) {
  // Stable URLs are resolved locally by the service worker, including after reload.
  return `${location.origin}/_orbit/files/${id.split('/').map(encodeURIComponent).join('/')}`;
}
export function pathFor(id: string) {
  const record = records.get(id);
  if (!record) return '';
  if (!urls.has(id)) urls.set(id, URL.createObjectURL(record.blob));
  return urls.get(id)!;
}
export function removeFile(id: string) {
  records.delete(id); if (urls.has(id)) URL.revokeObjectURL(urls.get(id)!); urls.delete(id);
  return transaction('files', 'readwrite', store => store.delete(id));
}
const files = {
  async pick(_mode: string, kinds: string) {
    // Browsers cannot retain arbitrary paths. Both picker modes keep a private copy.
    const file = await pickFile(kinds === 'audio' ? 'audio/*' : kinds || '');
    if (!file) return '';
    const id = await keepFile(file, file.name);
    return JSON.stringify({ id, name: file.name, size: file.size, mime: file.type, linked: false });
  },
  async adopt(uri: string) {
    const response = await fetch(uri); if (!response.ok) throw new Error('File is unavailable.');
    const blob = await response.blob(); const id = await keepFile(blob, 'Attachment');
    return JSON.stringify({ id, name: 'Attachment', mime: blob.type, size: blob.size, linked: false });
  },
  linkStatus: (uri: string) => uri.startsWith('blob:') ? 'ok' : 'missing',
  release: () => {}, pathFor,
  remove: (id: string) => { void removeFile(id); },
  totalBytes: () => [...records.values()].reduce((total, file) => total + file.size, 0),
  async audioInfo(id: string) {
    const record = records.get(id); if (!record) return '';
    const audio = new Audio(pathFor(id));
    const durationMs = await new Promise<number>(resolve => {
      const timer = setTimeout(() => resolve(0), 5000);
      audio.onloadedmetadata = () => { clearTimeout(timer); resolve(Number.isFinite(audio.duration) ? audio.duration * 1000 : 0); };
      audio.onerror = () => { clearTimeout(timer); resolve(0); };
    });
    audio.removeAttribute('src'); audio.load();
    return JSON.stringify({ title: record.name.replace(/\.[^.]+$/, ''), artist: '', album: '', durationMs, artwork: '' });
  },
  async openExternal(idOrUri: string) {
    const record = records.get(idOrUri);
    const controlled = !!navigator.serviceWorker?.controller;
    const uri = record ? (controlled ? fileUrl(idOrUri) : pathFor(idOrUri)) : idOrUri;
    if (!record && !/^https?:\/\//i.test(uri)) return false;
    // Private HTML/SVG must not execute with the app's origin. The service
    // worker adds a sandbox CSP; before it controls the page, download files
    // that are not a browser PDF/audio/video/raster viewer format.
    if (record && !controlled && !/^(application\/pdf|audio\/|video\/|image\/(png|jpeg|gif|webp|avif))/i.test(record.mime)) {
      const link = document.createElement('a'); link.href = uri; link.download = record.name; link.click(); return true;
    }
    // `noopener` makes window.open return null even after a successful open.
    // Obtain the blank window first so failures report accurately, then
    // sever its opener before navigating to the sandboxed/private file.
    const tab = window.open('about:blank', '_blank'); if (!tab) return false;
    tab.opener = null; tab.location.href = uri; return true;
  },
  async renderPdf(idOrUri: string, maxPages: number) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    const uri = pathFor(idOrUri) || idOrUri;
    const task = pdfjs.getDocument({ url: uri });
    const pdf = await task.promise;
    try {
      const pages = [];
      for (let index = 1; index <= Math.min(pdf.numPages, maxPages); index++) {
        const page = await pdf.getPage(index); const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
        pages.push({ page: index, width: canvas.width, height: canvas.height, uri: canvas.toDataURL('image/png') });
        page.cleanup();
      }
      return JSON.stringify({ pageCount: pdf.numPages, renderedCount: pages.length, pages });
    } finally { await task.destroy(); }
  },
};
export default files;
