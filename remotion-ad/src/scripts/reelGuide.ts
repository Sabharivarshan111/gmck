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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'No time for another app', silentText: 'No time for another app', vo: 'You do not have time to learn another app.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'All four MBBS years', silentText: 'All four MBBS years', vo: 'I know all four MBBS years.', accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'Sorted to your chapter', silentText: 'Sorted to your chapter', vo: 'Every past question, sorted down to your chapter.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'The ones that come back', silentText: 'The ones that come back', vo: 'And it marks the ones that keep coming back.', focus: 0.28, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'Triple-tap any question', silentText: 'Triple-tap any question', vo: 'Triple-tap any question and watch.', focus: 0.28, accent: '#FF4D8D' },
    { n: 6, frames: 129, screen: 'noteHero', camera: 'push', text: 'A full handwritten answer', silentText: 'A full handwritten answer', vo: 'I write you a full handwritten answer.', accent: '#FF4D8D' },
    { n: 7, frames: 129, screen: 'plateBrachial', mascot: 'guide', camera: 'settle', text: 'Its own diagram', silentText: 'Its own diagram, every time', vo: 'Its own diagram comes with it.', accent: '#22D3A6' },
    { n: 8, frames: 129, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Drawn for that question', silentText: 'Drawn for that question alone', vo: 'Labelled, and drawn for that question alone.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask me anything', silentText: 'Stuck? Ask the AI', vo: 'Still stuck? Ask me anything at all.', accent: '#7C5CFF' },
    { n: 10, frames: 128, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'Turn any chapter into flashcards', silentText: 'Any chapter to flashcards', vo: 'Turn any chapter into flashcards.', accent: '#4CC2FF' },
    { n: 11, frames: 128, screen: 'ankiStudy', camera: 'macro', text: 'Before you forget', silentText: 'They return before you forget', vo: 'They come back before you forget.', accent: '#4CC2FF' },
    { n: 12, frames: 128, screen: 'timer', mascot: 'guide', camera: 'push', text: 'A tree grows', silentText: 'Focus, and a tree grows', vo: 'Start a session and a tree grows.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'progress', camera: 'pull', text: 'Your streak needs no account', silentText: 'Your streak needs no account', vo: 'Your streak needs no account.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: null, mascot: 'hero', camera: 'settle', text: 'Free on Google Play', silentText: 'Orbit MBBS, free on Google Play', vo: "That's Orbit. Free on Google Play.", accent: '#7C5CFF' },
  ],
};
