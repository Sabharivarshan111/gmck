/**
 * The subject cards' colours.
 *
 * Here rather than in the screen because it is colour maths, and because a
 * check can import a module that does not render anything — the version of
 * this that lived inside HomeScreen.tsx could only be verified by looking at
 * a screenshot.
 */
import { hexToHsv, hsvToHex, mix, withAlpha } from '@/theme/color';

// Matches SUBJECT_GRADIENTS in src/components/shell/HomeTab.tsx.
export const SUBJECT_GRADIENT: Record<string, [string, string]> = {
  anatomy: ['rgba(147,51,234,0.40)', 'rgba(49,46,129,0.60)'],
  physiology: ['rgba(192,38,211,0.40)', 'rgba(88,28,135,0.60)'],
  biochemistry: ['rgba(8,145,178,0.40)', 'rgba(30,58,138,0.60)'],
  pharmacology: ['rgba(13,148,136,0.40)', 'rgba(22,78,99,0.60)'],
  pathology: ['rgba(124,58,237,0.40)', 'rgba(88,28,135,0.60)'],
  microbiology: ['rgba(5,150,105,0.40)', 'rgba(20,83,45,0.60)'],
};
export const DEFAULT_GRADIENT: [string, string] = ['rgba(124,58,237,0.40)', 'rgba(88,28,135,0.60)'];

/**
 * How each card differs from the accent: a hue offset in degrees, and a
 * brightness step.
 *
 * Six cards all in the accent would be one wall of colour, and six unrelated
 * hues would not be a theme. So they fan out around it — near enough to read
 * as a family, far enough apart that Pathology and Pharmacology are still
 * telling apart at a glance.
 *
 * The fan is deliberately narrow, and brightness carries the rest of the
 * difference. A wider one is the obvious way to separate six cards and it is
 * wrong: 100 degrees from an orange accent is green, and one green card in a
 * warm theme looks like a bug rather than a sixth colour.
 */
export const CARD_TINTS: { hue: number; value: number }[] = [
  { hue: 0, value: 0 },
  { hue: 24, value: -0.1 },
  { hue: -20, value: 0.08 },
  { hue: 46, value: -0.18 },
  { hue: -38, value: 0.14 },
  { hue: 66, value: -0.06 },
];

/**
 * Subject-card gradients for a **custom** theme.
 *
 * The built-in gradients are fixed hues chosen against the published dark
 * palette, and a theme built from someone's own four colours has nothing to do
 * with them — an orange-and-cream theme with a wall of purple and teal cards
 * underneath looks like two apps stacked.
 *
 * The first version of this tinted the *built-in* hue set towards the accent.
 * That was too timid to read as a change: at a 45% mix a violet card is still
 * a violet card, so on an orange theme one card in six changed and the rest
 * looked untouched. The hues are now taken **from** the accent rather than
 * pulled towards it, so every card belongs to the theme.
 *
 * The saturation and value floors are what stop a near-grey accent from
 * producing six identical grey cards; a card has to stay identifiable as its
 * subject, which is a stronger claim than matching the palette exactly.
 */
export function themedGradient(
  colors: { accent: string; background: string },
  index: number,
): [string, string] {
  const base = hexToHsv(colors.accent);
  const tint = CARD_TINTS[((index % CARD_TINTS.length) + CARD_TINTS.length) % CARD_TINTS.length];
  const hue = hsvToHex({
    h: (base.h + tint.hue + 360) % 360,
    s: Math.max(0.42, base.s),
    v: Math.min(1, Math.max(0.52, base.v + tint.value)),
  });
  return [
    withAlpha(hue, 0.42),
    // Grounded in the page rather than a second free colour: the bottom of
    // every card fading towards the background is what makes six different
    // hues look like one set.
    withAlpha(mix(hue, colors.background, 0.55), 0.72),
  ];
}
