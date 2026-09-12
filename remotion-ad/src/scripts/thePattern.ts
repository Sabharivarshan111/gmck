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
    { n: 1, screen: 'browse', camera: 'macro', text: 'the same questions', vo: 'Your university keeps asking the same questions. Most people just never stop to count them.', focus: 0.35, accent: '#F5B301' },
    { n: 2, screen: 'questions', camera: 'pull', text: 'already shown up in papers', vo: 'We counted them. A lot of these have already shown up in papers.', accent: '#F5B301' },
    { n: 3, screen: 'browse', camera: 'trackLeft', text: 'all in one place', vo: 'First year through final year. Twenty-five subjects, all in one place.', accent: '#7C5CFF' },
    { n: 4, screen: 'questionsChapters', camera: 'push', text: 'straight down to the chapter', vo: 'You can go straight down to the chapter you actually need.', focus: 0.35 },
    { n: 5, screen: 'questionsLeaf', camera: 'macro', text: 'which questions come up more', vo: 'Those stars actually mean something. They show you which questions come up more.', focus: 0.28, accent: '#F5B301' },
    { n: 6, screen: 'questionsLeaf', camera: 'orbit', text: 'the years it was asked', vo: 'You can see the years it was asked right there on the question.', focus: 0.28 },
    { n: 7, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap a question', vo: 'Triple-tap a question and see what you get.', focus: 0.28, accent: '#FF4D8D' },
    { n: 8, screen: 'noteHero', camera: 'push', text: 'the full written answer', vo: 'You get the full written answer for that exact question.', accent: '#FF4D8D' },
    { n: 9, screen: 'noteBody', camera: 'glideDown', text: 'an answer you’d actually write', vo: 'It’s laid out more like an answer you’d actually write in the exam.' },
    { n: 10, screen: 'plateBrachial', camera: 'settle', text: 'the diagram for that question', vo: 'And the diagram for that question is right there too.', accent: '#22D3A6' },
    { n: 11, screen: 'noteDiagram', camera: 'pull', text: 'the picture first', vo: 'You see the picture first, then the explanation behind it.', accent: '#22D3A6' },
    { n: 12, screen: 'chapterDiagrams', camera: 'glideDown', text: 'sits beside the bit of text', vo: 'And the diagram sits beside the bit of text it belongs to.' },
    { n: 13, screen: 'plateUlnar', camera: 'macro', text: 'Everything is labelled', vo: 'Everything is labelled, so you know what you’re supposed to put on paper.', accent: '#22D3A6' },
    { n: 14, screen: 'noteBody', camera: 'push', text: 'based on the standard textbook', vo: 'The answers are based on the standard textbook for the subject.', focus: 0.6 },
    { n: 15, screen: 'askai', camera: 'push', text: 'when you get stuck, just ask it', vo: 'And when you get stuck, just ask it.', accent: '#7C5CFF' },
    { n: 16, screen: 'chatdemo', camera: 'settle', text: 'ask for MCQs', vo: 'You can ask for MCQs too, and it makes a set for you.', accent: '#7C5CFF' },
    { n: 17, screen: 'flashcards', camera: 'orbit', text: 'Turn it into flashcards', vo: 'Finished a chapter? Turn it into flashcards.', accent: '#4CC2FF' },
    { n: 18, screen: 'ankiStudy', camera: 'push', text: 'come back at spaced intervals', vo: 'The cards come back at spaced intervals, so you’re not just rereading them over and over.', accent: '#4CC2FF' },
    { n: 19, screen: 'apkgHub', camera: 'push', text: 'Bring your deck in', vo: 'Already using Anki? Bring your deck in.', accent: '#4CC2FF' },
    { n: 20, screen: 'userNotesEdit', camera: 'macro', text: 'typed or handwritten', vo: 'And your own notes can be typed or handwritten.', focus: 0.35, accent: '#FF8A3D' },
    { n: 21, screen: 'userNotesEdit', camera: 'macro', text: 'rest your palm on the screen', vo: 'You can rest your palm on the screen and write with the pen.', focus: 0.5, accent: '#FF8A3D' },
    { n: 22, screen: 'userNotesPreview', camera: 'pull', text: 'right inside your notes', vo: 'Photos, recordings and PDFs can sit right inside your notes.', accent: '#FF8A3D' },
    { n: 23, screen: 'timer', camera: 'push', text: 'your tree starts growing', vo: 'Start a focus session and your tree starts growing.', accent: '#22D3A6' },
    { n: 24, screen: 'treegallery', camera: 'trackLeft', text: 'twelve species to unlock', vo: 'There are twelve species to unlock as you put in focused hours.', accent: '#22D3A6' },
    { n: 25, screen: 'growth', camera: 'settle', text: 'the time you studied still counts', vo: 'Leave halfway through and the tree stops growing, but the time you studied still counts.', accent: '#22D3A6' },
    { n: 26, screen: 'progress', camera: 'pull', text: 'all there in one place', vo: 'Your streak, your level and your year are all there in one place.', accent: '#F5B301' },
    { n: 27, screen: 'themeCustomizer', camera: 'push', text: 'or make your own', vo: 'Pick one of the four themes, or make your own.', accent: '#4CC2FF' },
    { n: 28, screen: 'wallpaperCustomizer', camera: 'macro', text: 'set a wallpaper', vo: 'You can even set a wallpaper and change how the whole thing looks.', focus: 0.45, accent: '#4CC2FF' },
    { n: 29, screen: 'home', camera: 'hero', text: 'even when you’re offline', vo: 'And the question bank is there even when you’re offline.' },
    { n: 30, screen: 'outroCard', camera: 'settle', text: 'Orbit MBBS', vo: 'Stop studying blind. Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};
