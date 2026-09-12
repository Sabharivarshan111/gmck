import type { AdScript } from './types';

/**
 * Reel — "You knew this last week".
 *
 * ## The argument
 *
 * Spaced repetition is the single best-evidenced thing in this app and the
 * hardest to advertise, because the benefit arrives weeks after the tap. An ad
 * that says "use spaced repetition" is a lecture. An ad that shows the moment
 * of forgetting is a story.
 *
 * So the cold open is the failure — a question you have already ticked, and
 * cannot answer — and everything after it is the machinery that stops it
 * happening again.
 *
 * ## SM-2, named on screen and named here
 *
 * The card in My Progress says SM-2, so this ad may say it too. It is the same
 * algorithm Anki's scheduler descends from, and saying its name is the
 * difference between a claim and a citation for the sort of student who will
 * go and look it up. What this ad must NOT do is claim the schedule is
 * Orbit's own invention, or that it is Anki's scheduler — the imported decks
 * keep their own, and that distinction is written down in the rules for a
 * reason.
 *
 * ## Ticking is what starts it
 *
 * The most common misunderstanding of the feature, and the reason the card
 * says "Tick a question off to start revising it": nothing is scheduled until
 * you mark something done. Shot 4 is that sentence, early, because a viewer
 * who installs and never ticks anything sees an empty Revise button and
 * concludes the feature is broken.
 */
export const reelSpaced: AdScript = {
  id: 'orbit-reel-spaced',
  title: 'Orbit MBBS — Reel: Spaced revision',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'You knew this last week', silentText: 'You knew this last week', vo: 'You knew this last week.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'ticked it off and moved on', silentText: 'Already ticked it off', vo: 'You ticked it off and moved on.', focus: 0.3, accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'push', text: 'when you should see it again', silentText: 'Orbit remembers', vo: 'Orbit keeps track of when you should see it again.', focus: 0.3, accent: '#7C5CFF' },
    { n: 4, frames: 129, screen: 'progress', camera: 'macro', text: 'starts the revision cycle', silentText: 'Ticking starts the cycle', vo: 'That first tick starts the revision cycle.', focus: 0.32, accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'progressBottom', camera: 'push', text: 'Then a few days later', silentText: 'Comes back later', vo: 'Maybe tomorrow. Then a few days later.', focus: 0.32, accent: '#4CC2FF' },
    { n: 6, frames: 129, screen: 'progress', mascot: 'guide', camera: 'macro', text: 'You’ll see it again sooner', silentText: 'Missed it? See it sooner', vo: 'Miss it? You’ll see it again sooner.', focus: 0.32, accent: '#F5B301' },
    { n: 7, frames: 129, screen: 'ankiStudy', camera: 'push', text: 'spacing idea you know from Anki', silentText: 'Spaced repetition', vo: 'Same basic spacing idea you know from Anki.', focus: 0.3, accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'flashcards', camera: 'orbit', text: 'Your flashcards use it too', silentText: 'Your flashcards too', vo: 'Your flashcards use it too.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'progressBottom', mascot: 'guide', camera: 'glideDown', text: 'remember the schedule yourself', silentText: 'No manual scheduling', vo: 'So you don’t have to remember the schedule yourself.', accent: '#22D3A6' },
    { n: 10, frames: 128, screen: 'settingsNotifications', camera: 'macro', text: 'Orbit can tell you', silentText: 'See what’s due', vo: 'When something’s due, Orbit can tell you.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'progressBottom', camera: 'pull', text: 'the days you actually showed up', silentText: 'Your study streak', vo: 'Your streak is just the days you actually showed up.', accent: '#F5B301' },
    { n: 12, frames: 128, screen: 'timer', camera: 'push', text: 'keep the habit going', silentText: 'A short session is enough', vo: 'Even a short focused session can keep the habit going.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: null, mascot: 'hero', camera: 'settle', text: 'from scratch every time', silentText: 'Stop starting over', vo: 'Stop studying the same thing from scratch every time.', accent: '#7C5CFF' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
