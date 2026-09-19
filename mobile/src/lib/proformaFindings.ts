import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureCardImage, pickCardImage } from './cardImage';
import { removeNoteImage } from './noteImages';
import { warn } from './log';

/**
 * Photographs of findings the student saw on their own patients, kept beside
 * the case sheet they were clerking.
 *
 * Asked for in exactly these words: "we can upload image as a finding or sign
 * we see in daily op or patients". A case proforma is filled in at the
 * bedside; the sign is in front of them; and until now the only place a
 * photograph of it could go was the phone's camera roll, where it lost the
 * one thing that made it useful — which case it belonged to.
 *
 * ── This never leaves the phone, and here that is not a preference ─────────
 *
 * Every other local-only store in this app is local because the app's owner
 * decided a ward-round scribble is not ours to keep. This one is local for a
 * harder reason: **a clinical photograph of a patient is identifiable health
 * information about a person who is not the user.** Uploading it would make
 * this app the custodian of somebody's medical record, taken by a student, in
 * a hospital that has not agreed to any of it.
 *
 * So there is no bucket, no row, no account, and `npm run check:cloud-ids`
 * fails if this file so much as imports the Supabase client. The same check
 * guards the personal notes; the rule here is the one that must never bend.
 *
 * The consequence is stated in the UI rather than hidden: these go when the
 * app does. That is the correct trade — a photograph that cannot be recovered
 * from a lost phone is far better than one that can be recovered from a
 * server.
 *
 * ── Why the bytes go through `noteImages` ──────────────────────────────────
 *
 * Because that is already the store for "a downscaled photograph on this
 * phone, under its own AsyncStorage key", and it already solves the two
 * problems this has: the picker returns a path into the *cache* directory
 * which Android empties, and a base64 photograph inside a list value makes
 * reading the list a multi-megabyte parse. One picture, one key, and this
 * file keeps only the ids.
 */

export interface ProformaFinding {
  /** The picture's id in `noteImages`. */
  imageId: string;
  /** What the student saw. Theirs to write; never generated. */
  caption: string;
  /** Where on the sheet it belongs — "General examination", free text. */
  site?: string;
  added: number;
}

const key = (proformaId: string) => `orbit:proforma-findings:${proformaId}`;

export async function loadFindings(proformaId: string): Promise<ProformaFinding[]> {
  try {
    const raw = await AsyncStorage.getItem(key(proformaId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProformaFinding[]) : [];
  } catch (error) {
    warn('proforma findings load failed:', error);
    return [];
  }
}

async function save(proformaId: string, findings: ProformaFinding[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key(proformaId), JSON.stringify(findings));
  } catch (error) {
    warn('proforma findings save failed:', error);
  }
}

/**
 * Add one, from the camera or the gallery.
 *
 * Both routes are offered because both are real: the sign is often in front of
 * the student *now* (camera), and just as often already on their phone from a
 * ward round that morning (gallery). Neither asks for a permission — see
 * `cardImage.ts` for why declaring `CAMERA` is what would create a prompt.
 */
export async function addFinding(
  proformaId: string,
  source: 'camera' | 'gallery',
): Promise<{ findings: ProformaFinding[] } | { error: string } | null> {
  const picked = source === 'camera' ? await captureCardImage() : await pickCardImage();
  if (!picked) return null;
  if ('tooLarge' in picked) {
    return { error: 'That picture is too big to keep on the phone. Take it again, or pick a smaller one.' };
  }

  const imageId = `finding-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  try {
    await AsyncStorage.setItem(`orbit:note-image:${imageId}`, picked.uri);
  } catch (error) {
    warn('proforma finding save failed:', error);
    return { error: 'There was no room to save that picture.' };
  }

  const current = await loadFindings(proformaId);
  const next = [...current, { imageId, caption: '', added: Date.now() }];
  await save(proformaId, next);
  return { findings: next };
}

/** Write what the student saw. */
export async function captionFinding(
  proformaId: string,
  imageId: string,
  caption: string,
): Promise<ProformaFinding[]> {
  const current = await loadFindings(proformaId);
  const next = current.map(f => (f.imageId === imageId ? { ...f, caption } : f));
  await save(proformaId, next);
  return next;
}

/**
 * Forget one, and its bytes with it.
 *
 * The picture is deleted rather than orphaned. A photograph of a patient that
 * the student meant to remove and which quietly stayed in storage is the worst
 * outcome this feature has available, and "it only costs bytes" — the reason
 * an orphaned note picture is tolerable — is not a reason that applies here.
 */
export async function removeFinding(
  proformaId: string,
  imageId: string,
): Promise<ProformaFinding[]> {
  const current = await loadFindings(proformaId);
  const next = current.filter(f => f.imageId !== imageId);
  await save(proformaId, next);
  await removeNoteImage(imageId);
  return next;
}
