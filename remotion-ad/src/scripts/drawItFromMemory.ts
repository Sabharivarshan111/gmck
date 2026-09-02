import type { AdScript } from './types';

/**
 * Script C — "Draw It From Memory".
 *
 * Contrarian hook: everyone optimises reading, and reading is not what the
 * diagram marks test. The cold open is a blank sheet and a running timer, which
 * does the work before the voice arrives — highest risk, highest ceiling.
 */
export const drawItFromMemory: AdScript = {
  id: 'orbit-draw-it-from-memory',
  title: 'Orbit MBBS — Draw It From Memory',
  voice: 'en-US-AriaNeural',
  rate: '+10%',
  pitch: '-1Hz',
  shots: [
    { n: 1, screen: null, camera: 'macro', text: 'Draw the brachial plexus', vo: 'You can explain the brachial plexus. Now draw it.', accent: '#FF4D8D' },
    { n: 2, screen: null, camera: 'push', text: 'From memory', vo: 'From memory. Four minutes. Most people freeze here.', accent: '#FF4D8D' },
    { n: 3, screen: 'plateBrachial', camera: 'settle', text: 'This is the mark', vo: 'This is what the examiner wants on the page.', accent: '#22D3A6' },
    { n: 4, screen: 'plateBrachial', camera: 'macro', text: 'Roots. Trunks. Cords.', vo: 'Roots, trunks, divisions, cords, branches. All labelled.', focus: 0.4, accent: '#22D3A6' },
    { n: 5, screen: 'noteDiagram', camera: 'pull', text: 'Inside the app', vo: "It's already in the app. Attached to that question.", accent: '#22D3A6' },
    { n: 6, screen: 'questions', camera: 'push', text: 'Triple-tap', vo: 'Triple-tap the question. The plate comes with it.', focus: 0.3, accent: '#FF4D8D' },
    { n: 7, screen: 'noteDiagram', camera: 'settle', text: 'Picture, then theory', vo: 'Picture first. Then the answer that explains it.' },
    { n: 8, screen: 'plateUlnar', camera: 'trackLeft', text: 'Not a stock image', vo: "Drawn for that question. Never a neighbour's picture.", accent: '#22D3A6' },
    { n: 9, screen: 'chapterDiagrams', camera: 'pull', text: '915 plates', vo: 'Nine hundred and fifteen of them across the bank.' },
    { n: 10, screen: 'plateShoulder', camera: 'orbit', text: '', vo: 'Shoulder joint. Thyroid. Pharynx. Tongue. Uterus.', accent: '#22D3A6' },
    { n: 11, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Beside its own text', vo: 'Each one sits beside the paragraph it belongs to.' },
    { n: 12, screen: 'noteBody', camera: 'glideDown', text: 'No scrolling back', vo: 'You never scroll up hunting for the picture again.' },
    { n: 13, screen: 'noteBodyBottom', camera: 'settle', text: '', vo: 'Comparisons build as tables. Steps build as flowcharts.' },
    { n: 14, screen: 'noteHero', camera: 'macro', text: '3x asked', vo: 'And it tells you how often it has been asked.', focus: 0.25, accent: '#F5B301' },
    { n: 15, screen: 'noteBody', camera: 'push', text: 'Textbook-grounded', vo: 'Written from the standard textbook for that subject.', focus: 0.55 },
    { n: 16, screen: 'askai', camera: 'push', text: 'Ask deeper', vo: 'Push it further. Ask why. It answers properly.', accent: '#7C5CFF' },
    { n: 17, screen: 'userNotes', camera: 'macro', text: 'Now you draw', vo: 'Now draw it yourself. Blank page. Real stylus.', accent: '#FF8A3D' },
    { n: 18, screen: 'userNotesEdit', camera: 'macro', text: 'Palm rejection', vo: 'Rest your palm on the glass. It only takes the pen.', accent: '#FF8A3D' },
    { n: 19, screen: 'userNotesPreview', camera: 'macro', text: 'Highlighter', vo: 'Highlighter washes under your writing, never over it.', accent: '#FF8A3D' },
    { n: 20, screen: 'userNotesEdit', camera: 'orbit', text: 'Any colour', vo: 'Six pens, or any colour off the wheel.', focus: 0.5, accent: '#FF8A3D' },
    { n: 21, screen: 'userNotesPreview', camera: 'macro', text: 'Two erasers', vo: 'Rub out a whole mark, or the middle of a line.', focus: 0.4, accent: '#FF8A3D' },
    { n: 22, screen: 'noteDiagram', camera: 'pull', text: 'Yours vs the plate', vo: 'Compare yours against the plate. That is the drill.', accent: '#22D3A6' },
    { n: 23, screen: 'flashcards', camera: 'settle', text: 'Drill it', vo: "Make it a flashcard. Drill it until it's automatic.", accent: '#4CC2FF' },
    { n: 24, screen: 'ankiStudy', camera: 'push', text: '', vo: "It returns exactly when you're about to forget it.", accent: '#4CC2FF' },
    { n: 25, screen: 'timer', camera: 'push', text: '25:00', vo: 'Twenty-five focused minutes. A tree grows for it.', accent: '#22D3A6' },
    { n: 26, screen: 'treegallery', camera: 'trackLeft', text: '12 species', vo: 'Twelve species. Earned in hours, not coins.', accent: '#22D3A6' },
    { n: 27, screen: 'progress', camera: 'pull', text: 'Your year', vo: 'Everything you drilled, mapped across the year.', accent: '#F5B301' },
    { n: 28, screen: 'glassHome', camera: 'orbit', text: '', vo: "And it looks like something you'd want to open.", accent: '#4CC2FF' },
    { n: 29, screen: null, camera: 'pull', text: '3:40 left', vo: 'Same question. Same four minutes. Different outcome.', accent: '#FF4D8D' },
    { n: 30, screen: null, camera: 'settle', text: 'Orbit MBBS QBank', vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
