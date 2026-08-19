import { contrast, isDark, mix, onColor } from '@/theme/color';
import type { CustomPalette } from '@/theme/presets';

/**
 * Build a theme out of a wallpaper.
 *
 * **This runs entirely on the phone.** No upload, no model, no network. That
 * is not a shortcut around asking Gemini — it is a better answer to the same
 * question: the palette appears the instant the picture is chosen, it works
 * with no signal, it costs nothing per use, it cannot run out of quota, and
 * the photo never leaves the device. There is nothing to store and therefore
 * nothing to remember to delete.
 *
 * What a language model would add is taste — a name, a sense of mood. What it
 * cannot add is correctness: a model asked for "colours from this image"
 * returns colours that look plausible in a list and produce unreadable text
 * about as often as not, so its output would have to go through exactly the
 * repair pass below anyway. The repair pass is the part that matters, so it
 * is the part that got built.
 *
 * Colours only. The typeface stays Roboto — see the note in
 * theme/typography.ts: React Native otherwise follows the *system* font, and
 * OEM skins replace it, so a per-theme typeface would re-typeset the app
 * differently on every phone. A wallpaper is not a reason to give up that
 * guarantee.
 */

/** What react-native-image-colors reports for an Android image. */
export interface ImagePalette {
  average?: string | null;
  dominant?: string | null;
  vibrant?: string | null;
  darkVibrant?: string | null;
  lightVibrant?: string | null;
  darkMuted?: string | null;
  lightMuted?: string | null;
  muted?: string | null;
}

/** WCAG AA, matching what check:contrast enforces on the built-in themes. */
const TEXT_ON_BACKGROUND = 4.5;
const ACCENT_ON_BACKGROUND = 3;
const CARD_VS_BACKGROUND = 1.05;

const first = (...values: (string | null | undefined)[]): string | undefined =>
  values.find((value): value is string => typeof value === 'string' && value.length > 0);

/**
 * Move `colour` towards `towards` until it clears `target` against `against`.
 *
 * Bisection rather than a fixed nudge: the amount of correction an image needs
 * is not knowable in advance — a photo of a foggy morning needs almost all of
 * it, a night sky almost none — and a fixed step either mangles the ones that
 * were nearly right or gives up on the ones that were not.
 */
function fixContrast(
  colour: string,
  against: string,
  towards: string,
  target: number,
): string {
  if (contrast(colour, against) >= target) {
    return colour;
  }
  let low = 0;
  let high = 1;
  for (let i = 0; i < 18; i += 1) {
    const mid = (low + high) / 2;
    if (contrast(mix(colour, towards, mid), against) >= target) {
      high = mid;
    } else {
      low = mid;
    }
  }
  const fixed = mix(colour, towards, high);
  // Mixing all the way to `towards` is the worst case and always clears the
  // bar, because `towards` is black or white against its own opposite.
  return contrast(fixed, against) >= target ? fixed : towards;
}

/**
 * The four colours a theme is made of, derived from an image.
 *
 * `paletteFrom` turns these into the other fourteen, so getting these right is
 * the whole job — cards, borders, muted text and the rest follow.
 */
export function themeFromImage(palette: ImagePalette): CustomPalette {
  const anchor = first(palette.average, palette.dominant, palette.muted) ?? '#808080';
  const dark = isDark(anchor);

  /**
   * The background is pulled hard towards black or white rather than used as
   * sampled. A photo's dominant colour at full strength is a *splash*; a
   * background is a surface you read six hundred questions on. 0.72 keeps the
   * hue recognisably from the picture while dropping the intensity that would
   * make it exhausting.
   */
  const backgroundSeed =
    first(
      dark ? palette.darkMuted : palette.lightMuted,
      dark ? palette.darkVibrant : palette.lightVibrant,
      anchor,
    ) ?? anchor;
  const background = mix(backgroundSeed, dark ? '#000000' : '#FFFFFF', 0.72);

  /**
   * The card is the background lifted towards the text, by enough to be seen
   * and not enough to become a second background. Same relationship the
   * built-in themes use.
   */
  const cardSeed = mix(background, onColor(background), 0.07);

  /**
   * Text starts as plain black or white and is then tinted a little towards
   * the picture — enough to belong to it, not enough to lose the contrast
   * that black or white was chosen for. The repair pass below is what
   * guarantees the second half.
   */
  const textSeed = mix(onColor(background), backgroundSeed, 0.12);

  /** The accent is the most alive colour the image offered. */
  const accentSeed =
    first(
      palette.vibrant,
      dark ? palette.lightVibrant : palette.darkVibrant,
      palette.dominant,
      anchor,
    ) ?? anchor;

  // Repair. Four freely-chosen colours can be unreadable — that is a property
  // of the feature, not a bug — but colours the *app* chose have no such
  // excuse, so every one of them is moved until it clears the same bar
  // check:contrast holds the built-in themes to.
  const text = fixContrast(textSeed, background, onColor(background), TEXT_ON_BACKGROUND);
  const accent = fixContrast(
    accentSeed,
    background,
    onColor(background),
    ACCENT_ON_BACKGROUND,
  );
  const card = fixContrast(cardSeed, background, onColor(background), CARD_VS_BACKGROUND);

  return { background, text, accent, card };
}
