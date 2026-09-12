import type { AdScript } from './types';

/**
 * Reel — "The first two minutes".
 *
 * ## An ad about setup, which sounds like the least interesting one
 *
 * It is the one that answers the objection nobody says out loud: *how much
 * work is this going to be before it is any use to me*. Every install decision
 * is really a guess at that, and a study app that asks for an account, a card
 * and a year's worth of preferences before it shows a single question loses
 * to the PDF in the group chat.
 *
 * So this ad is a stopwatch. Name, year, first question — and then the
 * walkthrough, which is the part people skip and then ask about a week later.
 *
 * ## Every claim here is checkable in the build
 *
 * **No sign-in.** `check:open-access` drives the built app down to a real
 * topic with no session and fails if a gate comes back. The anonymous session
 * exists and carries XP, but nothing asks for anything to get one.
 *
 * **The walkthrough is real.** `tour-01` to `tour-04` come out of the tour's
 * own capture, and `check:tour` fails if the walkthrough points at a control
 * that does not exist. It is also replayable from Settings, which is the shot
 * this ad ends the tour section on, because the commonest complaint about any
 * first-run tour is that it happened once and vanished.
 *
 * The one thing it may never claim is that setup restores an old account.
 * There is no old account to restore.
 */
export const reelSetup: AdScript = {
  id: 'orbit-reel-setup',
  title: 'Orbit MBBS — Reel: The first two minutes',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'before you even see anything', silentText: 'Email first?', vo: 'Most apps want your email before you even see anything.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'tourWelcome', mascot: 'guide', camera: 'push', text: 'two things and gets out of the way', silentText: 'Two things. That’s it.', vo: 'Orbit asks you two things and gets out of the way.', accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'browse', camera: 'trackLeft', text: 'Your subjects are already there', silentText: 'Your subjects are ready', vo: 'Your subjects are already there.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'Straight into the question bank', silentText: 'Straight to the questions', vo: 'Straight into the question bank.', focus: 0.35, accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'tourSpotlight', mascot: 'guide', camera: 'settle', text: 'a quick tour', silentText: 'Quick tour', vo: 'Then it gives you a quick tour.', accent: '#F5B301' },
    { n: 6, frames: 129, screen: 'tourSpotlight', camera: 'macro', text: 'the actual button you need', silentText: 'Shows you where to tap', vo: 'It shows you the actual button you need.', accent: '#F5B301' },
    { n: 7, frames: 129, screen: 'tourGestures', camera: 'push', text: 'the gestures do things too', silentText: 'Tap. Double-tap. Triple-tap.', vo: 'And yes, the gestures do things too.', accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'tourPomodoro', camera: 'glideDown', text: 'the tree grows while you focus', silentText: 'Timer and tree', vo: 'The timer’s there, and the tree grows while you focus.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'settings', mascot: 'guide', camera: 'push', text: 'all in one place', silentText: 'Settings in one place', vo: 'Your settings are all in one place.', accent: '#7C5CFF' },
    { n: 10, frames: 128, screen: 'home', camera: 'pull', text: 'rearrange the home screen', silentText: 'Rearrange your home', vo: 'You can rearrange the home screen too.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'homeEditTaller', camera: 'macro', text: 'Hold a block, move it, resize it', silentText: 'Move or resize blocks', vo: 'Hold a block, move it, resize it.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'themeCustomizer', camera: 'trackRight', text: 'a theme you can actually use at night', silentText: 'A theme that works at night', vo: 'And pick a theme you can actually use at night.', accent: '#FF4D8D' },
    { n: 13, frames: 128, screen: 'home', camera: 'push', text: 'Then get to studying', silentText: 'Two minutes. Then work.', vo: 'Two minutes of setup. Then get to studying.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
