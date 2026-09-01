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

/**
 * How a file is attached.
 *
 * `copy` — the bytes are inside Orbit. Delete or move the original and the
 * note still plays it. Costs space on the phone.
 *
 * `link` — nothing is copied; Orbit holds a long-term permission to read the
 * file where it already is. Costs no space, and stops working if the reader
 * moves or deletes the original. That is not a bug to be defended against, it
 * is the deal, and the UI says so before the choice is made.
 */
export type AttachMode = 'copy' | 'link';

export interface NoteFile {
  /** A file name inside Orbit for a copy; the content URI for a link. */
  id: string;
  /** What it was called where it came from, for the reader to recognise. */
  name: string;
  mime: string;
  size: number;
  /** True when the bytes are somebody else's and we only have a key. */
  linked?: boolean;
  /** The content URI, for a link. */
  uri?: string;
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
export async function attachNoteFile(
  mode: AttachMode,
): Promise<{ file: NoteFile } | { error: string } | null> {
  if (!native) {
    return { error: 'This build cannot attach files.' };
  }
  let raw: string;
  try {
    raw = await native.pick(mode, '');
  } catch (error) {
    warn('note file pick failed:', error);
    return {
      error:
        mode === 'link'
          ? 'Orbit could not keep permission to read that file.'
          : 'That file could not be copied to your phone.',
    };
  }
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<NoteFile>;
    if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
      return { error: 'That file could not be copied to your phone.' };
    }
    return { file: toNoteFile(parsed) };
  } catch (error) {
    warn('note file record unreadable:', error);
    return { error: 'That file could not be copied to your phone.' };
  }
}

function toNoteFile(parsed: Partial<NoteFile>): NoteFile {
  return {
    id: parsed.id as string,
    name: typeof parsed.name === 'string' && parsed.name ? parsed.name : 'Attachment',
    mime: typeof parsed.mime === 'string' ? parsed.mime : 'application/octet-stream',
    size: typeof parsed.size === 'number' ? parsed.size : 0,
    linked: parsed.linked === true,
    uri: typeof parsed.uri === 'string' ? parsed.uri : undefined,
  };
}

/**
 * Copy a linked file in, so the note stops depending on the original.
 *
 * Offered on every linked attachment, because the reason to link is usually
 * "not enough room today" and that changes. The reverse is not offered:
 * turning a copy back into a link would mean guessing which file on the device
 * it came from.
 */
export async function adoptNoteFile(
  file: NoteFile,
): Promise<{ file: NoteFile } | { error: string }> {
  if (!native || !file.uri) {
    return { error: 'That file could not be copied to your phone.' };
  }
  try {
    const parsed = JSON.parse(await native.adopt(file.uri)) as Partial<NoteFile>;
    if (typeof parsed.id !== 'string' || !parsed.id) {
      return { error: 'That file could not be copied to your phone.' };
    }
    // The link's grant is no longer needed, and Android caps how many an app
    // may hold. Released after the copy lands, never before.
    try {
      native.release(file.uri);
    } catch {
      // Nothing to do; the copy is what matters.
    }
    return { file: toNoteFile(parsed) };
  } catch (error) {
    warn('adopt failed:', error);
    return { error: 'That file could not be copied to your phone.' };
  }
}

/**
 * Whether a linked original is still there.
 *
 * Always true for a copy — those are ours. For a link this is a real question
 * with a real answer, asked when a note is opened.
 */
export function linkIsAlive(file: NoteFile): boolean {
  if (!file.linked) {
    return true;
  }
  if (!native || !file.uri) {
    return false;
  }
  try {
    return native.linkStatus(file.uri) === 'ok';
  } catch {
    return false;
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
  // A link is already a URI. ExoPlayer reads content:// directly, and so does
  // the PDF hand-off, so there is nothing to resolve.
  if (file.linked) {
    return file.uri ?? null;
  }
  try {
    const path = native.pathFor(file.id);
    if (!path) {
      return null;
    }
    /*
     * The Android side returns an absolute path; anything else is already a
     * URL and is handed through untouched. That second case is the preview
     * harness, which has no app storage and serves a small sample instead —
     * and it is there deliberately. The attach-and-play path is real on a
     * phone, so if nothing here can walk it, the one flow this file exists for
     * is the one flow no check can ever see.
     */
    return path.startsWith('/') ? `file://${path}` : path;
  } catch {
    return null;
  }
}

/**
 * Detach one file.
 *
 * Takes the whole record rather than an id, and that is the point: a **linked
 * file belongs to the reader** and lives outside this app, so detaching it
 * gives up our permission to read it and touches nothing else. Passing an id
 * alone would have made the two cases indistinguishable here, and the wrong
 * branch deletes somebody's only copy of their own recording.
 */
export function removeNoteFile(file: NoteFile): void {
  try {
    if (file.linked) {
      if (file.uri) {
        native?.release(file.uri);
      }
      return;
    }
    native?.remove(file.id);
  } catch (error) {
    warn('note file detach failed:', error);
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
    removeNoteFile(file);
  }
}
