import type { AdScript } from './types';

/**
 * Script A — "The Pattern".
 *
 * Investigator hook: the repeats are already counted. The cold open is a bare
 * star row on black, because the strongest visual this app owns is the
 * importance stars, and it reads at thumbnail size with the sound off.
 *
 * No line here counts what the bank holds. The owner's instruction, and the
 * right one: "General Medicine alone is 660" reached a finished frame over a
 * Pathology screen, and a figure a viewer cannot check by looking is a figure
 * that rots quietly. "A lot of these have already shown up in papers" is the
 * same claim in the form a student would make it.
 *
 * The related traps, both still live: nothing spoken or shown may be a number
 * that reads as a year ("2,025 questions" held a whole shot and every viewer
 * read it as 2025), and a diagram is never called a "plate".
 */
export const thePattern: AdScript = {
  id: 'orbit-the-pattern',
  title: 'Orbit MBBS — The Pattern',
  voice: 'en-US-AvaNeural',
  rate: '+10%',
  pitch: '+0Hz',
  shots: [
    { n: 1, screen: 'browse', camera: 'macro', text: 'The same questions keep coming back', silentText: 'The same questions keep coming back', vo: 'Your university keeps asking the same questions. Most people just never stop to count them.', focus: 0.35, accent: '#F5B301' },
    { n: 2, screen: 'questions', camera: 'pull', text: 'Questions that have come up before', silentText: 'Questions that have come up before', vo: 'We counted them. A lot of these have already shown up in papers.', accent: '#F5B301' },
    { n: 3, screen: 'browse', camera: 'trackLeft', text: 'First year to final year', silentText: 'First year to final year', vo: 'First year through final year. Twenty-five subjects, all in one place.', accent: '#7C5CFF' },
    { n: 4, screen: 'questionsChapters', camera: 'push', text: 'Go straight to your chapter', silentText: 'Go straight to your chapter', vo: 'You can go straight down to the chapter you actually need.', focus: 0.35 },
    { n: 5, screen: 'questionsLeaf', camera: 'macro', text: 'Stars = how often it comes up', silentText: 'Stars = how often it comes up', vo: 'Those stars actually mean something. They show you which questions come up more.', focus: 0.28, accent: '#F5B301' },
    { n: 6, screen: 'questionsLeaf', camera: 'orbit', text: 'See which years it was asked', silentText: 'See which years it was asked', vo: 'You can see the years it was asked right there on the question.', focus: 0.28 },
    { n: 7, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap the question', silentText: 'Triple-tap the question', vo: 'Triple-tap a question and see what you get.', focus: 0.28, accent: '#FF4D8D' },
    { n: 8, screen: 'noteHero', camera: 'push', text: 'Full written answer', silentText: 'Full written answer', vo: 'You get the full written answer for that exact question.', accent: '#FF4D8D' },
    { n: 9, screen: 'noteBody', camera: 'glideDown', text: 'Written like an exam answer', silentText: 'Written like an exam answer', vo: 'It’s laid out more like an answer you’d actually write in the exam.' },
    { n: 10, screen: 'plateBrachial', camera: 'settle', text: 'The diagram for the question', silentText: 'The diagram for the question', vo: 'And the diagram for that question is right there too.', accent: '#22D3A6' },
    { n: 11, screen: 'noteDiagram', camera: 'pull', text: 'Picture first. Then theory.', silentText: 'Picture first. Then theory.', vo: 'You see the picture first, then the explanation behind it.', accent: '#22D3A6' },
    { n: 12, screen: 'chapterDiagrams', camera: 'glideDown', text: 'Diagram beside the text', silentText: 'Diagram beside the text', vo: 'And the diagram sits beside the bit of text it belongs to.' },
    { n: 13, screen: 'plateUlnar', camera: 'macro', text: 'Every part labelled', silentText: 'Every part labelled', vo: 'Everything is labelled, so you know what you’re supposed to put on paper.', accent: '#22D3A6' },
    { n: 14, screen: 'noteBody', camera: 'push', text: 'Based on the textbook', silentText: 'Based on the textbook', vo: 'The answers are based on the standard textbook for the subject.', focus: 0.6 },
    { n: 15, screen: 'askai', camera: 'push', text: 'Stuck? Ask AI.', silentText: 'Stuck? Ask AI.', vo: 'And when you get stuck, just ask it.', accent: '#7C5CFF' },
    { n: 16, screen: 'chatdemo', camera: 'settle', text: 'Ask for MCQs', silentText: 'Ask for MCQs', vo: 'You can ask for MCQs too, and it makes a set for you.', accent: '#7C5CFF' },
    { n: 17, screen: 'flashcards', camera: 'orbit', text: 'Turn a chapter into cards', silentText: 'Turn a chapter into cards', vo: 'Finished a chapter? Turn it into flashcards.', accent: '#4CC2FF' },
    { n: 18, screen: 'ankiStudy', camera: 'push', text: 'Spaced repetition', silentText: 'Spaced repetition', vo: 'The cards come back at spaced intervals, so you’re not just rereading them over and over.', accent: '#4CC2FF' },
    { n: 19, screen: 'apkgHub', camera: 'push', text: 'Import your Anki deck', silentText: 'Import your Anki deck', vo: 'Already using Anki? Bring your deck in.', accent: '#4CC2FF' },
    { n: 20, screen: 'userNotesEdit', camera: 'macro', text: 'Type it. Draw it.', silentText: 'Type it. Draw it.', vo: 'And your own notes can be typed or handwritten.', focus: 0.35, accent: '#FF8A3D' },
    { n: 21, screen: 'userNotesEdit', camera: 'macro', text: 'Palm rejection', silentText: 'Palm rejection', vo: 'You can rest your palm on the screen and write with the pen.', focus: 0.5, accent: '#FF8A3D' },
    { n: 22, screen: 'userNotesPreview', camera: 'pull', text: 'Photos, recordings, PDFs', silentText: 'Photos, recordings, PDFs', vo: 'Photos, recordings and PDFs can sit right inside your notes.', accent: '#FF8A3D' },
    { n: 23, screen: 'timer', camera: 'push', text: 'Start focusing. Grow a tree.', silentText: 'Start focusing. Grow a tree.', vo: 'Start a focus session and your tree starts growing.', accent: '#22D3A6' },
    { n: 24, screen: 'treegallery', camera: 'trackLeft', text: '12 species', silentText: '12 species', vo: 'There are twelve species to unlock as you put in focused hours.', accent: '#22D3A6' },
    { n: 25, screen: 'growth', camera: 'settle', text: 'Your study time still counts', silentText: 'Your study time still counts', vo: 'Leave halfway through and the tree stops growing, but the time you studied still counts.', accent: '#22D3A6' },
    { n: 26, screen: 'progress', camera: 'pull', text: 'Your year, in one place', silentText: 'Your year, in one place', vo: 'Your streak, your level and your year are all there in one place.', accent: '#F5B301' },
    { n: 27, screen: 'themeCustomizer', camera: 'push', text: '4 themes, or make your own', silentText: '4 themes, or make your own', vo: 'Pick one of the four themes, or make your own.', accent: '#4CC2FF' },
    { n: 28, screen: 'wallpaperCustomizer', camera: 'macro', text: 'Make it yours', silentText: 'Make it yours', vo: 'You can even set a wallpaper and change how the whole thing looks.', focus: 0.45, accent: '#4CC2FF' },
    { n: 29, screen: 'home', camera: 'hero', text: 'Works offline', silentText: 'Works offline', vo: 'And the question bank is there even when you’re offline.' },
    { n: 30, screen: 'outroCard', camera: 'settle', text: 'Download Orbit on the Play Store', silentText: 'Download Orbit on the Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
