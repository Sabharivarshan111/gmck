import type { AdScript } from './types';

/**
 * Script C — "Draw It From Memory".
 *
 * Contrarian hook: everyone optimises reading, and reading is not what the
 * diagram marks test. The cold open is a blank sheet and a running timer, which
 * does the work before the voice arrives — highest risk, highest ceiling.
 *
 * Nothing here counts the drawings, and nothing here calls one a "plate".
 * Both are the owner's instruction. A line says the question HAS a diagram and
 * what the diagram is for; how many exist in the bank is a fact about our
 * storage, not a reason a student downloads anything, and the word "plate" is
 * ours rather than theirs. `check:ad-truth` refuses both.
 */
export const drawItFromMemory: AdScript = {
  id: 'orbit-draw-it-from-memory',
  title: 'Orbit MBBS — Draw It From Memory',
  voice: 'en-US-AriaNeural',
  rate: '+10%',
  pitch: '-1Hz',
  shots: [
    { n: 1, screen: 'plateBrachial', camera: 'macro', text: 'Now draw it.', silentText: 'Now draw it.', vo: 'You can name the branches of the brachial plexus. Cool. Now draw it.', focus: 0.25, accent: '#FF4D8D' },
    { n: 2, screen: 'plateBrachial', camera: 'push', text: 'Draw it from memory', silentText: 'Draw it from memory', vo: 'Four minutes. No notes.', focus: 0.35, accent: '#FF4D8D' },
    { n: 3, screen: 'plateBrachial', camera: 'settle', text: 'Knowing it ≠ drawing it', silentText: 'Knowing it ≠ drawing it', vo: 'Because knowing the name and actually putting it on paper are two different things.', accent: '#22D3A6' },
    { n: 4, screen: 'plateBrachial', camera: 'macro', text: 'Roots. Trunks. Divisions. Cords.', silentText: 'Roots. Trunks. Divisions. Cords.', vo: 'Roots, trunks, divisions, cords, branches — all of it has to end up on the page.', focus: 0.4, accent: '#22D3A6' },
    { n: 5, screen: 'noteDiagram', camera: 'pull', text: 'Diagram in the app', silentText: 'Diagram in the app', vo: 'And the reference is already in the app with the question.', accent: '#22D3A6' },
    { n: 6, screen: 'questions', camera: 'push', text: 'Triple-tap', silentText: 'Triple-tap', vo: 'Triple-tap the question and bring it up.', focus: 0.3, accent: '#FF4D8D' },
    { n: 7, screen: 'noteDiagram', camera: 'settle', text: 'Picture, then theory', silentText: 'Picture, then theory', vo: 'You get the picture, then the answer that explains it.' },
    { n: 8, screen: 'plateUlnar', camera: 'trackLeft', text: 'The diagram is right here', silentText: 'The diagram is right here', vo: 'It’s attached to that question instead of making you hunt for another image.', accent: '#22D3A6' },
    { n: 9, screen: 'chapterDiagrams', camera: 'pull', text: 'Clearly labelled', silentText: 'Clearly labelled', vo: 'And everything you need to label is already shown.' },
    { n: 10, screen: 'plateShoulder', camera: 'orbit', text: 'More diagrams like this', silentText: 'More diagrams like this', vo: 'Shoulder joint, thyroid, pharynx, tongue, uterus — the same idea keeps coming up.', accent: '#22D3A6' },
    { n: 11, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Diagram beside its text', silentText: 'Diagram beside its text', vo: 'Each diagram sits beside the part of the answer it belongs to.' },
    { n: 12, screen: 'noteBody', camera: 'glideDown', text: 'No scrolling back', silentText: 'No scrolling back', vo: 'So you’re not scrolling up and down trying to find the picture again.' },
    { n: 13, screen: 'noteBodyBottom', camera: 'settle', text: 'Tables and flowcharts', silentText: 'Tables and flowcharts', vo: 'Comparisons are put into tables. Steps go into flowcharts.' },
    { n: 14, screen: 'noteHero', camera: 'macro', text: 'See the repeat frequency', silentText: 'See the repeat frequency', vo: 'And you can see how often that question has come up.', focus: 0.25, accent: '#F5B301' },
    { n: 15, screen: 'noteBody', camera: 'push', text: 'Based on the textbook', silentText: 'Based on the textbook', vo: 'The answer is based on the standard textbook for that subject.', focus: 0.55 },
    { n: 16, screen: 'askai', camera: 'push', text: 'Ask why', silentText: 'Ask why', vo: 'And when something still doesn’t make sense, ask why.', accent: '#7C5CFF' },
    { n: 17, screen: 'userNotes', camera: 'macro', text: 'Now you draw', silentText: 'Now you draw', vo: 'Then put the app away. Open a blank page and draw it yourself.', accent: '#FF8A3D' },
    { n: 18, screen: 'userNotesEdit', camera: 'macro', text: 'Palm rejection', silentText: 'Palm rejection', vo: 'Rest your palm on the screen. The pen is what actually writes.', accent: '#FF8A3D' },
    { n: 19, screen: 'userNotesPreview', camera: 'macro', text: 'Highlighter', silentText: 'Highlighter', vo: 'You can highlight underneath your writing too.', accent: '#FF8A3D' },
    { n: 20, screen: 'userNotesEdit', camera: 'orbit', text: 'Pick your colour', silentText: 'Pick your colour', vo: 'Six pens, plus whatever colour you want.', focus: 0.5, accent: '#FF8A3D' },
    { n: 21, screen: 'userNotesPreview', camera: 'macro', text: 'Two erasers', silentText: 'Two erasers', vo: 'And there are two erasers — one for the whole mark, one for part of it.', focus: 0.4, accent: '#FF8A3D' },
    { n: 22, screen: 'noteDiagram', camera: 'pull', text: 'Compare yours', silentText: 'Compare yours', vo: 'Now compare your drawing with the reference.', accent: '#22D3A6' },
    { n: 23, screen: 'flashcards', camera: 'settle', text: 'Drill it', silentText: 'Drill it', vo: 'Got it? Turn it into a card and keep drilling it.', accent: '#4CC2FF' },
    { n: 24, screen: 'ankiStudy', camera: 'push', text: 'Spaced repetition', silentText: 'Spaced repetition', vo: 'It comes back later so you have to remember it again.', accent: '#4CC2FF' },
    { n: 25, screen: 'timer', camera: 'push', text: '25:00', silentText: '25:00', vo: 'Twenty-five focused minutes. Tree grows.', accent: '#22D3A6' },
    { n: 26, screen: 'treegallery', camera: 'trackLeft', text: '12 species', silentText: '12 species', vo: 'Keep putting in the hours and you unlock more species.', accent: '#22D3A6' },
    { n: 27, screen: 'progress', camera: 'pull', text: 'Your year', silentText: 'Your year', vo: 'And your study for the year is there to look back on.', accent: '#F5B301' },
    { n: 28, screen: 'themeCustomizer', camera: 'orbit', text: 'Make it yours', silentText: 'Make it yours', vo: 'You can even make the app look like yours.', accent: '#4CC2FF' },
    { n: 29, screen: 'userNotesEdit', camera: 'pull', text: '3:40 left', silentText: '3:40 left', vo: 'Same question. Four minutes. This time, you actually draw it.', accent: '#FF4D8D' },
    { n: 30, screen: 'outroCard', camera: 'settle', text: 'Download Orbit on the Play Store', silentText: 'Download Orbit on the Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
