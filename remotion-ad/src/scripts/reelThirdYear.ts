import type { AdScript } from './types';

/**
 * Reel — "Third year".
 *
 * ## The repeat counter is strongest here, and the ad leads on it
 *
 * Four fifths of third-year questions carry a repeat marker — behind second
 * year and well ahead of final year, where it is closer to a quarter. So the
 * circle on the right of a row is close to a map of what gets asked, and an ad
 * for this year can lead on it and be telling the truth about most of the
 * questions on screen. `npm run check:repeat-markers` prints the real table;
 * do not copy a figure out of here, because this docstring has already been
 * wrong about it once.
 *
 * It said ninety-six per cent, which was true of a third year holding only
 * Forensic and Community Medicine. **ENT and Ophthalmology are third year's
 * too** — the same two subject nodes final year serves, because they are
 * taught in third year and examined in final — and they carry fewer markers,
 * so the figure moved the day they were added and nothing here noticed.
 *
 * ## Which is why shot 2 names no subject
 *
 * It used to say "Forensic and Community Medicine, chapter by chapter" over a
 * screenshot of the third-year list. That list now has four rows in it, so the
 * line was naming half of what the viewer could see — the exact
 * screenshot-contradicts-the-line defect `ad-truth-check` exists for, and one
 * it cannot catch, because `DEPICTS.browseThird` records the year and not the
 * subjects. Counting is the fix that lasts: a fifth subject changes one word.
 *
 * ## All four have a real book behind them
 *
 * Forensic and Community Medicine were the first two textbooks uploaded and
 * the ones the triple tap was built around, which is why most of the notes
 * already in the cache are third year. ENT and Ophthalmology have books of
 * their own — `pickBookKey` is keyed on the subject and never on the year, so
 * they arrived grounded the moment third year started serving them.
 *
 * So "grounded in the actual textbook" is a stronger claim here than in any
 * other year's ad, and it is the one thing this reel spends two shots on.
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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'since the term started', silentText: 'Haven’t opened it in weeks?', vo: 'You haven’t touched Forensic since the term started.', accent: '#F5B301' },
    { n: 2, frames: 129, screen: 'browseThird', mascot: 'guide', camera: 'trackLeft', text: 'chapter by chapter', silentText: 'Four subjects, chapter by chapter', vo: 'Your four subjects, chapter by chapter.', accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'have already come up', silentText: 'Repeated questions', vo: 'And a lot of these questions have already come up.', focus: 0.28, accent: '#F5B301' },
    { n: 4, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'push', text: 'The circle tells you how often', silentText: 'Repeat frequency', vo: 'The circle tells you how often.', focus: 0.3, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'noteHero', camera: 'push', text: 'Triple-tap for the answer', silentText: 'Triple-tap for the answer', vo: 'Triple-tap for the answer.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'noteBody', mascot: 'guide', camera: 'glideDown', text: 'based on the textbook', silentText: 'Based on the textbook', vo: 'The answer is based on the textbook for the subject.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'noteBodyBottom', camera: 'glideDown', text: 'the must-write points', silentText: 'Must-write points', vo: 'And the must-write points are there at the end.', accent: '#7C5CFF' },
    { n: 8, frames: 129, screen: 'pageRefSheet', camera: 'settle', text: 'add the page reference', silentText: 'Add the page number', vo: 'Students can add the page reference too.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'turn the chapter into cards', silentText: 'Make flashcards', vo: 'Then turn the chapter into cards.', accent: '#4CC2FF' },
    { n: 10, frames: 128, screen: 'ankiStudy', camera: 'macro', text: 'come back for revision', silentText: 'Spaced revision', vo: 'And let them come back for revision.', accent: '#4CC2FF' },
    { n: 11, frames: 128, screen: 'attendance', camera: 'push', text: 'Keep track of attendance', silentText: 'Track attendance', vo: 'Keep track of attendance at the same time.', focus: 0.4, accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'timer', mascot: 'guide', camera: 'push', text: 'actually focusing', silentText: 'Focus for a while', vo: 'Then spend a while actually focusing.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'One app for the year', silentText: 'One app for third year', vo: 'One app for the year.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
