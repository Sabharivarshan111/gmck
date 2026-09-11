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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Ward now, exam in six weeks', silentText: 'Ward now, exam in six weeks', vo: 'Ward in the morning, exam in six weeks.', accent: '#FF4D8D' },
    { n: 2, frames: 129, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'General Medicine alone', silentText: 'General Medicine: 680', vo: 'General Medicine alone runs to six hundred and eighty.', accent: '#FF4D8D' },
    { n: 3, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'sorted by chapter', silentText: 'Every one sorted by chapter', vo: 'Every one of them sorted by chapter.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'How often it was asked', silentText: 'How often it was asked', vo: 'Each one shows how often it has been asked.', focus: 0.28, accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask it in plain words', silentText: 'Ask it in plain words', vo: 'Stuck on one? Ask it in plain words.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'askai', camera: 'macro', text: 'A medical exam question', silentText: 'An exam answer, not a chatbot', vo: 'It answers as a medical exam question rather than a chatbot.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'flashcards', camera: 'orbit', text: 'Turn a chapter into flashcards', silentText: 'Turn a chapter into flashcards', vo: 'Turn a chapter into flashcards for the drive in.', accent: '#4CC2FF' },
    { n: 8, frames: 129, screen: 'ankiStudy', camera: 'macro', text: 'Bring your batch deck', silentText: 'Bring the deck your batch shares', vo: 'Or bring the deck your batch already shares.', accent: '#4CC2FF' },
    { n: 9, frames: 128, screen: 'attendancePostings', mascot: 'guide', camera: 'push', text: 'Postings have an end date', silentText: 'Postings have an end date', vo: 'Postings have an end date, so it counts the days left.', accent: '#22D3A6' },
    { n: 10, frames: 128, screen: 'attendancePostings', camera: 'macro', text: 'How many you can miss', silentText: 'How many you can still miss', vo: 'And how many you can still miss without rounding up.', focus: 0.4, accent: '#22D3A6' },
    { n: 11, frames: 128, screen: 'userNotesEdit', camera: 'glideDown', text: 'Write up a case', silentText: 'Write the case on the ward', vo: 'Write up a case on the ward inside the app.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'userNotesMedia', mascot: 'guide', camera: 'macro', text: 'Photo, recording, PDF', silentText: 'Photos, recordings, PDFs — no limit', vo: 'A photo, a recording or a PDF with no limit.', accent: '#FF4D8D' },
    { n: 13, frames: 128, screen: 'userNotes', camera: 'push', text: 'None of it leaves your phone', silentText: 'None of it leaves your phone', vo: 'And none of it leaves your phone.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
