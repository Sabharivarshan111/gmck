import type { AdScript } from './types';

/**
 * Reel — "How to use My Progress → Notes", as a walkthrough.
 *
 * ## This is a different kind of ad from `reelNotes`, on purpose
 *
 * `reelNotes` argues: here is a thing you did not know Orbit does, and here is
 * why it is worth having. This one assumes the viewer is already persuaded and
 * answers the next question, which is the one that actually loses people —
 * *where is it, and what do I tap first?*
 *
 * Two features in this app were reported as missing when they were shipped and
 * on screen: reading a note (the title looked like a title, not a button) and
 * the stylus (it was reachable only from an attached picture). Both were
 * findability, not absence. A walkthrough is the cheapest fix for that class
 * of problem, and it costs no app code at all.
 *
 * ## The steps are in tap order, and the tap order is the script
 *
 * Every shot is one action, named the way the control names itself, so the
 * viewer can follow along on their own phone. That is why the captions say
 * "the plus button" and "Read note" rather than paraphrasing them — a
 * walkthrough that renames the buttons is a walkthrough you cannot follow.
 *
 * ## What it may never say
 *
 * That these notes sync, or reach the web app. They do not, deliberately —
 * `hooks/useUserNotes.ts` is AsyncStorage only and `check:cloud-ids` fails the
 * build if it ever imports the Supabase client. Shot 13 states the privacy
 * flatly for that reason: it is enforced, not promised.
 */
export const reelHowNotes: AdScript = {
  id: 'orbit-reel-how-notes',
  title: 'Orbit MBBS — How to: your own notes',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: 'home', mascot: 'hero', camera: 'settle', text: 'Your own notes', silentText: 'Your own notes', vo: 'Your own notes live inside My Progress.', accent: '#22D3A6' },
    { n: 2, frames: 129, screen: 'progress', mascot: 'guide', camera: 'push', text: 'Open My Progress', silentText: 'First, open My Progress', vo: 'Open My Progress from the bar at the bottom.', accent: '#22D3A6' },
    { n: 3, frames: 129, screen: 'progress', camera: 'macro', text: 'tap the Notes tab', silentText: 'Then the Notes tab', vo: 'Then tap the Notes tab along the top.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'userNotes', camera: 'settle', text: 'Every note you have written', silentText: 'Every note you wrote', vo: 'Every note you have written is listed here.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'userNotes', mascot: 'guide', camera: 'macro', text: 'The plus button starts a new one', silentText: 'Plus starts a new note', vo: 'The plus button starts a new one.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'userNotesEdit', camera: 'push', text: 'a title and start typing', silentText: 'Title it, then type', vo: 'Give it a title and start typing.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'noteToolbar', camera: 'macro', text: 'headings, bullets and a highlighter', silentText: 'Headings, bullets, highlighter', vo: 'The toolbar adds headings, bullets and a highlighter.', accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'userNotesPreview', camera: 'settle', text: 'turns it back into a document', silentText: 'It reads as a document', vo: 'Read note turns it back into a document.', accent: '#F5B301' },
    { n: 9, frames: 128, screen: 'userNotesEdit', mascot: 'guide', camera: 'macro', text: 'The pen draws on a blank page', silentText: 'Draw on a blank page', vo: 'The pen draws on a blank page too.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'userNotesMedia', camera: 'glideDown', text: 'a photograph, a recording or a video', silentText: 'Attach photos, audio, video', vo: 'Attach a photograph, a recording or a video.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'userNotesMedia', camera: 'push', text: 'Keep a copy, or link the original', silentText: 'Keep a copy, or link it', vo: 'Keep a copy, or link the original where it is.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'notesBottom', camera: 'glideDown', text: 'no limit on how much you attach', silentText: 'No limit on attachments', vo: 'There is no limit on how much you attach.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'userNotes', mascot: 'guide', camera: 'macro', text: 'None of it ever leaves your phone', silentText: 'It never leaves your phone', vo: 'None of it ever leaves your phone.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
