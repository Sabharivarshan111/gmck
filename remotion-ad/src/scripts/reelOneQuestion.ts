import type { AdScript } from './types';

/**
 * Reel 6 — "One question, end to end". Subtitle-led, black, cut to 120 BPM.
 *
 * The companion to `reelFunctions`, and deliberately the opposite shape.
 * That one is a catalogue: twenty-one functions, no thread. This one is a
 * **thread**: it follows a single question from the list to a written answer,
 * to its plate, to a flashcard, to a tree, to a ticked box. Same discipline —
 * the caption names a real function on every shot — but the shots are in an
 * order that means something, so a viewer who watches it twice gets a story
 * the second time.
 *
 * That is also why it is faster. `bpm: 120`, which is 15 frames a beat at
 * 30fps, so a 4-beat shot is 2.0s and a 6-beat shot is 3.0s. A catalogue can
 * breathe; a sequence has somewhere to be.
 *
 * Black ground and `BeatRoom` lighting, exactly as `reelFunctions` — see the
 * note there for why. No voice: the captions are the argument, and they follow
 * the same four copy rules written out in that file — the caption describes
 * the screen it is over, no caption ends in a full stop, no quantity falls
 * between 1900 and 2100 where it would be read as a date, and every
 * apostrophe is a plain ASCII one because a curly one breaks the parser.
 *
 * **To use your own music:** set `bpm` to your track's tempo and point `music`
 * at the file. The `beats` below are proportions, re-fitted to whatever grid
 * that tempo gives, and the reel stays exactly 1800 frames.
 * `.agents/video/BEAT-SYNC.md` is the long version.
 *
 * The `beats` sum to 120 — the number of beats in sixty seconds at 120 BPM.
 */
export const reelOneQuestion: AdScript = {
  id: 'orbit-reel-one-question',
  title: 'Orbit MBBS — Reel: One question, end to end',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  bpm: 120,
  music: 'audio/bed/bed-one-question.wav',
  shots: [
    { n: 1, beats: 6, screen: 'questionsLeaf', camera: 'macro', kicker: 'Question bank', text: 'Read it twice. Closed it.', focus: 0.28, accent: '#F5B301' , silentText: 'Read it twice. Closed it.', vo: 'You open the question, read it twice, and close it.' },
    { n: 2, beats: 6, screen: 'questionsLeaf', camera: 'macro', kicker: 'Triple tap', text: 'Tap it three times', focus: 0.28, accent: '#FF4D8D' , silentText: 'Tap it three times', vo: 'Tap it three times and watch.' },
    { n: 3, beats: 8, screen: 'noteHero', camera: 'push', kicker: 'Written notes', text: 'A full answer, written out', accent: '#FF4D8D' , silentText: 'A full answer, written out', vo: 'A full answer, written out for you.' },
    { n: 4, beats: 6, screen: 'noteBody', camera: 'glideDown', kicker: 'Exam-shaped', text: 'High-yield facts at the top', accent: '#FF4D8D' , silentText: 'High-yield facts at the top', vo: 'High-yield facts at the top, always.' },
    { n: 5, beats: 6, screen: 'plateBrachial', camera: 'settle', kicker: 'Its own diagram', text: 'The diagram for that question', accent: '#22D3A6' , silentText: 'The diagram for that question', vo: 'The diagram for that question comes too.' },
    { n: 6, beats: 4, screen: 'plateUlnar', camera: 'trackLeft', kicker: 'Only its own', text: "Never a neighbour's picture", accent: '#22D3A6' , silentText: "Never a neighbour's picture", vo: "Never a neighbour's picture. Only its own." },
    { n: 7, beats: 6, screen: 'askai', camera: 'push', kicker: 'Still stuck', text: 'Ask it in plain words', accent: '#7C5CFF' , silentText: 'Ask it in plain words', vo: 'Still stuck? Ask it in plain words.' },
    { n: 8, beats: 6, screen: 'flashcards', camera: 'orbit', kicker: 'Flashcards', text: 'Turn the chapter into cards', accent: '#4CC2FF' , silentText: 'Turn the chapter into cards', vo: 'Turn the chapter into cards.' },
    { n: 9, beats: 6, screen: 'ankiStudy', camera: 'macro', kicker: 'Spaced repetition', text: 'Hard cards come back sooner', accent: '#4CC2FF' , silentText: 'Hard cards come back sooner', vo: 'Hard cards come back sooner.' },
    { n: 10, beats: 4, screen: 'timer', camera: 'push', kicker: 'Focus timer', text: 'Twenty-five minutes', accent: '#22D3A6' , silentText: '25 minutes, kept honestly', vo: 'Twenty-five minutes and a timer that keeps them.' },
    { n: 11, beats: 6, screen: 'timerBottom', camera: 'macro', kicker: 'A tree grows', text: 'An oak grows while you work', accent: '#22D3A6' , silentText: 'An oak grows while you work', vo: 'An oak grows while you work.' },
    { n: 12, beats: 4, screen: 'music', camera: 'macro', kicker: 'Your own music', text: 'Your own music', accent: '#22D3A6' , silentText: 'Your own music, never uploaded', vo: 'Your own music that never leaves your phone.' },
    { n: 13, beats: 6, screen: 'progress', camera: 'pull', kicker: 'My progress', text: 'Just a name and your year', accent: '#F5B301' , silentText: 'Just a name and your year', vo: 'Just a name and your year. Nothing else.' },
    { n: 14, beats: 6, screen: 'outroCard', camera: 'settle', kicker: 'Free on Google Play', text: 'Orbit MBBS', accent: '#7C5CFF' , silentText: 'Orbit MBBS', vo: 'Orbit MBBS. Free on Google Play.' },
  ],
};
