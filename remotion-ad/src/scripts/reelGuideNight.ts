import type { AdScript } from './types';

/**
 * Reel 8 — "It is late". The mascot's third ad, and the only one with a pain
 * hook.
 *
 * ## Why the same character can carry this
 *
 * `reelGuide` tours the app and `reelGuideAnswer` works one question through
 * it. Both open on the product's terms. This one opens on the viewer's: it is
 * two in the morning, the exam is at nine, and the first thing the host says
 * is that she knows. Nothing is sold for the first six seconds.
 *
 * A mascot is what makes that survivable. The same scene without a face is
 * `reelSixHours`, which states the pain as a clock and a number and then
 * pivots to features — effective, and cold. Here somebody is in the room, and
 * the whole ad is her staying calm while the night is not.
 *
 * The close is the point of it. Every other reel ends on the app; this one
 * ends on the morning, with the one line the whole thing is built to earn:
 * "You are not walking in empty."
 *
 * ## One character, one voice
 *
 * `en-US-AvaNeural` at `+0%`, the same as the other two mascot ads and for the
 * same reason — the mascot is `BotAvatar`, the Ask AI chat's own face, and
 * three voices would make it three characters. The mood is carried by the bed:
 * `bed-guide-night` is the slowest here at twenty bars and the only one with
 * **no pulse at all for its first two bars**, because a beat under "it is
 * late" argues with the line.
 *
 * ## The rules this file obeys
 *
 * * `text` is a **verbatim span of `vo`** — preflight fails the render
 *   otherwise, and `ReelHeadline` lights each word as it is said.
 * * `vo` fits its shot at about 2.3 words per second less 0.4s of air, with
 *   numbers spelled out.
 * * `frames` sum to exactly REEL_FRAMES (1800). The shape is its own: a slow
 *   two-shot open, a brisk middle, and the longest shot in any reel here
 *   (120 frames) on the close, because that line needs the room.
 * * No quantity shaped like a year.
 */
export const reelGuideNight: AdScript = {
  id: 'orbit-reel-guide-night',
  title: 'Orbit MBBS — Reel: It is late',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide-night.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'It’s late. I know', silentText: 'Late, and the exam is close', vo: 'It’s late. I know.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'home', mascot: 'guide', camera: 'macro', text: 'start with the important stuff', silentText: 'Start here', vo: 'Exam at nine. So start with the important stuff.', focus: 0.2, accent: '#4CC2FF' },
    { n: 3, frames: 129, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'pick the subject', silentText: 'Pick your subject', vo: 'Open your year and pick the subject.', accent: '#7C5CFF' },
    { n: 4, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'the questions that repeat', silentText: 'Start with the repeats', vo: 'Start with the questions that repeat.', focus: 0.28, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'noteHero', mascot: 'guide', camera: 'push', text: 'open the answer', silentText: 'Full answer', vo: 'Triple-tap one and open the answer.', accent: '#FF4D8D' },
    { n: 6, frames: 129, screen: 'plateCalots', camera: 'settle', text: 'The diagram is right there', silentText: 'Diagram included', vo: 'The diagram is right there too.', accent: '#22D3A6' },
    { n: 7, frames: 129, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask the AI', silentText: 'Stuck? Ask AI.', vo: 'Something doesn’t make sense? Ask the AI.', accent: '#7C5CFF' },
    { n: 8, frames: 129, screen: 'chatdemo', camera: 'macro', text: 'let it quiz you', silentText: 'Test yourself', vo: 'Then let it quiz you.', accent: '#7C5CFF' },
    { n: 9, frames: 128, screen: 'flashcards', camera: 'orbit', text: 'Turn the chapter into flashcards', silentText: 'Chapter into flashcards', vo: 'Turn the chapter into flashcards.', accent: '#4CC2FF' },
    { n: 10, frames: 128, screen: 'timer', mascot: 'guide', camera: 'push', text: 'Phone down', silentText: 'Twenty-five minutes', vo: 'Twenty-five minutes. Phone down.', accent: '#22D3A6' },
    { n: 11, frames: 128, screen: 'music', camera: 'macro', text: 'Use your own music', silentText: 'Your own music', vo: 'Use your own music. Nothing needs to be streamed.', accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'progress', camera: 'pull', text: 'stays on your phone', silentText: 'No account needed', vo: 'And your progress stays on your phone.', accent: '#F5B301' },
    { n: 13, frames: 128, screen: 'progressBottom', camera: 'trackRight', text: 'the days you actually studied', silentText: 'Days you studied', vo: 'You can see the days you actually studied.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: null, mascot: 'hero', camera: 'settle', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
