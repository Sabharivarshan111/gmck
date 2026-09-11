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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Ward now. Exam in 6 weeks.', silentText: 'Ward now. Exam in 6 weeks.', vo: 'Ward in the morning. Exam in six weeks.', accent: '#FF4D8D' },
    { n: 2, frames: 129, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'Every subject. Every chapter.', silentText: 'Every subject. Every chapter.', vo: 'Every subject in your year, broken down by chapter.', accent: '#FF4D8D' },
    { n: 3, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'Go straight to the chapter', silentText: 'Go straight to the chapter', vo: 'So you can go straight to what you need.', focus: 0.35, accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'See the repeat frequency', silentText: 'See the repeat frequency', vo: 'And see how often the question has been asked.', focus: 0.28, accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'askai', mascot: 'guide', camera: 'push', text: 'Ask AI', silentText: 'Ask AI', vo: 'Stuck on one? Ask it in normal language.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'askai', camera: 'macro', text: 'Exam-focused answer', silentText: 'Exam-focused answer', vo: 'Get an answer shaped around the exam question.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'flashcards', camera: 'orbit', text: 'Flashcards for the commute', silentText: 'Flashcards for the commute', vo: 'Turn a chapter into flashcards for the drive in.', accent: '#4CC2FF' },
    { n: 8, frames: 129, screen: 'ankiStudy', camera: 'macro', text: 'Import your batch deck', silentText: 'Import your batch deck', vo: 'Or import the deck your batch already shares.', accent: '#4CC2FF' },
    { n: 9, frames: 128, screen: 'attendancePostings', mascot: 'guide', camera: 'push', text: 'See your posting days left', silentText: 'See your posting days left', vo: 'Postings have an end date, so you can see what’s left.', accent: '#22D3A6' },
    { n: 10, frames: 128, screen: 'attendancePostings', camera: 'macro', text: 'Check how many you can miss', silentText: 'Check how many you can miss', vo: 'And check how many classes you can still miss.', focus: 0.4, accent: '#22D3A6' },
    { n: 11, frames: 128, screen: 'userNotesEdit', camera: 'glideDown', text: 'Write your case notes', silentText: 'Write your case notes', vo: 'Write your case notes inside the app too.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'userNotesMedia', mascot: 'guide', camera: 'macro', text: 'Photos. Recordings. PDFs.', silentText: 'Photos. Recordings. PDFs.', vo: 'Attach photos, recordings or PDFs.', accent: '#FF4D8D' },
    { n: 13, frames: 128, screen: 'userNotes', camera: 'push', text: 'Stays on your phone', silentText: 'Stays on your phone', vo: 'And keep your notes on the phone.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
