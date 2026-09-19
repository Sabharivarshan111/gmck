/** Clinical photos visually reviewed on 2026-09-18. Separate from the generated manifest. */
import type { FetchedSignImage } from './examSignImages';
export interface CuratedExamPhoto extends FetchedSignImage { caption: string }
export const CURATED_EXAM_PHOTOS: Record<string, CuratedExamPhoto> = {
  'build-nourishment': {
    file: 'signs/build-nourishment.jpg',
    commonsTitle: 'File:Kwashiorkor 6180.jpg',
    credit: 'Centers for Disease Control and Prevention', licence: 'Public domain',
    source: 'https://commons.wikimedia.org/wiki/File:Kwashiorkor_6180.jpg',
    caption:
      'Kwashiorkor: the moon face of oedema, sparse depigmented hair and the ' +
      'perioral dermatosis. This is the oedematous form — marasmus is the wasted ' +
      'one, and the two look nothing alike, which is the point of naming which ' +
      'you are seeing.',
  },
  pallor: {
    file: 'signs/pallor.jpg',
    commonsTitle: 'File:Anemia.JPG', credit: 'James Heilman, MD', licence: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Anemia.JPG',
    caption:
      'The hand of a person with anaemia (left) beside a normal hand (right). ' +
      'The comparison is the point: pallor is judged against a normal, which is ' +
      'why the examiner asks you to compare with your own hand. This shows ' +
      'pallor of the skin and nail beds, not the conjunctival pallor the ' +
      'proforma also asks you to look for.',
  },
  'palmar-erythema': {
    file: 'signs/palmar-erythema.jpg',
    commonsTitle: 'File:Palmar erythema.jpg', credit: 'Jmarchn', licence: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Palmar_erythema.jpg',
    caption: 'Palmar erythema. This sign has several possible causes.',
  },
  'cyanosis-peripheral': {
    file: 'signs/cyanosis-peripheral.jpg',
    commonsTitle: 'File:Cyanosis-adult fingertips.PNG', credit: '7mike5000; derivative of Raynaud’s Syndrome.jpg', licence: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:Cyanosis-adult_fingertips.PNG',
    caption: 'Peripheral cyanosis in the cyanotic phase of Raynaud’s phenomenon; not a photograph of central cyanosis.',
  },
  onycholysis: {
    file: 'signs/onycholysis.jpg',
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
  // A Loa loa worm on a ruler. It matched because it was extracted FROM a
  // conjunctiva — the gate word named the site, and the site is where the
  // parasite came from, not what the picture shows.
  "File:Adult female Loa loa filarial worm - Extracted from a patient's conjunctiva in the left eye.jpg",
  // "Traditional bear pallor" — a mistranslation of beer parlour. Calabash
  // bowls outside a village bar.
  'File:Traditional bear pallor.jpg',
  // A ring binder of admission paperwork, not a malnourished patient.
  'File:Individual records for malnutrition (13897387422) (2).jpg',
  // A grainy halftone portrait. Genuinely a myxoedema plate, but the facies
  // is not legible in it, so it teaches nothing.
  'File:Mild myxedema.jpg',
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
/**
 * The signs whose picture a person has opened and confirmed shows the sign.
 *
 * This is the list that decides what the app displays. `SIGN_IMAGES` is
 * generated by the fetch workflow and is a list of CANDIDATES — five rounds of
 * it produced an engraving, a wrestler, a beer parlour, a starling and a Loa
 * loa worm, every one of which passed the licence, MIME, title and artwork
 * checks. A machine cannot tell a clinical photograph from a picture that
 * merely shares its words, so a human says so here and nowhere else.
 *
 * Adding an id means: open the image, confirm it shows the sign, and write a
 * caption for it if it needs one.
 */
export const REVIEWED_SIGNS = new Set<string>([
  'clubbing',
  'cyanosis-peripheral',
  'dupuytren',
  'edema',
  'icterus',
  'jvp',
  'koilonychia',
  'koplik-and-oral',
  'leukonychia',
  'lymphadenopathy',
  'onycholysis',
  'pallor',
  'palmar-erythema',
  'splinter-haemorrhages',
  'build-nourishment',
]);

export function examPhotoCaption(id: string): string | undefined {
  if (id === 'koplik-and-oral') return 'Angular cheilitis — this example is not Koplik spots.';
  return CURATED_EXAM_PHOTOS[id]?.caption;
}
export function examPhotoLicenceUrl(licence?: string): string | undefined {
  const match = licence?.match(/^CC BY(-SA)? (\d\.\d)$/);
  return match ? `https://creativecommons.org/licenses/by${match[1] ? '-sa' : ''}/${match[2]}/` : undefined;
}
