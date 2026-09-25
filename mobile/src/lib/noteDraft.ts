import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NoteFile } from '@/lib/noteFiles';
import type { NoteLink } from '@/lib/noteLinks';

/**
 * Crash-safe, device-only note drafts.
 *
 * A draft is deliberately separate from the saved note: closing the editor
 * should not silently publish half-written text into the notes list, but an
 * Activity recreation, WebView interruption, process kill, or accidental back
 * press must not erase what was being written either.
 */
export interface NoteDraft {
  noteId: string;
  savedAt: number;
  title: string;
  content: string;
  subject: string | null;
  chapterKey: string | null;
  chapterName: string | null;
  images: string[];
  files: NoteFile[];
  font: string | null;
  sheets: string[];
  links: NoteLink[];
}

const PREFIX = 'orbit:user-note-draft:v1:';
// Multiple rapid edits and a Save may overlap across the native bridge.
// Serialize operations for each note so a late autosave cannot recreate a
// draft after Save has removed it.
const pending = new Map<string, Promise<void>>();

function inOrder(noteId: string, write: () => Promise<void>): Promise<void> {
  const previous = pending.get(noteId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(write);
  pending.set(noteId, current);
  void current.finally(() => {
    if (pending.get(noteId) === current) pending.delete(noteId);
  }).catch(() => undefined);
  return current;
}

function keyFor(noteId: string): string {
  return `${PREFIX}${noteId}`;
}

export async function loadNoteDraft(noteId: string): Promise<NoteDraft | null> {
  try {
    // Closing and immediately reopening the editor must see its last queued
    // write, rather than an older draft still in AsyncStorage.
    await pending.get(noteId)?.catch(() => undefined);
    const raw = await AsyncStorage.getItem(keyFor(noteId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NoteDraft>;
    if (
      parsed.noteId !== noteId ||
      typeof parsed.savedAt !== 'number' ||
      typeof parsed.title !== 'string' ||
      typeof parsed.content !== 'string'
    ) {
      return null;
    }
    return {
      noteId,
      savedAt: parsed.savedAt,
      title: parsed.title,
      content: parsed.content,
      subject: typeof parsed.subject === 'string' ? parsed.subject : null,
      chapterKey: typeof parsed.chapterKey === 'string' ? parsed.chapterKey : null,
      chapterName: typeof parsed.chapterName === 'string' ? parsed.chapterName : null,
      images: Array.isArray(parsed.images)
        ? parsed.images.filter((value): value is string => typeof value === 'string')
        : [],
      files: Array.isArray(parsed.files) ? (parsed.files as NoteFile[]) : [],
      font: typeof parsed.font === 'string' ? parsed.font : null,
      sheets: Array.isArray(parsed.sheets)
        ? parsed.sheets.filter((value): value is string => typeof value === 'string')
        : [],
      links: Array.isArray(parsed.links) ? (parsed.links as NoteLink[]) : [],
    };
  } catch {
    return null;
  }
}

export async function saveNoteDraft(draft: NoteDraft): Promise<void> {
  return inOrder(draft.noteId, () =>
    AsyncStorage.setItem(keyFor(draft.noteId), JSON.stringify(draft)),
  );
}

export async function clearNoteDraft(noteId: string): Promise<void> {
  return inOrder(noteId, () => AsyncStorage.removeItem(keyFor(noteId)));
}
