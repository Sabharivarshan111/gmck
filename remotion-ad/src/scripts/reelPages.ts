import type { AdScript } from './types';

/**
 * Reel — "Which page is it on?"
 *
 * ## The feature nobody builds because it cannot be built alone
 *
 * A question is in the bank. The answer is in a textbook. Between them is a
 * page number, and no app can know it — editions differ, prints differ, and
 * the only people who have that information are the students holding the book.
 *
 * So the page numbers come from readers, and the whole design of the feature
 * is about what stops that from being useless. **Three different readers have
 * to enter the same page for the same book before anybody sees it.** That rule
 * lives in Postgres, not in the app, which is the part worth saying out loud:
 * it cannot be got round by an old build, a different client, or the web app.
 *
 * ## Why the ad is honest about the wait
 *
 * The obvious version of this ad shows somebody typing a page number and the
 * page number appearing. That is a lie, and it is the specific lie that would
 * make the feature look broken to the first person who tried it — they would
 * type a page, see nothing, and conclude it did not work.
 *
 * So shot 9 says the quiet part: yours does not show up yet, and here is why.
 * An ad that explains a delay is doing the support work up front.
 *
 * Screens are `pageref-2` through `pageref-6` from `preview/page-ref-shots.mjs`,
 * which drives the real sheet against the real rule.
 */
export const reelPages: AdScript = {
  id: 'orbit-reel-pages',
  title: 'Orbit MBBS — Reel: Textbook page numbers',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Which page is it on', silentText: 'Which page is it on?', vo: 'Which page is it on?', accent: '#F5B301' },
    { n: 2, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'The answer is in a book', silentText: 'The answer is in a book', vo: 'The question is here but the answer is in a book.', focus: 0.3, accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'pageRefToggle', camera: 'push', text: 'No app can know that page', silentText: 'No app can know the page', vo: 'No app can know that page. Editions differ.', accent: '#F5B301' },
    { n: 4, frames: 129, screen: 'pageRefSheet', mascot: 'guide', camera: 'settle', text: 'So students enter it', silentText: 'So students enter it', vo: 'So students enter it, from the book in front of them.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'pageRefAddBook', camera: 'macro', text: 'Your book, your edition', silentText: 'Your book, your edition', vo: 'Your book. Your edition. Your page.', accent: '#4CC2FF' },
    { n: 6, frames: 129, screen: 'pageRefSheet', camera: 'glideDown', text: 'It takes about ten seconds', silentText: 'It takes about ten seconds', vo: 'It takes about ten seconds while you are already reading.', accent: '#4CC2FF' },
    { n: 7, frames: 129, screen: 'pageRefQuorum', mascot: 'guide', camera: 'push', text: 'Three readers have to agree', silentText: 'Three readers have to agree', vo: 'Then three readers have to agree before anyone sees it.', accent: '#22D3A6' },
    { n: 8, frames: 129, screen: 'pageRefToggle', camera: 'glideDown', text: 'Not straight away', silentText: 'Not straight away', vo: 'So yours will not show up straight away.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'pageRefQuorum', camera: 'settle', text: 'The rule lives in the database', silentText: 'The rule lives in the database', vo: 'The rule lives in the database, not in the app.', accent: '#7C5CFF' },
    { n: 10, frames: 128, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'And then it is there for everyone', silentText: 'Then it is there for everyone', vo: 'And then it is there for everyone in your year.', focus: 0.35, accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'browse', camera: 'trackLeft', text: 'Every subject, every year', silentText: 'Every subject, every year', vo: 'Every subject, every year, one page at a time.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'pageRefSheet', camera: 'pull', text: 'Your batch built this', silentText: 'Your batch builds it', vo: 'Your batch built this. Not a company.', accent: '#F5B301' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'Add one the next time you open the book', silentText: 'Add one while you read', vo: 'Add one the next time you open the book.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
