import type { AdScript } from './types';

/**
 * Reel — "Third year".
 *
 * ## Third year is the year this app is best at, and the reason is data
 *
 * Ninety-six per cent of third-year questions carry a repeat marker. That is
 * the highest of the four years by a distance — first year is sixty-nine,
 * second eighty-eight, final year twenty-three — so the repeat counter is not
 * a nice-to-have here, it is close to a complete map of what gets asked. An ad
 * for this year can lead on it and be telling the truth about almost every
 * question on screen.
 *
 * The bank holds two third-year subjects: Forensic Medicine and Community
 * Medicine. That is a small number and the ad says it plainly rather than
 * implying six — a viewer who installs expecting Medicine and Surgery in third
 * year has been misled by the ad, not by the app.
 *
 * ## Both subjects have a real book behind them
 *
 * Forensic and Community Medicine were the first two textbooks uploaded, and
 * they are the ones the triple tap was originally built around: eight hundred
 * of the notes in the cache are third year. So "grounded in the actual
 * textbook" is a stronger claim here than in any other year's ad, and it is
 * the one thing this reel spends two shots on.
 *
 * What it must never do is promise page numbers on demand. Those come from
 * readers and need three of them to agree — `orbit-reel-pages` is the ad for
 * that, and it is honest about the wait. Two ads contradicting each other on
 * the same fact is how you lose the one that is true.
 */
export const reelThirdYear: AdScript = {
  id: 'orbit-reel-third-year',
  title: 'Orbit MBBS — Reel: Third year',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Haven’t opened it in weeks?', silentText: 'Haven’t opened it in weeks?', vo: 'You haven’t touched Forensic since the term started.', accent: '#F5B301' },
    { n: 2, frames: 129, screen: 'browseThird', mascot: 'guide', camera: 'trackLeft', text: 'Forensic + Community Medicine', silentText: 'Forensic + Community Medicine', vo: 'Forensic and Community Medicine, chapter by chapter.', accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'Repeated questions', silentText: 'Repeated questions', vo: 'And a lot of these questions have already come up.', focus: 0.28, accent: '#F5B301' },
    { n: 4, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'push', text: 'Repeat frequency', silentText: 'Repeat frequency', vo: 'The circle tells you how often.', focus: 0.3, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'noteHero', camera: 'push', text: 'Triple-tap for the answer', silentText: 'Triple-tap for the answer', vo: 'Triple-tap for the answer.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'noteBody', mascot: 'guide', camera: 'glideDown', text: 'Based on the textbook', silentText: 'Based on the textbook', vo: 'The answer is based on the textbook for the subject.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'noteBodyBottom', camera: 'glideDown', text: 'Must-write points', silentText: 'Must-write points', vo: 'And the must-write points are there at the end.', accent: '#7C5CFF' },
    { n: 8, frames: 129, screen: 'pageRefSheet', camera: 'settle', text: 'Add the page number', silentText: 'Add the page number', vo: 'Students can add the page reference too.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'Make flashcards', silentText: 'Make flashcards', vo: 'Then turn the chapter into cards.', accent: '#4CC2FF' },
    { n: 10, frames: 128, screen: 'ankiStudy', camera: 'macro', text: 'Spaced revision', silentText: 'Spaced revision', vo: 'And let them come back for revision.', accent: '#4CC2FF' },
    { n: 11, frames: 128, screen: 'attendance', camera: 'push', text: 'Track attendance', silentText: 'Track attendance', vo: 'Keep track of attendance at the same time.', focus: 0.4, accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'timer', mascot: 'guide', camera: 'push', text: 'Focus for 25 minutes', silentText: 'Focus for 25 minutes', vo: 'Then spend twenty-five minutes actually focusing.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'One app for third year', silentText: 'One app for third year', vo: 'One app for the year.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
