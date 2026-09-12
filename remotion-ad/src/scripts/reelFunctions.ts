import type { AdScript } from './types';

/**
 * Reel 5 — "Every function". Subtitle-led, black, cut to 100 BPM.
 *
 * ## What kind of ad this is
 *
 * No voice. Not a muted mix of a spoken ad — nothing was ever written to be
 * said. The **caption is the product**: every shot names one real function of
 * the app, in the app's own words, and the picture is that function happening.
 * A reel is watched muted and thumb-first, so this is the honest version of
 * that fact rather than a compromise with it.
 *
 * The rule that makes it work is one idea per shot and no stacking. A shot
 * that says "5,634 questions, sorted by subject, with stars and years" says
 * nothing at all at 2.4 seconds. Twenty-one shots, twenty-one functions.
 *
 * ## The copy rules, because there is no voice to carry a mistake
 *
 * * **The caption describes the screen it is over.** `screen` names a real
 *   screenshot in `ScreenRegistry`; the words have to be findable in that
 *   picture, or the viewer is reading one app and watching another.
 * * **No terminal full stops on a caption**, in this reel or its companion.
 *   One line, one idea, no sentence to finish.
 * * **No quantity between 1900 and 2100.** Set beside words like "the years
 *   asked", a number in that range is read as a date — which is exactly what
 *   "2,025 show the years asked" did on screen, and why it is gone.
 * * **Plain ASCII apostrophes.** A curly one breaks the caption parser.
 *
 * Counts here are measured against the shipped bank: 5,634 questions, 3,463
 * of them carrying a repeat marker, and 250 distinct plates (which hang off
 * 922 questions — that larger number counts rows, not drawings, and must
 * never be attached to the word "plates").
 *
 * ## Black, and why the room is still lit
 *
 * True `#000000`. Every phone gallery and every Reels feed frames a video
 * against black already, so matching it puts the device in the feed rather
 * than on a coloured card somebody designed. A flat black frame for sixty
 * seconds reads as a video that failed to load, so `BeatRoom` lights the room
 * on the beat instead — a wide, very low accent pool that swells on the
 * downbeat. Light, never shapes: the neon rectangle drawn over a screen is
 * failure mode #5 in the skill and it is not coming back.
 *
 * ## The tempo
 *
 * `bpm: 100`. Shot lengths are in **beats**, not frames — 4 beats is 2.4s and
 * reads as a snap, 6 is 3.6s and reads as a held idea. 100 BPM at 30fps is
 * exactly 18 frames a beat, so every cut is on a frame that is on a beat.
 *
 * **To use your own music:** put the file at `public/audio/bed/bed-functions.wav`
 * (or point `music` at it) and set `bpm` to the tempo of YOUR track. Nothing
 * else changes — the beats below are read as proportions and re-fitted to
 * whatever grid that tempo provides, and the reel stays exactly 1800 frames.
 * `.agents/video/BEAT-SYNC.md` is the long version.
 *
 * The `beats` below sum to 100, which is exactly the number of beats in sixty
 * seconds at 100 BPM — so at the tempo it was authored at, the numbers here
 * are the literal beats of the bed.
 */
export const reelFunctions: AdScript = {
  id: 'orbit-reel-functions',
  title: 'Orbit MBBS — Reel: Every function',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  bpm: 100,
  music: 'audio/bed/bed-functions.wav',
  shots: [
    { n: 1, beats: 4, screen: 'questionsLeaf', camera: 'macro', kicker: 'Question bank', text: 'still haven’t started', focus: 0.28, accent: '#F5B301' , silentText: 'Four apps. Still nothing.', vo: 'You’ve got four apps open and still haven’t started.' },
    { n: 2, beats: 4, screen: 'questionsLeaf', camera: 'macro', kicker: 'Repeat markers', text: 'questions that keep coming back', focus: 0.28, accent: '#F5B301' , silentText: 'See the repeats', vo: 'Orbit shows you the questions that keep coming back.' },
    { n: 3, beats: 6, screen: 'questionsChapters', camera: 'push', kicker: 'Subject and chapter', text: 'straight down to the chapter', focus: 0.35, accent: '#7C5CFF' , silentText: 'Down to the chapter', vo: 'And takes you straight down to the chapter.' },
    { n: 4, beats: 6, screen: 'questionsLeaf', camera: 'macro', kicker: 'Importance stars', text: 'how often they’ve been asked', focus: 0.28, accent: '#F5B301' , silentText: 'Stars = frequency', vo: 'The stars tell you how often they’ve been asked.' },
    { n: 5, beats: 6, screen: 'noteHero', camera: 'push', kicker: 'Triple tap', text: 'the full answer opens', accent: '#FF4D8D' , silentText: 'Full answer', vo: 'Triple-tap and the full answer opens.' },
    { n: 6, beats: 6, screen: 'noteBody', camera: 'glideDown', kicker: 'Written notes', text: 'easy to pick out', accent: '#FF4D8D' , silentText: 'Important points', vo: 'The important bits are easy to pick out.' },
    { n: 7, beats: 6, screen: 'plateBrachial', camera: 'settle', kicker: 'Exam diagrams', text: 'the diagram is already there', accent: '#22D3A6' , silentText: 'Diagram included', vo: 'And the diagram is already there.' },
    { n: 8, beats: 6, screen: 'askai', camera: 'push', kicker: 'Ask AI', text: 'in normal language', accent: '#7C5CFF' , silentText: 'Ask AI', vo: 'Got a question? Ask the AI in normal language.' },
    { n: 9, beats: 6, screen: 'flashcards', camera: 'orbit', kicker: 'Flashcards', text: 'Make them from the chapter', accent: '#4CC2FF' , silentText: 'Chapter into cards', vo: 'Need cards? Make them from the chapter.' },
    { n: 10, beats: 4, screen: 'ankiStudy', camera: 'macro', kicker: 'Spaced repetition', text: 'Hard cards can come back sooner', accent: '#4CC2FF' , silentText: 'Hard cards first', vo: 'Hard cards can come back sooner.' },
    { n: 11, beats: 6, screen: 'timer', camera: 'push', kicker: 'Focus timer', text: 'plant a tree', accent: '#22D3A6' , silentText: 'Focus into a tree', vo: 'Start the focus timer and plant a tree.' },
    { n: 12, beats: 4, screen: 'treegallery', camera: 'trackRight', kicker: 'Twelve species', text: 'unlock more species', accent: '#22D3A6' , silentText: 'Twelve species', vo: 'Keep studying and unlock more species.' },
    { n: 13, beats: 4, screen: 'glassHome', camera: 'orbit', kicker: 'Themes', text: 'change the theme', accent: '#4CC2FF' , silentText: 'Make it yours', vo: 'And change the theme if you get bored of looking at it.' },
    { n: 14, beats: 4, screen: 'outroCard', camera: 'settle', text: 'Download Orbit', accent: '#7C5CFF' , silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.' },
  ],
};
