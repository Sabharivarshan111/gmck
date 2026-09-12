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
 * attendance. This one argues by the reader: first year is a drawing exam,
 * second year is volume, third year is two subjects done properly, final year
 * is six at once. It is the same app in all four, and saying so in one film is
 * the closest thing the set has to a brand ad.
 *
 * The numbers stay out of it. There are no counts of diagrams or plates here,
 * on the owner's instruction, and the lines about pictures say what the
 * picture IS rather than how many exist.
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
    { n: 1, frames: 124, screen: 'glassHome', kicker: 'Orbit MBBS', text: 'ignore your MBBS year', silentText: 'Built around your year', vo: 'Most study apps ignore your MBBS year.', accent: '#7C5CFF' },
    { n: 2, frames: 124, screen: 'browseFirst', kicker: 'First year', text: 'Anatomy, Physiology, Biochem', silentText: 'Anatomy. Physiology. Biochem.', vo: 'First year: Anatomy, Physiology, Biochem.', accent: '#22D3A6' },
    { n: 3, frames: 124, screen: 'plateUlnar', kicker: 'First year', text: 'right there with the questions', silentText: 'Diagrams included', vo: 'And the diagrams are right there with the questions.', accent: '#22D3A6' },
    { n: 4, frames: 124, screen: 'userNotesEdit', kicker: 'First year', text: 'draw them yourself', silentText: 'Draw it yourself', vo: 'Then you can draw them yourself.', accent: '#22D3A6' },
    { n: 5, frames: 124, screen: 'browse', kicker: 'Second year', text: 'its own subjects', silentText: 'Second year', vo: 'Second year has its own subjects.', accent: '#FF4D8D' },
    { n: 6, frames: 124, screen: 'questionsChapters', focus: 0.35, kicker: 'Second year', text: 'broken down by chapter', silentText: 'Sorted by chapter', vo: 'And everything is still broken down by chapter.', accent: '#FF4D8D' },
    { n: 7, frames: 124, screen: 'questionsLeaf', focus: 0.28, kicker: 'Second year', text: 'which questions repeat more', silentText: 'Study the repeats', vo: 'The circle shows you which questions repeat more.', accent: '#F5B301' },
    { n: 8, frames: 124, screen: 'browseThird', kicker: 'Third year', text: 'Forensic and Community Medicine', silentText: 'Forensic and Community', vo: 'Third year: Forensic and Community Medicine.', accent: '#4CC2FF' },
    { n: 9, frames: 124, screen: 'noteBody', kicker: 'Third year', text: 'based on the textbook', silentText: 'Based on the textbook', vo: 'Answers are based on the textbook for the subject.', accent: '#4CC2FF' },
    { n: 10, frames: 124, screen: 'attendancePostings', focus: 0.4, kicker: 'Final year', text: 'count down to the end date', silentText: 'Days left in posting', vo: 'Final year postings can count down to the end date.', accent: '#22D3A6' },
    { n: 11, frames: 124, screen: 'attendance', focus: 0.42, kicker: 'Final year', text: 'what you can still miss', silentText: 'See what you can still miss', vo: 'And attendance shows what you can still miss.', accent: '#22D3A6' },
    { n: 12, frames: 124, screen: 'askai', kicker: 'Every year', text: 'you can ask the AI', silentText: 'Ask AI', vo: 'Whatever year you’re in, you can ask the AI.', accent: '#7C5CFF' },
    { n: 13, frames: 124, screen: 'progress', kicker: 'Every year', text: 'without creating another account', silentText: 'No account needed', vo: 'And keep your streak without creating another account.', accent: '#F5B301' },
    { n: 14, frames: 124, screen: 'glassHome', kicker: 'Orbit MBBS', text: 'The year you are in', silentText: 'The year you are in', vo: 'Whichever year you are in, it starts today.', accent: '#7C5CFF' },
  ],
};
