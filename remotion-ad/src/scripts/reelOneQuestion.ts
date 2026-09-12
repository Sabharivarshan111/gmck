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
    { n: 1, beats: 6, screen: 'questionsLeaf', camera: 'macro', kicker: 'Question bank', text: 'still don’t know where to start', focus: 0.28, accent: '#F5B301' , silentText: 'Read it twice. Still stuck.', vo: 'You open the question, read it twice, and still don’t know where to start.' },
    { n: 2, beats: 6, screen: 'questionsLeaf', camera: 'macro', kicker: 'Triple tap', text: 'Triple-tap it', focus: 0.28, accent: '#FF4D8D' , silentText: 'Triple-tap', vo: 'Triple-tap it.' },
    { n: 3, beats: 8, screen: 'noteHero', camera: 'push', kicker: 'Written notes', text: 'The written answer opens', accent: '#FF4D8D' , silentText: 'Full answer', vo: 'The written answer opens.' },
    { n: 4, beats: 6, screen: 'noteBody', camera: 'glideDown', kicker: 'Exam-shaped', text: 'up front', accent: '#FF4D8D' , silentText: 'High-yield points first', vo: 'The important bits are up front.' },
    { n: 5, beats: 6, screen: 'plateBrachial', camera: 'settle', kicker: 'Its own diagram', text: 'the diagram comes with the answer', accent: '#22D3A6' , silentText: 'Matching diagram', vo: 'And the diagram comes with the answer.' },
    { n: 6, beats: 4, screen: 'plateUlnar', camera: 'trackLeft', kicker: 'Only its own', text: 'hunt for another one', accent: '#22D3A6' , silentText: 'The diagram is right there', vo: 'You don’t have to hunt for another one.' },
    { n: 7, beats: 6, screen: 'askai', camera: 'push', kicker: 'Still stuck', text: 'Ask it', accent: '#7C5CFF' , silentText: 'Ask AI', vo: 'Still stuck? Ask it.' },
    { n: 8, beats: 6, screen: 'flashcards', camera: 'orbit', kicker: 'Flashcards', text: 'turn the chapter into cards', accent: '#4CC2FF' , silentText: 'Make flashcards', vo: 'Then turn the chapter into cards.' },
    { n: 9, beats: 6, screen: 'ankiStudy', camera: 'macro', kicker: 'Spaced repetition', text: 'come back sooner', accent: '#4CC2FF' , silentText: 'Hard cards come back sooner', vo: 'The tougher ones can come back sooner.' },
    { n: 10, beats: 4, screen: 'timer', camera: 'push', kicker: 'Focus timer', text: 'twenty-five minutes and focus', accent: '#22D3A6' , silentText: 'Twenty-five minutes', vo: 'Set twenty-five minutes and focus.' },
    { n: 11, beats: 6, screen: 'timerBottom', camera: 'macro', kicker: 'A tree grows', text: 'watch the tree grow', accent: '#22D3A6' , silentText: 'Grow while you study', vo: 'And watch the tree grow while you work.' },
    { n: 12, beats: 4, screen: 'music', camera: 'macro', kicker: 'Your own music', text: 'your own music', accent: '#22D3A6' , silentText: 'Your music', vo: 'Play your own music in the background.' },
    { n: 13, beats: 6, screen: 'progress', camera: 'pull', kicker: 'My progress', text: 'see what you actually did', accent: '#F5B301' , silentText: 'See your progress', vo: 'Then look back and see what you actually did.' },
    { n: 14, beats: 6, screen: 'outroCard', camera: 'settle', text: 'Download Orbit', accent: '#7C5CFF' , silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.' },
  ],
};
