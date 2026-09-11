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
    { n: 2, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'You ticked it off', silentText: 'You already ticked it off', vo: 'You ticked it off and moved on.', focus: 0.3, accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'progress', mascot: 'guide', camera: 'push', text: 'Orbit remembers when', silentText: 'Orbit remembers when', vo: 'Orbit remembers when, and what happens next.', focus: 0.3, accent: '#7C5CFF' },
    { n: 4, frames: 129, screen: 'progress', camera: 'macro', text: 'Ticking it starts it', silentText: 'Ticking it is what starts it', vo: 'Ticking a question is what starts it.', focus: 0.32, accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'progress', camera: 'push', text: 'It comes back in a day', silentText: 'It comes back in a day', vo: 'It comes back in a day. Then in six.', focus: 0.32, accent: '#4CC2FF' },
    { n: 6, frames: 129, screen: 'progress', mascot: 'guide', camera: 'macro', text: 'Miss one and it comes straight back', silentText: 'Miss one, it comes straight back', vo: 'Miss one and it comes straight back tomorrow.', focus: 0.32, accent: '#F5B301' },
    { n: 7, frames: 129, screen: 'progress', camera: 'push', text: 'The same idea as Anki', silentText: 'The same idea Anki uses', vo: 'The same spacing idea Anki is built on.', focus: 0.3, accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'flashcards', camera: 'orbit', text: 'Flashcards do it too', silentText: 'Your flashcards do it too', vo: 'Your flashcards do it too, on their own schedule.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'progressBottom', mascot: 'guide', camera: 'glideDown', text: 'Nothing to schedule yourself', silentText: 'Nothing to schedule yourself', vo: 'There is nothing to schedule yourself.', accent: '#22D3A6' },
    { n: 10, frames: 128, screen: 'settingsNotifications', camera: 'macro', text: 'when something is due', silentText: 'It tells you what is due', vo: 'It tells you in the evening when something is due.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'progressBottom', camera: 'pull', text: 'Your streak counts the days', silentText: 'Your streak counts the days', vo: 'Your streak counts the days you turned up.', accent: '#F5B301' },
    { n: 12, frames: 128, screen: 'timer', camera: 'push', text: 'Twenty-five minutes a day is enough', silentText: '25 minutes is enough', vo: 'Twenty-five minutes a day is enough to hold it.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: null, mascot: 'hero', camera: 'settle', text: 'Stop relearning the same thing', silentText: 'Stop relearning the same thing', vo: 'Stop relearning the same thing.', accent: '#7C5CFF' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
