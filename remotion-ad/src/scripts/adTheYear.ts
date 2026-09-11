import type { AdScript } from './types';

/**
 * Ad — "The year you are in" (the `keynote` look).
 *
 * ## The shape
 *
 * One claim at a time, in large type, over a dimmed full-bleed screen. No
 * device, no mascot, no camera move — the screen is the room the words are
 * standing in rather than the object being pointed at.
 *
 * This is the second of the two ads built on the techniques in
 * `Tejashmakwana/astra-chatgpt-hyperframes`, and it is deliberately the
 * opposite of `adAskIt`: dark where that one is light, centred where that one
 * is ranged left, declarative where that one is a question being answered.
 * Two ads in one visual language that differ only in colour would be one ad,
 * which is the thing the owner asked these not to be.
 *
 * ## Why it argues by year
 *
 * Every other ad in the set argues by feature — the notes, the flashcards, the
 * attendance. This one walks the four years in order and shows what each one
 * is looking at — the subjects on screen, the diagram beside the question, the
 * posting counting down. It is the same app in all four, and saying so in one
 * film is the closest thing the set has to a brand ad.
 *
 * What it does NOT do is tell a reader what their year IS. "First year is a
 * drawing exam" was here, the owner's verdict on it was blunt, and they were
 * right: a student does not need a stranger's characterisation of the year
 * they are living in. `check:ad-truth` refuses that sentence shape now.
 *
 * No counts, and never the word "plate" — the lines about diagrams say what
 * the diagram is for, not how many of them exist.
 */
export const adTheYear: AdScript = {
  id: 'orbit-the-year',
  title: 'Orbit MBBS — The year you are in',
  format: 'reel',
  look: 'keynote',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide-night.wav',
  shots: [
    { n: 1, frames: 124, screen: 'glassHome', kicker: 'Orbit MBBS', text: 'Built around your year', silentText: 'Built around your year', vo: 'Most study apps aren’t built around your MBBS year.', accent: '#7C5CFF' },
    { n: 2, frames: 124, screen: 'browseFirst', kicker: 'First year', text: 'Anatomy. Physiology. Biochem.', silentText: 'Anatomy. Physiology. Biochem.', vo: 'First year means Anatomy, Physiology and Biochem.', accent: '#22D3A6' },
    { n: 3, frames: 124, screen: 'plateUlnar', kicker: 'First year', text: 'Diagrams included', silentText: 'Diagrams included', vo: 'And the diagrams are right there with the questions.', accent: '#22D3A6' },
    { n: 4, frames: 124, screen: 'userNotesEdit', kicker: 'First year', text: 'Draw it yourself', silentText: 'Draw it yourself', vo: 'Then you can draw them yourself.', accent: '#22D3A6' },
    { n: 5, frames: 124, screen: 'browse', kicker: 'Second year', text: 'Second year', silentText: 'Second year', vo: 'Second year has its own subjects and its own list.', accent: '#FF4D8D' },
    { n: 6, frames: 124, screen: 'questionsChapters', focus: 0.35, kicker: 'Second year', text: 'Sorted by chapter', silentText: 'Sorted by chapter', vo: 'And everything is still broken down by chapter.', accent: '#FF4D8D' },
    { n: 7, frames: 124, screen: 'questionsLeaf', focus: 0.28, kicker: 'Second year', text: 'Study the repeats', silentText: 'Study the repeats', vo: 'The circle shows you which questions repeat more.', accent: '#F5B301' },
    { n: 8, frames: 124, screen: 'browseThird', kicker: 'Third year', text: 'Forensic + Community', silentText: 'Forensic + Community', vo: 'Third year brings Forensic and Community Medicine.', accent: '#4CC2FF' },
    { n: 9, frames: 124, screen: 'noteBody', kicker: 'Third year', text: 'Based on the textbook', silentText: 'Based on the textbook', vo: 'Answers are based on the textbook for the subject.', accent: '#4CC2FF' },
    { n: 10, frames: 124, screen: 'attendancePostings', focus: 0.4, kicker: 'Final year', text: 'Days left in posting', silentText: 'Days left in posting', vo: 'Final year postings can count down to the end date.', accent: '#22D3A6' },
    { n: 11, frames: 124, screen: 'attendance', focus: 0.42, kicker: 'Final year', text: 'See what you can still miss', silentText: 'See what you can still miss', vo: 'And attendance can show you what you can still miss.', accent: '#22D3A6' },
    { n: 12, frames: 124, screen: 'askai', kicker: 'Every year', text: 'Ask AI', silentText: 'Ask AI', vo: 'Whatever year you’re in, ask the AI.', accent: '#7C5CFF' },
    { n: 13, frames: 124, screen: 'progress', kicker: 'Every year', text: 'No account needed', silentText: 'No account needed', vo: 'And keep your streak without creating another account.', accent: '#F5B301' },
    { n: 14, frames: 124, screen: 'glassHome', kicker: 'Orbit MBBS', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
