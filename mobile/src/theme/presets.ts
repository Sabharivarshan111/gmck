import { isDark, mix, onColor } from '@/theme/color';

/**
 * The four colours a user picks, and the presets built on them.
 *
 * Matches the web app's "Create Your Own Theme": background, text, accent,
 * card. Everything else in the palette is derived from those, because asking
 * for eleven colours would be unusable and asking for four is what the app
 * already offers on the web.
 */
export interface CustomPalette {
  background: string;
  text: string;
  accent: string;
  card: string;
}

/** The named themes in the picker. `custom` is whatever is saved as My Theme. */
export type PresetKey = 'dark' | 'light' | 'blackwhite' | 'blackpink' | 'liquidglass' | 'custom' | 'system';

/**
 * How surfaces are drawn, as opposed to what colour they are.
 *
 * `solid` is an opaque card with a hairline border — what every theme here
 * used before. `glass` is ORBIT's glass treatment: a translucent layer
 * that sits *over* the background rather than replacing it, with a specular
 * highlight along its lit edge.
 *
 * It is a separate axis from the four colours on purpose. Glass is not a
 * palette — you cannot express "translucent, lit from above, floating" as a
 * background hex — and keeping it separate means the custom editor still deals
 * in four colours while a preset can carry a material as well.
 */
export type Material = 'solid' | 'glass';

export interface Preset {
  key: PresetKey;
  name: string;
  /** Absent for `system` and `custom`, which resolve at runtime. */
  palette?: CustomPalette & { monochrome?: boolean };
  /** Defaults to solid. */
  material?: Material;
}

/**
 * Named presets, in the order the web app lists them.
 *
 * Black Pink and Liquid Glass are the two the web app ships beyond light and
 * dark; their values are read from the published UI rather than invented, so
 * somebody switching between the two apps sees the same thing.
 */
export const PRESETS: Preset[] = [
  {
    key: 'dark',
    name: 'Dark',
    palette: { background: '#000000', text: '#FFFFFF', accent: '#E879F9', card: '#0E0E11' },
  },
  {
    key: 'light',
    name: 'Light',
    palette: { background: '#FFFFFF', text: '#0A0A0B', accent: '#C026D3', card: '#F6F6F9' },
  },
  {
    key: 'blackwhite',
    name: 'Black & White',
    palette: { background: '#000000', text: '#FFFFFF', accent: '#FFFFFF', card: '#101010', monochrome: true },
  },
  {
    key: 'blackpink',
    name: 'Black Pink',
    palette: { background: '#000000', text: '#FFFFFF', accent: '#FF2D78', card: '#141017' },
  },
  {
    key: 'liquidglass',
    name: 'Liquid Glass',
    /** ORBIT glass: cool ground, translucent controls and restrained rims.
     * Android 13+ can refract captured wallpaper through OrbitGlass; web and
     * older Android use SVG highlights. This is not Apple's native material.
     */
    palette: { background: '#080C14', text: '#F2F5FA', accent: '#5B9DFF', card: '#161E2C' },
    material: 'glass',
  },
];

/**
 * Starting points for the custom editor, matching the web app's quick presets.
 *
 * They exist because a blank colour picker is a bad first move: most people
 * want "something like this, but greener", not to specify four colours from
 * nothing. Each is a complete, readable four-colour set to nudge from.
 */
export const QUICK_PRESETS: { name: string; palette: CustomPalette }[] = [
  {
    name: 'Ocean',
    palette: { background: '#0B1B2B', text: '#F2F7FB', accent: '#34C3D4', card: '#12293D' },
  },
  {
    name: 'Sunset',
    palette: { background: '#1E1119', text: '#FFF4EC', accent: '#FF6B35', card: '#2C1A24' },
  },
  {
    name: 'Forest',
    palette: { background: '#0C1A12', text: '#EAF6EE', accent: '#3DD68C', card: '#14291D' },
  },
  {
    name: 'Lavender',
    palette: { background: '#FBFAFF', text: '#1B1630', accent: '#7C4DFF', card: '#F1EEFC' },
  },
];

/** Semantic colours never come from a theme. See the note in ThemeSheet. */
const SEMANTIC_DARK = { success: '#22C55E', warning: '#FBBF24', danger: '#F87171' };
const SEMANTIC_LIGHT = { success: '#16A34A', warning: '#D97706', danger: '#DC2626' };
const HUES_DARK = { cyan: '#22D3EE', emerald: '#34D399', green: '#22C55E', violet: '#8B5CF6' };
const HUES_LIGHT = { cyan: '#0891B2', emerald: '#059669', green: '#16A34A', violet: '#7C3AED' };

