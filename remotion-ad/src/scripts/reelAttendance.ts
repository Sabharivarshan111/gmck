import type { AdScript } from './types';

/**
 * Reel — "How many can I still miss?"
 *
 * ## The one question this feature answers
 *
 * Nobody opens an attendance tracker to admire a percentage. They open it
 * because a class clashes with something and they want to know whether they
 * can skip it. So the ad is built around that sentence and never leaves it:
 * every shot either asks it or answers it.
 *
 * The app itself is written the same way — `canMiss` and `mustAttend` in
 * `lib/attendance.ts` — and the arithmetic in the captures is that function's
 * real output, not a number typed into a mockup. `check:attendance` walks
 * eighteen worked examples of it, including the one that matters most here:
 * eighty-six per cent with nine to spare, and seventy-five per cent exactly,
 * where the honest answer is that you cannot miss another one.
 *
 * **The floor is the argument.** Rounding would tell somebody sitting on the
 * line that they have one spare, and they would take it, and they would be
 * short. That is the difference between a tool and a toy, and it is why shot 8
 * exists at all.
 *
 * ## Theory and postings are two lists, and the ad shows both
 *
 * A theory subject has no end anybody knows in advance. A clinical posting is
 * a fixed block, so "you can miss four" becomes "you can miss four, and there
 * are only two days left" — which is a different and much more useful answer.
 * Shots 11 to 13 are that distinction, and they are the reason the feature is
 * not one list with a filter on it.
 *
 * ## It stays on the phone
 *
 * A record of which classes somebody skipped is a record of their week. It is
 * AsyncStorage only, in `check:cloud-ids`' LOCAL_ONLY list, and shot 15 says
 * so plainly rather than leaving it as something the viewer has to trust.
 */
export const reelAttendance: AdScript = {
  id: 'orbit-reel-attendance',
  title: 'Orbit MBBS — Reel: The attendance tracker',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 120, screen: null, mascot: 'hero', camera: 'settle', text: 'How many can I miss', silentText: 'How many can I still miss?', vo: 'How many can I miss and still be safe?', accent: '#22D3A6' },
    { n: 2, frames: 125, screen: 'attendance', mascot: 'guide', camera: 'push', text: 'Orbit works it out', silentText: 'Orbit works it out for you', vo: 'Orbit works that out for you.', accent: '#22D3A6' },
    { n: 3, frames: 130, screen: 'attendance', camera: 'macro', text: 'Add your subjects once', silentText: 'Add your subjects once', vo: 'Add your subjects once at the start.', focus: 0.3, accent: '#22D3A6' },
    { n: 4, frames: 130, screen: 'attendance', camera: 'macro', text: 'Present or absent', silentText: 'Tap Present or Absent', vo: 'After each class tap present or absent.', focus: 0.45, accent: '#22D3A6' },
    { n: 5, frames: 135, screen: 'attendance', camera: 'push', text: 'Safely miss nine more', silentText: 'You can safely miss 9 more', vo: 'It tells you that you can safely miss nine more.', focus: 0.42, accent: '#4CC2FF' },
    { n: 6, frames: 130, screen: 'attendance', camera: 'glideDown', text: 'A number', silentText: 'A number, not a percentage', vo: 'A number rather than a percentage to work out.', focus: 0.55, accent: '#4CC2FF' },
    { n: 7, frames: 130, screen: 'attendance', camera: 'macro', text: 'Exactly on seventy-five', silentText: 'Exactly on 75%', vo: 'Sitting exactly on seventy-five per cent?', focus: 0.62, accent: '#F5B301' },
    { n: 8, frames: 135, screen: 'attendance', camera: 'push', text: 'Cannot miss another one', silentText: 'You cannot miss another one', vo: 'Then it says you cannot miss another one.', focus: 0.62, accent: '#F5B301' },
    { n: 9, frames: 130, screen: 'attendance', mascot: 'guide', camera: 'macro', text: 'It never rounds up', silentText: 'It never rounds up', vo: 'It never rounds up because rounding is how people fall short.', focus: 0.5, accent: '#F5B301' },
    { n: 10, frames: 130, screen: 'attendancePostings', mascot: 'guide', camera: 'push', text: 'Postings are different', silentText: 'Clinical postings are different', vo: 'Clinical postings are different so they get their own list.', accent: '#FF4D8D' },
    { n: 11, frames: 130, screen: 'attendancePostings', camera: 'macro', text: 'Day five of twenty-four', silentText: 'Day 5 of 24', vo: 'Day five of twenty-four counted off the calendar.', focus: 0.35, accent: '#FF4D8D' },
    { n: 12, frames: 130, screen: 'attendancePostings', camera: 'glideDown', text: 'Sundays do not count', silentText: 'Sundays do not count', vo: 'Sundays do not count so the days left are real.', focus: 0.5, accent: '#FF4D8D' },
    { n: 13, frames: 130, screen: 'progressBottom', mascot: 'guide', camera: 'settle', text: 'Stays on your phone', silentText: 'It stays on your phone', vo: 'It stays on your phone and nobody else sees it.', accent: '#22D3A6' },
    { n: 14, frames: 125, screen: 'home', camera: 'push', text: 'Know before you skip', silentText: 'Orbit MBBS — on Google Play', vo: 'Know before you skip. Orbit MBBS on Google Play.', accent: '#7C5CFF' },
  ],
};
