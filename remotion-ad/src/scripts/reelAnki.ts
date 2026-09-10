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
    { n: 1, frames: 80, screen: null, mascot: 'hero', camera: 'settle', text: 'Already have Anki decks', silentText: 'Already have Anki decks?', vo: 'You already have Anki decks.', accent: '#4CC2FF' },
    { n: 2, frames: 100, screen: 'apkgHubOnly', mascot: 'guide', camera: 'push', text: 'Bring them in here', silentText: 'Bring them straight in', vo: 'Bring them in here. Nothing to sign up for.', accent: '#4CC2FF' },
    { n: 3, frames: 100, screen: 'apkgInstructions', camera: 'glideDown', text: 'It tells you where the file is', silentText: 'Where the file is, first', vo: 'It tells you where the file is first.', accent: '#4CC2FF' },
    { n: 4, frames: 100, screen: 'apkgChooser', mascot: 'guide', camera: 'macro', text: 'Pick the package', silentText: 'Pick your .apkg', vo: 'Pick the package. That is the whole setup.', accent: '#4CC2FF' },
    { n: 5, frames: 95, screen: 'apkgNarrowed', camera: 'push', text: 'Only the files it can open', silentText: 'Only the files it can open', vo: 'It shows only the files it can open.', accent: '#4CC2FF' },
    { n: 6, frames: 105, screen: 'flashcards', camera: 'settle', text: 'Your deck lands in your list', silentText: 'Your deck lands in your list', vo: 'Your deck lands in your list with the rest.', accent: '#4CC2FF' },
    { n: 7, frames: 100, screen: 'ankiStudy', mascot: 'guide', camera: 'macro', text: 'Cards, pictures and cloze', silentText: 'Cards, pictures and cloze deletions', vo: 'Cards, pictures and cloze deletions, all of it.', accent: '#7C5CFF' },
    { n: 8, frames: 100, screen: 'ankiStudy', camera: 'push', text: 'Two hundred new cards a day', silentText: '200 new cards a day', vo: 'Two hundred new cards a day, not fifty.', focus: 0.4, accent: '#F5B301' },
    { n: 9, frames: 100, screen: 'flashcardsBottom', camera: 'glideDown', text: 'It never leaves your phone', silentText: 'It never leaves your phone', vo: 'It never leaves your phone. No account, no upload.', accent: '#22D3A6' },
    { n: 10, frames: 95, screen: 'apkgShare', mascot: 'guide', camera: 'macro', text: 'Send a deck to a friend', silentText: 'Send a deck to a friend', vo: 'You can send a deck to a friend too.', accent: '#FF4D8D' },
    { n: 11, frames: 95, screen: 'apkgShared', camera: 'settle', text: 'It opens in any version of Anki', silentText: 'Opens in any version of Anki', vo: 'It opens in any version of Anki they have.', accent: '#FF4D8D' },
    { n: 12, frames: 100, screen: 'flashcards', camera: 'pull', text: 'Or let Orbit write the cards', silentText: 'Or let Orbit write the cards', vo: 'Or let Orbit write the cards for a chapter.', accent: '#7C5CFF' },
    { n: 13, frames: 100, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'From the question bank itself', silentText: 'Built from the question bank', vo: 'From the question bank itself, not from nowhere.', focus: 0.3, accent: '#7C5CFF' },
    { n: 14, frames: 95, screen: 'progress', camera: 'push', text: 'They come back on schedule', silentText: 'They come back on schedule', vo: 'They come back on schedule, before you forget.', accent: '#22D3A6' },
    { n: 15, frames: 95, screen: 'progressBottom', camera: 'glideDown', text: 'Your streak keeps counting', silentText: 'Your streak keeps counting', vo: 'Your streak keeps counting either way.', accent: '#F5B301' },
    { n: 16, frames: 100, screen: 'home', camera: 'pull', text: 'One app for both', silentText: 'One app for both', vo: 'One app for both. Nothing to move again.', accent: '#4CC2FF' },
    { n: 17, frames: 95, screen: null, mascot: 'hero', camera: 'settle', text: 'Bring the deck you already have', silentText: 'Bring the deck you already have', vo: 'Bring the deck you already have.', accent: '#4CC2FF' },
    { n: 18, frames: 145, screen: 'home', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
