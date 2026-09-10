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
    // --- the host, before the product. She names the situation, nothing else.
    { n: 1, frames: 90, screen: null, mascot: 'hero', camera: 'settle', text: 'It is late', silentText: "2 AM. Exam at 9", vo: 'It is late. I know.', accent: '#7C5CFF' },
    { n: 2, frames: 90, screen: 'home', mascot: 'guide', camera: 'macro', text: 'Start here', silentText: "Six hours left", vo: 'Exam at nine. Start here.', focus: 0.2, accent: '#4CC2FF' },

    // --- the turn: what you actually do with the hours left.
    { n: 3, frames: 100, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'Pick the subject', silentText: "Open your year", vo: 'Open your year. Pick the subject.', accent: '#7C5CFF' },
    { n: 4, frames: 100, screen: 'questionsChapters', camera: 'push', text: 'down to chapters', silentText: "Sorted down to the chapter", vo: 'I sorted it down to chapters.', focus: 0.35, accent: '#7C5CFF' },
    { n: 5, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'the ones that repeat most', silentText: "Start with the repeats", vo: 'Start with the ones that repeat most.', focus: 0.28, accent: '#F5B301' },

    // --- the relief, which is the second half of every pain hook.
    { n: 6, frames: 110, screen: 'noteHero', mascot: 'guide', camera: 'push', text: 'A full answer opens', silentText: "A full answer in seconds", vo: 'Triple tap. A full answer opens.', accent: '#FF4D8D' },
    { n: 7, frames: 105, screen: 'plateCalots', camera: 'settle', text: 'you have to draw', silentText: "With the diagram you must draw", vo: 'With the diagram you have to draw.', accent: '#22D3A6' },
    { n: 8, frames: 100, screen: 'noteBody', camera: 'glideDown', text: 'the way examiners like reading', silentText: "Written exam-shaped", vo: 'Written the way examiners like reading.', accent: '#FF4D8D' },

    // --- she is still there when it does not make sense.
    { n: 9, frames: 100, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask me', silentText: "Stuck? Ask the AI", vo: 'Stuck on the mechanism? Ask me.', accent: '#7C5CFF' },
    { n: 10, frames: 95, screen: 'chatdemo', camera: 'macro', text: 'test you', silentText: "Then let it test you", vo: 'Then ask me to test you.', accent: '#7C5CFF' },
    { n: 11, frames: 100, screen: 'flashcards', camera: 'orbit', text: 'into flashcards', silentText: "Chapter to flashcards", vo: 'Turn the chapter into flashcards.', accent: '#4CC2FF' },

    // --- and she tells you to put it down, which is the un-obvious part.
    { n: 12, frames: 95, screen: 'timer', mascot: 'guide', camera: 'push', text: 'Phone down', silentText: "25 minutes. Phone down", vo: 'Twenty five minutes. Phone down.', accent: '#22D3A6' },
    { n: 13, frames: 100, screen: 'music', camera: 'macro', text: 'Nothing uploads', silentText: "Your own music. Nothing uploads", vo: 'Your own music. Nothing uploads.', accent: '#22D3A6' },
    { n: 14, frames: 95, screen: 'timerBottom', camera: 'pull', text: 'real minutes', silentText: "25 real minutes", vo: 'That is twenty five real minutes.', accent: '#22D3A6' },

    // --- counted, without asking anything of you.
    { n: 15, frames: 100, screen: 'progress', camera: 'pull', text: 'No account needed', silentText: "No account needed", vo: 'I count it. No account needed.', accent: '#F5B301' },
    { n: 16, frames: 95, screen: 'progressBottom', camera: 'trackRight', text: 'coloured in', silentText: "Every day you studied", vo: 'Every day you studied, coloured in.', accent: '#F5B301' },

    // --- the morning. The line the whole ad exists to earn.
    { n: 17, frames: 100, screen: 'homeLight', camera: 'pull', text: 'not walking in empty', silentText: "8 AM. Not empty-handed", vo: 'You are not walking in empty.', accent: '#4CC2FF' },
    { n: 18, frames: 120, screen: null, mascot: 'hero', camera: 'settle', text: 'Free on Google Play', silentText: "Orbit MBBS, free on Google Play", vo: 'I am Orbit. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
