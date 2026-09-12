import type { AdScript } from './types';

/**
 * Reel — "How to add a textbook page", the contribution walkthrough.
 *
 * ## Why this one has to teach rather than sell
 *
 * Every other ad here can afford to say what a feature does. This feature does
 * nothing at all unless readers use it: the page numbers are contributed by
 * students, and a question has a page only because somebody typed it while
 * their book was open. An ad that makes it sound impressive and leaves the
 * viewer unsure which button to press has not helped it at all.
 *
 * So it is in tap order, every step named the way the control names itself.
 *
 * ## The quorum is in the ad on purpose
 *
 * Shots nine to eleven are the part somebody would cut for pace, and they are
 * the reason anybody should trust a page number they did not add themselves.
 * Other readers have to agree before a page is shown to a year, and that rule
 * lives in Postgres rather than in the app — so it holds for every client,
 * including the two copies of this app that are not this repo.
 *
 * The ad deliberately does NOT say how many readers. That number is a
 * migration away from changing, and a video cannot be edited once it is on
 * somebody's feed.
 *
 * ## What it may never say
 *
 * That a page is verified, correct, or checked by anyone with authority. It is
 * agreed by students, which is a different and honest claim.
 */
export const reelHowPages: AdScript = {
  id: 'orbit-reel-how-pages',
  title: 'Orbit MBBS — How to: add a textbook page',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: 'questionsLeaf', mascot: 'hero', camera: 'settle', text: 'The full answer is in your book', silentText: 'The answer is in the book', vo: 'The question is here. The full answer is in your book.', accent: '#4CC2FF' },
    { n: 2, frames: 129, screen: 'pageRefToggle', mascot: 'guide', camera: 'push', text: 'Turn textbook page numbers on', silentText: 'Turn page numbers on', vo: 'Turn textbook page numbers on in the settings.', accent: '#4CC2FF' },
    { n: 3, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'every question can carry a page', silentText: 'A page on the question', vo: 'Now every question can carry a page.', accent: '#7C5CFF' },
    { n: 4, frames: 129, screen: 'pageRefSheet', camera: 'push', text: 'tap add page', silentText: 'Tap add page', vo: 'Open a question and tap add page.', accent: '#7C5CFF' },
    { n: 5, frames: 129, screen: 'pageRefAddBook', camera: 'macro', text: 'the book you are actually holding', silentText: 'Name your book', vo: 'Name the book you are actually holding.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'pageRefAddBook', camera: 'settle', text: 'because editions are paged differently', silentText: 'Then the edition', vo: 'Then the edition, because editions are paged differently.', accent: '#F5B301' },
    { n: 7, frames: 129, screen: 'pageRefSheet', camera: 'macro', text: 'the page number in front of you', silentText: 'And the page', vo: 'And the page number in front of you.', accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'pageRefSheet', camera: 'push', text: 'while the book is already open', silentText: 'Seconds, book already open', vo: 'It takes seconds while the book is already open.', accent: '#F5B301' },
    { n: 9, frames: 128, screen: 'pageRefQuorum', mascot: 'guide', camera: 'push', text: 'Other students have to agree', silentText: 'Others confirm it first', vo: 'Other students have to agree before it is shown.', accent: '#22D3A6' },
    { n: 10, frames: 128, screen: 'pageRefQuorum', camera: 'macro', text: 'one wrong page cannot', silentText: 'One mistake cannot spread', vo: 'So one wrong page cannot send your year to it.', accent: '#22D3A6' },
    { n: 11, frames: 128, screen: 'pageRefQuorum', camera: 'settle', text: 'lives in the database, not in the app', silentText: 'The rule is shared', vo: 'That rule lives in the database, not in the app.', accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'questionsLeaf', camera: 'push', text: 'your year sees the page too', silentText: 'Your year sees it', vo: 'Once it agrees, your year sees the page too.', accent: '#4CC2FF' },
    { n: 13, frames: 128, screen: 'browse', mascot: 'guide', camera: 'trackLeft', text: 'whenever your book is open', silentText: 'Add one as you study', vo: 'Add one whenever your book is open.', accent: '#4CC2FF' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
