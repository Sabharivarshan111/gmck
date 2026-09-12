import type { AdScript } from './types';

/**
 * Reel — "Made by the medical community".
 *
 * ## The second untargeted reel, and why it is not the first one again
 *
 * `reelEverything` is the feature walk: here is what the app does, in the
 * order you would do it. Posting that twice with different words would be one
 * ad with a variant, and anybody who saw both would recognise the second as
 * the first.
 *
 * This is the other argument the app actually has, and it is the one no
 * competitor can copy: **the bank and the book references come from the
 * students using it.** Page numbers are contributed, notes and decks are the
 * reader's own, and the app's whole surface is theirs to recolour. That is a
 * different reason to install from "it has a question bank".
 *
 * Neither names a year, which is the point of both — the owner asked for two
 * reels to post untargeted, where the audience is every MBBS year at once and
 * "third year" loses three quarters of it in the first second.
 *
 * ## What it may claim, and what it may not
 *
 * * **"Readers add the page a question is on"** is the contribution feature,
 *   and the shot after it is load-bearing rather than decorative: a page
 *   number is shown only once enough readers agree, and that rule lives in
 *   Postgres. `orbit-reel-pages` is the long version and is honest about the
 *   wait; an ad that implied page numbers appear on demand would contradict
 *   it, and of two ads disagreeing the true one is the one that loses.
 * * **Nothing is said about price.** The end card carries the owner's own
 *   wording and the app sells an ad-free unlock, so a "completely free" line
 *   in the body would be the ad contradicting the app. `check:payments`
 *   polices a figure; this is the same rule one step earlier.
 * * **No subject and no year.** `browse` is the final-year list, so it is
 *   shown for the shape of a full screen and never described in words.
 *
 * Eight shots at 129 and six at 128 is 1,800 frames. The welcome card costs 62
 * of them off the last shot, leaving the end card 66 — see `reelEverything`
 * for why those numbers are not round.
 */
export const reelCommunity: AdScript = {
  id: 'orbit-reel-community',
  title: 'Orbit MBBS — Reel: Made by the medical community',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'built by medical students', silentText: 'Built by medical students', vo: 'Orbit was built by medical students.', accent: '#7C5CFF' },
    { n: 2, frames: 129, screen: 'browse', camera: 'trackLeft', text: 'sits in one list', silentText: 'Every subject, one list', vo: 'Every subject sits in one list.', accent: '#7C5CFF' },
    { n: 3, frames: 129, screen: 'pageRefSheet', mascot: 'guide', camera: 'settle', text: 'the page a question is on', silentText: 'Readers add the page', vo: 'Readers add the page a question is on.', accent: '#22D3A6' },
    { n: 4, frames: 129, screen: 'pageRefQuorum', camera: 'push', text: 'once enough of them agree', silentText: 'Shown once readers agree', vo: 'It shows once enough of them agree.', accent: '#22D3A6' },
    { n: 5, frames: 129, screen: 'userNotesEdit', camera: 'push', text: 'write your own notes', silentText: 'Write your own notes', vo: 'You can write your own notes too.', accent: '#F5B301' },
    { n: 6, frames: 129, screen: 'noteToolbar', camera: 'macro', text: 'headings and highlights', silentText: 'Headings and highlights', vo: 'With headings and highlights.', focus: 0.3, accent: '#F5B301' },
    { n: 7, frames: 129, screen: 'userNotesMedia', mascot: 'guide', camera: 'glideDown', text: 'a recording or a PDF', silentText: 'Attach a recording or PDF', vo: 'Attach a recording or a PDF.', accent: '#F5B301' },
    { n: 8, frames: 129, screen: 'apkgHub', camera: 'push', text: 'an Anki deck you already have', silentText: 'Import your Anki deck', vo: 'Bring an Anki deck you already have.', accent: '#4CC2FF' },
    { n: 9, frames: 128, screen: 'themeCustomizer', camera: 'orbit', text: 'the whole app your colours', silentText: 'Your colours', vo: 'Then make the whole app your colours.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'glassHome', mascot: 'guide', camera: 'settle', text: 'your own picture behind it', silentText: 'Your own wallpaper', vo: 'Put your own picture behind it.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'progressBottom', camera: 'glideDown', text: 'for turning up', silentText: 'Badges and a streak', vo: 'Badges and a streak for turning up.', accent: '#F5B301' },
    { n: 12, frames: 128, screen: 'tourWelcome', camera: 'push', text: 'shows you round', silentText: 'A walkthrough on first open', vo: 'A walkthrough shows you round at the start.', accent: '#7C5CFF' },
    { n: 13, frames: 128, screen: 'settingsNotifications', camera: 'macro', text: 'one reminder in the evening', silentText: 'One reminder each evening', vo: 'And one reminder in the evening.', focus: 0.5, accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'pull', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
