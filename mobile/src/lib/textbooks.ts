/**
 * Which subjects the notes generator has a textbook for.
 *
 * A **mirror of `pickBookKey` in the deployed edge function's `textbook.ts`**,
 * kept identical on purpose: the server decides what it can ground an answer
 * in, and the client only decides whether to offer the button. Both sides
 * therefore have to agree on the same list, and `npm run check:textbooks`
 * fails if this drifts from the function's own copy.
 *
 * The gate used to be `year === 'third-year'`, with a comment explaining that
 * third year is Community and Forensic and those were the only two books that
 * existed. That was true when it was written. The function has since grown to
 * eight books covering first and second year as well, and the gate did not —
 * so a first-year student triple-tapping got Ask AI's generic answer while a
 * textbook-grounded one was sitting there, fully uploaded, unreachable. What
 * hid it is that the repo's copy of the function was the stale two-book one,
 * so reading the code agreed with the bug.
 *
 * Keyed on the **subject**, never the year, because that is what the server
 * keys on. Final year is the one that genuinely has no books, and it falls out
 * of this list on its own rather than being special-cased.
 */
export type BookKey =
  | 'community'
  | 'forensic'
  | 'pharmacology'
  | 'pathology'
  | 'microbiology'
  | 'physiology'
  | 'biochemistry'
  | 'anatomy';

export function pickBookKey(subject: string): BookKey | null {
  const s = (subject || '').toLowerCase();
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

/** The book behind a subject, for telling the reader where the answer came from. */
export const BOOK_LABELS: Record<BookKey, string> = {
  community: "Sia's Park Community Medicine",
  forensic: 'Vision Forensic Medicine & Toxicology',
  pharmacology: 'KD Tripathi + Tara V Shanbhag',
  pathology: 'Ramadas Nayak — Pathology',
  microbiology: 'Apurba S Sastry — Microbiology',
  physiology: 'K Sembulingam — Physiology',
  biochemistry: 'DM Vasudevan — Biochemistry',
  anatomy: 'Vishram Singh — Anatomy',
};
