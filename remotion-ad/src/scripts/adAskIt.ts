import type { AdScript } from './types';

/**
 * Ad — "Ask it" (the `prompt` look).
 *
 * ## The shape
 *
 * A student types a real question and the app answers it. That is the whole
 * film, and it is the right shape for this product because it is what the
 * product literally does: three taps on a question in the bank and a written
 * answer arrives.
 *
 * Built on the techniques in `Tejashmakwana/astra-chatgpt-hyperframes` at the
 * owner's request — the typed line with its caret, the light ground, type that
 * resolves out of blur with light crossing it. None of that repository's
 * assets are used and none could be: its artwork and soundtrack are a third
 * party's motion design and its own notice refuses redistribution.
 *
 * ## Why the question is a real one
 *
 * "Discuss the pathogenesis of rheumatic heart disease" is a question in the
 * bank. A made-up question would make the answer a mock-up, and the one thing
 * this ad has to be believed about is that the answer on screen is the answer
 * the app gives.
 *
 * The spoken line never reads the typed question aloud. Reading out what is
 * already being typed wastes the only seconds where both channels could be
 * saying different things, and a viewer can read faster than the voice.
 */
export const adAskIt: AdScript = {
  id: 'orbit-ask-it',
  title: 'Orbit MBBS — Ask it',
  format: 'reel',
  look: 'prompt',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide-answer.wav',
  shots: [
    { n: 1, frames: 124, screen: null, kicker: 'The question', typed: true, text: 'Pathogenesis of rheumatic heart disease', silentText: 'Ask it anything', vo: 'You’ve seen this question in a paper before, but can’t remember the answer.', accent: '#2F6BFF' },
    { n: 2, frames: 124, screen: 'questionsLeaf', focus: 0.28, kicker: 'The bank', text: 'Already in the bank', silentText: 'Already in the bank', vo: 'It’s already sitting in the bank.', accent: '#2F6BFF' },
    { n: 3, frames: 124, screen: 'questionsLeaf', focus: 0.28, kicker: 'How often', text: 'See how often', silentText: 'See how often', vo: 'And the circle shows how often it comes up.', accent: '#F5B301' },
    { n: 4, frames: 124, screen: 'questionsLeaf', focus: 0.3, kicker: 'Three taps', text: 'Triple-tap', silentText: 'Triple-tap', vo: 'Triple-tap it.', accent: '#FF4D8D' },
    { n: 5, frames: 124, screen: 'noteHero', kicker: 'The answer', text: 'Written answer', silentText: 'Written answer', vo: 'The written answer opens.', accent: '#FF4D8D' },
    { n: 6, frames: 124, screen: 'noteBody', kicker: 'Structure', text: 'Headings, then detail', silentText: 'Headings, then detail', vo: 'Headings first. Then the detail.', accent: '#FF4D8D' },
    { n: 7, frames: 124, screen: 'noteBodyBottom', kicker: 'The last page', text: 'Must-write points', silentText: 'Must-write points', vo: 'And the important points are at the end.', accent: '#FF4D8D' },
    { n: 8, frames: 124, screen: 'plateBrachial', kicker: 'The picture', text: 'Matching diagram', silentText: 'Matching diagram', vo: 'The diagram comes with the question too.', accent: '#22D3A6' },
    { n: 9, frames: 124, screen: 'noteDiagram', kicker: 'In order', text: 'Clearly labelled', silentText: 'Clearly labelled', vo: 'And it’s labelled for what you need to draw.', accent: '#22D3A6' },
    { n: 10, frames: 124, screen: 'askai', kicker: 'Still stuck', typed: true, text: 'Explain the Aschoff body', silentText: 'Ask it your way', vo: 'Still not clear? Ask it again, your way.', accent: '#7C5CFF' },
    { n: 11, frames: 124, screen: 'chatdemo', kicker: 'Properly', text: 'Explain. Then test.', silentText: 'Explain. Then test.', vo: 'It explains it, then you can test yourself.', accent: '#7C5CFF' },
    { n: 12, frames: 124, screen: 'flashcards', kicker: 'Keep it', text: 'Make flashcards', silentText: 'Make flashcards', vo: 'Turn the chapter into cards when you’re done.', accent: '#4CC2FF' },
    { n: 13, frames: 124, screen: 'ankiStudy', kicker: 'Spacing', text: 'Spaced revision', silentText: 'Spaced revision', vo: 'They come back later for revision.', accent: '#4CC2FF' },
    { n: 14, frames: 124, screen: 'home', kicker: 'No sign up', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#22D3A6' },
  ],
};
