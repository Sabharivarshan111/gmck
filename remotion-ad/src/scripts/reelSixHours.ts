import type { AdScript } from './types';

/**
 * Reel 2 — "Six Hours".
 *
 * Framework: pain hook, then Experimenter. The pain is the single most
 * universal one in this niche and it is stated as a scene rather than a
 * feeling — a clock and a number, not "exam stress". Pain framing carries
 * roughly twice the reach of a feature opening, and the loss being avoided
 * here (walking in unprepared) is sharper than any gain the app can promise.
 *
 * The hook is two shots and 5.5 seconds, which is as long as a reel gets to
 * spend before the product has to arrive. From shot 3 the screen is the app
 * and it never leaves.
 *
 * ## The headline is a span of the spoken line
 *
 * `text` is a word-for-word run of words lifted out of `vo`, so the viewer
 * reads a phrase from the sentence they are hearing rather than a second,
 * different line. Numbers are spelled out in `vo` — the synthesiser reads
 * numerals unpredictably — and the headline follows the speech.
 *
 * `frames` sums to REEL_FRAMES (1800); preflight fails if it stops doing so.
 */
export const reelSixHours: AdScript = {
  id: 'orbit-reel-six-hours',
  title: 'Orbit MBBS — Reel: Six Hours',
  format: 'reel',
  voice: 'en-US-JennyNeural',
  rate: '+13%',
  pitch: '+1Hz',
  music: 'audio/bed/bed-six-hours.wav',
  shots: [
    // --- the pain, stated as a scene. No product yet.
    { n: 1, frames: 90, screen: 'home', camera: 'macro', text: 'Exam at nine', silentText: "It's 2 AM. Exam at 9", vo: 'Two AM. Exam at nine.', focus: 0.2, accent: '#4CC2FF' },
    { n: 2, frames: 75, screen: 'home', camera: 'macro', text: 'Four hundred questions', silentText: "400 questions unread", vo: 'Four hundred questions unread.', focus: 0.2, accent: '#4CC2FF' },

    // --- the turn: what you actually do with six hours.
    { n: 3, frames: 90, screen: 'browse', camera: 'push', text: 'Six hours left', silentText: "Here is what works", vo: 'Six hours left. Start here.', accent: '#7C5CFF' },
    { n: 4, frames: 105, screen: 'questionsChapters', camera: 'glideDown', text: 'Open your year', silentText: "Open the subject you sit", vo: 'Open your year, then your subject.', focus: 0.35, accent: '#7C5CFF' },
    { n: 5, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Start with the five-star ones', silentText: "Five stars first", vo: 'Start with the five-star ones.', focus: 0.28, accent: '#F5B301' },
    { n: 6, frames: 105, screen: 'questionsLeaf', camera: 'orbit', text: 'Came back three times', silentText: "This one came 3 times", vo: 'This one came back three times.', focus: 0.28, accent: '#F5B301' },
    { n: 7, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap it', silentText: "Triple-tap. Type nothing", vo: 'Triple-tap it. Type nothing at all.', focus: 0.28, accent: '#FF4D8D' },

    // --- the relief, which is the whole second half of a pain hook.
    { n: 8, frames: 120, screen: 'noteHero', camera: 'push', text: 'A full handwritten answer', silentText: "A full answer in seconds", vo: 'A full handwritten answer, in seconds.', accent: '#FF4D8D' },
    { n: 9, frames: 120, screen: 'plateCalots', camera: 'settle', text: 'The diagram comes with it', silentText: "With the diagram you must draw", vo: 'The diagram comes with it, already drawn.', accent: '#22D3A6' },
    { n: 10, frames: 120, screen: 'noteBody', camera: 'glideDown', text: 'The years it was asked', silentText: "Headings, points, years asked", vo: 'Headings, points, and the years it was asked.', accent: '#FF4D8D' },

    { n: 11, frames: 105, screen: 'askai', camera: 'push', text: 'Ask it anything', silentText: "Stuck? Ask the AI", vo: 'Ask it anything and it explains properly.', accent: '#7C5CFF' },
    { n: 12, frames: 105, screen: 'chatdemo', camera: 'settle', text: 'Ask for MCQs', silentText: "Quiz yourself right there", vo: 'Ask for MCQs and quiz yourself.', accent: '#7C5CFF' },
    { n: 13, frames: 90, screen: 'flashcards', camera: 'orbit', text: 'Turn the chapter into flashcards', silentText: "Chapter to flashcards", vo: 'Turn the chapter into flashcards.', accent: '#4CC2FF' },
    { n: 14, frames: 90, screen: 'timer', camera: 'push', text: 'Twenty-five minutes', silentText: "25 minutes. Phone down", vo: 'Twenty-five minutes. Phone down.', accent: '#22D3A6' },
    { n: 15, frames: 90, screen: 'music', camera: 'trackRight', text: 'Your own music', silentText: "Your own music, from your phone", vo: 'Your own music. Nothing uploads.', accent: '#22D3A6' },
    { n: 16, frames: 90, screen: 'progress', camera: 'pull', text: 'Your streak needs no account', silentText: "No account needed", vo: 'Your streak needs no account.', accent: '#F5B301' },
    { n: 17, frames: 90, screen: 'home', camera: 'hero', text: 'It still works offline', silentText: "Hostel wifi died? Fine", vo: 'Wifi gone? It still works offline.', accent: '#7C5CFF' },

    { n: 18, frames: 105, screen: 'outroCard', camera: 'settle', text: 'Free on Google Play', silentText: "Orbit MBBS, free on Google Play", vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
