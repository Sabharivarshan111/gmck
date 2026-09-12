import type { AdScript } from './types';

/**
 * Reel — "Your own notes, on your own phone".
 *
 * ## Two different things called notes, and the ad has to separate them
 *
 * The handwritten notes the app *writes* for a question are one feature, and
 * three other reels are about them. This one is about the notes the reader
 * writes: the ward-round scribble, the photograph of somebody else's textbook,
 * the recording of a lecture, the diagram drawn with a stylus at midnight.
 *
 * They are a different promise, and the promise is privacy. None of it leaves
 * the phone — no row, no bucket, no account — and `check:cloud-ids` fails the
 * build if either file so much as imports the Supabase client. That is why the
 * ad can say it flatly instead of hedging.
 *
 * ## The uncapped part is real and worth saying
 *
 * There is no limit on how many pictures, videos, recordings or PDFs a note
 * holds. There is nothing to ration: they are on the reader's own phone, and
 * the device's free space is the limit. Every other app that offers this
 * counts megabytes at you.
 *
 * ## Copy or link, and why the ad says both consequences
 *
 * A copy survives the original being deleted and costs space. A link costs
 * nothing and dies with the original. The chooser says both before either is
 * picked, and so does shot 11 — because the failure mode of not saying it is
 * somebody's recording disappearing a month later.
 *
 * The one thing this ad may never say is that notes sync between the phone and
 * the web app. They do not, on purpose.
 */
export const reelNotes: AdScript = {
  id: 'orbit-reel-notes',
  title: 'Orbit MBBS — Reel: Your own notes',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'not in the textbook', silentText: 'Not in the textbook', vo: 'Your professor says something useful, and it’s not in the textbook.', accent: '#22D3A6' },
    { n: 2, frames: 129, screen: 'userNotes', mascot: 'guide', camera: 'push', text: 'Write it down right there', silentText: 'Your own notes', vo: 'Write it down right there.', accent: '#22D3A6' },
    { n: 3, frames: 129, screen: 'userNotesEdit', camera: 'macro', text: 'Headings, bullets, highlighting', silentText: 'Headings. Bullets. Highlighting.', vo: 'Headings, bullets, highlighting.', accent: '#22D3A6' },
    { n: 4, frames: 129, screen: 'userNotesPreview', camera: 'settle', text: 'a proper set of notes', silentText: 'Clean notes', vo: 'Then it still looks like a proper set of notes.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'userNotesEdit', mascot: 'guide', camera: 'macro', text: 'handwrite on a blank page', silentText: 'Handwritten notes', vo: 'You can handwrite on a blank page too.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'userNotesEdit', camera: 'macro', text: 'Rest your palm down', silentText: 'Palm rejection', vo: 'Rest your palm down and keep writing.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'userNotesMedia', camera: 'glideDown', text: 'Keep it with the note', silentText: 'Add a recording', vo: 'Got a recording from the ward round? Keep it with the note.', accent: '#FF4D8D' },
    { n: 8, frames: 129, screen: 'userNotesMedia', camera: 'push', text: 'attach a video or PDF', silentText: 'Video or PDF', vo: 'You can attach a video or PDF too.', accent: '#FF4D8D' },
    { n: 9, frames: 128, screen: 'userNotesMedia', mascot: 'guide', camera: 'macro', text: 'keep a copy or just link to it', silentText: 'Copy or link', vo: 'And choose whether to keep a copy or just link to it.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'notesBottom', camera: 'glideDown', text: 'together in the same note', silentText: 'Keep it together', vo: 'All of that can stay together in the same note.', accent: '#F5B301' },
    { n: 11, frames: 128, screen: 'userNotes', mascot: 'guide', camera: 'push', text: 'Your notes stay on your phone', silentText: 'Stays on your phone', vo: 'Your notes stay on your phone.', accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'userNotes', camera: 'macro', text: 'No account. No upload', silentText: 'No account. No upload.', vo: 'No account. No upload.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'alongside the question bank', silentText: 'Notes and question bank', vo: 'And the notes sit alongside the question bank.', accent: '#4CC2FF' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
