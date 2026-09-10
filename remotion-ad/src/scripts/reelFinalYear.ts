import type { AdScript } from './types';

/**
 * Reel — "Final year".
 *
 * ## The two things this ad may not say, and why they shape the whole cut
 *
 * Every other year's reel leans on the repeat counter and on the handwritten
 * notes. **Final year has neither, and pretending otherwise would be the most
 * damaging thing an ad here could do** — the viewer installs, opens General
 * Medicine, and finds the feature the ad promised is blank.
 *
 * * **Repeat markers.** Twenty-three per cent of final-year questions carry
 *   one, against ninety-six in third year. General Medicine is 0 of 660: those
 *   questions were transcribed with a page number and nothing else, so there is
 *   no marker to count and no circle to draw. That is a fact about the source,
 *   not a bug, and no ad can talk it away.
 * * **Textbooks.** The eight OCR'd books cover first, second and third year.
 *   Final year has none, so the triple tap deliberately falls through to Ask
 *   AI. So this reel never says "from your textbook" — it says the AI answers,
 *   which is what actually happens.
 *
 * ## What final year does have, and what the ad is built on instead
 *
 * Six subjects, which is more than any other year, and the two things a final
 * year actually runs on: **clinical postings** and **notes made on a ward
 * round**. The attendance tracker's posting list — a fixed block with an end
 * date, so "you can miss four, and there are only two days left" — is a final
 * year feature more than anyone else's. And a note carrying a photograph, a
 * recording and a PDF, none of it leaving the phone, is what a house-surgeon
 * year looks like.
 *
 * So the shape is: the size of the bank, then Ask AI, then flashcards, then
 * postings and notes. Honest, and a better ad for it — a final-year student
 * who has been told the truth about one feature will believe the next one.
 */
export const reelFinalYear: AdScript = {
  id: 'orbit-reel-final-year',
  title: 'Orbit MBBS — Reel: Final year',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 80, screen: null, mascot: 'hero', camera: 'settle', text: 'Final year is six subjects', silentText: 'Final year is six subjects', vo: 'Final year is six subjects at once.', accent: '#FF4D8D' },
    { n: 2, frames: 105, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'Medicine, Surgery, O and G', silentText: 'Medicine, Surgery, O&G', vo: 'Medicine, Surgery, O and G, Paediatrics, ENT, Ophthal.', accent: '#FF4D8D' },
    { n: 3, frames: 100, screen: 'questionsChapters', camera: 'push', text: 'sorted by chapter', silentText: 'Every one sorted by chapter', vo: 'Every one of them sorted by chapter.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 100, screen: 'questionsLeaf', camera: 'macro', text: 'General Medicine alone is', silentText: 'General Medicine alone is 660', vo: 'General Medicine alone is six hundred and sixty.', focus: 0.28, accent: '#4CC2FF' },
    { n: 5, frames: 105, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask it anything, in plain words', silentText: 'Ask it anything, in plain words', vo: 'Stuck on one? Ask it anything, in plain words.', accent: '#7C5CFF' },
    { n: 6, frames: 100, screen: 'askai', camera: 'macro', text: 'It answers as a medical exam question', silentText: 'It answers exam-shaped', vo: 'It answers as a medical exam question, not a chatbot.', accent: '#7C5CFF' },
    { n: 7, frames: 95, screen: 'chatdemo', camera: 'macro', text: 'Then ask it to test you', silentText: 'Then ask it to test you', vo: 'Then ask it to test you on it.', accent: '#7C5CFF' },
    { n: 8, frames: 100, screen: 'flashcards', camera: 'orbit', text: 'Turn a chapter into flashcards', silentText: 'Turn a chapter into flashcards', vo: 'Turn a chapter into flashcards for the drive in.', accent: '#4CC2FF' },
    { n: 9, frames: 95, screen: 'ankiStudy', camera: 'macro', text: 'Or bring the deck your batch shares', silentText: 'Or bring your batch’s Anki deck', vo: 'Or bring the deck your batch shares, straight in.', accent: '#4CC2FF' },
    { n: 10, frames: 105, screen: 'attendancePostings', mascot: 'guide', camera: 'push', text: 'Postings have an end date', silentText: 'Postings have an end date', vo: 'Postings have an end date, so it counts the days left.', accent: '#22D3A6' },
    { n: 11, frames: 100, screen: 'attendancePostings', camera: 'macro', text: 'How many you can still miss', silentText: 'How many you can still miss', vo: 'And how many you can still miss. It never rounds up.', focus: 0.4, accent: '#22D3A6' },
    { n: 12, frames: 100, screen: 'userNotesEdit', camera: 'glideDown', text: 'Write up a case on the ward', silentText: 'Write a case up on rounds', vo: 'Write up a case on the ward, in the app.', accent: '#FF4D8D' },
    { n: 13, frames: 100, screen: 'userNotesMedia', mascot: 'guide', camera: 'macro', text: 'A photo, a recording, a PDF', silentText: 'A photo, a recording, a PDF', vo: 'A photo, a recording, a PDF. No limit on any of it.', accent: '#FF4D8D' },
    { n: 14, frames: 95, screen: 'userNotes', camera: 'push', text: 'None of it leaves your phone', silentText: 'None of it leaves your phone', vo: 'And none of it leaves your phone.', accent: '#22D3A6' },
    { n: 15, frames: 95, screen: 'timer', camera: 'push', text: 'Twenty-five minutes at a time', silentText: 'Twenty-five minutes at a time', vo: 'Revise in twenty-five minutes at a time.', accent: '#22D3A6' },
    { n: 16, frames: 95, screen: 'progress', camera: 'pull', text: 'Your streak needs no account', silentText: 'Your streak needs no account', vo: 'Your streak needs no account at all.', accent: '#F5B301' },
    { n: 17, frames: 85, screen: null, mascot: 'hero', camera: 'settle', text: 'Made for final year', silentText: 'Made for final year', vo: 'Made for final year.', accent: '#FF4D8D' },
    { n: 18, frames: 145, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
