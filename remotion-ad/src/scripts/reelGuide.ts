import type { AdScript } from './types';

/**
 * Reel 4 — "Meet your guide". The mascot ad.
 *
 * ## Why a mascot at all
 *
 * The other five ads open on the product. This one opens on a face, and that
 * is the whole reason it exists as a fourth argument rather than a fourth
 * edit: a face is the fastest thing a person parses, it is the one opening
 * that cannot be mistaken for a screen recording of some other study app, and
 * it gives sixty seconds of feature list a **host** — somebody whose job is to
 * hand you from one thing to the next, so the ad reads as a tour rather than
 * as a list.
 *
 * The bot is not invented for the ad. It is `BotAvatar`, the avatar that has
 * been sitting inside the app's own Ask AI chat since the first cut of this
 * renderer, at 140px, behind a phone bezel, where nobody has ever really seen
 * it. `MascotStage` is what gives it the room.
 *
 * ## How it is staged
 *
 * `mascot: 'hero'` on the first and last shots — it has the frame to itself
 * and no device is drawn. In between, `mascot: 'guide'` recurs every second or
 * third shot: it steps in from the near corner, leans towards the phone, and
 * holds while the screen does the talking. It alternates sides, so it reads as
 * somebody moving around the room rather than as a decal in one place.
 *
 * It is deliberately NOT in every shot. A presenter who never leaves is a
 * presenter competing with the product; the shots it sits out are the ones
 * where the screen is the argument — the written answer, the plate, the
 * scheduler.
 *
 * ## Why the voice is slower than the other reels
 *
 * The three earlier reels run `+14%`, which is right for a hook-driven cut
 * that has to land a claim before the thumb moves. This one is a guided tour
 * and the brief for it was explicit: not robotic, not rushed. So `+0%`, and
 * the lines are written to the pace rather than the pace squeezed to the
 * lines: **117 words across 60 seconds**, and no shot's line exceeds ~2.5
 * words per second of its own length once ~0.4s of air is left before the cut.
 * Shot 1 is five words in 2.5 seconds. Nothing here has to be hurried.
 *
 * `en-US-AvaNeural` is female and single-language. Never a `*MultilingualNeural`
 * voice: those read "M.G.R." and "MBBS" with French phonemes.
 *
 * Frames are declared per shot and sum to REEL_FRAMES (1800). `npm run
 * preflight` fails if that stops being true.
 */
export const reelGuide: AdScript = {
  id: 'orbit-reel-guide',
  title: 'Orbit MBBS — Reel: Meet your guide',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    // --- the host arrives. Face first, product second.
    { n: 1, frames: 75, screen: null, mascot: 'hero', camera: 'settle', text: 'Meet your study guide', vo: 'Hi. I live inside Orbit.', accent: '#7C5CFF' },
    { n: 2, frames: 100, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'All four MBBS years', vo: 'I know all four years of MBBS.', accent: '#7C5CFF' },

    // --- the bank, and the thing about it nobody else has counted.
    { n: 3, frames: 105, screen: 'questionsChapters', camera: 'push', text: '5,545 questions, sorted', vo: 'Five and a half thousand questions, sorted.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 100, screen: 'questionsLeaf', camera: 'macro', text: 'Stars mean it repeats', vo: 'The stars tell you which ones repeat.', focus: 0.28, accent: '#F5B301' },

    // --- the payload. Front-loaded, because it is the reason to install.
    { n: 5, frames: 100, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'Triple-tap any question', vo: 'Triple-tap any question. Just watch.', focus: 0.28, accent: '#FF4D8D' },
    { n: 6, frames: 110, screen: 'noteHero', camera: 'push', text: 'A full handwritten answer', vo: 'A full handwritten answer, written for you.', accent: '#FF4D8D' },
    { n: 7, frames: 105, screen: 'noteBody', camera: 'glideDown', text: 'Written exam-shaped', vo: 'Laid out the way examiners like reading.', accent: '#FF4D8D' },

    // --- the diagrams, which is the part nothing else does.
    { n: 8, frames: 110, screen: 'plateBrachial', mascot: 'guide', camera: 'settle', text: 'And its own diagram', vo: 'And the diagram that belongs to it.', accent: '#22D3A6' },
    { n: 9, frames: 100, screen: 'noteDiagram', camera: 'pull', text: 'Picture, then theory', vo: 'Picture first, then the theory underneath.', accent: '#22D3A6' },
    { n: 10, frames: 100, screen: 'chapterDiagrams', camera: 'glideDown', text: '915 hand-drawn plates', vo: 'Nine hundred and fifteen hand-drawn plates.', accent: '#22D3A6' },

    // --- Ask AI. The mascot is the one asking, which is the join between the
    //     presenter and the feature — it is literally this avatar in the app.
    { n: 11, frames: 105, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Still stuck? Ask me', vo: 'Still stuck? Ask me. I explain properly.', accent: '#7C5CFF' },
    { n: 12, frames: 95, screen: 'chatdemo', camera: 'macro', text: 'Instant MCQs', vo: 'Ask for MCQs and I write them.', accent: '#7C5CFF' },

    // --- flashcards.
    { n: 13, frames: 100, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'Chapter to flashcards', vo: 'Turn any chapter into flashcards.', accent: '#4CC2FF' },
    { n: 14, frames: 95, screen: 'ankiStudy', camera: 'macro', text: 'Back before you forget', vo: 'They come back before you forget.', accent: '#4CC2FF' },

    // --- focus.
    { n: 15, frames: 105, screen: 'timer', mascot: 'guide', camera: 'push', text: 'Focus. A tree grows', vo: 'Start a session. A tree grows.', accent: '#22D3A6' },
    { n: 16, frames: 95, screen: 'treegallery', camera: 'trackRight', text: 'Twelve species', vo: 'Twelve species, earned in focused hours.', accent: '#22D3A6' },
    { n: 17, frames: 95, screen: 'progress', camera: 'pull', text: 'Your streak, your year', vo: 'Your streak stays on your phone.', accent: '#F5B301' },

    // --- the host closes it. One CTA, no second ask.
    { n: 18, frames: 105, screen: null, mascot: 'hero', camera: 'settle', text: 'Orbit MBBS · Google Play', vo: "That's Orbit. Free on Google Play.", accent: '#7C5CFF' },
  ],
};
