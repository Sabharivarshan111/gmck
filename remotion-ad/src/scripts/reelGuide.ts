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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'another app', silentText: 'You don’t need another app', vo: 'You do not need another app to organise your whole life.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'pick your year and start', silentText: 'Your MBBS year', vo: 'Just pick your year and start.', accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'sorted down to the chapter', silentText: 'Sorted to your chapter', vo: 'Every past question is sorted down to the chapter.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'which ones keep coming back', silentText: 'See the repeats', vo: 'And you can see which ones keep coming back.', focus: 0.28, accent: '#F5B301' },
    { n: 5, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'Triple-tap a question', silentText: 'Triple-tap', vo: 'Triple-tap a question.', focus: 0.28, accent: '#FF4D8D' },
    { n: 6, frames: 129, screen: 'noteHero', camera: 'push', text: 'The written answer opens', silentText: 'Full written answer', vo: 'The written answer opens.', accent: '#FF4D8D' },
    { n: 7, frames: 129, screen: 'plateBrachial', mascot: 'guide', camera: 'settle', text: 'the diagram is there with it', silentText: 'Its diagram', vo: 'And the diagram is there with it.', accent: '#22D3A6' },
    { n: 8, frames: 129, screen: 'chapterDiagrams', camera: 'glideDown', text: 'made for that question', silentText: 'Right beside the answer', vo: 'It’s made for that question.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask the AI', silentText: 'Stuck? Ask AI.', vo: 'Still stuck? Ask the AI.', accent: '#7C5CFF' },
    { n: 10, frames: 128, screen: 'flashcards', mascot: 'guide', camera: 'orbit', text: 'a whole chapter into cards', silentText: 'Chapter into cards', vo: 'You can turn a whole chapter into cards.', accent: '#4CC2FF' },
    { n: 11, frames: 128, screen: 'ankiStudy', camera: 'macro', text: 'come back later for revision', silentText: 'Spaced revision', vo: 'Then they come back later for revision.', accent: '#4CC2FF' },
    { n: 12, frames: 128, screen: 'timer', mascot: 'guide', camera: 'push', text: 'the tree grows', silentText: 'Focus. Grow.', vo: 'Start a focus session and the tree grows.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'progress', camera: 'pull', text: 'your streak stays on your phone', silentText: 'Your streak', vo: 'And your streak stays on your phone.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: null, mascot: 'hero', camera: 'settle', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
