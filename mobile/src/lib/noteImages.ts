import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickCardImage } from './cardImage';
import { warn } from './log';

/**
 * Pictures attached to a personal study note.
 *
 * **On this phone, and nowhere else.** No bucket, no upload, no account. A
 * study note is the most private thing in this app — a photo of a whiteboard,
 * a page of somebody's own book, a scribble from a ward round — and the app's
 * owner asked for it to stay on the device. That decision is not an
 * implementation detail to be optimised away later: uploading it would mean a
 * server copy that outlives the app, for a feature whose whole value is that it
 * is yours.
 *
 * The trade is the same one the hand-written flashcard decks make, and the UI
 * says it plainly: reinstall the app or lose the phone and these go with it.
 *
 * **One AsyncStorage key per picture**, not an array inside the note.
 * `orbit:user-notes:v1` is a single value holding every note; a few base64
 * photographs in there would make reading the *list* of note titles a
 * multi-megabyte parse on a cheap phone. The note stores ids; the bytes sit in
 * their own keys and are read only when a note is opened.
 */

const IMAGE_PREFIX = 'orbit:note-image:';
/**
 * The pen marks made on a picture, kept beside it rather than burnt into it.
 *
 * Flattening the strokes into the bitmap would need a native snapshot, would
 * double the bytes stored, and would make the annotation permanent — draw an
 * arrow in the wrong place and the only fix is deleting the picture. Kept as
 * geometry, they render over the photograph at any size and can be redrawn or
 * cleared later. The picture itself is never modified.
 */
const INK_PREFIX = 'orbit:note-ink:';

/**
 * No cap, deliberately.
 *
 * There is nothing to ration. The pictures are on the reader's own phone, one
 * AsyncStorage key each, and this library (v3) stores through Room with no
 * fixed database size — the 6 MB `AsyncStorage_db_size_in_MB` ceiling belonged
 * to v1's `ReactDatabaseSupplier` and is gone; there is no size constant left
 * anywhere in its Android source. The only limit is the free space on the
 * device, which is the reader's to spend.
 *
 * An invented cap would be this app deciding how many photographs of somebody's
 * own textbook they are allowed to keep, which is not its call.
 */

const key = (id: string) => `${IMAGE_PREFIX}${id}`;
const inkKey = (id: string) => `${INK_PREFIX}${id}`;

export interface NoteInkStroke {
  d: string;
  color: string;
  width: number;
  /**
   * Below 1 for a highlighter, so the mark sits over the writing rather than
   * on top of it. Absent on every stroke written before highlighting existed,
   * which is why it is optional rather than defaulted at the call site.
   */
  opacity?: number;
}

export interface NoteInk {
  strokes: NoteInkStroke[];
  /** The canvas the strokes were drawn on, so they scale to any box. */
  width: number;
  height: number;
  /** 'plain' | 'lined' | 'grid' — the ruling of a page written by hand. */
  paper?: string;
}

export async function saveNoteInk(id: string, ink: NoteInk): Promise<void> {
  try {
    await AsyncStorage.setItem(inkKey(id), JSON.stringify(ink));
  } catch (error) {
    warn('note ink save failed:', error);
  }
}

export async function loadNoteInk(id: string): Promise<NoteInk | null> {
  try {
    const raw = await AsyncStorage.getItem(inkKey(id));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<NoteInk>;
    return Array.isArray(parsed.strokes) && parsed.width && parsed.height
      ? {
          strokes: parsed.strokes,
          width: parsed.width,
          height: parsed.height,
          paper: parsed.paper,
        }
      : null;
  } catch {
    return null;
  }
}

/**
 * Pick a picture and keep it.
 *
 * Returns the local id the note stores. Null means cancelled; `error` means it
 * failed and the reader should be told rather than left with nothing.
 */
export async function attachNoteImage(): Promise<
  { id: string } | { error: string } | null
> {
  const picked = await pickCardImage();
  if (!picked) {
    return null;
  }
  if ('tooLarge' in picked) {
    return { error: 'That picture is too big to keep on the phone. Crop it, or pick a smaller one.' };
  }
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  try {
    await AsyncStorage.setItem(key(id), picked.uri);
  } catch (error) {
    warn('note image save failed:', error);
    return { error: 'There was no room to save that picture.' };
  }
  return { id };
}

/** The data URI for one picture, or null if it is gone. */
export async function loadNoteImage(id: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key(id));
  } catch {
    return null;
  }
}

/** Forget one picture's bytes. The note is the source of truth for the list. */
export async function removeNoteImage(id: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(id));
    // The marks go with the picture they were drawn on. Nothing else refers
    // to them, so leaving them is bytes the reader can never account for.
    await AsyncStorage.removeItem(inkKey(id));
  } catch (error) {
    warn('note image delete failed:', error);
  }
}

/** Forget one handwritten page. It has no bytes but its own marks. */
export async function removeNoteInk(id: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(inkKey(id));
  } catch (error) {
    warn('note ink delete failed:', error);
  }
}

/** The same, for every page a deleted note owned. */
export async function removeNoteInks(ids: string[]): Promise<void> {
  await Promise.all(ids.map(id => removeNoteInk(id)));
}

/**
 * Drop every picture a deleted note owned.
 *
 * Without this a deleted note's photographs stay on the device for ever, taking
 * space nothing on screen accounts for — the reader deleted the only thing that
 * referenced them.
 */
export async function removeNoteImages(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  // multiRemove is not on the typed surface of this AsyncStorage build, and a
  // handful of small deletes is not worth reaching around the types for.
  await Promise.all(ids.map(id => removeNoteImage(id)));
}
