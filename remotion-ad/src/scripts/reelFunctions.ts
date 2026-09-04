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
 * that says "5,545 questions, sorted by subject, with stars and years" says
 * nothing at all at 2.4 seconds. Twenty-one shots, twenty-one functions.
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
    { n: 1, beats: 4, screen: 'questionsLeaf', camera: 'macro', kicker: 'Question bank', text: '5,545 exam questions', focus: 0.28, accent: '#F5B301' },
    { n: 2, beats: 4, screen: 'questionsLeaf', camera: 'macro', kicker: 'Repeat markers', text: '2,025 show the years asked', focus: 0.28, accent: '#F5B301' },

    // --- what is in there.
    { n: 3, beats: 4, screen: 'browse', camera: 'trackLeft', kicker: 'All four years', text: 'First year to final year', accent: '#7C5CFF' },
    { n: 4, beats: 6, screen: 'questionsChapters', camera: 'push', kicker: 'Subject and chapter', text: 'Sorted down to the chapter', focus: 0.35, accent: '#7C5CFF' },
    { n: 5, beats: 6, screen: 'questionsLeaf', camera: 'macro', kicker: 'Importance stars', text: 'Stars mean frequency', focus: 0.28, accent: '#F5B301' },

    // --- the payload.
    { n: 6, beats: 6, screen: 'noteHero', camera: 'push', kicker: 'Triple tap', text: 'A full handwritten answer', accent: '#FF4D8D' },
    { n: 7, beats: 6, screen: 'noteBody', camera: 'glideDown', kicker: 'Handwritten notes', text: 'Headings, points, PYQ years', accent: '#FF4D8D' },

    // --- the diagrams.
    { n: 8, beats: 6, screen: 'plateBrachial', camera: 'settle', kicker: 'Exam diagrams', text: '915 hand-drawn plates', accent: '#22D3A6' },
    { n: 9, beats: 4, screen: 'noteDiagram', camera: 'pull', kicker: 'One question, its own plate', text: 'Picture, then theory', accent: '#22D3A6' },

    // --- AI.
    { n: 10, beats: 6, screen: 'askai', camera: 'push', kicker: 'Ask AI', text: 'Ask anything, any time', accent: '#7C5CFF' },
    { n: 11, beats: 4, screen: 'chatdemo', camera: 'macro', kicker: 'Instant MCQs', text: 'It writes you a quiz', accent: '#7C5CFF' },

    // --- cards.
    { n: 12, beats: 6, screen: 'flashcards', camera: 'orbit', kicker: 'Flashcards', text: 'Any chapter, spaced repetition', accent: '#4CC2FF' },
    { n: 13, beats: 4, screen: 'ankiStudy', camera: 'macro', kicker: 'The scheduler', text: 'Back before you forget', accent: '#4CC2FF' },
    { n: 14, beats: 4, screen: 'apkgHub', camera: 'push', kicker: 'Import .apkg', text: 'Your Anki deck opens', accent: '#4CC2FF' },

    // --- focus.
    { n: 15, beats: 6, screen: 'timer', camera: 'push', kicker: 'Focus timer', text: 'A tree grows while you work', accent: '#22D3A6' },
    { n: 16, beats: 4, screen: 'treegallery', camera: 'trackRight', kicker: 'Twelve species', text: 'Earned in focused hours', accent: '#22D3A6' },
    { n: 17, beats: 4, screen: 'music', camera: 'macro', kicker: 'Your own music', text: 'Plays from your phone', accent: '#22D3A6' },

    // --- the reader's own work.
    { n: 18, beats: 4, screen: 'userNotesEdit', camera: 'glideDown', kicker: 'Write and draw', text: 'Your notes, your stylus', accent: '#FF4D8D' },
    { n: 19, beats: 4, screen: 'progress', camera: 'pull', kicker: 'Streak and XP', text: 'Your whole year mapped', accent: '#F5B301' },
    { n: 20, beats: 4, screen: 'glassHome', camera: 'orbit', kicker: 'Themes', text: 'Four themes, or build your own', accent: '#4CC2FF' },

    // --- one CTA, no second ask.
    { n: 21, beats: 4, screen: 'outroCard', camera: 'settle', kicker: 'Free on Google Play', text: 'Orbit MBBS', accent: '#7C5CFF' },
  ],
};
