import type { AdScript } from './types';

/**
 * Reel — "How to set up a posting", the calendar walkthrough.
 *
 * ## Why this ad exists at all
 *
 * The rotation used to be a number somebody typed: "how many days does it
 * run?". It is two dates on a calendar now, because a college hands a posting
 * out as two dates on a noticeboard and the subtraction was never the
 * reader's to do. A control that changed shape is exactly the thing a
 * walkthrough is for — anybody who used the old one is looking for a box that
 * is no longer there.
 *
 * ## The honest part is the selling point, so it is shot nine and ten
 *
 * Four of India's gazetted holidays fall on a fixed date every year, and those
 * are offered by name. Everything else moves against the Gregorian calendar or
 * belongs to one college or one state — which is exactly the kind that closes
 * a medical college — so the reader marks those themselves.
 *
 * The ad says both halves. A competitor's tracker that silently pre-filled a
 * holiday list would look better in a demo and would be handing people a
 * working-day count built on dates that are wrong, which is the failure this
 * whole feature exists to prevent: telling somebody they can miss three more
 * days when the answer is one.
 *
 * ## What it may never say
 *
 * That this syncs, or that anybody else can see it. A record of which days
 * somebody turned up is a record of their movements. `lib/attendance.ts` is
 * AsyncStorage only and `check:cloud-ids` holds it there.
 */
export const reelHowAttendance: AdScript = {
  id: 'orbit-reel-how-attendance',
  title: 'Orbit MBBS — How to: set up a posting',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: 'home', mascot: 'hero', camera: 'settle', text: 'keeps you in the exam', silentText: 'Attendance decides the exam', vo: 'Attendance is the number that keeps you in the exam.', accent: '#FF4D8D' },
    { n: 2, frames: 129, screen: 'progress', mascot: 'guide', camera: 'push', text: 'Open My Progress, then the Attendance tab', silentText: 'My Progress, then Attendance', vo: 'Open My Progress, then the Attendance tab.', accent: '#FF4D8D' },
    { n: 3, frames: 129, screen: 'attendanceEmpty', camera: 'settle', text: 'Choose Theory, or Clinical postings', silentText: 'Theory, or clinical postings', vo: 'Choose Theory, or Clinical postings.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'attendancePostings', camera: 'macro', text: 'Name the rotation you are starting', silentText: 'Name your rotation', vo: 'Name the rotation you are starting.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'attendanceCalendar', mascot: 'guide', camera: 'push', text: 'Tap the first day', silentText: 'Tap the first day', vo: 'A calendar opens. Tap the first day.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'attendanceCalendar', camera: 'macro', text: 'tap the last one, in any month', silentText: 'Then tap the last day', vo: 'Then tap the last one, in any month.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'attendanceRange', camera: 'settle', text: 'counts the days between them', silentText: 'It counts the days for you', vo: 'Orbit counts the days between them for you.', accent: '#22D3A6' },
    { n: 8, frames: 129, screen: 'attendanceRange', camera: 'macro', text: 'Sundays come out', silentText: 'Sundays can come out', vo: 'Sundays come out when your posting does not run.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'attendanceHoliday', mascot: 'guide', camera: 'push', text: 'holidays inside the block are offered by name', silentText: 'Holidays are offered by name', vo: 'National holidays inside the block are offered by name.', accent: '#F5B301' },
    { n: 10, frames: 128, screen: 'attendanceHoliday', camera: 'macro', text: 'the ones your college actually closes for', silentText: 'Accept only the real ones', vo: 'Accept the ones your college actually closes for.', accent: '#F5B301' },
    { n: 11, frames: 128, screen: 'attendanceMarked', camera: 'glideDown', text: 'Mark any other day off yourself', silentText: 'Mark your own days off', vo: 'Mark any other day off yourself.', accent: '#F5B301' },
    { n: 12, frames: 128, screen: 'attendanceMarked', camera: 'macro', text: 'comes off the working days', silentText: 'They come off the count', vo: 'Every one of them comes off the working days.', accent: '#4CC2FF' },
    { n: 13, frames: 128, screen: 'attendanceCritical', mascot: 'guide', camera: 'push', text: 'how many you may miss', silentText: 'How many you can miss', vo: 'Now it can tell you how many you may miss.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
