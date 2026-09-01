/**
 * Which subjects the notes generator has a textbook for.
 *
 * A **mirror of `pickBookKey` in the deployed edge function's `textbook.ts`**,
 * kept identical on purpose: the server decides what it can ground an answer
 * in, and the client only decides whether to offer the button. Both sides
 * therefore have to agree on the same list.
 *
 * Keyed on the **subject**, never the year, because that is what the server
 * keys on.
 */
export type BookKey =
  | 'community'
  | 'forensic'
  | 'pharmacology'
  | 'pathology'
  | 'microbiology'
  | 'physiology'
  | 'biochemistry'
  | 'anatomy'
  // Final year
  | 'medicine'
  | 'surgery'
  | 'orthopaedics'
  | 'obstetrics'
  | 'gynaecology'
  | 'paediatrics'
  | 'ent'
  | 'ophthalmology';

export function pickBookKey(subject: string): BookKey | null {
  const s = (subject || '').toLowerCase();

  // --- 3rd year ---
  if (
    s.includes('community') ||
    s.includes('psm') ||
    s.includes('preventive') ||
    s.includes('social medicine')
  ) {
    return 'community';
  }
  if (s.includes('forensic') || s.includes('fmt') || s.includes('toxicology')) {
    return 'forensic';
  }

  // --- 2nd year ---
  if (s.includes('pharmac') || s.includes('drug')) {
    return 'pharmacology';
  }
  if (s.includes('patholog')) {
    return 'pathology';
  }
  if (
    s.includes('microbio') ||
    s.includes('bacterio') ||
    s.includes('virolog') ||
    s.includes('mycolog') ||
    s.includes('parasitolog') ||
    s.includes('immunolog')
  ) {
    return 'microbiology';
  }

  // --- 1st year ---
  if (s.includes('physiolog')) {
    return 'physiology';
  }
  if (s.includes('biochem')) {
    return 'biochemistry';
  }
  if (
    s.includes('anatom') ||
    s.includes('embryo') ||
    s.includes('histolog') ||
    s.includes('osteolog')
  ) {
    return 'anatomy';
  }

  // --- Final year ---
  // OB-GYN: check more specific terms first.
  // "obstetrics-gynaecology" as a combined key → return 'obstetrics' (Dutta)
  // so hasTextbook returns true; the server loads both Dutta + Shaw.
  if (s.includes('obstet')) {
    return 'obstetrics';
  }
  if (s.includes('gynae') || s.includes('gynec') || s.includes('gynaec')) {
    return 'gynaecology';
  }

  // Surgery vs Orthopaedics: check ortho first (more specific) then surgery.
  if (s.includes('ortho')) {
    return 'orthopaedics';
  }
  if (s.includes('surg')) {
    return 'surgery';
  }

  if (s.includes('medicine') || s.includes('general-medicine')) {
    return 'medicine';
  }
  if (s.includes('paediat') || s.includes('pediatr')) {
    return 'paediatrics';
  }
  if (s.includes('ent') || s.includes('otorhinolaryng') || s.includes('otolaryngol')) {
    return 'ent';
  }
  if (s.includes('ophthalm') || s.includes('eye')) {
    return 'ophthalmology';
  }

  return null;
}

/**
 * Whether a triple tap on this subject can produce a grounded note.
 *
 * Both the key and the display name are tried, because the two disagree in
 * places — the bank's key is `general-surgery` while its name is "General
 * Surgery and Orthopaedics" — and a subject only needs one of them to match
 * for the server to find it a book.
 */
export function hasTextbook(subjectKey: string, subjectName?: string): boolean {
  return pickBookKey(subjectKey) !== null || pickBookKey(subjectName ?? '') !== null;
}
