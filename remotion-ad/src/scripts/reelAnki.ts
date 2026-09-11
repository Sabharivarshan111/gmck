import type { AdScript } from './types';

/**
 * Reel — "Your Anki decks, on the phone you already study on".
 *
 * ## Why this ad exists separately
 *
 * Every other reel argues that Orbit has something. This one argues that Orbit
 * takes something the viewer **already has** — the shared `.apkg` a senior
 * passed down, the deck their batch has been trading since first year — and
 * opens it. That is a different kind of claim and it needs its own sixty
 * seconds, because the objection it answers is not "is this good" but "do I
 * have to start again".
 *
 * ## Every frame is a real capture of the real importer
 *
 * `apkg-1-hub` through `apkg-6-shared` come out of `preview/apkg-shot.mjs`,
 * which drives the actual screens. Nothing here is a mockup, and nothing here
 * shows a deck that does not exist: the fixtures are the packages
 * `scripts/make-apkg-fixtures.py` builds and `check:apkg` opens.
 *
 * ## Two claims that are load-bearing and both are true
 *
 * **It stays on the phone.** The importer takes no permission — Android's
 * document picker runs out of process — and the module never touches the
 * network. `check:cloud-ids` and `check:apkg` both hold that from opposite
 * sides. So the line "it never leaves your phone" is a fact about the build,
 * not a reassurance.
 *
 * **Two hundred a day.** The daily new-card cap really is 200 now. It was 50,
 * which is Anki's own default and far too few for somebody importing a
 * thousand-card pathology deck three weeks before an exam.
 *
 * The one thing this ad may never say is that the decks sync. They do not, on
 * purpose: a shared medical deck is somebody else's work, and uploading it
 * would be this app redistributing it.
 */
export const reelAnki: AdScript = {
  id: 'orbit-reel-anki',
  title: 'Orbit MBBS — Reel: Bring your Anki decks',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Already have Anki decks', silentText: 'Already have Anki decks?', vo: 'You already have Anki decks.', accent: '#4CC2FF' },
    { n: 2, frames: 129, screen: 'apkgHubOnly', mascot: 'guide', camera: 'push', text: 'Bring them in here', silentText: 'Bring them straight in', vo: 'Bring them in here. Nothing to sign up for.', accent: '#4CC2FF' },
    { n: 3, frames: 129, screen: 'apkgInstructions', camera: 'glideDown', text: 'It tells you where the file is', silentText: 'Where the file is, first', vo: 'It tells you where the file is first.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'apkgChooser', mascot: 'guide', camera: 'macro', text: 'Pick the package', silentText: 'Pick your .apkg', vo: 'Pick the package. That is the whole setup.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'flashcards', camera: 'settle', text: 'Your deck lands in your list', silentText: 'Your deck lands in your list', vo: 'Your deck lands in your list with the rest.', accent: '#4CC2FF' },
    { n: 6, frames: 129, screen: 'ankiStudy', mascot: 'guide', camera: 'macro', text: 'Cards, pictures and cloze', silentText: 'Your deck, beside your own', vo: 'Cards and pictures and cloze deletions come through.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'ankiStudy', camera: 'push', text: 'It will not take a year', silentText: 'It will not take a year', vo: 'A shared deck is huge, and it will not take you a year.', focus: 0.4, accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'flashcardsBottom', camera: 'glideDown', text: 'It never leaves your phone', silentText: 'Never leaves your phone', vo: 'It never leaves your phone and nothing is uploaded.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'apkgShare', mascot: 'guide', camera: 'macro', text: 'Send a deck to a friend', silentText: 'Send a deck to a friend', vo: 'You can send a deck to a friend too.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'flashcards', camera: 'pull', text: 'Or let Orbit write the cards', silentText: 'Or let Orbit write the cards', vo: 'Or let Orbit write the cards for a chapter.', accent: '#7C5CFF' },
    { n: 11, frames: 128, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'From the question bank itself', silentText: 'Built from the question bank', vo: 'From the question bank itself, not from nowhere.', focus: 0.3, accent: '#7C5CFF' },
    { n: 12, frames: 128, screen: 'progress', camera: 'push', text: 'They come back on schedule', silentText: 'They come back on schedule', vo: 'They come back on schedule, before you forget.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: null, mascot: 'hero', camera: 'settle', text: 'Bring the deck you already have', silentText: 'Bring the deck you already have', vo: 'Bring the deck you already have.', accent: '#4CC2FF' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
