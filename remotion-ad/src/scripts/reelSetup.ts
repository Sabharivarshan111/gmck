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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Email first, always', silentText: 'Email first, always', vo: 'Every other app wants your email first.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'tourWelcome', mascot: 'guide', camera: 'push', text: 'It asks you two things', silentText: 'It asks you two things', vo: 'It asks you two things and then gets out of the way.', accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'browse', camera: 'trackLeft', text: 'Your subjects are already there', silentText: 'Your subjects are already there', vo: 'Your subjects are already there waiting.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'questionsChapters', camera: 'push', text: 'Straight into the question bank', silentText: 'Straight into the question bank', vo: 'Straight into the question bank. No wall.', focus: 0.35, accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'tourSpotlight', mascot: 'guide', camera: 'settle', text: 'Then it shows you round', silentText: 'Then it shows you round', vo: 'Then it shows you round, properly.', accent: '#F5B301' },
    { n: 6, frames: 129, screen: 'tourSpotlight', camera: 'macro', text: 'The real button', silentText: 'It points at the real button', vo: 'It points at the real button rather than a picture.', accent: '#F5B301' },
    { n: 7, frames: 129, screen: 'tourGestures', camera: 'push', text: 'Every tap does something', silentText: 'Tap, double-tap, triple-tap', vo: 'Every tap and double tap does something.', accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'tourPomodoro', camera: 'glideDown', text: 'The timer and the tree', silentText: 'The timer, and the tree', vo: 'The timer, and the tree that grows in it.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'settings', mascot: 'guide', camera: 'push', text: 'Everything adjustable is here', silentText: 'Everything adjustable is in one place', vo: 'Everything adjustable is here, in one button.', accent: '#7C5CFF' },
    { n: 10, frames: 128, screen: 'home', camera: 'pull', text: 'Rearrange the home screen', silentText: 'Rearrange your home screen', vo: 'Rearrange the home screen to suit you.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'homeEditTaller', camera: 'macro', text: 'Hold a block and move it', silentText: 'Hold a block and move it', vo: 'Hold a block and move it. Or make it bigger.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'themeCustomizer', camera: 'trackRight', text: 'Pick a theme you can actually read', silentText: 'Pick a theme you can read', vo: 'Pick a theme you can actually read at night.', accent: '#FF4D8D' },
    { n: 13, frames: 128, screen: 'home', camera: 'push', text: 'Two minutes of setup, then actual work', silentText: 'Two minutes, then actual work', vo: 'Two minutes of setup, then actual work.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
