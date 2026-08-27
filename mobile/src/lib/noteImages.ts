import { supabase } from './supabase';
import { pickCardImage } from './cardImage';
import { warn } from './log';

/**
 * Pictures attached to a personal study note.
 *
 * **Uploaded to a private bucket, not inlined into the row.** A note syncs
 * across devices, so bytes in the row would mean every phone re-downloading
 * megabytes of JPEG just to list a note's title. The row stores paths; the
 * bytes live in `note-images`, which is private and whose RLS keys every
 * policy off the first path segment — so `{uid}/…` is the only folder a user
 * can reach.
 *
 * This is the opposite of the choice made for hand-written flashcards, and
 * deliberately: those never leave the phone, so there is no server to put them
 * on and no sync to keep small.
 */

export const BUCKET = 'note-images';

/**
 * base64 → bytes, without a dependency.
 *
 * Hermes has no `Buffer`, and `atob` produces a binary *string* that would have
 * to be walked anyway. This is the walk, done once: fifteen lines instead of a
 * package, a lockfile change and a `npm ci` in three workflows.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(input: string): Uint8Array {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array((clean.length * 3) >> 2);
  let out = 0;
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    buffer = (buffer << 6) | ALPHABET.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out++] = (buffer >> bits) & 0xff;
    }
  }
  // `>> 2` over-allocates by up to two bytes when the input was padded, and a
  // trailing zero byte is a corrupt JPEG rather than a harmless one.
  return out === bytes.length ? bytes : bytes.subarray(0, out);
}

/** Enough for a page of a textbook or a whiteboard; more is a second note. */
export const MAX_IMAGES_PER_NOTE = 8;

/** How long a display URL stays good. Long enough to read a note, not to share. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Pick one picture and put it in the note's folder.
 *
 * Returns the storage **path**, which is what the row stores. Null means the
 * picker was cancelled; a string in `error` means it failed and the reader
 * should be told why rather than left with nothing.
 */
export async function attachNoteImage(
  userId: string,
  noteId: string,
): Promise<{ path: string } | { error: string } | null> {
  const picked = await pickCardImage();
  if (!picked) {
    return null;
  }
  if ('tooLarge' in picked) {
    return { error: 'That picture is too big. Crop it, or pick a smaller one.' };
  }

  // pickCardImage hands back a data URI because that is what the flashcard
  // decks need; here only the bytes matter.
  const comma = picked.uri.indexOf(',');
  const base64 = comma >= 0 ? picked.uri.slice(comma + 1) : picked.uri;
  const mime = /^data:([^;]+)/.exec(picked.uri)?.[1] ?? 'image/jpeg';
  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${noteId}/${Date.now().toString(36)}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, base64ToBytes(base64), { contentType: mime, upsert: false });

  if (error) {
    warn('note image upload failed:', error.message);
    return { error: error.message || 'Could not upload that picture.' };
  }
  return { path };
}

/**
 * Display URLs for a note's pictures.
 *
 * The bucket is private, so there is no public URL to build — each one is
 * signed, and expires. Failures come back as an empty list rather than a
 * throw: a note whose pictures will not load is still a note worth reading.
 */
export async function signNoteImages(paths: string[]): Promise<string[]> {
  if (paths.length === 0) {
    return [];
  }
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    warn('note image signing failed:', error?.message);
    return [];
  }
  return data.map(item => item.signedUrl).filter((url): url is string => Boolean(url));
}

/** Remove one picture's bytes. Best effort — the row is the source of truth. */
export async function removeNoteImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    warn('note image delete failed:', error.message);
  }
}
