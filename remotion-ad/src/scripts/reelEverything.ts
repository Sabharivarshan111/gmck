import type { AdScript } from './types';

/**
 * Reel — "Whatever year you're in".
 *
 * ## Why a reel with no year in it
 *
 * There are four year reels and they are the right ad for a student who
 * already knows which year they are in. They are the wrong ad for Instagram,
 * where the audience is every MBBS year at once and three quarters of anyone
 * who sees "third year" scrolls past something that was also for them.
 *
 * So this one names no year and no subject. The owner asked for two of these
 * to post untargeted; `reelCommunity` is the other, and the two are
 * deliberately different arguments rather than one film cut twice — this is
 * what the app DOES, start to finish, and that one is who made it and what a
 * reader puts into it.
 *
 * ## What that costs, and why it is worth it
 *
 * The year reels can say "Forensic and Community Medicine, chapter by chapter"
 * and show that exact list. This cannot: every subject-specific line is gone,
 * which is most of what makes a year reel concrete. What replaces it is
 * sequence — thirteen shots that are the actual path through the app, in the
 * order a reader walks it, ending on the screen that shows the walk was
 * recorded.
 *
 * `questionsLeaf` is a Pathology chapter and `browse` is the final-year list,
 * so neither may be described in words here: the screen would be naming a year
 * the voice deliberately does not. `ad-truth-check` enforces the first of
 * those against year-specific ads; the second is a choice this file makes, and
 * it is why `browse` appears in `reelCommunity` and not here.
 *
 * ## The arithmetic
 *
 * Eight shots at 129 and six at 128 is 1,800 — sixty seconds exactly. The
 * welcome card `bookends.ts` prepends costs 62 of those, taken off the last
 * shot by `resolveShotFrames`, which leaves the end card 66 frames (2.2s).
 * That is the shape every reel here uses and the reason the numbers are not
 * round: an author who "tidies" them to 130 each pushes the total to 1,820 and
 * the surplus comes off the call to action, silently. `preflight` holds a
 * two-second floor under it now, and that floor exists because it happened.
 */
export const reelEverything: AdScript = {
  id: 'orbit-reel-everything',
  title: 'Orbit MBBS — Reel: Whatever year you are in',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'nothing is revised', silentText: 'Exam close. Nothing revised.', vo: 'The exam is close and nothing is revised.', accent: '#F5B301' },
    { n: 2, frames: 129, screen: 'questionsLeaf', camera: 'macro', text: 'the questions themselves', silentText: 'Straight to the questions', vo: 'Orbit opens on the questions themselves.', focus: 0.28, accent: '#F5B301' },
    { n: 3, frames: 129, screen: 'questionsLeaf', mascot: 'guide', camera: 'push', text: 'how often each one came up', silentText: 'See what repeats', vo: 'The circle says how often each one came up.', focus: 0.3, accent: '#F5B301' },
    { n: 4, frames: 129, screen: 'noteHero', camera: 'push', text: 'the answer opens', silentText: 'Triple-tap for the answer', vo: 'Triple-tap and the answer opens.', accent: '#FF4D8D' },
    { n: 5, frames: 129, screen: 'noteBody', camera: 'glideDown', text: 'the way you would write it', silentText: 'Notes you could have written', vo: 'It is written the way you would write it.', accent: '#FF4D8D' },
    { n: 6, frames: 129, screen: 'plateBrachial', mascot: 'guide', camera: 'settle', text: 'the diagram comes with it', silentText: 'Diagram included', vo: 'And the diagram comes with it.', accent: '#22D3A6' },
    { n: 7, frames: 129, screen: 'askai', camera: 'push', text: 'in plain words', silentText: 'Ask anything, plainly', vo: 'Anything else you ask in plain words.', accent: '#7C5CFF' },
    { n: 8, frames: 129, screen: 'flashcards', camera: 'orbit', text: 'The chapter becomes flashcards', silentText: 'Chapter into flashcards', vo: 'The chapter becomes flashcards.', accent: '#4CC2FF' },
    { n: 9, frames: 128, screen: 'ankiStudy', mascot: 'guide', camera: 'macro', text: 'before you forget', silentText: 'Back before you forget', vo: 'They come back before you forget.', accent: '#4CC2FF' },
    { n: 10, frames: 128, screen: 'attendanceCalendar', camera: 'push', text: 'counted on a calendar', silentText: 'Attendance on a calendar', vo: 'Attendance is counted on a calendar.', accent: '#22D3A6' },
    { n: 11, frames: 128, screen: 'timer', camera: 'push', text: 'grows a tree while you sit', silentText: 'Focus grows a tree', vo: 'The timer grows a tree while you sit.', accent: '#22D3A6' },
    { n: 12, frames: 128, screen: 'music', mascot: 'guide', camera: 'settle', text: 'Your own music plays under it', silentText: 'Your own music', vo: 'Your own music plays under it.', accent: '#4CC2FF' },
    { n: 13, frames: 128, screen: 'progress', camera: 'glideDown', text: 'coloured in', silentText: 'Progress, coloured in', vo: 'Every question you finished is coloured in.', accent: '#F5B301' },
    { n: 14, frames: 128, screen: 'home', camera: 'pull', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};
