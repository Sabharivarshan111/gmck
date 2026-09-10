import type { AdScript } from './types';

/**
 * Script C — "Draw It From Memory".
 *
 * Contrarian hook: everyone optimises reading, and reading is not what the
 * diagram marks test. The cold open is a blank sheet and a running timer, which
 * does the work before the voice arrives — highest risk, highest ceiling.
 *
 * The plate count this ad turns on is 250, which is the number of distinct
 * drawings. It is not 915: that figure counted question rows pointing at a
 * plate, and the drawings themselves cover 922 questions. Say "two hundred and
 * fifty plates" or "the drawings cover nine hundred questions", and never
 * attach the larger number to the word "plates".
 */
export const drawItFromMemory: AdScript = {
  id: 'orbit-draw-it-from-memory',
  title: 'Orbit MBBS — Draw It From Memory',
  voice: 'en-US-AriaNeural',
  rate: '+10%',
  pitch: '-1Hz',
  shots: [
    { n: 1, screen: 'plateBrachial', camera: 'macro', text: 'Draw the brachial plexus', vo: 'You can explain the brachial plexus. Now draw it.', focus: 0.25, accent: '#FF4D8D' },
    { n: 2, screen: 'plateBrachial', camera: 'push', text: 'From memory', vo: 'From memory, in four minutes. Most people freeze.', focus: 0.35, accent: '#FF4D8D' },
    { n: 3, screen: 'plateBrachial', camera: 'settle', text: 'This is the mark', vo: 'This is what the examiner wants on the page.', accent: '#22D3A6' },
    { n: 4, screen: 'plateBrachial', camera: 'macro', text: 'Roots. Trunks. Cords.', vo: 'Roots, trunks, divisions, cords and branches, all labelled.', focus: 0.4, accent: '#22D3A6' },
    { n: 5, screen: 'noteDiagram', camera: 'pull', text: 'Already in the app', vo: 'It is already in the app, attached to that question.', accent: '#22D3A6' },
    { n: 6, screen: 'questions', camera: 'push', text: 'Triple-tap', vo: 'Triple-tap the question and the diagram comes with it.', focus: 0.3, accent: '#FF4D8D' },
    { n: 7, screen: 'noteDiagram', camera: 'settle', text: 'Picture, then theory', vo: 'The picture first, then the answer that explains it.' },
    { n: 8, screen: 'plateUlnar', camera: 'trackLeft', text: 'Not a stock image', vo: "Drawn for that question. Never a neighbour's picture.", accent: '#22D3A6' },
    { n: 9, screen: 'chapterDiagrams', camera: 'pull', text: '250 diagrams', vo: 'Two hundred and fifty diagrams across the whole bank.' },
    { n: 10, screen: 'plateShoulder', camera: 'orbit', text: '', vo: 'Shoulder joint, thyroid, pharynx, tongue, uterus and more.', accent: '#22D3A6' },
    { n: 11, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Beside its own text', vo: 'Each one sits beside the paragraph it belongs to.' },
    { n: 12, screen: 'noteBody', camera: 'glideDown', text: 'No scrolling back', vo: 'You never scroll up hunting for the picture again.' },
    { n: 13, screen: 'noteBodyBottom', camera: 'settle', text: '', vo: 'Comparisons come as tables, and steps as flowcharts.' },
    { n: 14, screen: 'noteHero', camera: 'macro', text: 'How often it is asked', vo: 'And it tells you how often that question is asked.', focus: 0.25, accent: '#F5B301' },
    { n: 15, screen: 'noteBody', camera: 'push', text: 'From the textbook', vo: 'Written from the standard textbook for that subject.', focus: 0.55 },
    { n: 16, screen: 'askai', camera: 'push', text: 'Ask why', vo: 'Push it further. Ask why, and it answers properly.', accent: '#7C5CFF' },
    { n: 17, screen: 'userNotes', camera: 'macro', text: 'Now you draw', vo: 'Now draw it yourself. Blank page, real stylus.', accent: '#FF8A3D' },
    { n: 18, screen: 'userNotesEdit', camera: 'macro', text: 'Only the pen draws', vo: 'Rest your palm on the glass. Only the pen draws.', accent: '#FF8A3D' },
    { n: 19, screen: 'userNotesPreview', camera: 'macro', text: 'Highlighter', vo: 'The highlighter washes under your writing, never over it.', accent: '#FF8A3D' },
    { n: 20, screen: 'userNotesEdit', camera: 'orbit', text: 'Any colour', vo: 'Six pens, or any colour from the wheel.', focus: 0.5, accent: '#FF8A3D' },
    { n: 21, screen: 'userNotesPreview', camera: 'macro', text: 'Two erasers', vo: 'Rub out a whole mark, or just the middle.', focus: 0.4, accent: '#FF8A3D' },
    { n: 22, screen: 'noteDiagram', camera: 'pull', text: 'Yours against the diagram', vo: 'Compare yours against the diagram. That is the drill.', accent: '#22D3A6' },
    { n: 23, screen: 'flashcards', camera: 'settle', text: 'Drill it', vo: 'Make it a flashcard and drill it until it is automatic.', accent: '#4CC2FF' },
    { n: 24, screen: 'ankiStudy', camera: 'push', text: '', vo: 'It comes back exactly when you are about to forget.', accent: '#4CC2FF' },
    { n: 25, screen: 'timer', camera: 'push', text: '25:00', vo: 'Twenty-five focused minutes, and a tree grows for it.', accent: '#22D3A6' },
    { n: 26, screen: 'treegallery', camera: 'trackLeft', text: '12 species', vo: 'Twelve species, earned in hours, not in coins.', accent: '#22D3A6' },
    { n: 27, screen: 'progress', camera: 'pull', text: 'Your year', vo: 'Everything you drilled, mapped across the whole year.', accent: '#F5B301' },
    { n: 28, screen: 'themeCustomizer', camera: 'orbit', text: '', vo: 'And it looks like something you want to open.', accent: '#4CC2FF' },
    { n: 29, screen: 'userNotesEdit', camera: 'pull', text: '3:40 left', vo: 'Same question, same four minutes, different outcome.', accent: '#FF4D8D' },
    { n: 30, screen: 'outroCard', camera: 'settle', text: 'Orbit MBBS', vo: 'That is Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
