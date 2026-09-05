import type { AdScript } from './types.ts';
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
export const ALL_SCRIPTS: AdScript[] = [
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
];

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
};

/**
 * The reels that have nothing spoken in them at all.
 *
 * Not the same as the `-silent` MIX of a voiced reel, which has clips the
 * render leaves out. These were written without a voice — `Root.tsx` registers
 * them once rather than twice, and `voice-manifest` / `preflight` know not to
 * expect an mp3 that was never meant to exist.
 */
export const SILENT_REELS: AdScript[] = REELS.filter((s) => Boolean(s.noVoice));

/** The reels that do have a voice, and therefore ship in two mixes. */
export const VOICED_REELS: AdScript[] = REELS.filter((s) => !s.noVoice);
