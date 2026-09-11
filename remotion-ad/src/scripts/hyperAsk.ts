import type { AdScript } from './types';

/**
 * HyperFrames film A — "One question, all the way through".
 *
 * ## Why this exists rather than reusing `adAskIt`
 *
 * The two HyperFrames films were first cut from `adAskIt` and `adTheYear`, and
 * the owner's verdict on the result named four things. Three are fixed here
 * and the fourth in the renderer:
 *
 * 1. **It named a year.** `adTheYear` walks first year, then second, then
 *    third, then final — it is a film *about* the four years, and the
 *    instruction is that these two are for all of them: "i dont want to
 *    mention what year ok its for all years". So neither of these scripts
 *    names one. That also kills a bug the same frame showed: the caption read
 *    "Second year" over the final-year subject list, because the year in the
 *    words and the year in the screenshot were set in two different places and
 *    nothing compared them.
 * 2. **The diagram was missing.** The film reached for `noteDiagram` — a
 *    screenshot of a note with a diagram card inside it — which is captured
 *    against the storage bucket and comes back as an empty box wherever that
 *    bucket is unreachable. The diagram shots here are the **drawings
 *    themselves**, full frame, which are ordinary files on disk and cannot
 *    fail to load. A diagram is worth more at full frame than as a card inside
 *    a screenshot of a card anyway.
 * 3. **Ask AI showed nothing.** `askai` is the chat's empty state — a nearly
 *    black screen reading "Ask me any medical question!" — which under the
 *    film's vignette was invisible. `chatdemo` is the same screen with an
 *    actual exchange in it.
 * 4. **It was slow.** That one is the renderer's, and it is the transitions
 *    rather than the cut rate — see the note on pacing below.
 *
 * ## The shape
 *
 * One question, followed all the way through: it is in the bank, it repeats,
 * three taps open the written answer, the diagram comes with it, and it ends
 * as a card you will see again. Most ads in this set are a list of features;
 * this one is an argument, and the argument is that the app finishes a thought
 * rather than starting twelve.
 *
 * ## Seventeen shots, and why not thirty
 *
 * The owner watched the first cut and said "every frame is slow and the video
 * is too slow and boring" — four seconds is a very long time to hold one
 * screenshot. This runs at about three and a half, which is as fast as a
 * **voiced** reel can be cut: every spoken shot costs about 2.1 seconds before
 * a single word of its own, because a line carries a fixed opening, a full
 * stop's worth of pause and the air after it. Twenty-two shots would leave
 * thirteen characters a line, which is not a sentence.
 *
 * So the speed comes from the cut itself — a directional push at every
 * boundary, type that slams rather than fades, and a picture that never stops
 * moving. A three-second shot that arrives from the side and holds still reads
 * as a slideshow; the same shot pushed in over a moving frame does not.
 */
export const hyperAsk: AdScript = {
  id: 'orbit-hyper-ask',
  title: 'Orbit MBBS — One question, all the way through',
  format: 'reel',
  look: 'prompt',
  hyperOnly: true,
  voice: 'en-US-AvaNeural',
  rate: '+8%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide-answer.wav',
  shots: [
    { n: 1, frames: 120, screen: null, kicker: 'The question', typed: true, text: 'Pathogenesis of rheumatic heart disease', silentText: 'Ask it anything', vo: 'You have seen this one in a paper.', accent: '#2F6BFF' },
    { n: 2, frames: 100, screen: 'questionsLeaf', focus: 0.28, kicker: 'The bank', text: 'Already in the bank', silentText: 'Already in the bank', vo: 'It is already in the bank.', accent: '#2F6BFF' },
    { n: 3, frames: 112, screen: 'questionsLeaf', focus: 0.28, kicker: 'How often', text: 'How often it repeats', silentText: 'How often it repeats', vo: 'The circle counts the repeats.', accent: '#F5B301' },
    { n: 4, frames: 86, screen: 'questionsLeaf', focus: 0.3, kicker: 'Three taps', text: 'Triple-tap', silentText: 'Triple-tap', vo: 'Triple-tap it.', accent: '#FF4D8D' },
    { n: 5, frames: 100, screen: 'noteHero', kicker: 'The answer', text: 'Written answer', silentText: 'Written answer', vo: 'The written answer opens.', accent: '#FF4D8D' },
    { n: 6, frames: 112, screen: 'noteBody', kicker: 'Structure', text: 'Headings, then detail', silentText: 'Headings, then detail', vo: 'Headings first, then the detail.', accent: '#FF4D8D' },
    { n: 7, frames: 108, screen: 'noteBodyBottom', kicker: 'The last page', text: 'Must-write points', silentText: 'Must-write points', vo: 'The must-write points are last.', accent: '#FF4D8D' },
    { n: 8, frames: 112, screen: 'plateBrachial', kicker: 'The picture', text: 'Its own diagram', silentText: 'Its own diagram', vo: 'And the diagram comes with it.', accent: '#22D3A6' },
    { n: 9, frames: 112, screen: 'plateUlnar', kicker: 'Labelled', text: 'Every part labelled', silentText: 'Every part labelled', vo: 'Labelled for what you draw.', accent: '#22D3A6' },
    { n: 10, frames: 118, screen: 'askai', kicker: 'Still stuck', typed: true, text: 'Explain the Aschoff body', silentText: 'Ask it your way', vo: 'Still not clear? Ask it your way.', accent: '#7C5CFF' },
    { n: 11, frames: 112, screen: 'chatdemo', kicker: 'Properly', text: 'Explain. Then test.', silentText: 'Explain. Then test.', vo: 'It explains, then it tests you.', accent: '#7C5CFF' },
    { n: 12, frames: 104, screen: 'flashcards', kicker: 'Keep it', text: 'Make flashcards', silentText: 'Make flashcards', vo: 'Turn the chapter into cards.', accent: '#4CC2FF' },
    { n: 13, frames: 100, screen: 'ankiStudy', kicker: 'Spacing', text: 'Spaced revision', silentText: 'Spaced revision', vo: 'They come back for revision.', accent: '#4CC2FF' },
    { n: 14, frames: 116, screen: 'timer', kicker: 'Focus', text: 'Focus. Grow a tree.', silentText: 'Focus. Grow a tree.', vo: 'Put the phone down. A tree grows.', accent: '#22D3A6' },
    { n: 15, frames: 106, screen: 'progress', kicker: 'No sign up', text: 'No account needed', silentText: 'No account needed', vo: 'Your streak, no account needed.', accent: '#F5B301' },
    { n: 16, frames: 120, screen: null, kicker: 'Orbit MBBS', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
