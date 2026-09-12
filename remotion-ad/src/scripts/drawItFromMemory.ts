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
    { n: 1, screen: 'plateBrachial', camera: 'macro', text: 'Now draw it', vo: 'You can name the branches of the brachial plexus. Cool. Now draw it.', focus: 0.25, accent: '#FF4D8D' },
    { n: 2, screen: 'plateBrachial', camera: 'push', text: 'Four minutes. No notes', vo: 'Four minutes. No notes.', focus: 0.35, accent: '#FF4D8D' },
    { n: 3, screen: 'plateBrachial', camera: 'settle', text: 'two different things', vo: 'Because knowing the name and actually putting it on paper are two different things.', accent: '#22D3A6' },
    { n: 4, screen: 'plateBrachial', camera: 'macro', text: 'all of it has to end up on the page', vo: 'Roots, trunks, divisions, cords, branches. All of it has to end up on the page.', focus: 0.4, accent: '#22D3A6' },
    { n: 5, screen: 'noteDiagram', camera: 'pull', text: 'already in the app', vo: 'And the reference is already in the app with the question.', accent: '#22D3A6' },
    { n: 6, screen: 'questions', camera: 'push', text: 'Triple-tap the question', vo: 'Triple-tap the question and bring it up.', focus: 0.3, accent: '#FF4D8D' },
    { n: 7, screen: 'noteDiagram', camera: 'settle', text: 'the picture, then the answer', vo: 'You get the picture, then the answer that explains it.' },
    { n: 8, screen: 'plateUlnar', camera: 'trackLeft', text: 'attached to that question', vo: 'It’s attached to that question instead of making you hunt for another image.', accent: '#22D3A6' },
    { n: 9, screen: 'chapterDiagrams', camera: 'pull', text: 'everything you need to label', vo: 'And everything you need to label is already shown.' },
    { n: 10, screen: 'plateShoulder', camera: 'orbit', text: 'The same idea keeps coming up', vo: 'Shoulder joint, thyroid, pharynx, tongue, uterus. The same idea keeps coming up.', accent: '#22D3A6' },
    { n: 11, screen: 'chapterDiagrams', camera: 'glideDown', text: 'beside the part of the answer', vo: 'Each diagram sits beside the part of the answer it belongs to.' },
    { n: 12, screen: 'noteBody', camera: 'glideDown', text: 'not scrolling up and down', vo: 'So you’re not scrolling up and down trying to find the picture again.' },
    { n: 13, screen: 'noteBodyBottom', camera: 'settle', text: 'tables. Steps go into flowcharts', vo: 'Comparisons are put into tables. Steps go into flowcharts.' },
    { n: 14, screen: 'noteHero', camera: 'macro', text: 'how often that question has come up', vo: 'And you can see how often that question has come up.', focus: 0.25, accent: '#F5B301' },
    { n: 15, screen: 'noteBody', camera: 'push', text: 'based on the standard textbook', vo: 'The answer is based on the standard textbook for that subject.', focus: 0.55 },
    { n: 16, screen: 'askai', camera: 'push', text: 'ask why', vo: 'And when something still doesn’t make sense, ask why.', accent: '#7C5CFF' },
    { n: 17, screen: 'userNotes', camera: 'macro', text: 'Open a blank page', vo: 'Then put the app away. Open a blank page and draw it yourself.', accent: '#FF8A3D' },
    { n: 18, screen: 'userNotesEdit', camera: 'macro', text: 'The pen is what actually writes', vo: 'Rest your palm on the screen. The pen is what actually writes.', accent: '#FF8A3D' },
    { n: 19, screen: 'userNotesPreview', camera: 'macro', text: 'highlight underneath your writing', vo: 'You can highlight underneath your writing too.', accent: '#FF8A3D' },
    { n: 20, screen: 'userNotesEdit', camera: 'orbit', text: 'whatever colour you want', vo: 'Six pens, plus whatever colour you want.', focus: 0.5, accent: '#FF8A3D' },
    { n: 21, screen: 'userNotesPreview', camera: 'macro', text: 'two erasers', vo: 'And there are two erasers. One for the whole mark, one for part of it.', focus: 0.4, accent: '#FF8A3D' },
    { n: 22, screen: 'noteDiagram', camera: 'pull', text: 'compare your drawing', vo: 'Now compare your drawing with the reference.', accent: '#22D3A6' },
    { n: 23, screen: 'flashcards', camera: 'settle', text: 'keep drilling it', vo: 'Got it? Turn it into a card and keep drilling it.', accent: '#4CC2FF' },
    { n: 24, screen: 'ankiStudy', camera: 'push', text: 'It comes back later', vo: 'It comes back later so you have to remember it again.', accent: '#4CC2FF' },
    { n: 25, screen: 'timer', camera: 'push', text: 'Twenty-five focused minutes', vo: 'Twenty-five focused minutes. Tree grows.', accent: '#22D3A6' },
    { n: 26, screen: 'treegallery', camera: 'trackLeft', text: 'you unlock more species', vo: 'Keep putting in the hours and you unlock more species.', accent: '#22D3A6' },
    { n: 27, screen: 'progress', camera: 'pull', text: 'there to look back on', vo: 'And your study for the year is there to look back on.', accent: '#F5B301' },
    { n: 28, screen: 'themeCustomizer', camera: 'orbit', text: 'make the app look like yours', vo: 'You can even make the app look like yours.', accent: '#4CC2FF' },
    { n: 29, screen: 'userNotesEdit', camera: 'pull', text: 'This time, you actually draw it', vo: 'Same question. Four minutes. This time, you actually draw it.', accent: '#FF4D8D' },
    { n: 30, screen: 'outroCard', camera: 'settle', text: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
