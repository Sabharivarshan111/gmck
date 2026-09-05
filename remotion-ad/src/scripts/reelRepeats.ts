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
    // --- hook: 0.0s - 5.5s. The claim, then the number that proves it.
    { n: 1, frames: 90, screen: 'questionsLeaf', camera: 'macro', text: 'Your university repeats its questions', silentText: "3,463 already asked", vo: 'Your university repeats its questions.', focus: 0.28, accent: '#F5B301' },
    { n: 2, frames: 75, screen: 'questionsLeaf', camera: 'macro', text: 'Over three thousand', silentText: "We counted every one", vo: 'Over three thousand repeat.', focus: 0.28, accent: '#F5B301' },

    // --- the bank: what is actually in there.
    { n: 3, frames: 90, screen: 'browse', camera: 'trackLeft', text: 'First year to final year', silentText: "All four MBBS years", vo: 'First year to final year.', accent: '#7C5CFF' },
    { n: 4, frames: 105, screen: 'questionsChapters', camera: 'push', text: 'Five thousand six hundred questions', silentText: "5,634 questions, sorted", vo: 'Five thousand six hundred questions, already sorted.', focus: 0.35, accent: '#7C5CFF' },
    { n: 5, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'The stars are frequency', silentText: "Stars mean frequency", vo: 'The stars are frequency, not decoration.', focus: 0.28, accent: '#F5B301' },

    // --- the payload, front-loaded: triple tap to a full written answer.
    { n: 6, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap any question', silentText: "Triple-tap any question", vo: 'Triple-tap any question and watch.', focus: 0.28, accent: '#FF4D8D' },
    { n: 7, frames: 120, screen: 'noteHero', camera: 'push', text: 'A full handwritten answer', silentText: "A full handwritten answer", vo: 'A full handwritten answer appears, in seconds.', accent: '#FF4D8D' },
    { n: 8, frames: 120, screen: 'noteBody', camera: 'glideDown', text: 'The way examiners read it', silentText: "Written exam-shaped", vo: 'Structured the way examiners read it.', accent: '#FF4D8D' },

    // --- the diagrams, which is the part nothing else does.
    { n: 9, frames: 120, screen: 'plateBrachial', camera: 'settle', text: 'The diagram that question needs', silentText: "And its own diagram", vo: 'With the diagram that question needs.', accent: '#22D3A6' },
    { n: 10, frames: 105, screen: 'noteDiagram', camera: 'pull', text: 'Picture before theory', silentText: "Picture, then the theory", vo: 'Picture before theory, every single time.', accent: '#22D3A6' },
    { n: 11, frames: 105, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Two hundred and fifty plates', silentText: "250 exam plates", vo: 'Two hundred and fifty plates, hand-drawn.', accent: '#22D3A6' },

    // --- everything else, one beat each. One idea per shot, no stacking.
    { n: 12, frames: 105, screen: 'askai', camera: 'push', text: 'Ask anything', silentText: "Stuck? Ask the AI", vo: 'Ask anything and it explains properly.', accent: '#7C5CFF' },
    { n: 13, frames: 90, screen: 'flashcards', camera: 'orbit', text: 'Turn any chapter into flashcards', silentText: "Any chapter to flashcards", vo: 'Turn any chapter into flashcards.', accent: '#4CC2FF' },
    { n: 14, frames: 90, screen: 'apkgHub', camera: 'push', text: 'Import your own Anki deck', silentText: "Import your Anki deck", vo: 'Import your own Anki deck.', accent: '#4CC2FF' },
    { n: 15, frames: 90, screen: 'timer', camera: 'push', text: 'A tree grows', silentText: "Focus, and a tree grows", vo: 'Start a session. A tree grows.', accent: '#22D3A6' },
    { n: 16, frames: 90, screen: 'progress', camera: 'pull', text: 'Your streak needs no account', silentText: "Your streak, your year", vo: 'Your streak needs no account.', accent: '#F5B301' },
    { n: 17, frames: 90, screen: 'wallpaperCustomizer', camera: 'macro', text: 'Four themes', silentText: "Four themes, or build one", vo: 'Four themes, or build your own.', focus: 0.45, accent: '#4CC2FF' },

    // --- one CTA, no second ask.
    { n: 18, frames: 105, screen: 'outroCard', camera: 'settle', text: 'Free on Google Play', silentText: "Orbit MBBS, free on Google Play", vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
