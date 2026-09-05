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
    // --- the offer, from the face. No product for two and a half seconds.
    { n: 1, frames: 75, screen: null, mascot: 'hero', camera: 'settle', text: 'Ask me anything', vo: 'Ask me anything.', accent: '#7C5CFF' },
    { n: 2, frames: 100, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'Pick a question', vo: 'Pick a question. Any question.', focus: 0.28, accent: '#F5B301' },

    // --- what the list already knows before you read a word.
    { n: 3, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'how often it repeats', vo: 'The stars say how often it repeats.', focus: 0.28, accent: '#F5B301' },

    // --- the mascot does the work, in the first person.
    { n: 4, frames: 100, screen: 'noteHero', mascot: 'guide', camera: 'push', text: 'I write the answer', vo: 'Triple tap. I write the answer.', accent: '#FF4D8D' },
    { n: 5, frames: 100, screen: 'noteBody', camera: 'glideDown', text: 'the years asked', vo: 'Headings, points, and the years asked.', accent: '#FF4D8D' },
    { n: 6, frames: 110, screen: 'noteBodyBottom', camera: 'glideDown', text: 'the must write points', vo: 'It ends with the must write points.', accent: '#FF4D8D' },

    // --- the plate, which is the part nothing else does.
    { n: 7, frames: 105, screen: 'plateBrachial', mascot: 'guide', camera: 'settle', text: 'the diagram that belongs', vo: 'Then the diagram that belongs to it.', accent: '#22D3A6' },
    { n: 8, frames: 110, screen: 'noteDiagram', camera: 'pull', text: 'Picture first', vo: 'Picture first, then the theory underneath.', accent: '#22D3A6' },

    // --- still stuck. This is the join: it is literally this avatar in the app.
    { n: 9, frames: 100, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask me again', vo: 'Still not clear? Ask me again.', accent: '#7C5CFF' },
    { n: 10, frames: 100, screen: 'chatdemo', camera: 'macro', text: 'I explain it properly', vo: 'I explain it properly, not briefly.', accent: '#7C5CFF' },

    // --- making it stick.
    { n: 11, frames: 105, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'turn it into flashcards', vo: 'Then I turn it into flashcards.', accent: '#4CC2FF' },
    { n: 12, frames: 95, screen: 'ankiStudy', camera: 'macro', text: 'before you forget', vo: 'They come back before you forget.', accent: '#4CC2FF' },

    // --- the hour you give it.
    { n: 13, frames: 100, screen: 'timer', mascot: 'guide', camera: 'push', text: 'A tree grows', vo: 'Set a session. A tree grows.', accent: '#22D3A6' },
    { n: 14, frames: 95, screen: 'treegallery', camera: 'trackRight', text: 'Twelve species', vo: 'Twelve species, earned in focused hours.', accent: '#22D3A6' },
    { n: 15, frames: 105, screen: 'progress', camera: 'pull', text: 'stays on your phone', vo: 'Your streak stays on your phone.', accent: '#F5B301' },

    // --- and the box that gets ticked, which is where the question started.
    { n: 16, frames: 95, screen: 'questionsLeaf', camera: 'macro', text: 'You never reopen it', vo: 'Tick it. You never reopen it.', focus: 0.28, accent: '#F5B301' },
    { n: 17, frames: 95, screen: 'glassHome', camera: 'orbit', text: 'how you like', vo: 'Make it look how you like.', accent: '#4CC2FF' },

    // --- one CTA, no second ask.
    { n: 18, frames: 105, screen: null, mascot: 'hero', camera: 'settle', text: 'Free on Google Play', vo: "That's Orbit. Free on Google Play.", accent: '#7C5CFF' },
  ],
};
