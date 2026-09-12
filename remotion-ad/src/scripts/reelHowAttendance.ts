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
    { n: 1, frames: 129, screen: 'home', mascot: 'hero', camera: 'settle', text: 'how many classes you can still miss', silentText: 'How many can I miss?', vo: 'You never actually know how many classes you can still miss.', accent: '#FF4D8D' },
    { n: 2, frames: 129, screen: 'progress', mascot: 'guide', camera: 'push', text: 'the Attendance tab', silentText: 'My Progress, then Attendance', vo: 'Open My Progress and the Attendance tab.', accent: '#FF4D8D' },
    { n: 3, frames: 129, screen: 'attendanceEmpty', camera: 'settle', text: 'Pick Theory, or Clinical postings', silentText: 'Theory, or clinical postings', vo: 'Pick Theory, or Clinical postings.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'attendancePostings', camera: 'macro', text: 'the rotation you’re starting', silentText: 'Name your rotation', vo: 'Type the name of the rotation you’re starting.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'attendanceCalendar', mascot: 'guide', camera: 'push', text: 'Tap the day it starts', silentText: 'Tap the first day', vo: 'A calendar opens. Tap the day it starts.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'attendanceCalendar', camera: 'macro', text: 'tap the last day', silentText: 'Then tap the last day', vo: 'Then tap the last day, in whichever month.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'attendanceRange', camera: 'settle', text: 'counts the days between them', silentText: 'It counts the days', vo: 'It counts the days between them for you.', accent: '#22D3A6' },
    { n: 8, frames: 129, screen: 'attendanceRange', camera: 'macro', text: 'Tick Sundays off', silentText: 'Sundays can come out', vo: 'Tick Sundays off if your posting doesn’t run then.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'attendanceHoliday', mascot: 'guide', camera: 'push', text: 'offered by name', silentText: 'Holidays offered by name', vo: 'Any national holidays in that block are offered by name.', accent: '#F5B301' },
    { n: 10, frames: 128, screen: 'attendanceHoliday', camera: 'macro', text: 'the ones your college actually shuts for', silentText: 'Accept the real ones', vo: 'Accept the ones your college actually shuts for.', accent: '#F5B301' },
    { n: 11, frames: 128, screen: 'attendanceMarked', camera: 'glideDown', text: 'tap any other day off yourself', silentText: 'Mark your own days off', vo: 'And tap any other day off yourself.', accent: '#F5B301' },
    { n: 12, frames: 128, screen: 'attendanceMarked', camera: 'macro', text: 'come off the working days', silentText: 'They come off the count', vo: 'They all come off the working days.', accent: '#4CC2FF' },
    { n: 13, frames: 128, screen: 'attendanceCritical', mascot: 'guide', camera: 'push', text: 'how many you can still miss', silentText: 'Now you know', vo: 'Then it can tell you how many you can still miss.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
