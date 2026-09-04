import type { AdScript } from './types.ts';
import { thePattern } from './thePattern.ts';
import { twoAM } from './twoAM.ts';
import { drawItFromMemory } from './drawItFromMemory.ts';
import { reelRepeats } from './reelRepeats.ts';
import { reelSixHours } from './reelSixHours.ts';
import { reelDrawIt } from './reelDrawIt.ts';

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
];

/** The 60-second vertical cuts, which are the ones with fixed shot frames. */
export const REELS: AdScript[] = ALL_SCRIPTS.filter((s) => s.format === 'reel');

export { thePattern, twoAM, drawItFromMemory, reelRepeats, reelSixHours, reelDrawIt };
