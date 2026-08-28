/**
 * The trees you grow by concentrating.
 *
 * Forest's idea, and the reason it works: you are not earning points, you are
 * growing something, and walking away costs you the thing rather than the
 * score. What is taken from it here is the *mechanic*, not the artwork — every
 * tree below is described as a handful of numbers and drawn from them, so a
 * species is a dozen bytes rather than a bitmap per theme per density.
 *
 * **Unlocked by focused minutes, not by a currency.** Forest pays coins and
 * sells species; this app already has one XP ladder shared with the web app
 * (`lib/xp.ts`), and a second economy is a second set of numbers to disagree
 * with the first. Lifetime focus minutes is a count the timer already keeps.
 */

export type Crown =
  /** One rounded mass — an oak, a maple. */
  | 'blob'
  /** Stacked triangles narrowing upwards — a conifer. */
  | 'cone'
  /** Fronds radiating from the top — a palm. */
  | 'fan'
  /** Long strands falling from the top — a willow. */
  | 'weep'
  /** A narrow column of leaves — bamboo, poplar. */
  | 'column'
  /** Flat pads stacked up a thick stem — a cactus. */
  | 'pad'
  /** Limbs rising in a V with a mass of leaf at each tip — a ginkgo, an elm. */
  | 'vase';

export type Decor = 'none' | 'blossom' | 'fruit' | 'star';

export interface Species {
  key: string;
  name: string;
  /** Lifetime focused minutes before this one can be planted. */
  unlockAt: number;
  crown: Crown;
  /**
   * The species' own hue, 0-360 — a real one, not an offset.
   *
   * It was an offset from the theme's accent, and that was wrong twice over:
   * every tree came out the same colour as every other (a fuchsia accent grew
   * a fuchsia pine), and none of them looked like the thing they are named
   * after. A maple is red, a pine is deep green, and a reader who picks
   * "Maple" and gets a violet tree has been told the name means nothing.
   *
   * The theme still gets its say — `FocusTree` pulls every hue part of the way
   * towards the accent — but identity survives the pull.
   */
  hue: number;
  /** The same, for blossom or fruit. */
  decorHue: number;
  decor: Decor;
  /** Trunk height as a fraction of the drawing box. */
  trunk: number;
  /** Trunk width at the base, as a fraction of the box. */
  girth: number;
  /** How much the trunk leans, in degrees. Character, not error. */
  lean: number;
  /** How wide the crown spreads, as a fraction of the box. */
  spread: number;
  /** How many masses, fronds or pads the crown is made of. */
  parts: number;
}

/**
 * Twelve species, ordered by what they cost.
 *
 * The first two are free because a reward you cannot reach on day one is not a
 * reward, it is a locked door. The last is 2,500 minutes — around forty hours
 * of real concentration — and is meant to take a term.
 */
export const SPECIES: Species[] = [
  {
    key: 'sprout',
    name: 'Sprout',
    unlockAt: 0,
    crown: 'blob',
    hue: 96,
    decorHue: 96,
    decor: 'none',
    trunk: 0.3,
    girth: 0.05,
    lean: 0,
    spread: 0.34,
    parts: 3,
  },
  {
    key: 'oak',
    name: 'Oak',
    unlockAt: 0,
    crown: 'blob',
    hue: 108,
    decorHue: 108,
    decor: 'none',
    trunk: 0.42,
    girth: 0.1,
    lean: -3,
    spread: 0.66,
    parts: 5,
  },
  {
    key: 'pine',
    name: 'Pine',
    unlockAt: 30,
    crown: 'cone',
    hue: 152,
    decorHue: 152,
    decor: 'none',
    trunk: 0.34,
    girth: 0.07,
    lean: 0,
    spread: 0.52,
    parts: 4,
  },
  {
    key: 'cherry',
    name: 'Cherry blossom',
    unlockAt: 60,
    crown: 'blob',
    hue: 338,
    decorHue: 320,
    decor: 'blossom',
    trunk: 0.4,
    girth: 0.08,
    lean: 5,
    spread: 0.64,
    parts: 5,
  },
  {
    key: 'maple',
    name: 'Maple',
    unlockAt: 150,
    crown: 'blob',
    hue: 18,
    decorHue: 8,
    decor: 'none',
    trunk: 0.4,
    girth: 0.09,
    lean: -4,
    spread: 0.62,
    parts: 6,
  },
  {
    key: 'willow',
    name: 'Willow',
    unlockAt: 300,
    crown: 'weep',
    hue: 92,
    decorHue: 92,
    decor: 'none',
    trunk: 0.44,
    girth: 0.08,
    lean: 3,
    spread: 0.68,
    parts: 7,
  },
  {
    key: 'apple',
    name: 'Apple',
    unlockAt: 450,
    crown: 'blob',
    hue: 118,
    decorHue: 6,
    decor: 'fruit',
    trunk: 0.38,
    girth: 0.09,
    lean: -6,
    spread: 0.6,
    parts: 5,
  },
  {
    key: 'palm',
    name: 'Palm',
    unlockAt: 650,
    crown: 'fan',
    hue: 140,
    decorHue: 140,
    decor: 'none',
    trunk: 0.62,
    girth: 0.06,
    lean: 8,
    spread: 0.74,
    parts: 7,
  },
  {
    key: 'bamboo',
    name: 'Bamboo',
    unlockAt: 900,
    crown: 'column',
    hue: 88,
    decorHue: 88,
    decor: 'none',
    trunk: 0.66,
    girth: 0.045,
    lean: -2,
    spread: 0.46,
    parts: 8,
  },
  {
    key: 'ginkgo',
    name: 'Ginkgo',
    unlockAt: 1200,
    crown: 'vase',
    hue: 48,
    decorHue: 48,
    decor: 'none',
    trunk: 0.4,
    girth: 0.08,
    lean: 2,
    spread: 0.68,
    parts: 5,
  },
  {
    key: 'saguaro',
    name: 'Saguaro',
    unlockAt: 1800,
    crown: 'pad',
    hue: 128,
    decorHue: 328,
    decor: 'blossom',
    trunk: 0.6,
    girth: 0.13,
    lean: 0,
    spread: 0.46,
    parts: 3,
  },
  {
    key: 'sequoia',
    name: 'Sequoia',
    unlockAt: 2500,
    crown: 'cone',
    hue: 150,
    decorHue: 40,
    decor: 'none',
    trunk: 0.34,
    girth: 0.15,
    lean: 0,
    spread: 0.44,
    parts: 8,
  },
];

export const DEFAULT_SPECIES = 'oak';

export function speciesFor(key: string | null | undefined): Species {
  return SPECIES.find(one => one.key === key) ?? SPECIES[1];
}

/** Everything the reader has earned the right to plant. */
export function unlockedSpecies(focusMinutes: number): Species[] {
  return SPECIES.filter(one => one.unlockAt <= focusMinutes);
}

export function isUnlocked(key: string, focusMinutes: number): boolean {
  return speciesFor(key).unlockAt <= focusMinutes;
}

/**
 * The next thing to look forward to.
 *
 * A ladder with nothing visible above you is a ladder you stop climbing, so
 * the settings sheet names what is coming rather than only what is done.
 */
export function nextUnlock(focusMinutes: number): Species | null {
  return SPECIES.find(one => one.unlockAt > focusMinutes) ?? null;
}
