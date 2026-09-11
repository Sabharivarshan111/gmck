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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Some notes are only yours', silentText: 'Some notes are only yours', vo: 'Some notes are only yours.', accent: '#22D3A6' },
    { n: 2, frames: 129, screen: 'userNotes', mascot: 'guide', camera: 'push', text: 'Write them here', silentText: 'Write them in Orbit', vo: 'Write them here in the app you already have open.', accent: '#22D3A6' },
    { n: 3, frames: 129, screen: 'userNotesEdit', camera: 'macro', text: 'Headings, bullets, highlighter', silentText: 'Headings, bullets, highlighter', vo: 'It does headings, bullets and a highlighter.', accent: '#22D3A6' },
    { n: 4, frames: 129, screen: 'userNotesPreview', camera: 'settle', text: 'Reads like a document', silentText: 'Reads like a document', vo: 'It reads like a document afterwards.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'userNotesEdit', mascot: 'guide', camera: 'macro', text: 'Draw on a blank page', silentText: 'Draw on a blank page', vo: 'Draw on a blank page with a stylus.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'userNotesEdit', camera: 'macro', text: 'Your palm does not draw', silentText: 'Palm rejection, properly', vo: 'Your palm does not draw because it knows the pen.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'userNotesMedia', camera: 'glideDown', text: 'Attach a recording', silentText: 'Attach a recording', vo: 'Attach a recording from the ward round.', accent: '#FF4D8D' },
    { n: 8, frames: 129, screen: 'userNotesMedia', camera: 'push', text: 'A video, a PDF', silentText: 'A video, or a PDF', vo: 'A video, a PDF, as many as you like.', accent: '#FF4D8D' },
    { n: 9, frames: 128, screen: 'userNotesMedia', mascot: 'guide', camera: 'macro', text: 'Keep a copy, or link it', silentText: 'Keep a copy, or link it', vo: 'Keep a copy or link it and it explains the difference.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'notesBottom', camera: 'glideDown', text: 'There is no limit', silentText: 'There is no limit', vo: 'There is no limit on any of it.', accent: '#F5B301' },
    { n: 11, frames: 128, screen: 'userNotes', mascot: 'guide', camera: 'push', text: 'None of it leaves your phone', silentText: 'None of it leaves your phone', vo: 'And none of it leaves your phone. Ever.', accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'userNotes', camera: 'macro', text: 'No account, no upload', silentText: 'No account. No upload.', vo: 'No account, no upload, no server copy.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: 'home', camera: 'pull', text: 'Beside the question bank', silentText: 'Beside the question bank', vo: 'All of it beside the question bank.', accent: '#4CC2FF' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
