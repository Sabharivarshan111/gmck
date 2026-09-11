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
    { n: 1, frames: 129, screen: 'home', camera: 'macro', text: '2 AM. Exam at 9.', silentText: '2 AM. Exam at 9.', vo: 'It’s two in the morning. Exam at nine.', focus: 0.2, accent: '#4CC2FF' },
    { n: 2, frames: 129, screen: 'home', camera: 'macro', text: 'Still unread', silentText: 'Still unread', vo: 'Four hundred questions, still sitting there.', focus: 0.2, accent: '#4CC2FF' },
    { n: 3, frames: 129, screen: 'browse', camera: 'push', text: 'Six hours left', silentText: 'Six hours left', vo: 'Six hours left. So start somewhere useful.', accent: '#7C5CFF' },
    { n: 4, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'Start with the repeats', silentText: 'Start with the repeats', vo: 'Start with the questions that repeat the most.', focus: 0.28, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'questionsLeaf', camera: 'orbit', text: 'Asked 3 times', silentText: 'Asked 3 times', vo: 'This one’s already come up three times.', focus: 0.28, accent: '#F5B301' },
    { n: 6, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap. That’s it.', silentText: 'Triple-tap. That’s it.', vo: 'Triple-tap it. Don’t even type.', focus: 0.28, accent: '#FF4D8D' },
    { n: 7, frames: 129, screen: 'noteHero', camera: 'push', text: 'Full answer', silentText: 'Full answer', vo: 'The full answer opens.', accent: '#FF4D8D' },
    { n: 8, frames: 129, screen: 'plateCalots', camera: 'settle', text: 'Diagram included', silentText: 'Diagram included', vo: 'The diagram is there too.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'askai', camera: 'push', text: 'Stuck? Ask AI.', silentText: 'Stuck? Ask AI.', vo: 'Something confusing? Ask the AI.', accent: '#7C5CFF' },
    { n: 10, frames: 128, screen: 'flashcards', camera: 'orbit', text: 'Chapter → cards', silentText: 'Chapter → cards', vo: 'Then turn the chapter into flashcards.', accent: '#4CC2FF' },
    { n: 11, frames: 128, screen: 'timer', camera: 'push', text: '25 minutes', silentText: '25 minutes', vo: 'Twenty-five minutes. Phone down.', accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'music', camera: 'trackRight', text: 'Your music', silentText: 'Your music', vo: 'Play your own music. It stays on your phone.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'home', camera: 'hero', text: 'Works offline', silentText: 'Works offline', vo: 'Wi-Fi gone? The question bank still works.', accent: '#7C5CFF' },
    { n: 14, frames: 128, screen: 'outroCard', camera: 'settle', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
