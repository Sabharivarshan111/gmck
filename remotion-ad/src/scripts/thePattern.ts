import type { AdScript } from './types';

/**
 * Script A — "The Pattern".
 *
 * Investigator hook: the repeats are already counted. The cold open is a bare
 * star row on black, because the strongest visual this app owns is the
 * importance stars, and it reads at thumbnail size with the sound off.
 *
 * The measured figures, which are the only ones any line here may use: the
 * bank holds 5,634 questions, 3,463 of them carry a repeat marker, and the
 * drawings are 250 distinct plates covering 922 questions. Two traps sit in
 * that last pair — the plate count is the number of *drawings*, never the
 * number of question rows that point at one, and no quantity spoken or shown
 * here may be a number that reads as a year. "2,025 questions" was on screen
 * for a whole shot and every viewer read it as 2025.
 */
export const thePattern: AdScript = {
  id: 'orbit-the-pattern',
  title: 'Orbit MBBS — The Pattern',
  voice: 'en-US-AvaNeural',
  rate: '+10%',
  pitch: '+0Hz',
  shots: [
    { n: 1, screen: 'browse', camera: 'macro', text: 'Nobody counted them', vo: 'Your university repeats its questions. Nobody counted them.', focus: 0.35, accent: '#F5B301' },
    { n: 2, screen: 'questions', camera: 'pull', text: '3,463 already asked', vo: 'We did. Three thousand four hundred and sixty-three of them repeat.', accent: '#F5B301' },
    { n: 3, screen: 'browse', camera: 'trackLeft', text: 'Four years, 25 subjects', vo: 'First year to final year. Twenty-five subjects. One bank.', accent: '#7C5CFF' },
    { n: 4, screen: 'questionsChapters', camera: 'push', text: '5,634 questions', vo: 'Over five thousand six hundred questions, sorted by chapter.', focus: 0.35 },
    { n: 5, screen: 'questionsLeaf', camera: 'macro', text: 'Stars count the repeats', vo: 'Those stars are not decoration. They count the repeats.', focus: 0.28, accent: '#F5B301' },
    { n: 6, screen: 'questionsLeaf', camera: 'orbit', text: 'Every year it was asked', vo: 'Every year it was asked is printed on the question.', focus: 0.28 },
    { n: 7, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap any question', vo: 'Triple-tap any question and watch what happens next.', focus: 0.28, accent: '#FF4D8D' },
    { n: 8, screen: 'noteHero', camera: 'push', text: '', vo: 'A full handwritten answer, written for that exact question.', accent: '#FF4D8D' },
    { n: 9, screen: 'noteBody', camera: 'glideDown', text: '', vo: 'Laid out the way an examiner expects to read it.' },
    { n: 10, screen: 'plateBrachial', camera: 'settle', text: 'Its own diagram', vo: 'And the diagram that belongs to that exact question.', accent: '#22D3A6' },
    { n: 11, screen: 'noteDiagram', camera: 'pull', text: 'Picture first, then theory', vo: 'The picture comes first, then the theory behind it.', accent: '#22D3A6' },
    { n: 12, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Beside the text it explains', vo: 'Every plate sits beside the text it explains.' },
    { n: 13, screen: 'plateUlnar', camera: 'macro', text: '250 hand-drawn plates', vo: 'Two hundred and fifty plates, drawn for these questions.', accent: '#22D3A6' },
    { n: 14, screen: 'noteBody', camera: 'push', text: 'Grounded in the textbook', vo: 'Grounded in the standard textbook for that subject.', focus: 0.6 },
    { n: 15, screen: 'askai', camera: 'push', text: 'Ask it anything', vo: 'Ask it anything and it answers like a tutor.', accent: '#7C5CFF' },
    { n: 16, screen: 'chatdemo', camera: 'settle', text: 'Ask for MCQs', vo: 'Ask for MCQs and it writes you a set.', accent: '#7C5CFF' },
    { n: 17, screen: 'flashcards', camera: 'orbit', text: 'A spaced repetition deck', vo: 'Turn any chapter into a spaced repetition deck.', accent: '#4CC2FF' },
    { n: 18, screen: 'ankiStudy', camera: 'push', text: '', vo: 'The scheduler brings each card back just before you forget.', accent: '#4CC2FF' },
    { n: 19, screen: 'apkgHub', camera: 'push', text: 'Import your Anki deck', vo: 'Already have an Anki deck? Import it and it opens.', accent: '#4CC2FF' },
    { n: 20, screen: 'userNotesEdit', camera: 'macro', text: 'Write it. Draw it.', vo: 'Write your own notes, or draw them with a stylus.', focus: 0.35, accent: '#FF8A3D' },
    { n: 21, screen: 'userNotesEdit', camera: 'macro', text: 'Only the pen writes', vo: 'Rest your hand on the screen. Only the pen writes.', focus: 0.5, accent: '#FF8A3D' },
    { n: 22, screen: 'userNotesPreview', camera: 'pull', text: 'Photos, recordings, PDFs', vo: 'Photos, recordings and PDFs all live inside your notes.', accent: '#FF8A3D' },
    { n: 23, screen: 'timer', camera: 'push', text: 'Something grows', vo: 'Start a session and something grows while you work.', accent: '#22D3A6' },
    { n: 24, screen: 'treegallery', camera: 'trackLeft', text: '12 species', vo: 'Twelve species, unlocked by the hours you actually focused.', accent: '#22D3A6' },
    { n: 25, screen: 'growth', camera: 'settle', text: 'Your minutes still count', vo: 'Leave mid-session and it withers, but your minutes still count.', accent: '#22D3A6' },
    { n: 26, screen: 'progress', camera: 'pull', text: 'Your whole year, mapped', vo: 'Your streak, your level and your whole year, mapped.', accent: '#F5B301' },
    { n: 27, screen: 'themeCustomizer', camera: 'push', text: 'Four themes, or your own', vo: 'Four themes, or build your own from four colours.', accent: '#4CC2FF' },
    { n: 28, screen: 'wallpaperCustomizer', camera: 'macro', text: 'The surfaces bend the light', vo: 'Set a wallpaper and the surfaces bend the light.', focus: 0.45, accent: '#4CC2FF' },
    { n: 29, screen: 'home', camera: 'hero', text: 'The whole bank, offline', vo: 'Every question in your pocket, and it works offline.' },
    { n: 30, screen: 'outroCard', camera: 'settle', text: 'Orbit MBBS', vo: 'Stop studying blind. Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
