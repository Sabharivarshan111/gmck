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

function keyFor(noteId: string): string {
  return `${PREFIX}${noteId}`;
}

export async function loadNoteDraft(noteId: string): Promise<NoteDraft | null> {
  try {
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
  try {
    await AsyncStorage.setItem(keyFor(draft.noteId), JSON.stringify(draft));
  } catch {
    // Recovery is best effort. The normal Save path still owns the note.
  }
}

export async function clearNoteDraft(noteId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(noteId));
  } catch {
    // A stale draft is ignored when it is older than a saved note.
  }
}
