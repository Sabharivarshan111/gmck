import type { AdScript } from './types';

/**
 * Reel 7 — "Ask me anything". The mascot's second ad.
 *
 * ## Why a second mascot ad rather than a re-cut of the first
 *
 * `reelGuide` is a tour: the host walks you round the app and names each room.
 * That works once. Watched twice it is a list, and a list has no reason to
 * reach the end — nothing in shot four depends on shot three.
 *
 * This one is the same character doing a **single job in front of you**. One
 * question, from the list to a ticked box, with the mascot doing each step and
 * saying so in the first person: "I write the answer", "I explain it properly",
 * "I turn it into flashcards". The claim is identical to the tour's; what
 * changes is that you watch it happen instead of being told it exists.
 *
 * ## One character, one voice
 *
 * `en-US-AvaNeural` at `+0%`, exactly as `reelGuide`. That is deliberate and
 * it is the reason this file does not pick something fresher: the mascot is a
 * character the app already has — `BotAvatar`, the Ask AI chat's own face —
 * and three ads about one character in three different voices is three
 * characters. Rate and bed carry the mood instead. This bed
 * (`bed-guide-answer`) is a touch brisker than the tour's at 24 bars, because
 * a job being done has somewhere to be.
 *
 * ## The rules this file obeys
 *
 * * `text` is a **verbatim span of `vo`**. `preflight` fails the render if it
 *   is not, and `ReelHeadline` lights each headline word as it is spoken. It
 *   exists because the earlier reels put one sentence on screen and said a
 *   different one aloud.
 * * `vo` fits its own shot at roughly 2.3 words per second of it, less 0.4s of
 *   air, and spells numbers out — the synthesiser reads numerals unevenly.
 * * `frames` sum to exactly REEL_FRAMES (1800).
 * * No quantity shaped like a year. "2,025" reached a published cut and read
 *   as the year; preflight now refuses the shape.
 */
export const reelGuideAnswer: AdScript = {
  id: 'orbit-reel-guide-answer',
  title: 'Orbit MBBS — Reel: Ask me anything',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide-answer.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Brain = blank', silentText: 'Brain = blank', vo: 'You read the question and suddenly your brain is empty.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'Pick a question', silentText: 'Pick a question', vo: 'Pick a question. Any one.', focus: 0.28, accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'noteHero', mascot: 'guide', camera: 'push', text: 'Triple-tap for the answer', silentText: 'Triple-tap for the answer', vo: 'Triple-tap it. The answer opens.', accent: '#FF4D8D' },
    { n: 4, frames: 129, screen: 'noteBody', camera: 'glideDown', text: 'Headings. Points. Years.', silentText: 'Headings. Points. Years.', vo: 'Headings, points and the years it was asked.', accent: '#FF4D8D' },
    { n: 5, frames: 129, screen: 'noteBodyBottom', camera: 'glideDown', text: 'Must-write points', silentText: 'Must-write points', vo: 'Then the important points at the end.', accent: '#FF4D8D' },
    { n: 6, frames: 129, screen: 'plateBrachial', mascot: 'guide', camera: 'settle', text: 'The matching diagram', silentText: 'The matching diagram', vo: 'And the diagram that belongs with it.', accent: '#22D3A6' },
    { n: 7, frames: 129, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Still stuck?', silentText: 'Still stuck?', vo: 'Still confused? Ask again.', accent: '#7C5CFF' },
    { n: 8, frames: 129, screen: 'chatdemo', camera: 'macro', text: 'Ask it your way', silentText: 'Ask it your way', vo: 'You can ask it in your own words.', accent: '#7C5CFF' },
    { n: 9, frames: 128, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'Make flashcards', silentText: 'Make flashcards', vo: 'Then turn the chapter into flashcards.', accent: '#4CC2FF' },
    { n: 10, frames: 128, screen: 'ankiStudy', camera: 'macro', text: 'Comes back later', silentText: 'Comes back later', vo: 'They come back later for revision.', accent: '#4CC2FF' },
    { n: 11, frames: 128, screen: 'timer', mascot: 'guide', camera: 'push', text: 'Focus. Grow.', silentText: 'Focus. Grow.', vo: 'Set a focus session. Let the tree grow.', accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'progress', camera: 'pull', text: 'Your streak', silentText: 'Your streak', vo: 'Your streak stays with you on the phone.', accent: '#F5B301' },
    { n: 13, frames: 128, screen: 'glassHome', camera: 'orbit', text: 'Make it yours', silentText: 'Make it yours', vo: 'And you can make the app look the way you want.', accent: '#4CC2FF' },
    { n: 14, frames: 128, screen: null, mascot: 'hero', camera: 'settle', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
