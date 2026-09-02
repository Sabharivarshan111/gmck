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
    { n: 1, screen: null, camera: 'macro', text: '2:04 AM', vo: "It's two AM. Your exam is in six hours.", accent: '#F5B301' },
    { n: 2, screen: null, camera: 'push', text: '400 questions', vo: "Four hundred questions. You've written notes for nine.", accent: '#F5B301' },
    { n: 3, screen: 'home', camera: 'hero', text: '', vo: "Okay. Here's what actually saves you tonight.", accent: '#7C5CFF' },
    { n: 4, screen: 'browse', camera: 'push', text: 'Pick your subject', vo: 'Open your year. Pick the subject you are sitting.', accent: '#7C5CFF' },
    { n: 5, screen: 'questions', camera: 'glideDown', text: 'Start with 5 stars', vo: 'Start with the five-star ones. Those repeat most.', accent: '#F5B301' },
    { n: 6, screen: 'questions', camera: 'macro', text: 'It came 3 times', vo: "This one came three times. It's coming again.", focus: 0.4, accent: '#F5B301' },
    { n: 7, screen: 'questions', camera: 'macro', text: 'Triple-tap', vo: "Triple-tap it. Don't type anything. Just tap.", focus: 0.3, accent: '#FF4D8D' },
    { n: 8, screen: 'noteHero', camera: 'push', text: '', vo: 'A full written answer. In about ten seconds.', accent: '#FF4D8D' },
    { n: 9, screen: 'plateCalots', camera: 'settle', text: 'With the diagram', vo: "With the diagram you'd have to draw in the exam.", accent: '#22D3A6' },
    { n: 10, screen: 'noteBody', camera: 'glideDown', text: 'Exam-shaped', vo: 'Headings, points, and the years it was asked.' },
    { n: 11, screen: 'noteDiagram', camera: 'glideDown', text: 'Image. Theory. Image.', vo: 'Picture, then its theory. You never scroll hunting.', accent: '#22D3A6' },
    { n: 12, screen: 'noteBody', camera: 'macro', text: 'The examinable words', vo: 'The words worth marks are already marked for you.', focus: 0.3 },
    { n: 13, screen: 'noteBodyBottom', camera: 'push', text: 'Not enough?', vo: 'Want it deeper? Regenerate. Or fix it with AI.' },
    { n: 14, screen: 'askai', camera: 'push', text: 'Ask it', vo: 'Still stuck? Ask. It explains it properly.', accent: '#7C5CFF' },
    { n: 15, screen: 'chatdemo', camera: 'settle', text: 'Test yourself', vo: 'Ask for MCQs and quiz yourself right there.', accent: '#7C5CFF' },
    { n: 16, screen: 'flashcards', camera: 'orbit', text: 'Make cards', vo: 'Turn the chapter into flashcards in one tap.', accent: '#4CC2FF' },
    { n: 17, screen: 'ankiStudy', camera: 'push', text: '', vo: "It shows each card again right before you'd forget.", accent: '#4CC2FF' },
    { n: 18, screen: 'apkgHub', camera: 'push', text: 'Your Anki works', vo: "Your senior's Anki deck? Import it. It opens.", accent: '#4CC2FF' },
    { n: 19, screen: 'questions', camera: 'macro', text: '1 down', vo: 'Tick it. That is one you never reopen.', focus: 0.45 },
    { n: 20, screen: 'progress', camera: 'push', text: '+XP', vo: 'It counts everything you finish. Quietly.', accent: '#F5B301' },
    { n: 21, screen: 'timer', camera: 'push', text: '25 minutes', vo: 'Set twenty-five minutes. Put the phone down.', accent: '#22D3A6' },
    { n: 22, screen: 'growth', camera: 'macro', text: '', vo: 'A tree grows the whole time you stay focused.', accent: '#22D3A6' },
    { n: 23, screen: 'music', camera: 'pull', text: 'Your own music', vo: 'Play your own music. Nothing streams. Nothing uploads.', accent: '#FF8A3D' },
    { n: 24, screen: 'timerBottom', camera: 'pull', text: 'Session complete', vo: "Session done. That's twenty-five real minutes.", accent: '#22D3A6' },
    { n: 25, screen: 'progress', camera: 'push', text: 'Day 12', vo: 'Your streak survives on your phone. No account needed.', accent: '#F5B301' },
    { n: 26, screen: 'progressBottom', camera: 'trackLeft', text: '', vo: 'Every day you studied, coloured in.', accent: '#F5B301' },
    { n: 27, screen: 'home', camera: 'hero', text: 'Works offline', vo: 'Hostel wifi died? The whole bank works offline.' },
    { n: 28, screen: 'glassHome', camera: 'orbit', text: 'Make it yours', vo: 'Make it look how you want. Even the colours.', accent: '#4CC2FF' },
    { n: 29, screen: 'homeLight', camera: 'pull', text: '8 AM', vo: "Eight AM. You're not walking in empty-handed." },
    { n: 30, screen: null, camera: 'settle', text: 'Orbit MBBS QBank', vo: 'Orbit MBBS. Free on Google Play.', accent: '#7C5CFF' },
  ],
};
