import type { AdScript } from './types';

/**
 * Script A — "The Pattern".
 *
 * Investigator hook: the repeats are already counted. The cold open is a bare
 * star row on black, because the strongest visual this app owns is the
 * importance stars, and it reads at thumbnail size with the sound off.
 */
export const thePattern: AdScript = {
  id: 'orbit-the-pattern',
  title: 'Orbit MBBS — The Pattern',
  voice: 'en-US-AvaNeural',
  rate: '+10%',
  pitch: '+0Hz',
  shots: [
    { n: 1, screen: null, camera: 'macro', text: '2,025 questions', vo: 'Your university repeats its questions. Nobody counted them.', accent: '#F5B301' },
    { n: 2, screen: 'questions', camera: 'pull', text: 'Until now', vo: 'We did. Two thousand and twenty-five carry a year.', accent: '#F5B301' },
    { n: 3, screen: 'browse', camera: 'trackLeft', text: 'Four years', vo: 'First year to final year. Every subject. One bank.', accent: '#7C5CFF' },
    { n: 4, screen: 'questions', camera: 'push', text: '5,545 questions', vo: 'Five and a half thousand questions, already sorted.', focus: 0.35 },
    { n: 5, screen: 'questions', camera: 'macro', text: 'Stars mean frequency', vo: 'The stars are not decoration. They are frequency.', focus: 0.2, accent: '#F5B301' },
    { n: 6, screen: 'questions', camera: 'orbit', text: 'Asked Feb 23. Aug 19.', vo: 'Every year it was asked is printed on it.', focus: 0.5 },
    { n: 7, screen: 'questions', camera: 'macro', text: 'Triple-tap', vo: 'Triple-tap any question. Watch what happens.', focus: 0.3, accent: '#FF4D8D' },
    { n: 8, screen: 'noteHero', camera: 'push', text: '', vo: 'A full handwritten answer, written for that question.', accent: '#FF4D8D' },
    { n: 9, screen: 'noteBody', camera: 'glideDown', text: '', vo: 'Structured the way an examiner wants to read it.' },
    { n: 10, screen: 'plateBrachial', camera: 'settle', text: 'Its own diagram', vo: 'And the diagram that belongs to that exact question.', accent: '#22D3A6' },
    { n: 11, screen: 'noteDiagram', camera: 'pull', text: 'Picture, then theory', vo: 'Picture first. Then the theory that explains it.', accent: '#22D3A6' },
    { n: 12, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Never a wall of images', vo: 'Every plate sits beside the text it illustrates.' },
    { n: 13, screen: 'plateUlnar', camera: 'macro', text: 'Hand-drawn', vo: 'Nine hundred and fifteen plates, drawn for these questions.', accent: '#22D3A6' },
    { n: 14, screen: 'noteBody', camera: 'push', text: 'Textbook-grounded', vo: 'Grounded in the standard textbook for that subject.', focus: 0.6 },
    { n: 15, screen: 'askai', camera: 'push', text: 'Ask anything', vo: 'Ask it anything. It answers like your tutor.', accent: '#7C5CFF' },
    { n: 16, screen: 'chatdemo', camera: 'settle', text: 'Instant MCQs', vo: 'Ask for MCQs and it writes you a set.', accent: '#7C5CFF' },
    { n: 17, screen: 'flashcards', camera: 'orbit', text: 'Spaced repetition', vo: 'Turn any chapter into spaced-repetition flashcards.', accent: '#4CC2FF' },
    { n: 18, screen: 'ankiStudy', camera: 'push', text: '', vo: 'The scheduler brings each card back exactly when needed.', accent: '#4CC2FF' },
    { n: 19, screen: 'apkgHub', camera: 'push', text: 'Import your Anki', vo: 'Already have an Anki deck? Import it. It just opens.', accent: '#4CC2FF' },
    { n: 20, screen: 'userNotes', camera: 'macro', text: 'Write. Draw.', vo: 'Write your own notes. Draw on them with a stylus.', accent: '#FF8A3D' },
    { n: 21, screen: 'userNotesEdit', camera: 'macro', text: 'Palm rejection', vo: 'Rest your hand on the screen. It ignores your palm.', accent: '#FF8A3D' },
    { n: 22, screen: 'userNotes', camera: 'pull', text: 'Your ward photos', vo: 'Photos, recordings and PDFs live inside your notes.', focus: 0.6, accent: '#FF8A3D' },
    { n: 23, screen: 'timer', camera: 'push', text: 'Focus', vo: 'Start a session. Something grows while you work.', accent: '#22D3A6' },
    { n: 24, screen: 'treegallery', camera: 'trackLeft', text: '12 species', vo: 'Twelve species, each unlocked by hours you actually focused.', accent: '#22D3A6' },
    { n: 25, screen: 'growth', camera: 'settle', text: 'It withers. It survives.', vo: 'Leave mid-session and it withers. Your minutes still count.', accent: '#22D3A6' },
    { n: 26, screen: 'progress', camera: 'pull', text: 'Your year', vo: 'Your streak, your level, your whole year mapped.', accent: '#F5B301' },
    { n: 27, screen: 'glassHome', camera: 'orbit', text: 'Make it yours', vo: 'Four themes, or build your own from four colours.', accent: '#4CC2FF' },
    { n: 28, screen: 'glassHome', camera: 'macro', text: '', vo: 'Set a wallpaper and the surfaces bend the light.', focus: 0.45, accent: '#4CC2FF' },
    { n: 29, screen: 'home', camera: 'hero', text: 'Orbit MBBS', vo: 'Every question, every plate, every note. Offline.' },
    { n: 30, screen: null, camera: 'settle', text: 'Orbit MBBS QBank', vo: 'Stop studying blind. Orbit MBBS. On Google Play.', accent: '#7C5CFF' },
  ],
};
