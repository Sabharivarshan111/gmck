import type { AdScript } from './types';

/**
 * Reel — "The tab you open on a bad day".
 *
 * ## What My Progress is actually for
 *
 * Not analytics. A student who has had a bad week does not need a dashboard;
 * they need evidence that the last month happened. So the ad is about
 * *proof* — the streak, the XP, the badges, the subject bars — and every one
 * of those is a thing the app can show without an account.
 *
 * ## The claims, and where each is enforced
 *
 * **The streak works with no account.** `check:streak` drives it on a phone
 * with no session. This is the headline because it is the surprising part:
 * every competitor's streak is a login prompt.
 *
 * **One XP ladder.** The web app and the phone level off the same numbers, and
 * `check:xp` reads both files and fails if they part company. They used to
 * disagree — sixty XP was level two in a browser and level three on a phone —
 * so the line "the same numbers everywhere" is a fix, not a boast.
 *
 * **The leaderboard shows fifty.** It rendered ten for a while, so anybody
 * ranked eleventh could not find themselves on a board they were on. Saying
 * "fifty" here is safe now and would have been a lie then.
 *
 * ## What it may not say
 *
 * Nothing here claims notes or attendance sync. They do not, deliberately, and
 * the ad about attendance says so. Two ads contradicting each other on the
 * same fact is the fastest way to lose the one that is true.
 */
export const reelProgress: AdScript = {
  id: 'orbit-reel-progress',
  title: 'Orbit MBBS — Reel: My Progress',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 80, screen: null, mascot: 'hero', camera: 'settle', text: 'Some weeks feel like nothing', silentText: 'Some weeks feel like nothing', vo: 'Some weeks feel like nothing happened.', accent: '#F5B301' },
    { n: 2, frames: 100, screen: 'progress', mascot: 'guide', camera: 'push', text: 'This tab disagrees', silentText: 'This tab disagrees', vo: 'This tab disagrees, with numbers.', accent: '#F5B301' },
    { n: 3, frames: 100, screen: 'progress', camera: 'macro', text: 'Your streak, counted in days', silentText: 'Your streak, in days', vo: 'Your streak, counted in days you turned up.', focus: 0.25, accent: '#F5B301' },
    { n: 4, frames: 105, screen: 'progress', camera: 'push', text: 'It needs no account', silentText: 'It needs no account', vo: 'It needs no account. Not one.', focus: 0.25, accent: '#22D3A6' },
    { n: 5, frames: 100, screen: 'progressBottom', camera: 'glideDown', text: 'XP for every question', silentText: 'XP for every question', vo: 'XP for every question you tick off.', accent: '#7C5CFF' },
    { n: 6, frames: 95, screen: 'progressBottom', camera: 'macro', text: 'The same numbers on the phone and the web', silentText: 'The same numbers everywhere', vo: 'The same numbers on the phone and the web.', accent: '#7C5CFF' },
    { n: 7, frames: 100, screen: 'progressBottom', mascot: 'guide', camera: 'push', text: 'Badges you can actually see', silentText: 'Badges you can actually see', vo: 'Badges you can actually see when you have them.', focus: 0.45, accent: '#FF4D8D' },
    { n: 8, frames: 95, screen: 'progressBottom', camera: 'glideDown', text: 'A leaderboard of fifty', silentText: 'A leaderboard of fifty', vo: 'A leaderboard of fifty, so you can find yourself.', focus: 0.6, accent: '#FF4D8D' },
    { n: 9, frames: 100, screen: 'progress', camera: 'macro', text: 'Every subject, and how far into it', silentText: 'Every subject, how far in', vo: 'Every subject, and how far into it you are.', focus: 0.5, accent: '#4CC2FF' },
    { n: 10, frames: 100, screen: 'attendance', camera: 'push', text: 'Your attendance is in here too', silentText: 'Your attendance is here too', vo: 'Your attendance is in here too, worked out.', focus: 0.4, accent: '#22D3A6' },
    { n: 11, frames: 95, screen: 'userNotes', camera: 'trackRight', text: 'And your own notes', silentText: 'And your own notes', vo: 'And your own notes, on this phone only.', accent: '#22D3A6' },
    { n: 12, frames: 95, screen: 'progress', camera: 'settle', text: 'Days until your exam', silentText: 'Days until your exam', vo: 'Days until your exam, counting down.', focus: 0.2, accent: '#F5B301' },
    { n: 13, frames: 95, screen: 'growth', camera: 'push', text: 'Hours you actually focused', silentText: 'Hours you actually focused', vo: 'Hours you actually focused, not hours you planned to.', accent: '#22D3A6' },
    { n: 14, frames: 95, screen: 'treegallery', camera: 'trackRight', text: 'Twelve trees, unlocked by focused hours', silentText: 'Twelve trees to unlock', vo: 'Twelve trees, unlocked by focused hours.', accent: '#22D3A6' },
    { n: 15, frames: 100, screen: 'settingsNotifications', mascot: 'guide', camera: 'macro', text: 'One reminder in the evening', silentText: 'One reminder in the evening', vo: 'One reminder in the evening, if there is something to say.', accent: '#7C5CFF' },
    { n: 16, frames: 95, screen: 'home', camera: 'pull', text: 'Proof that the month happened', silentText: 'Proof the month happened', vo: 'Proof that the month happened.', accent: '#F5B301' },
    { n: 17, frames: 85, screen: null, mascot: 'hero', camera: 'settle', text: 'Open it on a bad day', silentText: 'Open it on a bad day', vo: 'Open it on a bad day.', accent: '#F5B301' },
    { n: 18, frames: 165, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
