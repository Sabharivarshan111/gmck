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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Which page is it on?', silentText: 'Which page is it on?', vo: 'Ever wonder which page a question is on?', accent: '#F5B301' },
    { n: 2, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'The answer is in the book', silentText: 'The answer is in the book', vo: 'The question is here. The answer is in your textbook.', focus: 0.3, accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'pageRefToggle', camera: 'push', text: 'Editions have different pages', silentText: 'Editions have different pages', vo: 'And the app can’t magically know your edition’s page number.', accent: '#F5B301' },
    { n: 4, frames: 129, screen: 'pageRefSheet', mascot: 'guide', camera: 'settle', text: 'Add your page number', silentText: 'Add your page number', vo: 'So students add the page from the book they’re using.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'pageRefAddBook', camera: 'macro', text: 'Book + edition + page', silentText: 'Book + edition + page', vo: 'Just the book, edition and page.', accent: '#4CC2FF' },
    { n: 6, frames: 129, screen: 'pageRefSheet', camera: 'glideDown', text: 'Add it in seconds', silentText: 'Add it in seconds', vo: 'It takes a few seconds while you’re already on that page.', accent: '#4CC2FF' },
    { n: 7, frames: 129, screen: 'pageRefQuorum', mascot: 'guide', camera: 'push', text: 'Confirmed by other students', silentText: 'Confirmed by other students', vo: 'Then other students can confirm it before it becomes shared.', accent: '#22D3A6' },
    { n: 8, frames: 129, screen: 'pageRefToggle', camera: 'glideDown', text: 'Not immediate', silentText: 'Not immediate', vo: 'So it may take a little time to show up.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'pageRefQuorum', camera: 'settle', text: 'Shared reference system', silentText: 'Shared reference system', vo: 'The same process works for everyone.', accent: '#7C5CFF' },
    { n: 10, frames: 128, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'Shared with your year', silentText: 'Shared with your year', vo: 'Then everyone in your year can use it.', focus: 0.35, accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'browse', camera: 'trackLeft', text: 'One page at a time', silentText: 'One page at a time', vo: 'Do that across subjects, one page at a time.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'pageRefSheet', camera: 'pull', text: 'Built by students', silentText: 'Built by students', vo: 'Students build this together.', accent: '#F5B301' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'Add one as you study', silentText: 'Add one as you study', vo: 'Next time the book is open, add the next one.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
