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
 * Enough for a diagram and its labels. Four rather than eight because these are
 * kept locally and never thinned: every one is storage the reader does not get
 * back until they delete the note.
 */
export const MAX_IMAGES_PER_NOTE = 4;

const key = (id: string) => `${IMAGE_PREFIX}${id}`;

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
  } catch (error) {
    warn('note image delete failed:', error);
  }
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
