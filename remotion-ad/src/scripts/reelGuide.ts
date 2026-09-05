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
 * ## It is the mascot talking, so it talks like one
 *
 * Every line here is the character speaking in the first person — "I know all
 * four MBBS years", "Ask me anything" — because a host that narrates itself in
 * the third person is a brochure with a cartoon stuck on the front. The
 * register is calm and plain: no exclamation marks, no stacked claims, one
 * idea per shot, and never a sentence a person would not say out loud.
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
 * ## The headline is a span of the spoken line, always
 *
 * `text` is not a second piece of copy that happens to agree with `vo`. It is
 * a **word-for-word run of words lifted out of `vo`**, so the sentence the
 * viewer reads is inside the sentence they hear. It used to be written
 * separately, and a shot that showed one claim while saying another read as
 * two ads playing at once — which is exactly how it was reported. Two to five
 * words, so it still lands as a headline at phone size.
 *
 * ## Why the voice is slower than the other reels
 *
 * The three earlier reels run `+14%`, which is right for a hook-driven cut
 * that has to land a claim before the thumb moves. This one is a guided tour
 * and the brief for it was explicit: not robotic, not rushed. So `+0%`, and
 * the lines are written to the pace rather than the pace squeezed to the
 * lines: **105 words across 60 seconds**, and no shot's line exceeds ~2.3
 * words per second of its own length once ~0.4s of air is left before the cut.
 * Shot 1 is four words in 2.5 seconds. Nothing here has to be hurried.
 *
 * `en-US-AvaNeural` is female and single-language. Never a `*MultilingualNeural`
 * voice: those read "M.G.R." and "MBBS" with French phonemes. Numbers are
 * spelled out for the same reason — a numeral is read back unpredictably.
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
    { n: 1, frames: 75, screen: null, mascot: 'hero', camera: 'settle', text: 'I live inside Orbit', vo: 'I live inside Orbit.', accent: '#7C5CFF' },
    { n: 2, frames: 100, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'All four MBBS years', vo: 'I know all four MBBS years.', accent: '#7C5CFF' },

    // --- the bank, and the thing about it nobody else has counted.
    { n: 3, frames: 105, screen: 'questionsChapters', camera: 'push', text: 'Five thousand six hundred questions', vo: 'Five thousand six hundred questions, all sorted.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 100, screen: 'questionsLeaf', camera: 'macro', text: 'Three thousand of them repeat', vo: 'Over three thousand of them repeat.', focus: 0.28, accent: '#F5B301' },

    // --- the payload. Front-loaded, because it is the reason to install.
    { n: 5, frames: 100, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'Triple-tap any question', vo: 'Triple-tap any question and watch.', focus: 0.28, accent: '#FF4D8D' },
    { n: 6, frames: 110, screen: 'noteHero', camera: 'push', text: 'A full handwritten answer', vo: 'I write you a full handwritten answer.', accent: '#FF4D8D' },
    { n: 7, frames: 105, screen: 'noteBody', camera: 'glideDown', text: 'The way examiners read', vo: 'Laid out the way examiners read.', accent: '#FF4D8D' },

    // --- the diagrams, which is the part nothing else does.
    { n: 8, frames: 110, screen: 'plateBrachial', mascot: 'guide', camera: 'settle', text: 'Its own diagram', vo: 'Its own diagram comes with it.', accent: '#22D3A6' },
    { n: 9, frames: 100, screen: 'noteDiagram', camera: 'pull', text: 'Picture first', vo: 'Picture first, then the theory.', accent: '#22D3A6' },
    { n: 10, frames: 100, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Two hundred and fifty plates', vo: 'Two hundred and fifty plates.', accent: '#22D3A6' },

    // --- Ask AI. The mascot is the one asking, which is the join between the
    //     presenter and the feature — it is literally this avatar in the app.
    { n: 11, frames: 105, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask me anything', vo: 'Still stuck? Ask me anything at all.', accent: '#7C5CFF' },
    { n: 12, frames: 95, screen: 'chatdemo', camera: 'macro', text: 'Ask for MCQs', vo: 'Ask for MCQs. I write them.', accent: '#7C5CFF' },

    // --- flashcards.
    { n: 13, frames: 100, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'Turn any chapter into flashcards', vo: 'Turn any chapter into flashcards.', accent: '#4CC2FF' },
    { n: 14, frames: 95, screen: 'ankiStudy', camera: 'macro', text: 'Before you forget', vo: 'They come back before you forget.', accent: '#4CC2FF' },

    // --- focus.
    { n: 15, frames: 105, screen: 'timer', mascot: 'guide', camera: 'push', text: 'A tree grows', vo: 'Start a session and a tree grows.', accent: '#22D3A6' },
    { n: 16, frames: 95, screen: 'treegallery', camera: 'trackRight', text: 'Twelve species', vo: 'Twelve species, earned in focused hours.', accent: '#22D3A6' },
    { n: 17, frames: 95, screen: 'progress', camera: 'pull', text: 'Your streak needs no account', vo: 'Your streak needs no account.', accent: '#F5B301' },

    // --- the host closes it. One CTA, no second ask.
    { n: 18, frames: 105, screen: null, mascot: 'hero', camera: 'settle', text: 'Free on Google Play', vo: "That's Orbit. Free on Google Play.", accent: '#7C5CFF' },
  ],
};
