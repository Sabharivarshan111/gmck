import AsyncStorage from '@react-native-async-storage/async-storage';
import OrbitFiles from '@/native/NativeOrbitFiles';

/**
 * PDF pages, rendered to pictures so they can be drawn on.
 *
 * ## Why annotating a PDF is drawing on a picture
 *
 * The app already has a canvas that does pen, highlighter, two erasers, a
 * colour wheel and real palm rejection, and it already draws on a photograph.
 * A PDF page IS a photograph once something has rendered it, so the whole
 * annotation half of this feature is `DrawCanvas` with a different picture
 * underneath.
 *
 * What it deliberately does NOT do is edit the PDF file. The bytes are never
 * touched. A reader's lecture handout stays exactly as their professor sent
 * it, and the marks live beside it — which is also the only version of this
 * that can be undone.
 *
 * ## It costs no dependency
 *
 * `android.graphics.pdf.PdfRenderer` has been in Android since API 21, and
 * `FilesModule` calls it. Every PDF library on npm is megabytes per ABI for a
 * job the platform already does.
 *
 * ## The ink is stored per page, not per document
 *
 * `orbit:pdf-ink:{fileId}:{page}`, the same shape the handwritten pages use.
 * One key per document would mean loading every mark in a fifty-page handout
 * to show page one, and rewriting all of them to save a circle.
 */

const INK_PREFIX = 'orbit:pdf-ink:';

const inkKey = (fileId: string, page: number) => `${INK_PREFIX}${fileId}:${page}`;

/** How many pages, or 0 when the file will not open. */
export async function pdfPageCount(fileId: string): Promise<number> {
  if (!OrbitFiles) {
    return 0;
  }
  try {
    return await OrbitFiles.pdfPageCount(fileId);
  } catch {
    return 0;
  }
}

/**
 * A `file://` path to one page, rendered at `width` device pixels.
 *
 * Null rather than a throw when it cannot be drawn: a handout that Android's
 * renderer refuses is a fact about the file, and the screen says so instead of
 * dying on a promise nobody caught.
 */
export async function pdfPageImage(
  fileId: string,
  page: number,
  width: number,
): Promise<string | null> {
  if (!OrbitFiles) {
    return null;
  }
  try {
    const path = await OrbitFiles.renderPdfPage(fileId, page, Math.round(width));
    return path || null;
  } catch {
    return null;
  }
}

export async function loadPdfInk(fileId: string, page: number): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(inkKey(fileId, page));
  } catch {
    return null;
  }
}

export async function savePdfInk(
  fileId: string,
  page: number,
  ink: string | null,
): Promise<void> {
  try {
    if (!ink) {
      // An erased page is not a page with empty marks on it. Storing "[]"
      // would leave a key per page of every handout anybody ever opened.
      await AsyncStorage.removeItem(inkKey(fileId, page));
      return;
    }
    await AsyncStorage.setItem(inkKey(fileId, page), ink);
  } catch {
    // The session keeps what is on screen; losing a save is better than
    // losing the screen.
  }
}

/**
 * Which pages of a document carry marks.
 *
 * Read from the keys rather than from a stored list, so it cannot disagree
 * with what is actually there — the same reason the XP milestones are read
 * from the crossing rather than from a record of what was announced.
 */
export async function annotatedPages(fileId: string): Promise<number[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `${INK_PREFIX}${fileId}:`;
    return keys
      .filter(key => key.startsWith(prefix))
      .map(key => Number(key.slice(prefix.length)))
      .filter(page => Number.isFinite(page))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/**
 * Forget every mark on a document.
 *
 * Called when the file it belongs to is detached, because ink pointing at a
 * document nobody can open is space the reader can only see as "Orbit is using
 * 400MB" — the same rule the note media already follows.
 */
export async function forgetPdfInk(fileId: string): Promise<void> {
  try {
    const pages = await annotatedPages(fileId);
    // One at a time: the preview harness's AsyncStorage shim has no
    // `multiRemove`, and a handout has pages, not thousands of them.
    await Promise.all(pages.map(page => AsyncStorage.removeItem(inkKey(fileId, page))));
  } catch {
    // Nothing to forget, or storage is unavailable.
  }
}
