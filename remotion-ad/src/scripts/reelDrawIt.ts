import type { AdScript } from './types';

/**
 * Reel 3 — "Now Draw It".
 *
 * Framework: Contrarian. It challenges a belief the viewer holds about their
 * own preparation — that having read a topic is the same as being able to
 * reproduce its diagram — and it does it in six words. The highest-risk of the
 * three and the highest-ceiling, because a viewer who fails the challenge in
 * their head cannot scroll past it.
 *
 * The opening frame is a real plate rather than the app, which is the one
 * place these reels lead with something other than UI: the argument is about
 * the drawing, so the drawing has to be the first thing on screen. The app
 * arrives at shot 4 and stays.
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
    { n: 1, frames: 90, screen: 'plateBrachial', camera: 'macro', text: 'Now draw it. From memory.', vo: 'You can explain the brachial plexus.', accent: '#22D3A6' },
    { n: 2, frames: 75, screen: 'plateBrachial', camera: 'macro', text: 'Four minutes. Most freeze.', vo: 'Four minutes. Most people freeze.', accent: '#22D3A6' },
    { n: 3, frames: 90, screen: 'plateUlnar', camera: 'trackRight', text: 'This is where the marks are', vo: 'This is what the examiner wants.', accent: '#22D3A6' },

    // --- and it is already in the app, attached to that exact question.
    { n: 4, frames: 105, screen: 'questionsLeaf', camera: 'push', text: 'Already in the app', vo: 'It is already inside the app.', focus: 0.28, accent: '#7C5CFF' },
    { n: 5, frames: 105, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap the question', vo: 'Triple-tap it. The plate comes too.', focus: 0.28, accent: '#FF4D8D' },
    { n: 6, frames: 120, screen: 'noteDiagram', camera: 'pull', text: 'Picture, then theory', vo: 'Picture first. Then the theory.', accent: '#22D3A6' },
    { n: 7, frames: 120, screen: 'plateStomach', camera: 'macro', text: 'Never a neighbour’s picture', vo: 'Drawn for that question. Never another.', accent: '#22D3A6' },
    { n: 8, frames: 120, screen: 'chapterDiagrams', camera: 'glideDown', text: '915 plates across the bank', vo: 'Nine hundred and fifteen plates.', accent: '#22D3A6' },
    { n: 9, frames: 105, screen: 'noteBody', camera: 'glideDown', text: 'Tables. Flowcharts. Years.', vo: 'Comparisons build as real tables.', accent: '#FF4D8D' },

    // --- now you draw it, which is the drill the hook demanded.
    { n: 10, frames: 105, screen: 'userNotesEdit', camera: 'macro', text: 'Now you draw it', vo: 'Now draw it yourself. Blank page.', focus: 0.35, accent: '#FF8A3D' },
    { n: 11, frames: 105, screen: 'userNotesEdit', camera: 'macro', text: 'Rest your palm on it', vo: 'Rest your palm. It takes the pen.', focus: 0.5, accent: '#FF8A3D' },
    { n: 12, frames: 105, screen: 'userNotesPreview', camera: 'pull', text: 'Yours against the plate', vo: 'Compare yours against the plate.', accent: '#FF8A3D' },

    { n: 13, frames: 90, screen: 'flashcards', camera: 'orbit', text: 'Drill it until automatic', vo: 'Make it a card. Drill it.', accent: '#4CC2FF' },
    { n: 14, frames: 90, screen: 'ankiStudy', camera: 'push', text: 'Back before you forget', vo: 'It returns before you forget.', accent: '#4CC2FF' },
    { n: 15, frames: 90, screen: 'timer', camera: 'push', text: '25 focused minutes', vo: 'Twenty-five focused minutes. One tree.', accent: '#22D3A6' },
    { n: 16, frames: 90, screen: 'treegallery', camera: 'trackLeft', text: '12 species, earned in hours', vo: 'Twelve species. Earned in hours.', accent: '#22D3A6' },
    { n: 17, frames: 90, screen: 'glassHome', camera: 'hero', text: 'Make it yours', vo: 'And it looks worth opening.', accent: '#4CC2FF' },

    { n: 18, frames: 105, screen: 'outroCard', camera: 'settle', text: 'Orbit MBBS · Google Play', vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
