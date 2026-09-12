import type { AdScript } from './types';

/**
 * Reel — "Second year, specifically".
 *
 * ## Why a year-specific ad at all
 *
 * The general ads have to describe an app that serves four years, and the
 * result is always the same shape: a list of things it can do. A second-year
 * student does not have a list-of-things problem. They have Pathology,
 * Pharmacology, Microbiology and Forensic Medicine in one year, they have the
 * first big volume of names to hold, and they have a professional exam at the
 * end of it. This ad is written to that and to nothing else.
 *
 * Every subject named here is a real second-year subject and every screen is
 * captured with the app **set to second year**, which is the default. That
 * matters more than it sounds: the general reels use the final-year browse
 * screen because it is the only one with six subjects, and naming
 * second-year subjects over a final-year screen is exactly the sort of thing
 * that gets noticed by the one person the ad is for.
 *
 * ## The numbers are the bank's, and they are not rounded up
 *
 * Five thousand six hundred questions and three thousand four hundred repeats
 * are counts across all four years, so this ad says so rather than implying
 * they are second year's. The repeat circle is the honest headline for this
 * year in particular — second year's coverage is high, unlike final year's,
 * which is why the feature reads as useful here and barely registers there.
 *
 * ## The pairing with the WhatsApp copy
 *
 * This is the reel that goes out with the second-year group message in
 * `.agents/video/WHATSAPP-SECOND-YEAR.md`. The video never shows a link — a
 * link in a video is a thing nobody can tap — so the copy carries it and the
 * video carries the argument. They are written together and should be sent
 * together.
 */
export const reelSecondYear: AdScript = {
  id: 'orbit-reel-second-year',
  title: 'Orbit MBBS — Reel: Second year',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'in the same week', silentText: 'Patho + Pharma', vo: 'Pathology and Pharmacology in the same week. Great.', accent: '#FF4D8D' },
    { n: 2, frames: 129, screen: 'browseSecond', mascot: 'guide', camera: 'trackLeft', text: 'Micro and Forensic', silentText: 'Patho. Pharma. Micro. Forensic.', vo: 'Then Micro and Forensic show up too.', accent: '#FF4D8D' },
    { n: 3, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'split down by chapter', silentText: 'Sorted by chapter', vo: 'At least they’re split down by chapter.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'how often the question repeats', silentText: 'Repeat frequency', vo: 'The circle shows how often the question repeats.', focus: 0.28, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'push', text: 'the fours before the ones', silentText: 'Start with the repeats', vo: 'So start with the fours before the ones.', focus: 0.3, accent: '#F5B301' },
    { n: 6, frames: 129, screen: 'noteHero', camera: 'push', text: 'Triple-tap for the written answer', silentText: 'Triple-tap for the answer', vo: 'Triple-tap for the written answer.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'noteBody', camera: 'glideDown', text: 'based on the textbook', silentText: 'Based on the textbook', vo: 'And it’s based on the textbook for the subject.', accent: '#7C5CFF' },
    { n: 8, frames: 129, screen: 'plateStomach', camera: 'settle', text: 'The diagram you need is there', silentText: 'Diagram included', vo: 'The diagram you need is there too.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'the chapter can become flashcards', silentText: 'Chapter into cards', vo: 'One tap and the chapter can become flashcards.', accent: '#4CC2FF' },
    { n: 10, frames: 128, screen: 'ankiStudy', camera: 'macro', text: 'Bring that in too', silentText: 'Import your Anki deck', vo: 'Already using Anki? Bring that in too.', accent: '#4CC2FF' },
    { n: 11, frames: 128, screen: 'attendance', camera: 'push', text: 'attendance in the same app', silentText: 'Attendance too', vo: 'And keep your attendance in the same app.', focus: 0.4, accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'timer', mascot: 'guide', camera: 'push', text: 'let the tree grow', silentText: 'Focus. Grow.', vo: 'Then focus for twenty-five minutes and let the tree grow.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'all in one place', silentText: 'One app for second year', vo: 'Second year, all in one place.', accent: '#FF4D8D' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
