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
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'Don’t start again', silentText: 'Already have Anki?', vo: 'Already have Anki decks? Don’t start again.', accent: '#4CC2FF' },
    { n: 2, frames: 129, screen: 'apkgHubOnly', mascot: 'guide', camera: 'push', text: 'Bring the deck straight in', silentText: 'Import your deck', vo: 'Bring the deck straight in.', accent: '#4CC2FF' },
    { n: 3, frames: 129, screen: 'apkgInstructions', camera: 'glideDown', text: 'where to find the file', silentText: 'Find the file', vo: 'Orbit shows you where to find the file first.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'apkgChooser', mascot: 'guide', camera: 'macro', text: 'Pick the file', silentText: 'Pick your .apkg', vo: 'Pick the file and that’s basically it.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'flashcards', camera: 'settle', text: 'with the rest of your cards', silentText: 'Your deck is here', vo: 'It shows up with the rest of your cards.', accent: '#4CC2FF' },
    { n: 6, frames: 129, screen: 'ankiStudy', mascot: 'guide', camera: 'macro', text: 'Pictures and cloze cards', silentText: 'Cards, pictures, cloze', vo: 'Pictures and cloze cards come through too.', accent: '#7C5CFF' },
    { n: 7, frames: 129, screen: 'ankiStudy', camera: 'push', text: 'rebuild a huge shared deck', silentText: 'Don’t start from zero', vo: 'So you don’t have to rebuild a huge shared deck from scratch.', focus: 0.4, accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'flashcardsBottom', camera: 'glideDown', text: 'stays on your phone', silentText: 'Stays on your phone', vo: 'The deck stays on your phone.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'apkgShare', mascot: 'guide', camera: 'macro', text: 'send a deck to someone else', silentText: 'Share a deck', vo: 'And you can send a deck to someone else too.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'flashcards', camera: 'pull', text: 'make new cards from a chapter', silentText: 'Make cards from a chapter', vo: 'Or make new cards from a chapter.', accent: '#7C5CFF' },
    { n: 11, frames: 128, screen: 'questionsLeaf', mascot: 'guide', camera: 'macro', text: 'the question bank', silentText: 'Built from the question bank', vo: 'From the question bank you’re already studying.', focus: 0.3, accent: '#7C5CFF' },
    { n: 12, frames: 128, screen: 'progress', camera: 'push', text: 'come back on their schedule', silentText: 'Scheduled revision', vo: 'Then the cards come back on their schedule.', accent: '#22D3A6' },
    { n: 13, frames: 128, screen: null, mascot: 'hero', camera: 'settle', text: 'the deck you already use', silentText: 'Bring your existing deck', vo: 'So bring the deck you already use.', accent: '#4CC2FF' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
