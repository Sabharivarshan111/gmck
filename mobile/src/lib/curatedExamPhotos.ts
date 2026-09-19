/** Clinical photos visually reviewed on 2026-09-18. Separate from the generated manifest. */
import type { FetchedSignImage } from './examSignImages';
export interface CuratedExamPhoto extends FetchedSignImage { caption: string }
export const CURATED_EXAM_PHOTOS: Record<string, CuratedExamPhoto> = {
  'palmar-erythema': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Palmar_erythema.jpg',
    commonsTitle: 'File:Palmar erythema.jpg', credit: 'Jmarchn', licence: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Palmar_erythema.jpg',
    caption: 'Palmar erythema. This sign has several possible causes.',
  },
  'cyanosis-peripheral': {
    file: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Cyanosis-adult_fingertips.PNG',
    commonsTitle: 'File:Cyanosis-adult fingertips.PNG', credit: '7mike5000; derivative of Raynaud’s Syndrome.jpg', licence: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Cyanosis-adult_fingertips.PNG',
    caption: 'Peripheral cyanosis in the cyanotic phase of Raynaud’s phenomenon; not a photograph of central cyanosis.',
  },
  onycholysis: {
    file: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Onycholysis.jpg',
    commonsTitle: 'File:Onycholysis.jpg', credit: 'Alborz Fallah', licence: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Onycholysis.jpg',
    caption: 'Distal nail-plate separation; the source does not establish its cause.',
  },
};
/**
 * Files a human has looked at and rejected. The fetcher reads this list, so a
 * rejection sticks instead of being re-fetched on the next run.
 *
 * Each of these was returned by a search whose words were perfect and whose
 * picture was not a clinical photograph of the sign.
 */
export const EXCLUDED_EXAM_PHOTOS = new Set([
  // A microscopic fragment cannot demonstrate the bedside appearance of a nail sign.
  'File:Splinter hemorrhage under the microscope.jpg',
  // A magazine illustration of two men at a table, from a novel — the caption
  // reads "face assumed a deadly pallor". The words are right; it is a drawing.
  "File:P 451 Harper's vol121--Face assumed a deadly pallor.png",
  // A carved stone relief, not a photograph of a wasted patient.
  'File:Ancient Egyptian Medicine-starvation-cachexia.JPG',
  // A grainy archive snapshot of a woman outdoors. Even if the subject had
  // myxoedema, no student could learn the facies from it.
  'File:BASA-3K-7-529-35(7)-Myxedema.jpg',
  // A photograph of a professional wrestler whose ring name is Pallor. It
  // passed the licence check, the MIME check, the title gate and the artwork
  // filter. The word is not evidence about the picture.
  'File:Pallor (5687275766).jpg',
  // A Victorian "medical curiosity" photograph whose title is a slur. Neither
  // the dignity nor the teaching value is acceptable in a modern app.
  'File:Microcephalic idiot with local myxedema.jpg',
  // A statistical infographic about hospital stays. A chart is not a sign.
  'File:Characteristics of Hospital Stays Involving Malnutrition, 2013 Infographic.jpg',
]);
export function examPhotoCaption(id: string): string | undefined {
  if (id === 'koplik-and-oral') return 'Angular cheilitis — this example is not Koplik spots.';
  return CURATED_EXAM_PHOTOS[id]?.caption;
}
export function examPhotoLicenceUrl(licence?: string): string | undefined {
  const match = licence?.match(/^CC BY(-SA)? (\d\.\d)$/);
  return match ? `https://creativecommons.org/licenses/by${match[1] ? '-sa' : ''}/${match[2]}/` : undefined;
}
