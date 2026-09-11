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
 * assets are used and none could be: its plates and soundtrack are a third
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
    { n: 1, frames: 124, screen: null, kicker: 'The question', typed: true, text: 'Pathogenesis of rheumatic heart disease', silentText: 'Ask it anything', vo: 'You have seen this one in a paper before.', accent: '#2F6BFF' },
    { n: 2, frames: 124, screen: 'questionsLeaf', focus: 0.28, kicker: 'The bank', text: 'It is already in here', silentText: 'It is already in here', vo: 'That one is already in the bank, with its own row.', accent: '#2F6BFF' },
    { n: 3, frames: 124, screen: 'questionsLeaf', focus: 0.28, kicker: 'How often', text: 'And it keeps coming back', silentText: 'And it keeps coming back', vo: 'The circle beside it counts how often it returns.', accent: '#F5B301' },
    { n: 4, frames: 124, screen: 'questionsLeaf', focus: 0.3, kicker: 'Three taps', text: 'Tap it three times', silentText: 'Tap it three times', vo: 'Tap the question three times and wait.', accent: '#FF4D8D' },
    { n: 5, frames: 124, screen: 'noteHero', kicker: 'The answer', text: 'A written answer arrives', silentText: 'A written answer arrives', vo: 'A full written answer arrives, ready to copy.', accent: '#FF4D8D' },
    { n: 6, frames: 124, screen: 'noteBody', kicker: 'Structure', text: 'Headings, then the detail', silentText: 'Headings, then detail', vo: 'Headings first, then the detail underneath them.', accent: '#FF4D8D' },
    { n: 7, frames: 124, screen: 'noteBodyBottom', kicker: 'The last page', text: 'It ends with what to write', silentText: 'It ends with what to write', vo: 'It finishes with the points you have to write down.', accent: '#FF4D8D' },
    { n: 8, frames: 124, screen: 'plateBrachial', kicker: 'The picture', text: 'And the diagram it needs', silentText: 'And the diagram it needs', vo: 'The diagram that question needs comes with it.', accent: '#22D3A6' },
    { n: 9, frames: 124, screen: 'noteDiagram', kicker: 'In order', text: 'Picture, then the theory', silentText: 'Picture, then the theory', vo: 'Labelled the way you must draw it in the hall.', accent: '#22D3A6' },
    { n: 10, frames: 124, screen: 'askai', kicker: 'Still stuck', typed: true, text: 'Explain the Aschoff body', silentText: 'Ask it again, in your words', vo: 'Not clear yet? Ask it again in your own words.', accent: '#7C5CFF' },
    { n: 11, frames: 124, screen: 'chatdemo', kicker: 'Properly', text: 'It explains, then tests you', silentText: 'It explains, then tests you', vo: 'It explains properly then tests you.', accent: '#7C5CFF' },
    { n: 12, frames: 124, screen: 'flashcards', kicker: 'Keep it', text: 'The chapter becomes cards', silentText: 'The chapter becomes cards', vo: 'Turn the whole chapter into flashcards afterwards.', accent: '#4CC2FF' },
    { n: 13, frames: 124, screen: 'ankiStudy', kicker: 'Spacing', text: 'They return before you forget', silentText: 'They return before you forget', vo: 'They come back before you forget them.', accent: '#4CC2FF' },
    { n: 14, frames: 124, screen: 'home', kicker: 'No sign up', text: 'No account to make', silentText: 'No account to make', vo: 'There is no account to make and nothing to pay.', accent: '#22D3A6' },
  ],
};
