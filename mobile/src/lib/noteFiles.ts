import OrbitFiles from '@/native/NativeOrbitFiles';
import { warn } from './log';

/**
 * Videos, recordings and PDFs kept beside a personal study note.
 *
 * **On this phone, and nowhere else** — the same rule the note pictures follow
 * and for the same reason. A lecture recording, a scan of somebody's own
 * textbook, a video of a procedure from a ward round: none of it is this app's
 * to keep a server copy of. `npm run check:cloud-ids` fails if this file so
 * much as imports the Supabase client.
 *
 * **A file on disk, not bytes in a database.** Pictures live in AsyncStorage,
 * one key each, which is right for a downscaled photograph and hopeless for a
 * forty-megabyte video: the same store also holds the note list, and base64
 * inflates by a third before it gets there. These are copied into the app's own
 * `filesDir/note-media/` by the native side and the note stores a small record.
 *
 * **No cap, deliberately.** Not on the size of one and not on how many. They
 * sit on the reader's own phone in the app's own storage, and the only limit is
 * the free space on the device, which is theirs to spend. A number invented
 * here would be this app deciding how much of somebody's own recording of
 * their own lecture they are allowed to keep. The trade is stated in the UI, as
 * it is for the pictures: reinstall the app or lose the phone and these go too.
 */

const native = OrbitFiles ?? undefined;

/** Whether this build can keep files at all. False in the preview harness. */
export const noteFilesAvailable = native != null;

export type NoteFileKind = 'image' | 'video' | 'audio' | 'pdf' | 'file';

export interface NoteFile {
  /** The file's name inside the app's own media directory. */
  id: string;
  /** What it was called where it came from, for the reader to recognise. */
  name: string;
  mime: string;
  size: number;
}

/** What the note renderer should do with it. */
export function kindOf(file: NoteFile): NoteFileKind {
  const mime = file.mime.toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  return 'file';
}

/**
 * Bytes as something a person reads.
 *
 * Shown per attachment rather than totalled into a budget: there is no budget.
 * It is there so a reader deciding whether to keep a 300 MB video on a phone
 * with 2 GB free can see what they are deciding about.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Open the picker and keep whatever comes back.
 *
 * Null means cancelled — the commonest outcome and not worth a message.
 * `error` means it failed, which is worth one: a file that looked like it
 * attached and did not is the failure this returns rather than swallows.
 */
export async function attachNoteFile(): Promise<
  { file: NoteFile } | { error: string } | null
> {
  if (!native) {
    return { error: 'This build cannot attach files.' };
  }
  let raw: string;
  try {
    raw = await native.pick();
  } catch (error) {
    warn('note file pick failed:', error);
    return { error: 'That file could not be copied to your phone.' };
  }
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<NoteFile>;
    if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
      return { error: 'That file could not be copied to your phone.' };
    }
    return {
      file: {
        id: parsed.id,
        name: typeof parsed.name === 'string' && parsed.name ? parsed.name : 'Attachment',
        mime: typeof parsed.mime === 'string' ? parsed.mime : 'application/octet-stream',
        size: typeof parsed.size === 'number' ? parsed.size : 0,
      },
    };
  } catch (error) {
    warn('note file record unreadable:', error);
    return { error: 'That file could not be copied to your phone.' };
  }
}

/**
 * A `file://` URI to play or show, or null if the file has gone.
 *
 * Null is a real outcome rather than a defensive one: the reader can clear the
 * app's storage from Android's settings at any time, and a player handed a
 * path to nothing shows a black rectangle instead of saying so.
 */
export function noteFileUri(file: NoteFile): string | null {
  if (!native) {
    return null;
  }
  try {
    const path = native.pathFor(file.id);
    return path ? `file://${path}` : null;
  } catch {
    return null;
  }
}

/** Forget one file's bytes. The note is the source of truth for the list. */
export function removeNoteFile(id: string): void {
  try {
    native?.remove(id);
  } catch (error) {
    warn('note file delete failed:', error);
  }
}

/**
 * Drop every file a deleted note owned.
 *
 * Without this a deleted note's video stays on the device for ever, taking
 * space nothing on screen accounts for — the reader deleted the only thing
 * that referenced it. The pictures have the same rule for the same reason.
 */
export function removeNoteFiles(files: NoteFile[] | undefined): void {
  for (const file of files ?? []) {
    removeNoteFile(file.id);
  }
}
