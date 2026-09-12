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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'what you actually did', silentText: 'Where did the week go?', vo: 'You studied all week and somehow can’t remember what you actually did.', accent: '#F5B301' },
    { n: 2, frames: 129, screen: 'progress', mascot: 'guide', camera: 'push', text: 'gives you numbers', silentText: 'See the numbers', vo: 'This tab at least gives you numbers.', accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'progress', camera: 'macro', text: 'the days you turned up', silentText: 'Your streak, in days', vo: 'Your streak is just the days you turned up.', focus: 0.25, accent: '#F5B301' },
    { n: 4, frames: 129, screen: 'progress', camera: 'push', text: 'another account', silentText: 'No account needed', vo: 'And you don’t need another account for it.', focus: 0.25, accent: '#22D3A6' },
    { n: 5, frames: 129, screen: 'progressBottom', camera: 'glideDown', text: 'XP when you tick off questions', silentText: 'XP for completed questions', vo: 'You get XP when you tick off questions.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'progressBottom', mascot: 'guide', camera: 'push', text: 'Badges show up as you earn them', silentText: 'See your badges', vo: 'Badges show up as you earn them.', focus: 0.45, accent: '#FF4D8D' },
    { n: 7, frames: 129, screen: 'progressBottom', camera: 'glideDown', text: 'a leaderboard if you actually want one', silentText: 'Optional leaderboard', vo: 'And there’s a leaderboard if you actually want one.', focus: 0.6, accent: '#FF4D8D' },
    { n: 8, frames: 129, screen: 'attendance', camera: 'push', text: 'Your attendance sits here too', silentText: 'Attendance too', vo: 'Your attendance sits here too.', focus: 0.4, accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'userNotes', camera: 'trackRight', text: 'Same with your own notes', silentText: 'Your own notes', vo: 'Same with your own notes.', accent: '#22D3A6' },
    { n: 10, frames: 128, screen: 'growth', camera: 'push', text: 'the hours you actually focused', silentText: 'Focused hours', vo: 'You can see the hours you actually focused.', accent: '#22D3A6' },
    { n: 11, frames: 128, screen: 'treegallery', camera: 'trackRight', text: 'how many trees you’ve unlocked', silentText: 'Your unlocked trees', vo: 'And how many trees you’ve unlocked.', accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'settingsNotifications', mascot: 'guide', camera: 'macro', text: 'an evening reminder', silentText: 'Evening reminder', vo: 'There’s also an evening reminder when something needs your attention.', accent: '#7C5CFF' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'proof that you actually studied', silentText: 'Your month, in one place', vo: 'Basically, proof that you actually studied this month.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
