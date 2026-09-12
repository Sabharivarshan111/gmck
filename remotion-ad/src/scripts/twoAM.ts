import type { AdScript } from './types';

/**
 * Script B — "2 AM".
 *
 * Pain hook. The first two shots carry no product at all: the viewer has to
 * recognise themselves before anything is sold to them. Pain opens outperform
 * feature opens roughly two to one, and this pain is universal in the niche.
 *
 * The one number it spends is the honest one: 3,463 of the bank's 5,634
 * questions carry a repeat marker. It does not claim a repeat filter, because
 * there is none — the topic list has a text filter, and the repeats are
 * marked on the rows themselves. And no quantity here is ever written as a
 * number that could be read as a year.
 */
export const twoAM: AdScript = {
  id: 'orbit-2am',
  title: 'Orbit MBBS — 2 AM',
  voice: 'en-US-JennyNeural',
  rate: '+12%',
  pitch: '+1Hz',
  shots: [
    { n: 1, screen: 'home', camera: 'macro', text: 'Your exam is at nine', vo: 'It’s two in the morning. Your exam is at nine.', accent: '#F5B301' },
    { n: 2, screen: 'browse', camera: 'push', text: 'more confusing', vo: 'Three textbooks are open, and somehow they’ve made things more confusing.', accent: '#F5B301' },
    { n: 3, screen: 'home', camera: 'hero', text: 'Six hours left', vo: 'Six hours left. You’re not reading two hundred pages tonight.', accent: '#7C5CFF' },
    { n: 4, screen: 'browse', camera: 'push', text: 'Pick your year, then your subject', vo: 'Open Orbit. Pick your year, then your subject.', accent: '#7C5CFF' },
    { n: 5, screen: 'questionsLeaf', camera: 'glideDown', text: 'the repeat questions are already marked', vo: 'Before you even start reading, the repeat questions are already marked.', accent: '#F5B301' },
    { n: 6, screen: 'questionsLeaf', camera: 'macro', text: 'already appeared in papers', vo: 'A lot of these have already appeared in papers.', focus: 0.28, accent: '#F5B301' },
    { n: 7, screen: 'questionsLeaf', camera: 'macro', text: 'start with one of those', vo: 'So start with one of those.', focus: 0.28, accent: '#FF4D8D' },
    { n: 8, screen: 'noteHero', camera: 'push', text: 'the written answer opens', vo: 'Triple-tap it and the written answer opens.', accent: '#FF4D8D' },
    { n: 9, screen: 'plateCalots', camera: 'settle', text: 'the diagram is already there', vo: 'And the diagram is already there with it.', accent: '#22D3A6' },
    { n: 10, screen: 'noteBody', camera: 'glideDown', text: 'the shape you want for the paper', vo: 'Headings, subheadings, flowcharts. Basically the shape you want for the paper.' },
    { n: 11, screen: 'noteDiagram', camera: 'glideDown', text: 'the labels are already in place', vo: 'And the labels are already in place.', accent: '#22D3A6' },
    { n: 12, screen: 'noteBody', camera: 'macro', text: 'Ask the AI on the question', vo: 'Still don’t get it? Ask the AI on the question.', focus: 0.3 },
    { n: 13, screen: 'noteBodyBottom', camera: 'push', text: 'a few short points', vo: 'Get the explanation in a few short points instead of digging through three pages.' },
    { n: 14, screen: 'askai', camera: 'push', text: 'test yourself before you move on', vo: 'Then test yourself before you move on.', accent: '#7C5CFF' },
    { n: 15, screen: 'chatdemo', camera: 'settle', text: 'Ask for five MCQs', vo: 'Ask for five MCQs. Tap through them. Done.', accent: '#7C5CFF' },
    { n: 16, screen: 'flashcards', camera: 'orbit', text: 'Turn the whole thing into flashcards', vo: 'Finished the chapter? Turn the whole thing into flashcards.', accent: '#4CC2FF' },
    { n: 17, screen: 'ankiStudy', camera: 'push', text: 'They come back over time', vo: 'They come back over time instead of making you reread everything.', accent: '#4CC2FF' },
    { n: 18, screen: 'apkgHub', camera: 'push', text: 'Import it', vo: 'Your senior sent you an Anki deck? Import it.', accent: '#4CC2FF' },
    { n: 19, screen: 'questionsLeaf', camera: 'macro', text: 'tick off the question', vo: 'Then tick off the question and move on.', focus: 0.28 },
    { n: 20, screen: 'progress', camera: 'push', text: 'what you’ve finished', vo: 'Orbit keeps track of what you’ve finished in the background.', accent: '#F5B301' },
    { n: 21, screen: 'timer', camera: 'push', text: 'put the phone down', vo: 'Set twenty-five minutes and put the phone down.', accent: '#22D3A6' },
    { n: 22, screen: 'growth', camera: 'macro', text: 'The tree grows', vo: 'The tree grows while you stay focused.', accent: '#22D3A6' },
    { n: 23, screen: 'music', camera: 'pull', text: 'your own music', vo: 'And your own music stays on your phone.', accent: '#FF8A3D' },
    { n: 24, screen: 'timerBottom', camera: 'pull', text: 'you actually studied', vo: 'Twenty-five minutes done. That’s twenty-five minutes you actually studied.', accent: '#22D3A6' },
    { n: 25, screen: 'progress', camera: 'push', text: 'your streak stays on the phone', vo: 'And your streak stays on the phone with you.', accent: '#F5B301' },
    { n: 26, screen: 'progressBottom', camera: 'trackLeft', text: 'the days you actually studied', vo: 'You can see the days you actually studied.', accent: '#F5B301' },
    { n: 27, screen: 'home', camera: 'hero', text: 'still works offline', vo: 'Even if the hostel Wi-Fi disappears, the question bank still works offline.' },
    { n: 28, screen: 'themeCustomizer', camera: 'orbit', text: 'look the way you want', vo: 'And you can make the app look the way you want.', accent: '#4CC2FF' },
    { n: 29, screen: 'homeLight', camera: 'pull', text: 'you know what you’re walking in with', vo: 'It’s eight in the morning. At least now you know what you’re walking in with.' },
    { n: 30, screen: 'outroCard', camera: 'settle', text: 'Orbit MBBS', vo: 'That is Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
