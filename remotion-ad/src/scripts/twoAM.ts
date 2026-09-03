import type { AdScript } from './types';

/**
 * Script B — "2 AM".
 *
 * Pain hook. The first two shots carry no product at all: the viewer has to
 * recognise themselves before anything is sold to them. Pain opens outperform
 * feature opens roughly two to one, and this pain is universal in the niche.
 */
export const twoAM: AdScript = {
  id: 'orbit-2am',
  title: 'Orbit MBBS — 2 AM',
  voice: 'en-US-JennyNeural',
  rate: '+12%',
  pitch: '+1Hz',
  shots: [
    { n: 1, screen: null, camera: 'macro', text: 'Two AM. The exam is at nine.', vo: 'Two AM. The exam is at nine.', accent: '#F5B301' },
    { n: 2, screen: null, camera: 'push', text: 'Three textbooks open', vo: 'Three textbooks open on the floor. None of them agree.', accent: '#F5B301' },
    { n: 3, screen: 'home', camera: 'hero', text: 'Six hours left', vo: 'You have six hours. You cannot read two hundred pages.', accent: '#7C5CFF' },
    { n: 4, screen: 'browse', camera: 'push', text: 'Open Orbit', vo: 'Open Orbit. Pick your subject.', accent: '#7C5CFF' },
    { n: 5, screen: 'questions', camera: 'glideDown', text: 'Filter by repeats', vo: 'Filter by repeated questions. The top twenty are right here.', accent: '#F5B301' },
    { n: 6, screen: 'questions', camera: 'macro', text: 'Last 5 years starred', vo: 'Every question that came in the last five years, starred.', focus: 0.4, accent: '#F5B301' },
    { n: 7, screen: 'questions', camera: 'macro', text: 'Triple-tap', vo: 'Triple-tap the first one.', focus: 0.3, accent: '#FF4D8D' },
    { n: 8, screen: 'noteHero', camera: 'push', text: 'Three-page answer', vo: 'A three-page answer opens. Ready to write.', accent: '#FF4D8D' },
    { n: 9, screen: 'plateCalots', camera: 'settle', text: 'Exact format', vo: 'Heading, subheading, flowchart. The exact format.', accent: '#22D3A6' },
    { n: 10, screen: 'noteBody', camera: 'glideDown', text: 'Diagram ready', vo: 'The diagram is already drawn at the top.' },
    { n: 11, screen: 'noteDiagram', camera: 'glideDown', text: 'Labelled cleanly', vo: 'Labelled the way you will draw it on the paper.', accent: '#22D3A6' },
    { n: 12, screen: 'noteBody', camera: 'macro', text: 'Ask AI', vo: "Don't understand the mechanism? Tap Ask AI.", focus: 0.3 },
    { n: 13, screen: 'noteBodyBottom', camera: 'push', text: '3 bullet points', vo: 'It explains the concept in three bullet points.' },
    { n: 14, screen: 'askai', camera: 'push', text: 'Test yourself', vo: 'Test yourself before you move on.', accent: '#7C5CFF' },
    { n: 15, screen: 'chatdemo', camera: 'settle', text: '5 quick MCQs', vo: 'Five quick MCQs. Tap, tap, done.', accent: '#7C5CFF' },
    { n: 16, screen: 'flashcards', camera: 'orbit', text: 'One-tap cards', vo: 'Turn the chapter into flashcards in one tap.', accent: '#4CC2FF' },
    { n: 17, screen: 'ankiStudy', camera: 'push', text: 'Spaced recall', vo: "It shows each card again right before you'd forget.", accent: '#4CC2FF' },
    { n: 18, screen: 'apkgHub', camera: 'push', text: 'Import your Anki', vo: "Your senior's Anki deck? Import it. It opens.", accent: '#4CC2FF' },
    { n: 19, screen: 'questions', camera: 'macro', text: 'Tick it off', vo: "Tick it. That's one you never have to reopen.", focus: 0.45 },
    { n: 20, screen: 'progress', camera: 'push', text: 'Tracked quietly', vo: 'It counts everything you finish. Quietly.', accent: '#F5B301' },
    { n: 21, screen: 'timer', camera: 'push', text: '25 minutes', vo: 'Set twenty-five minutes. Put the phone down.', accent: '#22D3A6' },
    { n: 22, screen: 'growth', camera: 'macro', text: 'Tree grows', vo: 'A tree grows the whole time you stay focused.', accent: '#22D3A6' },
    { n: 23, screen: 'music', camera: 'pull', text: 'Offline beats', vo: 'Play your own music. Nothing streams. Nothing uploads.', accent: '#FF8A3D' },
    { n: 24, screen: 'timerBottom', camera: 'pull', text: 'Session complete', vo: "Session done. That's twenty-five real minutes.", accent: '#22D3A6' },
    { n: 25, screen: 'progress', camera: 'push', text: 'Phone streak', vo: 'Your streak survives on your phone. No account needed.', accent: '#F5B301' },
    { n: 26, screen: 'progressBottom', camera: 'trackLeft', text: 'Every day mapped', vo: 'Every day you studied, coloured in.', accent: '#F5B301' },
    { n: 27, screen: 'home', camera: 'hero', text: '100% offline', vo: 'Hostel wifi died? The whole bank works offline.' },
    { n: 28, screen: 'glassHome', camera: 'orbit', text: 'Your colours', vo: 'Make it look how you want. Even the colours.', accent: '#4CC2FF' },
    { n: 29, screen: 'homeLight', camera: 'pull', text: 'Eight AM', vo: "Eight AM. You're not walking in empty-handed." },
    { n: 30, screen: null, camera: 'settle', text: 'Orbit MBBS QBank', vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
