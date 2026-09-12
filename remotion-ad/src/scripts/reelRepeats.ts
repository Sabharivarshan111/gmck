import type { AdScript } from './types';

/**
 * Reel 1 — "Already Asked".
 *
 * Framework: Investigator (the secret is already in the data) with a
 * specificity hook. The contrast it opens is between what the viewer believes
 * — "the syllabus is enormous and I have to read all of it" — and what is
 * true: of the 5,634 questions in the bank, 3,463 carry a repeat marker, and
 * 2,013 of those name the years they were asked in.
 *
 * Those are the only numbers this reel is allowed to claim. The first cut said
 * "2,025 already asked", which was stale, counted the wrong thing, and read on
 * screen as the *year* 2025 rather than as a quantity — so no headline here
 * ever carries a number between 1900 and 2100.
 *
 * The first shot is a macro on the importance stars because that is the one
 * visual this app owns that reads at thumbnail size with the sound off, and a
 * Reels viewer decides inside ~1.7 seconds.
 *
 * ## The headline is a span of the spoken line
 *
 * `text` is a word-for-word run of words lifted out of `vo`, never a second
 * piece of copy that agrees with it in spirit. Read and heard have to be the
 * same sentence; when they were written separately the reel showed one claim
 * while saying another. Numbers are spelled out in `vo` because the
 * synthesiser reads numerals unpredictably, and the headline follows the
 * speech.
 *
 * Every `frames` value is deliberate and they sum to REEL_FRAMES (1800).
 * `npm run preflight` fails if that stops being true.
 */
export const reelRepeats: AdScript = {
  id: 'orbit-reel-repeats',
  title: 'Orbit MBBS — Reel: Already Asked',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+14%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-repeats.wav',
  shots: [
    { n: 1, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'like it matters equally', silentText: 'They’re not all equal.', vo: 'You revise every question like it matters equally. It doesn’t.', focus: 0.28, accent: '#F5B301' },
    { n: 2, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'already come up in papers', silentText: 'Already asked before', vo: 'Some of them have already come up in papers.', focus: 0.28, accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'down to the chapter', silentText: 'Down to your chapter', vo: 'Orbit sorts them down to the chapter you’re on.', focus: 0.35, accent: '#7C5CFF' },
    { n: 4, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'which ones repeat more', silentText: 'Stars = repeat frequency', vo: 'And the stars show you which ones repeat more.', focus: 0.28, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap one', silentText: 'Triple-tap', vo: 'Triple-tap one and see the answer.', focus: 0.28, accent: '#FF4D8D' },
    { n: 6, frames: 129, screen: 'noteHero', camera: 'push', text: 'A full written answer', silentText: 'Full written answer', vo: 'A full written answer opens straight away.', accent: '#FF4D8D' },
    { n: 7, frames: 129, screen: 'noteBody', camera: 'glideDown', text: 'something you’d actually write', silentText: 'Exam-style structure', vo: 'It’s structured more like something you’d actually write in the exam.', accent: '#FF4D8D' },
    { n: 8, frames: 129, screen: 'plateBrachial', camera: 'settle', text: 'the diagram comes with it', silentText: 'Diagram included', vo: 'And the diagram comes with it.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'chapterDiagrams', camera: 'glideDown', text: 'go and find somewhere else', silentText: 'Right beside the answer', vo: 'Not something you have to go and find somewhere else.', accent: '#22D3A6' },
    { n: 10, frames: 128, screen: 'askai', camera: 'push', text: 'Ask the AI', silentText: 'Stuck? Ask AI.', vo: 'Still stuck? Ask the AI.', accent: '#7C5CFF' },
    { n: 11, frames: 128, screen: 'flashcards', camera: 'orbit', text: 'Turn it into flashcards', silentText: 'Chapter into flashcards', vo: 'Finished the chapter? Turn it into flashcards.', accent: '#4CC2FF' },
    { n: 12, frames: 128, screen: 'apkgHub', camera: 'push', text: 'Import the deck', silentText: 'Import your Anki deck', vo: 'Already have Anki? Import the deck.', accent: '#4CC2FF' },
    { n: 13, frames: 128, screen: 'timer', camera: 'push', text: 'the tree grows', silentText: 'Focus. Grow.', vo: 'And when you focus, the tree grows.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'outroCard', camera: 'settle', text: 'Free on Google Play', silentText: 'Orbit MBBS, free on Google Play', vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
