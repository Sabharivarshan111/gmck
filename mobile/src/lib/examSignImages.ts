/**
 * Photographs fetched for the general-examination signs.
 *
 * Written by `.github/workflows/exam-sign-images.yml` — do not edit by hand,
 * the next run overwrites it. Each entry records the file it put under
 * `signs/` in the diagrams bucket, plus the attribution and licence, because
 * CC-BY requires attribution and `GeneralExamSigns.tsx` draws that credit line
 * directly under the picture.
 *
 * It is TypeScript rather than JSON on purpose: a JSON import needs
 * `resolveJsonModule`, which comes from the React Native tsconfig preset and
 * is therefore a flag this repo does not own. A generated `.ts` file needs
 * nothing and typechecks the same way every other file does.
 *
 * Empty is the correct starting state. A sign with no entry renders its text
 * and says it has no picture yet, which is what a sign whose only available
 * images are not licensed for commercial use should do for ever.
 */
export interface FetchedSignImage {
  /** Path under the diagrams bucket, e.g. 'signs/koilonychia.jpg'. */
  file: string;
  /** Shown under the picture. */
  credit?: string;
  /** e.g. 'CC BY-SA 4.0'. Commercial use must be permitted. */
  licence?: string;
  /** The Commons file page, for anyone checking the provenance. */
  source?: string;
  commonsTitle?: string;
}

export const SIGN_IMAGES: Record<string, FetchedSignImage> = {};
