import type { AdScript } from './types';

/**
 * HyperFrames film B — "All of it, in one app".
 *
 * The companion to `hyperAsk`, and deliberately the opposite shape. That one
 * follows a single question the whole way through; this one is the tour. Both
 * are year-agnostic on the owner's instruction — `hyperAsk` carries the long
 * version of what the year-by-year cut got wrong, including a caption that
 * said one year over a screenshot of another.
 *
 * ## What replaces the years
 *
 * The film this succeeds was structured by year, so the years *were* its
 * spine: take them out and nothing holds the shots in order. What holds them
 * here is the study itself, in the order a night of revision actually happens
 * — find the question, see how often it repeats, read the answer, look at the
 * diagram, ask when it does not land, turn it into cards, sit down and work,
 * then look at what you did. A viewer in any year recognises all of it, which
 * is the point.
 *
 * ## The diagrams are the drawings, full frame
 *
 * Not a screenshot of a note with a diagram card in it. Those are captured
 * against the storage bucket and come back empty wherever it is unreachable,
 * which is what the owner photographed. These are the files themselves.
 *
 * ## Pacing
 *
 * Seventeen shots, about three and a half seconds each. `hyperAsk` has the
 * arithmetic for why a voiced sixty-second reel cannot hold many more than
 * that, and why the answer to "too slow" is the transition rather than the cut
 * rate.
 */
export const hyperAll: AdScript = {
  id: 'orbit-hyper-all',
  title: 'Orbit MBBS — All of it, in one app',
  format: 'reel',
  look: 'keynote',
  hyperOnly: true,
  voice: 'en-US-AvaNeural',
  rate: '+8%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide-night.wav',
  shots: [
    { n: 1, frames: 112, screen: 'glassHome', kicker: 'Orbit MBBS', text: 'One app, not four', silentText: 'One app, not four', vo: 'Four apps open, nothing started.', accent: '#7C5CFF' },
    { n: 2, frames: 98, screen: 'browse', kicker: 'Your subjects', text: 'All your subjects', silentText: 'All your subjects', vo: 'Every subject in one list.', accent: '#7C5CFF' },
    { n: 3, frames: 104, screen: 'questionsChapters', focus: 0.35, kicker: 'By chapter', text: 'Down to your chapter', silentText: 'Down to your chapter', vo: 'Down to the chapter you need.', accent: '#4CC2FF' },
    { n: 4, frames: 112, screen: 'questionsLeaf', focus: 0.28, kicker: 'The repeats', text: 'Stars = how often', silentText: 'Stars = how often', vo: 'The stars say which ones repeat.', accent: '#F5B301' },
    { n: 5, frames: 98, screen: 'questionsLeaf', focus: 0.28, kicker: 'The years', text: 'See the years asked', silentText: 'See the years asked', vo: 'And the years it was asked.', accent: '#F5B301' },
    { n: 6, frames: 100, screen: 'noteHero', kicker: 'Three taps', text: 'Triple-tap the question', silentText: 'Triple-tap the question', vo: 'Triple-tap for the answer.', accent: '#FF4D8D' },
    { n: 7, frames: 112, screen: 'noteBody', kicker: 'Exam-shaped', text: 'Written exam-shaped', silentText: 'Written exam-shaped', vo: 'Shaped like the paper you write.', accent: '#FF4D8D' },
    { n: 8, frames: 106, screen: 'plateBrachial', kicker: 'The picture', text: 'Its own diagram', silentText: 'Its own diagram', vo: 'With the diagram it needs.', accent: '#22D3A6' },
    { n: 9, frames: 112, screen: 'plateShoulder', kicker: 'Labelled', text: 'Every part labelled', silentText: 'Every part labelled', vo: 'Labelled, so you can draw it.', accent: '#22D3A6' },
    { n: 10, frames: 108, screen: 'chatdemo', kicker: 'Ask it', text: 'Ask AI', silentText: 'Ask AI', vo: 'Stuck? Ask, and it explains.', accent: '#7C5CFF' },
    { n: 11, frames: 104, screen: 'flashcards', kicker: 'Flashcards', text: 'Chapter to flashcards', silentText: 'Chapter to flashcards', vo: 'Any chapter becomes flashcards.', accent: '#4CC2FF' },
    { n: 12, frames: 104, screen: 'apkgHub', kicker: 'Anki', text: 'Import your deck', silentText: 'Import your deck', vo: 'Bring the Anki deck you have.', accent: '#4CC2FF' },
    { n: 13, frames: 106, screen: 'userNotesEdit', kicker: 'Your notes', text: 'Type it. Draw it.', silentText: 'Type it. Draw it.', vo: 'Write your notes, or draw them.', accent: '#FF4D8D' },
    { n: 14, frames: 104, screen: 'timer', kicker: 'Focus', text: 'Focus timer', silentText: 'Focus timer', vo: 'Set the clock and put it down.', accent: '#22D3A6' },
    { n: 15, frames: 138, screen: 'attendance', focus: 0.42, kicker: 'Attendance', text: 'What you can still miss', silentText: 'What you can still miss', vo: 'It says what you can still miss.', accent: '#F5B301' },
    { n: 16, frames: 120, screen: null, kicker: 'Orbit MBBS', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
