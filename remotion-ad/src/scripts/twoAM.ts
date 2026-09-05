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
    { n: 1, screen: 'home', camera: 'macro', text: '2 AM. Exam at nine.', vo: 'It is two AM and your exam is at nine.', accent: '#F5B301' },
    { n: 2, screen: 'browse', camera: 'push', text: 'None of them agree', vo: 'Three textbooks open on the floor and none of them agree.', accent: '#F5B301' },
    { n: 3, screen: 'home', camera: 'hero', text: 'Six hours left', vo: 'Six hours left. You cannot read two hundred pages.', accent: '#7C5CFF' },
    { n: 4, screen: 'browse', camera: 'push', text: 'Open Orbit', vo: 'Open Orbit. Pick your year, then your subject.', accent: '#7C5CFF' },
    { n: 5, screen: 'questionsLeaf', camera: 'glideDown', text: 'The repeats are marked', vo: 'The repeats are marked before you read a word.', accent: '#F5B301' },
    { n: 6, screen: 'questionsLeaf', camera: 'macro', text: '3,463 already asked', vo: 'Three thousand four hundred of these have already been asked.', focus: 0.28, accent: '#F5B301' },
    { n: 7, screen: 'questionsLeaf', camera: 'macro', text: 'Triple-tap the first one', vo: 'So triple-tap the first one and start there.', focus: 0.28, accent: '#FF4D8D' },
    { n: 8, screen: 'noteHero', camera: 'push', text: 'A three-page answer', vo: 'A three-page answer opens, ready for you to write.', accent: '#FF4D8D' },
    { n: 9, screen: 'plateCalots', camera: 'settle', text: 'Already drawn', vo: 'The diagram is already drawn and already labelled.', accent: '#22D3A6' },
    { n: 10, screen: 'noteBody', camera: 'glideDown', text: 'Heading. Subheading. Flowchart.', vo: 'Heading, subheading, flowchart. The format the paper wants.' },
    { n: 11, screen: 'noteDiagram', camera: 'glideDown', text: 'Labelled cleanly', vo: 'Labelled the way you will draw it on paper.', accent: '#22D3A6' },
    { n: 12, screen: 'noteBody', camera: 'macro', text: 'Still not clear? Ask AI.', vo: 'Still not clear? Tap Ask AI on the question.', focus: 0.3 },
    { n: 13, screen: 'noteBodyBottom', camera: 'push', text: 'Three short points', vo: 'It explains the mechanism in three short points.' },
    { n: 14, screen: 'askai', camera: 'push', text: 'Test yourself', vo: 'Then test yourself before you move on.', accent: '#7C5CFF' },
    { n: 15, screen: 'chatdemo', camera: 'settle', text: '5 quick MCQs', vo: 'Ask for five quick MCQs. Tap, tap, done.', accent: '#7C5CFF' },
    { n: 16, screen: 'flashcards', camera: 'orbit', text: 'Cards in one tap', vo: 'Turn the whole chapter into flashcards in one tap.', accent: '#4CC2FF' },
    { n: 17, screen: 'ankiStudy', camera: 'push', text: 'Spaced recall', vo: 'Each card comes back right before you would forget.', accent: '#4CC2FF' },
    { n: 18, screen: 'apkgHub', camera: 'push', text: 'Import your Anki deck', vo: 'Your senior sent an Anki deck? Import it here.', accent: '#4CC2FF' },
    { n: 19, screen: 'questionsLeaf', camera: 'macro', text: 'Tick it off', vo: 'Tick it off. That is one you never reopen.', focus: 0.28 },
    { n: 20, screen: 'progress', camera: 'push', text: 'It counts everything', vo: 'It counts everything you finish, quietly, in the background.', accent: '#F5B301' },
    { n: 21, screen: 'timer', camera: 'push', text: '25 minutes', vo: 'Set twenty-five minutes and put the phone down.', accent: '#22D3A6' },
    { n: 22, screen: 'growth', camera: 'macro', text: 'A tree grows', vo: 'A tree grows for as long as you stay focused.', accent: '#22D3A6' },
    { n: 23, screen: 'music', camera: 'pull', text: 'Nothing streams', vo: 'Play your own music. Nothing streams, nothing uploads.', accent: '#FF8A3D' },
    { n: 24, screen: 'timerBottom', camera: 'pull', text: 'Session complete', vo: 'Session done. That is twenty-five real minutes of work.', accent: '#22D3A6' },
    { n: 25, screen: 'progress', camera: 'push', text: 'No account needed', vo: 'Your streak lives on your phone. No account needed.', accent: '#F5B301' },
    { n: 26, screen: 'progressBottom', camera: 'trackLeft', text: 'Every day you studied', vo: 'Every day you studied is coloured in for you.', accent: '#F5B301' },
    { n: 27, screen: 'home', camera: 'hero', text: 'Works offline', vo: 'Hostel wifi gone? The whole question bank works offline.' },
    { n: 28, screen: 'themeCustomizer', camera: 'orbit', text: 'Down to the colours', vo: 'Make it look how you want, down to the colours.', accent: '#4CC2FF' },
    { n: 29, screen: 'homeLight', camera: 'pull', text: 'Eight AM', vo: 'Eight AM, and you are not walking in empty-handed.' },
    { n: 30, screen: 'outroCard', camera: 'settle', text: 'Orbit MBBS', vo: 'That is Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
