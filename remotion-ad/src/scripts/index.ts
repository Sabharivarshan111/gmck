import type { AdScript } from './types.ts';
import { silentReel } from './silent.ts';
import { withBookends } from './bookends.ts';
import { thePattern } from './thePattern.ts';
import { twoAM } from './twoAM.ts';
import { drawItFromMemory } from './drawItFromMemory.ts';
import { reelRepeats } from './reelRepeats.ts';
import { reelSixHours } from './reelSixHours.ts';
import { reelDrawIt } from './reelDrawIt.ts';
import { reelGuide } from './reelGuide.ts';
import { reelGuideAnswer } from './reelGuideAnswer.ts';
import { reelGuideNight } from './reelGuideNight.ts';
import { reelFunctions } from './reelFunctions.ts';
import { reelOneQuestion } from './reelOneQuestion.ts';
import { reelAnki } from './reelAnki.ts';
import { reelAttendance } from './reelAttendance.ts';
import { reelSecondYear } from './reelSecondYear.ts';
import { reelSetup } from './reelSetup.ts';
import { reelPages } from './reelPages.ts';
import { reelFirstYear } from './reelFirstYear.ts';
import { reelSpaced } from './reelSpaced.ts';
import { reelProgress } from './reelProgress.ts';
import { reelReminder } from './reelReminder.ts';
import { reelYours } from './reelYours.ts';
import { reelNotes } from './reelNotes.ts';
import { reelHowNotes } from './reelHowNotes.ts';
import { reelHowAttendance } from './reelHowAttendance.ts';
import { reelThirdYear } from './reelThirdYear.ts';
import { reelFinalYear } from './reelFinalYear.ts';
import { adAskIt } from './adAskIt.ts';
import { adTheYear } from './adTheYear.ts';

/**
 * Every script that exists, in one list.
 *
 * `voice-manifest.mjs` and `preflight.mjs` both walked their own hardcoded
 * list of three imports. Adding a fourth script meant remembering both files,
 * and forgetting the manifest is the quiet failure: the render still happens,
 * with no voice on a third of the ads. They read this instead.
 *
 * Node 22 strips the TypeScript types natively, so those scripts can import
 * this file directly — the same file the bundler sees.
 */
const AUTHORED: AdScript[] = [
  thePattern,
  twoAM,
  drawItFromMemory,
  reelRepeats,
  reelSixHours,
  reelDrawIt,
  reelGuide,
  reelGuideAnswer,
  reelGuideNight,
  reelFunctions,
  reelOneQuestion,
  reelAnki,
  reelAttendance,
  reelSecondYear,
  reelSetup,
  reelPages,
  reelFirstYear,
  reelSpaced,
  reelProgress,
  reelReminder,
  reelYours,
  reelNotes,
  // The walkthroughs. These answer "where is it and what do I tap", which is
  // the question that loses people AFTER the pitch has worked — two features
  // here were reported as missing while shipped and on screen.
  reelHowNotes,
  reelHowAttendance,
  reelThirdYear,
  reelFinalYear,
  // The two flat, typographic ads. Same pipeline, different renderer —
  // `look` chooses, and `HyperAd` draws them.
  adAskIt,
  adTheYear,
];

/**
 * Every script, bookended.
 *
 * `AUTHORED` is what the script files say; this is what renders. Each ad opens
 * on "Welcome to Orbit" and closes on "Download Orbit on the Play Store",
 * stamped in one place rather than typed into twenty-four — see
 * `bookends.ts`.
 */
export const ALL_SCRIPTS: AdScript[] = AUTHORED.map(withBookends);

/** The 60-second vertical cuts, which are the ones with fixed shot frames. */
export const REELS: AdScript[] = ALL_SCRIPTS.filter((s) => s.format === 'reel');

export {
  thePattern,
  twoAM,
  drawItFromMemory,
  reelRepeats,
  reelSixHours,
  reelDrawIt,
  reelGuide,
  reelGuideAnswer,
  reelGuideNight,
  reelFunctions,
  reelOneQuestion,
  reelAnki,
  reelAttendance,
  reelSecondYear,
  reelSetup,
  reelPages,
  reelFirstYear,
  reelSpaced,
  reelProgress,
  reelReminder,
  reelYours,
  reelNotes,
  reelThirdYear,
  reelFinalYear,
  adAskIt,
  adTheYear,
};

/** The reels somebody speaks over. */
export const VOICED_REELS: AdScript[] = REELS.filter((s) => !s.noVoice);

/**
 * The silent reel that goes out beside each spoken one — a SCRIPT, not a mix.
 *
 * This used to be `REELS.filter(s => s.noVoice)` and it matched nothing,
 * because no reel was written without a voice: the muted cut was the same
 * script rendered again with `withVoice: false`. See `silent.ts` for why that
 * one edit could not serve both, and which of the two clocks was silently
 * winning.
 *
 * Built rather than hand-written, for the reason every other pair of lists in
 * this repo is: a reel and its silent twin have to stage the same screens in
 * the same order, and two files that must agree are two files that drift. What
 * is AUTHORED separately is what differs — `silentText` and `kicker`, written
 * for somebody who will never hear a word. What is derived is the staging.
 */
export const SILENT_REELS: AdScript[] = VOICED_REELS.map(silentReel);

/** Everything that gets registered and rendered, both cuts of every reel. */
export const ALL_COMPOSITIONS: AdScript[] = [...ALL_SCRIPTS, ...SILENT_REELS];
