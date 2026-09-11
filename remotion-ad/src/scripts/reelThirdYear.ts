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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Not opened since term started', silentText: 'Not opened since term started', vo: 'You have not opened Forensic since the term started.', accent: '#F5B301' },
    { n: 2, frames: 129, screen: 'browseThird', mascot: 'guide', camera: 'trackLeft', text: 'Forensic and Community', silentText: 'Forensic + Community Medicine', vo: 'Forensic and Community Medicine chapter by chapter.', accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'Almost every one has been asked before', silentText: 'Almost all have repeated', vo: 'And almost every one has been asked before.', focus: 0.28, accent: '#F5B301' },
    { n: 4, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'push', text: 'The circle counts', silentText: 'The circle counts repeats', vo: 'The circle counts how many times it was asked.', focus: 0.3, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'noteHero', camera: 'push', text: 'Triple-tap for a written answer', silentText: 'Triple-tap for a written answer', vo: 'Triple-tap for a written answer.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'noteBody', mascot: 'guide', camera: 'glideDown', text: 'From your actual textbook', silentText: 'From your actual textbook', vo: 'Written from your actual textbook, not from nowhere.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'noteBodyBottom', camera: 'glideDown', text: 'It ends with the must-write points', silentText: 'It ends with the must-write points', vo: 'It ends with the must-write points.', accent: '#7C5CFF' },
    { n: 8, frames: 129, screen: 'pageRefSheet', camera: 'settle', text: 'which page it is on', silentText: 'And which page it is on', vo: 'And students add which page it is on.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'Any chapter becomes flashcards', silentText: 'Any chapter becomes flashcards', vo: 'Any chapter becomes flashcards in one tap.', accent: '#4CC2FF' },
    { n: 10, frames: 128, screen: 'ankiStudy', camera: 'macro', text: 'They come back before you forget', silentText: 'They come back before you forget', vo: 'They come back before you forget them.', accent: '#4CC2FF' },
    { n: 11, frames: 128, screen: 'attendance', camera: 'push', text: 'It counts your attendance', silentText: 'It counts your attendance', vo: 'It counts your attendance while you are at it.', focus: 0.4, accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'timer', mascot: 'guide', camera: 'push', text: 'A tree grows while you focus', silentText: 'A tree grows while you focus', vo: 'A tree grows while you focus.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'One app, the whole year', silentText: 'One app, the whole year', vo: 'One app, the whole year, free.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
