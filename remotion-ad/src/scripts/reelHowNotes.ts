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
    { n: 1, frames: 129, screen: 'home', mascot: 'hero', camera: 'settle', text: 'live in My Progress', silentText: 'Your own notes', vo: 'Your own notes live in My Progress.', accent: '#22D3A6' },
    { n: 2, frames: 129, screen: 'progress', mascot: 'guide', camera: 'push', text: 'the Notes tab', silentText: 'My Progress, then Notes', vo: 'Open My Progress and the Notes tab.', accent: '#22D3A6' },
    { n: 3, frames: 129, screen: 'userNotes', camera: 'macro', text: 'The plus button', silentText: 'Plus starts a new note', vo: 'The plus button starts a new note.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'userNotesEdit', camera: 'settle', text: 'start typing', silentText: 'Title it, then type', vo: 'Give it a title and start typing.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'noteToolbar', camera: 'macro', text: 'bullets and highlighting', silentText: 'Headings, bullets, highlighter', vo: 'The toolbar does headings, bullets and highlighting.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'userNotesPreview', camera: 'push', text: 'makes it a document', silentText: 'It reads as a document', vo: 'Read note makes it a document.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'userNotesMedia', mascot: 'guide', camera: 'macro', text: 'Add a file', silentText: 'Add a file', vo: 'Add a file and pick what you want to attach.', accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'userNotesMedia', camera: 'settle', text: 'a recording, a PDF', silentText: 'Photo, video, audio, PDF', vo: 'A photo, a video, a recording, a PDF.', accent: '#F5B301' },
    { n: 9, frames: 128, screen: 'userNotesMedia', camera: 'macro', text: 'keep a copy, or link it', silentText: 'Copy, or link', vo: 'Then it asks: keep a copy, or link it.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'notesBottom', mascot: 'guide', camera: 'glideDown', text: 'survives the original and costs space', silentText: 'A copy is safe', vo: 'A copy survives the original and costs space.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'notesBottom', camera: 'push', text: 'dies if you move it', silentText: 'A link can break', vo: 'A link costs nothing but dies if you move it.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'notesBottom', camera: 'glideDown', text: 'Orbit offers to copy it', silentText: 'A broken link is one tap', vo: 'If a link breaks, Orbit offers to copy it.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'userNotes', mascot: 'guide', camera: 'macro', text: 'None of it leaves your phone', silentText: 'No limit. Nothing leaves.', vo: 'None of it leaves your phone. No limit.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
