import type { AdScript } from './types';

/**
 * Reel — "First year".
 *
 * ## What is actually different about first year
 *
 * Three subjects, one of which is Anatomy, and Anatomy is a drawing exam. A
 * first-year student's problem is not finding questions — it is that the
 * answer to half of them is a labelled picture they have to be able to produce
 * from memory in a viva.
 *
 * So this ad leads on the plates rather than on the bank. The brachial plexus,
 * the ulnar nerve, the shoulder joint: real plates out of the app's own
 * storage, the same ones a first-year note draws. `npm run plates` fetches
 * them and preflight refuses to render a cut where one is a white rectangle,
 * which is a mistake this project has actually published before.
 *
 * ## The one number this year cares about
 *
 * Sixty-nine per cent of first-year questions carry a repeat marker. That is
 * lower than second and third year and much higher than final year, and it is
 * *the* reason the repeat circle is worth pointing at here — it works, and it
 * works often enough to plan around.
 *
 * The screen is captured with the app set to first year (`browseFirst`), not
 * the six-subject final-year screen the general reels use. An ad about first
 * year showing Ophthalmology is an ad that was made by somebody who has not
 * been to first year.
 */
export const reelFirstYear: AdScript = {
  id: 'orbit-reel-first-year',
  title: 'Orbit MBBS — Reel: First year',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'drawing it without looking', silentText: 'Now draw it from memory', vo: 'You can explain the topic. Now try drawing it without looking.', accent: '#22D3A6' },
    { n: 2, frames: 129, screen: 'browseFirst', mascot: 'guide', camera: 'trackLeft', text: 'all at once', silentText: 'Anatomy. Physiology. Biochem.', vo: 'Anatomy, Physiology and Biochemistry all at once.', accent: '#22D3A6' },
    { n: 3, frames: 129, screen: 'plateBrachial', camera: 'settle', text: 'need a diagram', silentText: 'The answer is a picture', vo: 'Some questions need a diagram.', accent: '#22D3A6' },
    { n: 4, frames: 129, screen: 'plateUlnar', camera: 'push', text: 'the labelled diagram', silentText: 'Labelled diagram', vo: 'So you get the labelled diagram with it.', accent: '#22D3A6' },
    { n: 5, frames: 129, screen: 'chapterDiagrams', camera: 'glideDown', text: 'its own set of diagrams', silentText: 'Diagrams by chapter', vo: 'Each chapter has its own set of diagrams.', accent: '#4CC2FF' },
    { n: 6, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'the same way you study them', silentText: 'Sorted by chapter', vo: 'And the questions are organised the same way you study them.', focus: 0.35, accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'have come up before', silentText: 'Repeated questions', vo: 'A lot of questions have come up before.', focus: 0.28, accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'push', text: 'The circle shows how often', silentText: 'See the frequency', vo: 'The circle shows how often.', focus: 0.3, accent: '#F5B301' },
    { n: 9, frames: 128, screen: 'noteHero', camera: 'push', text: 'Triple-tap for the written answer', silentText: 'Triple-tap for the answer', vo: 'Triple-tap for the written answer.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'noteBody', camera: 'glideDown', text: 'based on the textbook', silentText: 'Based on the textbook', vo: 'The answer is based on the textbook for the subject.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'userNotesEdit', camera: 'macro', text: 'draw it yourself', silentText: 'Draw it yourself', vo: 'Then draw it yourself with a stylus or your finger.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'Turn the chapter into flashcards', silentText: 'Make flashcards', vo: 'Finished? Turn the chapter into flashcards.', accent: '#4CC2FF' },
    { n: 13, frames: 128, screen: 'progress', camera: 'pull', text: 'without making another account', silentText: 'Start your streak', vo: 'And your study streak can start without making another account.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
