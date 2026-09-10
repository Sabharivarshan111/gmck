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
    { n: 1, frames: 80, screen: null, mascot: 'hero', camera: 'settle', text: 'Second year is the volume year', silentText: 'Second year is the volume year', vo: 'Second year is the volume year.', accent: '#FF4D8D' },
    { n: 2, frames: 100, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'Patho, Pharma, Micro, Forensic', silentText: 'Patho, Pharma, Micro, Forensic', vo: 'Patho, Pharma, Micro, Forensic. All at once.', accent: '#FF4D8D' },
    { n: 3, frames: 100, screen: 'questionsChapters', camera: 'push', text: 'Sorted by chapter', silentText: 'Sorted chapter by chapter', vo: 'Every one of them sorted by chapter.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'The circle is how often', silentText: 'The circle counts the repeats', vo: 'The circle is how often that question repeats.', focus: 0.28, accent: '#F5B301' },
    { n: 5, frames: 100, screen: 'questionsLeaf', mascot: 'guide', camera: 'push', text: 'Study the fours before the ones', silentText: 'Study the fours before the ones', vo: 'Study the fours before the ones. That is the whole trick.', focus: 0.3, accent: '#F5B301' },
    { n: 6, frames: 100, screen: 'noteHero', camera: 'push', text: 'Triple-tap for a written answer', silentText: 'Triple-tap for a written answer', vo: 'Triple-tap for a written answer.', accent: '#7C5CFF' },
    { n: 7, frames: 100, screen: 'noteBody', camera: 'glideDown', text: 'Grounded in your own textbook', silentText: 'Grounded in your own textbook', vo: 'Grounded in your own textbook, not invented.', accent: '#7C5CFF' },
    { n: 8, frames: 100, screen: 'plateStomach', camera: 'settle', text: 'With the diagram', silentText: 'With the diagram it needs', vo: 'With the diagram the question actually needs.', accent: '#22D3A6' },
    { n: 9, frames: 95, screen: 'noteDiagram', camera: 'pull', text: 'Picture, then the theory', silentText: 'Picture, then the theory', vo: 'Picture, then the theory underneath.', accent: '#22D3A6' },
    { n: 10, frames: 100, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'Any chapter becomes flashcards', silentText: 'Any chapter becomes flashcards', vo: 'Any chapter becomes flashcards in one tap.', accent: '#4CC2FF' },
    { n: 11, frames: 95, screen: 'ankiStudy', camera: 'macro', text: 'Or bring your own Anki deck', silentText: 'Or bring your own Anki deck', vo: 'Or bring your own Anki deck straight in.', accent: '#4CC2FF' },
    { n: 12, frames: 100, screen: 'attendance', camera: 'push', text: 'And it counts your attendance', silentText: 'It counts your attendance too', vo: 'And it counts your attendance for you.', focus: 0.4, accent: '#22D3A6' },
    { n: 13, frames: 95, screen: 'timer', mascot: 'guide', camera: 'push', text: 'A tree grows while you focus', silentText: 'A tree grows while you focus', vo: 'A tree grows while you focus.', accent: '#22D3A6' },
    { n: 14, frames: 95, screen: 'music', camera: 'macro', text: 'With your own music', silentText: 'With your own music', vo: 'With your own music, off your own phone.', accent: '#7C5CFF' },
    { n: 15, frames: 95, screen: 'progress', camera: 'pull', text: 'Your streak needs no account', silentText: 'Your streak needs no account', vo: 'Your streak needs no account at all.', accent: '#F5B301' },
    { n: 16, frames: 100, screen: 'home', camera: 'pull', text: 'One app for the whole of second year', silentText: 'One app, the whole year', vo: 'One app for the whole of second year.', accent: '#FF4D8D' },
    { n: 17, frames: 85, screen: null, mascot: 'hero', camera: 'settle', text: 'Made for second year', silentText: 'Made for second year', vo: 'Made for second year.', accent: '#FF4D8D' },
    { n: 18, frames: 155, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
