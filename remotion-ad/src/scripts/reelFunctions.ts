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
  noVoice: true,
  bpm: 100,
  music: 'audio/bed/bed-functions.wav',
  shots: [
    // --- hook: two snaps. The number, then the thing about the number.
    // Four beats is 2.4s, which is over the ~1.7s at which a Reels viewer has
    // already decided — so the claim is in the FIRST shot, not built up to.
    { n: 1, beats: 4, screen: 'questionsLeaf', camera: 'macro', kicker: 'Question bank', text: '5,634 past exam questions', focus: 0.28, accent: '#F5B301' },
    { n: 2, beats: 4, screen: 'questionsLeaf', camera: 'macro', kicker: 'Repeat markers', text: '3,463 have been asked before', focus: 0.28, accent: '#F5B301' },

    // --- what is in there.
    { n: 3, beats: 4, screen: 'browse', camera: 'trackLeft', kicker: 'All four years', text: 'Every subject in your year', accent: '#7C5CFF' },
    { n: 4, beats: 6, screen: 'questionsChapters', camera: 'push', kicker: 'Subject and chapter', text: 'Broken down to the chapter', focus: 0.35, accent: '#7C5CFF' },
    { n: 5, beats: 6, screen: 'questionsLeaf', camera: 'macro', kicker: 'Importance stars', text: 'Four stars, four exams', focus: 0.28, accent: '#F5B301' },

    // --- the payload.
    { n: 6, beats: 6, screen: 'noteHero', camera: 'push', kicker: 'Triple tap', text: 'A full answer, written out', accent: '#FF4D8D' },
    { n: 7, beats: 6, screen: 'noteBody', camera: 'glideDown', kicker: 'Written notes', text: 'The high-yield lines are marked', accent: '#FF4D8D' },

    // --- the diagrams.
    { n: 8, beats: 6, screen: 'plateBrachial', camera: 'settle', kicker: 'Exam diagrams', text: '250 diagrams, every part labelled', accent: '#22D3A6' },
    { n: 9, beats: 4, screen: 'noteDiagram', camera: 'pull', kicker: 'Inside the note', text: 'Picture first, then the theory', accent: '#22D3A6' },

    // --- AI.
    { n: 10, beats: 6, screen: 'askai', camera: 'push', kicker: 'Ask AI', text: 'Ask any medical question', accent: '#7C5CFF' },
    { n: 11, beats: 4, screen: 'chatdemo', camera: 'macro', kicker: 'Follow-ups', text: 'Then ask it to test you', accent: '#7C5CFF' },

    // --- cards.
    { n: 12, beats: 6, screen: 'flashcards', camera: 'orbit', kicker: 'Flashcards', text: 'Anki-style cards for any chapter', accent: '#4CC2FF' },
    { n: 13, beats: 4, screen: 'ankiStudy', camera: 'macro', kicker: 'Spaced repetition', text: 'Hard cards come back sooner', accent: '#4CC2FF' },
    { n: 14, beats: 4, screen: 'apkgHub', camera: 'push', kicker: 'Your pace', text: 'You choose how many a day', accent: '#4CC2FF' },

    // --- focus.
    { n: 15, beats: 6, screen: 'timer', camera: 'push', kicker: 'Focus timer', text: 'Tap play to plant an oak', accent: '#22D3A6' },
    { n: 16, beats: 4, screen: 'treegallery', camera: 'trackRight', kicker: 'Twelve species', text: 'Unlocked by the hours you focus', accent: '#22D3A6' },
    { n: 17, beats: 4, screen: 'music', camera: 'macro', kicker: 'Your own music', text: 'Straight from your phone', accent: '#22D3A6' },

    // --- the reader's own work.
    { n: 18, beats: 4, screen: 'userNotesEdit', camera: 'glideDown', kicker: 'Your own notes', text: 'Headings and bullets as you type', accent: '#FF4D8D' },
    { n: 19, beats: 4, screen: 'progress', camera: 'pull', kicker: 'My progress', text: 'A name and a year to start', accent: '#F5B301' },
    { n: 20, beats: 4, screen: 'glassHome', camera: 'orbit', kicker: 'Themes', text: 'Four themes, or build your own', accent: '#4CC2FF' },

    // --- one CTA, no second ask.
    { n: 21, beats: 4, screen: 'outroCard', camera: 'settle', kicker: 'Free on Google Play', text: 'Orbit MBBS', accent: '#7C5CFF' },
  ],
};
