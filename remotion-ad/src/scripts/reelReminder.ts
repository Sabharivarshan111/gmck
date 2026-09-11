import type { AdScript } from './types';

/**
 * Reel — "The notification that mostly says nothing".
 *
 * ## An ad whose selling point is silence
 *
 * Every study app sends a daily notification and every one of them is the same
 * notification: come back and play. People turn them off in the first week and
 * never turn them on again, which means the one evening the reminder would
 * have mattered, it is not there.
 *
 * Orbit's rules are the opposite and they are the product: at most one a day,
 * nothing at all if you have already studied, and it stops asking for a week
 * after three you ignore. That last rule is the one no competitor has, and it
 * is the one that earns the switch being left on.
 *
 * ## Why this is hard to advertise, and how the ad handles it
 *
 * A feature that is correctly silent looks identical to a feature that is
 * broken. That is not a marketing problem, it is a real one — the digest that
 * feeds it was written from one screen for months, so the alarm woke every
 * evening, found no facts and went back to sleep, with the switch showing on.
 *
 * So the ad points at "Send one now", which is a real button in Settings that
 * runs the real composer over the real digest, and says what it does. An ad
 * that tells you how to check a thing works is an ad that expects to be
 * checked.
 *
 * The screen is `settings-bottom`, captured by tapping Settings open — the
 * notifications section, its rules printed underneath it, in the app's own
 * words. Nothing here is a claim the screen does not already make.
 */
export const reelReminder: AdScript = {
  id: 'orbit-reel-reminder',
  title: 'Orbit MBBS — Reel: The daily reminder',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'You turned notifications off', silentText: 'You turned notifications off', vo: 'You turned notifications off. Everyone did.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'settingsNotifications', mascot: 'guide', camera: 'push', text: 'This one is different', silentText: 'This one is different', vo: 'This one is different, and here is why.', accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'settingsNotifications', camera: 'macro', text: 'At most one a day', silentText: 'At most one a day', vo: 'At most one a day, in the evening.', focus: 0.45, accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'settingsNotifications', camera: 'push', text: 'Nothing at all if you have already studied', silentText: 'Nothing if you already studied', vo: 'Nothing at all if you have already studied today.', focus: 0.45, accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'settingsNotifications', camera: 'glideDown', text: 'it stops for a week after three you ignore', silentText: 'It stops after three you ignore', vo: 'And it stops for a week after three you ignore.', focus: 0.5, accent: '#22D3A6' },
    { n: 6, frames: 129, screen: 'settingsNotifications', mascot: 'guide', camera: 'macro', text: 'Never come back and play', silentText: 'It has nothing to sell you', vo: 'It never says come back and play.', focus: 0.5, accent: '#22D3A6' },
    { n: 7, frames: 129, screen: 'progress', camera: 'push', text: 'Days left until your exam', silentText: 'Days left until your exam', vo: 'It says days left until your exam.', focus: 0.2, accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'progressBottom', camera: 'glideDown', text: 'Or revision that is genuinely due', silentText: 'Or revision that is due', vo: 'Or revision that is genuinely due tonight.', accent: '#F5B301' },
    { n: 9, frames: 128, screen: 'settingsNotifications', camera: 'settle', text: 'You choose the hour', silentText: 'You choose the hour', vo: 'You choose the hour it arrives.', focus: 0.4, accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'settings', mascot: 'guide', camera: 'macro', text: 'Send one now', silentText: 'Send one now and see it', vo: 'You can send one now to see what it looks like.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'home', camera: 'pull', text: 'Most evenings it is silent', silentText: 'Most evenings: silent', vo: 'Most evenings it is silent and that is correct.', accent: '#7C5CFF' },
    { n: 12, frames: 128, screen: 'settings', camera: 'glideDown', text: 'Off by default', silentText: 'Off by default', vo: 'It is off by default. You turn it on.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'home', camera: 'push', text: 'A reminder worth leaving on', silentText: 'A reminder worth keeping on', vo: 'A reminder worth leaving on.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
