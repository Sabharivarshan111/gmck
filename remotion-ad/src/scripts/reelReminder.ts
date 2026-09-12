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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'every app kept shouting at you', silentText: 'Too many notifications?', vo: 'You turned notifications off because every app kept shouting at you.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'settingsNotifications', mascot: 'guide', camera: 'push', text: 'meant to be quieter', silentText: 'A quieter reminder', vo: 'This one is meant to be quieter.', accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'settingsNotifications', camera: 'macro', text: 'one a day, in the evening', silentText: 'At most one a day', vo: 'At most one a day, in the evening.', focus: 0.45, accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'progress', camera: 'push', text: 'nothing if you’ve already studied', silentText: 'Nothing if you studied', vo: 'And nothing if you’ve already studied.', focus: 0.45, accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'progressBottom', camera: 'glideDown', text: 'it gives you a break', silentText: 'Ignored? It backs off', vo: 'Ignore a few and it gives you a break for a week.', focus: 0.5, accent: '#22D3A6' },
    { n: 6, frames: 129, screen: 'home', mascot: 'guide', camera: 'macro', text: 'for no reason', silentText: 'No pointless notifications', vo: 'It’s not trying to pull you back into the app for no reason.', focus: 0.5, accent: '#22D3A6' },
    { n: 7, frames: 129, screen: 'progress', camera: 'push', text: 'days are left until the exam', silentText: 'Days until your exam', vo: 'It can tell you how many days are left until the exam.', focus: 0.2, accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'progressBottom', camera: 'glideDown', text: 'actually due tonight', silentText: 'Revision due tonight', vo: 'Or that something is actually due tonight.', accent: '#F5B301' },
    { n: 9, frames: 128, screen: 'settings', camera: 'settle', text: 'You choose when the reminder arrives', silentText: 'You choose the time', vo: 'You choose when the reminder arrives.', focus: 0.4, accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'settings', mascot: 'guide', camera: 'macro', text: 'a test notification', silentText: 'Test it first', vo: 'And you can send yourself a test notification first.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'home', camera: 'pull', text: 'it should stay quiet', silentText: 'Most evenings: silent', vo: 'Most evenings, it should stay quiet.', accent: '#7C5CFF' },
    { n: 12, frames: 128, screen: 'settings', camera: 'glideDown', text: 'You turn it on when you want it', silentText: 'Off by default', vo: 'It starts off. You turn it on when you want it.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'progress', camera: 'push', text: 'I’d actually leave on', silentText: 'A reminder worth keeping', vo: 'That’s the kind of reminder I’d actually leave on.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
