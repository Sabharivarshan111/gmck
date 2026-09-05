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
    // --- the challenge. The viewer answers it privately and usually fails.
    { n: 1, frames: 90, screen: 'plateBrachial', camera: 'macro', text: 'You know the brachial plexus', silentText: "Now draw it. From memory", vo: 'You know the brachial plexus.', accent: '#22D3A6' },
    { n: 2, frames: 75, screen: 'plateBrachial', camera: 'macro', text: 'Draw it from memory', silentText: "Four minutes. Most freeze", vo: 'Draw it from memory.', accent: '#22D3A6' },
    { n: 3, frames: 90, screen: 'plateUlnar', camera: 'trackRight', text: 'Where the marks are', silentText: "This is where the marks are", vo: 'That is where the marks are.', accent: '#22D3A6' },

    // --- and it is already in the app, attached to that exact question.
    { n: 4, frames: 105, screen: 'questionsLeaf', camera: 'push', text: 'Already in the app', silentText: "It's already in the app", vo: 'This diagram is already in the app.', focus: 0.28, accent: '#7C5CFF' },
    { n: 5, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap the question', silentText: "Triple-tap the question", vo: 'Triple-tap the question and it appears.', focus: 0.28, accent: '#FF4D8D' },
    { n: 6, frames: 120, screen: 'noteDiagram', camera: 'pull', text: 'The picture comes first', silentText: "Picture, then the theory", vo: 'The picture comes first, then the theory.', accent: '#22D3A6' },
    { n: 7, frames: 120, screen: 'plateStomach', camera: 'macro', text: 'Drawn for that question', silentText: "Never a neighbour's picture", vo: "Drawn for that question, never a neighbour's.", accent: '#22D3A6' },
    { n: 8, frames: 120, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Two hundred and fifty diagrams', silentText: "250 exam diagrams", vo: 'Two hundred and fifty diagrams, drawn by hand.', accent: '#22D3A6' },
    { n: 9, frames: 105, screen: 'noteBody', camera: 'glideDown', text: 'Tables and flowcharts', silentText: "Tables. Flowcharts. Years", vo: 'Tables and flowcharts, laid out properly.', accent: '#FF4D8D' },

    // --- now you draw it, which is the drill the hook demanded.
    { n: 10, frames: 105, screen: 'userNotesEdit', camera: 'macro', text: 'Now draw it yourself', silentText: "Now you draw it", vo: 'Now draw it yourself. Blank page.', focus: 0.35, accent: '#FF8A3D' },
    { n: 11, frames: 105, screen: 'userNotesEdit', camera: 'macro', text: 'Rest your palm', silentText: "Rest your palm on it", vo: 'Rest your palm. It takes the pen.', focus: 0.5, accent: '#FF8A3D' },
    { n: 12, frames: 105, screen: 'userNotesPreview', camera: 'pull', text: 'Compare yours against the diagram', silentText: "Yours against the diagram", vo: 'Then compare yours against the diagram.', accent: '#FF8A3D' },

    { n: 13, frames: 90, screen: 'flashcards', camera: 'orbit', text: 'Make it a card', silentText: "Drill it until automatic", vo: 'Make it a card. Drill it.', accent: '#4CC2FF' },
    { n: 14, frames: 90, screen: 'ankiStudy', camera: 'push', text: 'It returns before you forget', silentText: "Back before you forget", vo: 'It returns before you forget.', accent: '#4CC2FF' },
    { n: 15, frames: 90, screen: 'timer', camera: 'push', text: 'Twenty-five focused minutes', silentText: "25 focused minutes", vo: 'Twenty-five focused minutes. One tree.', accent: '#22D3A6' },
    { n: 16, frames: 90, screen: 'treegallery', camera: 'trackLeft', text: 'Twelve species', silentText: "Twelve species, earned in hours", vo: 'Twelve species, earned in focused hours.', accent: '#22D3A6' },
    { n: 17, frames: 90, screen: 'glassHome', camera: 'hero', text: 'It looks worth opening', silentText: "Make it yours", vo: 'And it looks worth opening.', accent: '#4CC2FF' },

    { n: 18, frames: 105, screen: 'outroCard', camera: 'settle', text: 'Free on Google Play', silentText: "Orbit MBBS, free on Google Play", vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
