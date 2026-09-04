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
    { n: 1, frames: 90, screen: 'home', camera: 'macro', text: "It's 2 AM. Exam at 9.", vo: 'Two AM. Exam at nine.', focus: 0.2, accent: '#4CC2FF' },
    { n: 2, frames: 75, screen: 'home', camera: 'macro', text: '400 questions. 9 notes.', vo: 'Four hundred questions. Nine notes.', focus: 0.2, accent: '#4CC2FF' },

    // --- the turn: what you actually do with six hours.
    { n: 3, frames: 90, screen: 'browse', camera: 'push', text: 'Here is what works', vo: 'Six hours left. Start here.', accent: '#7C5CFF' },
    { n: 4, frames: 105, screen: 'questionsChapters', camera: 'glideDown', text: 'Open the subject you sit', vo: 'Open your year. Pick your subject.', focus: 0.35, accent: '#7C5CFF' },
    { n: 5, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Five stars first', vo: 'Start with the five-star ones.', focus: 0.28, accent: '#F5B301' },
    { n: 6, frames: 105, screen: 'questionsLeaf', camera: 'orbit', text: 'This one came 3 times', vo: 'It came back three times already.', focus: 0.28, accent: '#F5B301' },
    { n: 7, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap. Type nothing.', vo: 'Triple-tap it. Type nothing.', focus: 0.28, accent: '#FF4D8D' },

    // --- the relief, which is the whole second half of a pain hook.
    { n: 8, frames: 120, screen: 'noteHero', camera: 'push', text: 'A full answer. Seconds.', vo: 'A full answer, in seconds.', accent: '#FF4D8D' },
    { n: 9, frames: 120, screen: 'plateCalots', camera: 'settle', text: 'With the diagram you must draw', vo: 'With the diagram you have to draw.', accent: '#22D3A6' },
    { n: 10, frames: 120, screen: 'noteBody', camera: 'glideDown', text: 'Headings. Points. Years asked.', vo: 'Headings, points, and the years asked.', accent: '#FF4D8D' },

    { n: 11, frames: 105, screen: 'askai', camera: 'push', text: 'Still stuck? Ask.', vo: 'Still stuck? Ask. It explains.', accent: '#7C5CFF' },
    { n: 12, frames: 105, screen: 'chatdemo', camera: 'settle', text: 'Quiz yourself right there', vo: 'Ask for MCQs. Quiz yourself.', accent: '#7C5CFF' },
    { n: 13, frames: 90, screen: 'flashcards', camera: 'orbit', text: 'Chapter to flashcards', vo: 'Turn the chapter into flashcards.', accent: '#4CC2FF' },
    { n: 14, frames: 90, screen: 'timer', camera: 'push', text: '25 minutes. Phone down.', vo: 'Twenty-five minutes. Phone down.', accent: '#22D3A6' },
    { n: 15, frames: 90, screen: 'music', camera: 'trackRight', text: 'Your own music', vo: 'Your own music. Nothing uploads.', accent: '#22D3A6' },
    { n: 16, frames: 90, screen: 'progress', camera: 'pull', text: 'No account needed', vo: 'Your streak. No account needed.', accent: '#F5B301' },
    { n: 17, frames: 90, screen: 'home', camera: 'hero', text: 'Hostel wifi died? Fine.', vo: 'Wifi gone? It works offline.', accent: '#7C5CFF' },

    { n: 18, frames: 105, screen: 'outroCard', camera: 'settle', text: 'Orbit MBBS · Google Play', vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