/**
 * Expand four chosen colours into the eighteen the app actually uses.
 *
 * The derived ones are all *relationships*, which is why they can be computed
 * rather than asked for:
 *
 *   • `cardElevated` is the card lifted towards the text colour — a second
 *     surface has to be visible against the first or the hierarchy is carried
 *     by borders alone.
 *   • `border` sits between card and text, far enough to frame and not so far
 *     it fences.
 *   • `textMuted` is text faded towards the background, which is what "muted"
 *     means; picking it independently is how you get unreadable secondary text.
 *   • `primary` is the text colour and `primaryText` the background, so a
 *     filled button is always the inverse of the page — that is what keeps the
 *     white timer disc and the inverted chips working in every theme.
 *
 * Semantic colours (success, warning, danger) and the fixed hues are taken
 * from whichever base the chosen background is closer to. They are never
 * derived from the user's picks: a red that means "wrong" has to stay red.
 */
/**
 * How much of what is behind a surface shows through it, 0–1.
 *
 * A single number rather than a per-surface setting: translucency is a
 * property of the *material* the app is made of, and surfaces made of
 * different amounts of glass read as a mistake rather than a hierarchy.
 * Elevated surfaces are derived from it, not chosen separately.
 */
export const DEFAULT_TRANSLUCENCY = 0.38;

/**
 * The most a surface may let through.
 *
 * Not a legibility limit, and it is worth being precise about that because the
 * obvious guess is wrong: raising this does **not** cost text contrast. The
 * wallpaper's scrim is solved against the theme background, so the more of the
 * picture a surface lets through, the more of it has already been washed
 * towards that background — the two cancel, and text holds AA even at 100%.
 * scripts/glass-check.mjs sweeps the whole range and proves it.
 *
 * What does break, past roughly here, is the *surface*: its border and its
 * lift dissolve into the picture and a card stops reading as a card. That is a
 * judgement about form, and it is written down as one rather than dressed up
 * as a measurement.
 */
export const MAX_TRANSLUCENCY = 0.55;

export function paletteFrom(
  custom: CustomPalette & { monochrome?: boolean },
  material: Material = 'solid',
  translucency: number = material === 'glass' ? DEFAULT_TRANSLUCENCY : 0,
  /** Skips the ceiling. Only scripts/glass-check.mjs passes this. */
  unclamped = false,
) {
  const dark = isDark(custom.background);
  const semantic = dark ? SEMANTIC_DARK : SEMANTIC_LIGHT;
  const hues = custom.monochrome
    ? { cyan: '#FFFFFF', emerald: '#D4D4D4', green: '#FFFFFF', violet: '#BDBDBD' }
    : dark ? HUES_DARK : HUES_LIGHT;

  /*
   * A material has to be visible in the PALETTE, not only in the component.
   *
   * This is the thing the first Liquid Glass pass got wrong, and it is worth
   * writing down because it is invisible from inside `GlassSurface.tsx`, where
   * every fix looks like it worked. `GlassSurface` is rendered in **ten**
   * places in this app — the music player and two spots on Home. **Ninety-eight**
   * surfaces instead write `backgroundColor: colors.card, borderColor:
   * colors.border` by hand. So the entire bevel, the specular, the
   * counter-rim and the AGSL shader were reaching about a tenth of the screen,
   * and "Liquid Glass" was, everywhere else, a dark palette with a hairline so
   * dim you could not find it.
   *
   * The answer is not to put a rim round all ninety-eight — a rim on every
   * list row is exactly what `bevel` is documented not to be for, and it would
   * undo the distinction the hero surfaces draw. The answer is that the two
   * derived values every one of those surfaces already reads should say what
   * material this is.
   *
   * So under glass the border is lit rather than merely present, and an
   * elevated surface separates more. A lit edge on a card is most of what the
   * eye reads as glass at a glance, and it costs nothing anywhere: it is one
   * mix factor, on a colour the whole app already asks for.
   */
  const glass = material === 'glass';

  return {
    background: custom.background,
    card: custom.card,
    cardElevated: mix(custom.card, custom.text, glass ? 0.11 : 0.08),
    muted: mix(custom.card, custom.text, 0.08),
    border: mix(custom.card, custom.text, glass ? 0.26 : 0.18),
    text: custom.text,
    textMuted: mix(custom.text, custom.background, 0.38),
    primary: custom.text,
    primaryText: custom.background,
    ...hues,
    fuchsia: custom.accent,
    accent: custom.accent,
    onAccent: onColor(custom.accent),
    ...semantic,
    monochrome: custom.monochrome === true,
    material,
    /**
     * Clamped here rather than trusted from the caller, because this value
     * arrives from a slider and from storage, and a stored 0.9 from some
     * future version would otherwise quietly make the app unreadable.
     */
    translucency:
      material === 'glass'
        ? Math.max(0, unclamped ? translucency : Math.min(MAX_TRANSLUCENCY, translucency))
        : 0,
  };
}

export function presetByKey(key: PresetKey): Preset | undefined {
  return PRESETS.find(p => p.key === key);
}
