import type { AdScript } from './types';

/**
 * Reel 1 — "Already Asked".
 *
 * Framework: Investigator (the secret is already in the data) with a
 * specificity hook. The contrast it opens is between what the viewer believes
 * — "the syllabus is enormous and I have to read all of it" — and what is
 * true: 2,025 of those questions already carry the year they were asked in.
 *
 * The first shot is a macro on the importance stars because that is the one
 * visual this app owns that reads at thumbnail size with the sound off, and a
 * Reels viewer decides inside ~1.7 seconds. The headline says the number, the
 * voice says the number, the picture is the number. Three hooks, one claim.
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
    // --- hook: 0.0s - 5.5s. The number, then the reveal that it is countable.
    { n: 1, frames: 90, screen: 'questionsLeaf', camera: 'macro', text: '2,025 already asked', vo: 'Your university repeats its questions.', focus: 0.28, accent: '#F5B301' },
    { n: 2, frames: 75, screen: 'questionsLeaf', camera: 'macro', text: 'We counted every one', vo: 'Nobody counted them. We did.', focus: 0.28, accent: '#F5B301' },

    // --- the bank: what is actually in there.
    { n: 3, frames: 90, screen: 'browse', camera: 'trackLeft', text: 'All four years', vo: 'First year to final year.', accent: '#7C5CFF' },
    { n: 4, frames: 105, screen: 'questionsChapters', camera: 'push', text: '5,545 questions, sorted', vo: 'Five thousand questions, already sorted.', focus: 0.35, accent: '#7C5CFF' },
    { n: 5, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Stars mean frequency', vo: 'The stars are frequency, not decoration.', focus: 0.28, accent: '#F5B301' },

    // --- the payload, front-loaded: triple tap to a full written answer.
    { n: 6, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap any question', vo: 'Triple-tap it. Watch.', focus: 0.28, accent: '#FF4D8D' },
    { n: 7, frames: 120, screen: 'noteHero', camera: 'push', text: 'A full handwritten answer', vo: 'A whole handwritten answer appears.', accent: '#FF4D8D' },
    { n: 8, frames: 120, screen: 'noteBody', camera: 'glideDown', text: 'Written exam-shaped', vo: 'Structured the way examiners read.', accent: '#FF4D8D' },

    // --- the diagrams, which is the part nothing else does.
    { n: 9, frames: 120, screen: 'plateBrachial', camera: 'settle', text: 'And its own diagram', vo: 'With the diagram that question needs.', accent: '#22D3A6' },
    { n: 10, frames: 105, screen: 'noteDiagram', camera: 'pull', text: 'Picture, then theory', vo: 'Picture first. Then the theory.', accent: '#22D3A6' },
    { n: 11, frames: 105, screen: 'chapterDiagrams', camera: 'glideDown', text: '915 hand-drawn plates', vo: 'Nine hundred and fifteen plates.', accent: '#22D3A6' },

    // --- everything else, one beat each. One idea per shot, no stacking.
    { n: 12, frames: 105, screen: 'askai', camera: 'push', text: 'Still stuck? Ask it', vo: 'Ask anything. It explains properly.', accent: '#7C5CFF' },
    { n: 13, frames: 90, screen: 'flashcards', camera: 'orbit', text: 'Chapter to flashcards', vo: 'Turn any chapter into flashcards.', accent: '#4CC2FF' },
    { n: 14, frames: 90, screen: 'apkgHub', camera: 'push', text: 'Your Anki deck opens', vo: 'Import the Anki deck you have.', accent: '#4CC2FF' },
    { n: 15, frames: 90, screen: 'timer', camera: 'push', text: 'Focus. A tree grows', vo: 'Start a session. A tree grows.', accent: '#22D3A6' },
    { n: 16, frames: 90, screen: 'progress', camera: 'pull', text: 'Your streak, your year', vo: 'Your streak lives on your phone.', accent: '#F5B301' },
    { n: 17, frames: 90, screen: 'wallpaperCustomizer', camera: 'macro', text: 'Make it yours', vo: 'Four themes, or build your own.', focus: 0.45, accent: '#4CC2FF' },

    // --- one CTA, no second ask.
    { n: 18, frames: 105, screen: 'outroCard', camera: 'settle', text: 'Orbit MBBS · Google Play', vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
