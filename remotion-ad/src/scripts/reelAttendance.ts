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
    { n: 1, frames: 120, screen: null, mascot: 'hero', camera: 'settle', text: 'How many more classes can I miss', silentText: 'How many can I miss?', vo: 'How many more classes can I miss without getting into trouble?', accent: '#22D3A6' },
    { n: 2, frames: 125, screen: 'attendanceEmpty', mascot: 'guide', camera: 'push', text: 'Add your subjects once', silentText: 'Add your subjects', vo: 'Add your subjects once.', accent: '#22D3A6' },
    { n: 3, frames: 130, screen: 'attendance', camera: 'macro', text: 'tap present or absent', silentText: 'Present or absent', vo: 'After class, tap present or absent.', focus: 0.3, accent: '#22D3A6' },
    { n: 4, frames: 130, screen: 'attendance', camera: 'macro', text: 'how many you can still miss', silentText: 'See what you can still miss', vo: 'And it tells you how many you can still miss.', focus: 0.45, accent: '#22D3A6' },
    { n: 5, frames: 135, screen: 'attendance', camera: 'push', text: 'No percentage maths in your head', silentText: 'See the number directly', vo: 'No percentage maths in your head.', focus: 0.42, accent: '#4CC2FF' },
    { n: 6, frames: 130, screen: 'attendanceCritical', camera: 'glideDown', text: 'right on the line', silentText: 'Right on the line', vo: 'Sitting right on the line?', focus: 0.55, accent: '#4CC2FF' },
    { n: 7, frames: 130, screen: 'attendanceCritical', camera: 'macro', text: 'whether you can miss another one', silentText: 'Check before you miss', vo: 'Then you can see whether you can miss another one.', focus: 0.62, accent: '#F5B301' },
    { n: 8, frames: 135, screen: 'attendanceCritical', camera: 'push', text: 'instead of rounding it for you', silentText: 'No rounding', vo: 'It keeps the calculation exact instead of rounding it for you.', focus: 0.62, accent: '#F5B301' },
    { n: 9, frames: 130, screen: 'attendance', mascot: 'guide', camera: 'macro', text: 'Your college decides', silentText: 'Your college sets the target', vo: 'Your college decides the attendance requirement.', focus: 0.5, accent: '#F5B301' },
    { n: 10, frames: 130, screen: 'attendancePostings', mascot: 'guide', camera: 'push', text: 'their own tracking', silentText: 'Separate posting tracker', vo: 'And postings can have their own tracking.', accent: '#FF4D8D' },
    { n: 11, frames: 130, screen: 'attendancePostings', camera: 'macro', text: 'see what’s left of the rotation', silentText: 'See what’s left', vo: 'You can actually see what’s left of the rotation.', focus: 0.35, accent: '#FF4D8D' },
    { n: 12, frames: 130, screen: 'attendancePostings', camera: 'glideDown', text: 'only the days you’ve told it to count', silentText: 'Only counted days', vo: 'And only the days you’ve told it to count are included.', focus: 0.5, accent: '#FF4D8D' },
    { n: 13, frames: 130, screen: 'progressBottom', mascot: 'guide', camera: 'settle', text: 'It stays on your phone', silentText: 'Stays on your phone', vo: 'It stays on your phone.', accent: '#22D3A6' },
    { n: 14, frames: 125, screen: 'home', camera: 'push', text: 'Know before you skip', silentText: 'Orbit MBBS — on Google Play', vo: 'Know before you skip. Orbit MBBS on Google Play.', accent: '#7C5CFF' },
  ],
};
