import type { AdScript } from './types';

/**
 * Reel 3 — "Now Draw It".
 *
 * Framework: Contrarian. It challenges a belief the viewer holds about their
 * own preparation — that having read a topic is the same as being able to
 * reproduce its diagram — and it does it in two lines and nine words. The
 * highest-risk of the three and the highest-ceiling, because a viewer who
 * fails the challenge in their head cannot scroll past it.
 *
 * The opening frame is a real plate rather than the app, which is the one
 * place these reels lead with something other than UI: the argument is about
 * the drawing, so the drawing has to be the first thing on screen. The app
 * arrives at shot 4 and stays.
 *
 * ## The headline is a span of the spoken line
 *
 * `text` is a word-for-word run of words lifted out of `vo`, so the challenge
 * the viewer reads is the challenge they hear. It matters more here than in
 * either of the others: the hook is a dare, and a dare that is worded one way
 * on screen and another in the ear is answered by nobody.
 *
 * The bank holds 250 distinct plates, attached to 922 questions. The number
 * that belongs next to the word "plates" is therefore 250 — an earlier cut
 * said 915, which was the question count wearing the drawings' name.
 *
 * `frames` sums to REEL_FRAMES (1800); preflight fails if it stops doing so.
 */
export const reelDrawIt: AdScript = {
  id: 'orbit-reel-draw-it',
  title: 'Orbit MBBS — Reel: Now Draw It',
  format: 'reel',
  voice: 'en-US-AriaNeural',
  rate: '+14%',
  pitch: '-1Hz',
  music: 'audio/bed/bed-draw-it.wav',
  shots: [
    { n: 1, frames: 129, screen: 'plateBrachial', camera: 'macro', text: 'Now try drawing it', silentText: 'You still have to draw it', vo: 'You can name every branch. Now try drawing it.', accent: '#22D3A6' },
    { n: 2, frames: 129, screen: 'plateBrachial', camera: 'macro', text: 'four minutes. No notes', silentText: 'Four minutes. No notes.', vo: 'Give yourself four minutes. No notes.', accent: '#22D3A6' },
    { n: 3, frames: 129, screen: 'plateUlnar', camera: 'trackRight', text: 'if you really know it', silentText: 'This is the test', vo: 'Because this is where you find out if you really know it.', accent: '#22D3A6' },
    { n: 4, frames: 129, screen: 'chapterDiagrams', camera: 'push', text: 'already in Orbit', silentText: 'Already in the app', vo: 'The reference is already in Orbit.', focus: 0.28, accent: '#7C5CFF' },
    { n: 5, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap the question', silentText: 'Triple-tap', vo: 'Triple-tap the question and bring it up.', focus: 0.28, accent: '#FF4D8D' },
    { n: 6, frames: 129, screen: 'plateStomach', camera: 'macro', text: 'It belongs to that question', silentText: 'The diagram is right there', vo: 'It belongs to that question.', accent: '#22D3A6' },
    { n: 7, frames: 129, screen: 'chapterDiagrams', camera: 'glideDown', text: 'labelled the way you need', silentText: 'Clearly labelled', vo: 'And it’s labelled the way you need to see it.', accent: '#22D3A6' },
    { n: 8, frames: 129, screen: 'userNotesEdit', camera: 'macro', text: 'open a blank page', silentText: 'Now you draw', vo: 'Now open a blank page and draw it.', focus: 0.35, accent: '#FF8A3D' },
    { n: 9, frames: 128, screen: 'userNotesEdit', camera: 'macro', text: 'Rest your palm down', silentText: 'Palm rejection', vo: 'Rest your palm down. Keep writing.', focus: 0.5, accent: '#FF8A3D' },
    { n: 10, frames: 128, screen: 'userNotesPreview', camera: 'pull', text: 'next to the reference', silentText: 'Compare yours', vo: 'Then put yours next to the reference and compare.', accent: '#FF8A3D' },
    { n: 11, frames: 128, screen: 'flashcards', camera: 'orbit', text: 'keep testing yourself', silentText: 'Drill it', vo: 'Make it a card and keep testing yourself.', accent: '#4CC2FF' },
    { n: 12, frames: 128, screen: 'ankiStudy', camera: 'push', text: 'It comes back later', silentText: 'Comes back again', vo: 'It comes back later.', accent: '#4CC2FF' },
    { n: 13, frames: 128, screen: 'treegallery', camera: 'trackLeft', text: 'you unlock more trees', silentText: 'Twelve species', vo: 'Keep focusing and you unlock more trees.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'outroCard', camera: 'settle', text: 'Free on Google Play', silentText: 'Orbit MBBS, free on Google Play', vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
