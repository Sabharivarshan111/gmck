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
// A microscopic fragment cannot demonstrate the bedside appearance of a nail sign.
export const EXCLUDED_EXAM_PHOTOS = new Set(['File:Splinter hemorrhage under the microscope.jpg']);
export function examPhotoCaption(id: string): string | undefined {
  if (id === 'koplik-and-oral') return 'Angular cheilitis — this example is not Koplik spots.';
  return CURATED_EXAM_PHOTOS[id]?.caption;
}
export function examPhotoLicenceUrl(licence?: string): string | undefined {
  const match = licence?.match(/^CC BY(-SA)? (\d\.\d)$/);
  return match ? `https://creativecommons.org/licenses/by${match[1] ? '-sa' : ''}/${match[2]}/` : undefined;
}
