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
    { n: 1, frames: 124, screen: 'glassHome', kicker: 'Orbit MBBS', text: 'One app, four years', silentText: 'One app, four years', vo: 'One app that knows which year you are in.', accent: '#7C5CFF' },
    { n: 2, frames: 124, screen: 'browseFirst', kicker: 'First year', text: 'A drawing exam', silentText: 'First year is a drawing exam', vo: 'First year is a drawing exam more than a written one.', accent: '#22D3A6' },
    { n: 3, frames: 124, screen: 'plateUlnar', kicker: 'First year', text: 'Labelled as you must draw it', silentText: 'Labelled as you must draw it', vo: 'So it is labelled the way you have to draw it.', accent: '#22D3A6' },
    { n: 4, frames: 124, screen: 'userNotesEdit', kicker: 'First year', text: 'Then draw it yourself', silentText: 'Then draw it yourself', vo: 'Then draw it yourself with a stylus or a finger.', accent: '#22D3A6' },
    { n: 5, frames: 124, screen: 'browse', kicker: 'Second year', text: 'The volume year', silentText: 'Second year is volume', vo: 'Second year is four heavy subjects at once.', accent: '#FF4D8D' },
    { n: 6, frames: 124, screen: 'questionsChapters', focus: 0.35, kicker: 'Second year', text: 'Sorted down to the chapter', silentText: 'Sorted to the chapter', vo: 'All of it sorted down to the chapter you are on.', accent: '#FF4D8D' },
    { n: 7, frames: 124, screen: 'questionsLeaf', focus: 0.28, kicker: 'Second year', text: 'Study the fours first', silentText: 'Study the 4s first', vo: 'The circle counts repeats so study the fours.', accent: '#F5B301' },
    { n: 8, frames: 124, screen: 'browseThird', kicker: 'Third year', text: 'Two subjects, done properly', silentText: 'Two subjects, properly', vo: 'Third year is two subjects and a lot of questions.', accent: '#4CC2FF' },
    { n: 9, frames: 124, screen: 'noteBody', kicker: 'Third year', text: 'From your own textbook', silentText: 'From your own textbook', vo: 'The answers are written from your own textbook.', accent: '#4CC2FF' },
    { n: 10, frames: 124, screen: 'attendancePostings', focus: 0.4, kicker: 'Final year', text: 'Postings have an end date', silentText: 'Postings have an end date', vo: 'Final year is postings and postings end.', accent: '#22D3A6' },
    { n: 11, frames: 124, screen: 'attendance', focus: 0.42, kicker: 'Final year', text: 'It never rounds up', silentText: 'It never rounds up', vo: 'It works out what you can miss without rounding.', accent: '#22D3A6' },
    { n: 12, frames: 124, screen: 'askai', kicker: 'Every year', text: 'Ask it anything', silentText: 'Ask it anything', vo: 'Ask it anything at all, in plain words.', accent: '#7C5CFF' },
    { n: 13, frames: 124, screen: 'progress', kicker: 'Every year', text: 'No account needed', silentText: 'No account needed', vo: 'Your streak counts without an account.', accent: '#F5B301' },
    { n: 14, frames: 124, screen: 'glassHome', kicker: 'Orbit MBBS', text: 'The year you are in', silentText: 'The year you are in', vo: 'Whichever year you are in, it starts today.', accent: '#7C5CFF' },
  ],
};
