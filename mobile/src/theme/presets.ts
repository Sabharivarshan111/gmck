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
export type PresetKey = 'dark' | 'light' | 'blackpink' | 'liquidglass' | 'custom' | 'system';

/**
 * How surfaces are drawn, as opposed to what colour they are.
 *
 * `solid` is an opaque card with a hairline border — what every theme here
 * used before. `glass` is Apple's Liquid Glass treatment: a translucent layer
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
  palette?: CustomPalette;
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
    key: 'blackpink',
    name: 'Black Pink',
    palette: { background: '#000000', text: '#FFFFFF', accent: '#FF2D78', card: '#141017' },
  },
  {
    key: 'liquidglass',
    name: 'Liquid Glass',
    /**
     * Modelled on Apple's Liquid Glass (iOS 26), within what React Native can
     * honestly draw. What the material actually is, and what survives the
     * port:
     *
     *   • **Translucency over an opaque fill.** Glass shows what is behind it.
     *     The card is a white wash at partial alpha rather than a solid, so
     *     the background reads through it and two stacked surfaces visibly
     *     differ in depth rather than just in lightness.
     *   • **A specular highlight on the lit edge.** The single most
     *     identifiable feature: a bright hairline along the top, fading down
     *     the sides, as if a light source sits above the screen. Drawn as a
     *     gradient rim in GlassSurface.
     *   • **Concentric radii and float.** Larger corners and a soft shadow, so
     *     a panel reads as sitting above the page rather than cut into it.
     *   • **A deep, cool ground.** Glass has no colour of its own; it takes it
     *     from what is behind, so it needs something behind it with contrast
     *     to spare.
     *
     * This preset used to be near-white — `#EAEFF6` behind a `#FFFFFF` card —
     * on the reasoning that a bright ground is what lets translucency read,
     * because over black a *white wash* at 60% is just a grey card. That
     * reasoning was sound for the material at the time and is obsolete now:
     * the wash is the theme's own card colour rather than white, and what
     * carries the effect is the bevel GlassSurface draws, not the fill.
     *
     * What the old palette actually produced was a white card four per cent
     * lighter than the page it sat on, with a white rim on top of that —
     * three near-identical whites, which is a surface with nothing to show
     * through it and no edge you can find. Apple demonstrates this material
     * over photographs and saturated colour for the same reason.
     *
     * So: a near-black with a blue cast, a slate card that is visibly a layer
     * above it, and an accent bright enough to hold its own against both.
     * `theme` is derived from the background's luminance, so the status bar,
     * the navigator and the moon icon follow this without being told.
     *
     * What still does NOT survive: real refraction and background blur. Both
     * need a backdrop filter, which React Native has no equivalent for
     * without a native module. The Android shader libraries that do it draw
     * nothing below Android 13 and sample a one-off bitmap snapshot of the
     * background, which is stale the moment anything scrolls — so this stays
     * a drawn bevel rather than an imitation of refraction. See
     * .claude/skills/apple-design/README.md, where "no backdrop blur" is
     * recorded as a deliberate departure.
     *
     * Text stays near-white: "glass" is a surface treatment, never a licence
     * for grey-on-grey type.
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
  custom: CustomPalette,
  material: Material = 'solid',
  translucency: number = material === 'glass' ? DEFAULT_TRANSLUCENCY : 0,
  /** Skips the ceiling. Only scripts/glass-check.mjs passes this. */
  unclamped = false,
) {
  const dark = isDark(custom.background);
  const semantic = dark ? SEMANTIC_DARK : SEMANTIC_LIGHT;
  const hues = dark ? HUES_DARK : HUES_LIGHT;

  return {
    background: custom.background,
    card: custom.card,
    cardElevated: mix(custom.card, custom.text, 0.08),
    muted: mix(custom.card, custom.text, 0.08),
    border: mix(custom.card, custom.text, 0.18),
    text: custom.text,
    textMuted: mix(custom.text, custom.background, 0.38),
    primary: custom.text,
    primaryText: custom.background,
    ...hues,
    fuchsia: custom.accent,
    accent: custom.accent,
    onAccent: onColor(custom.accent),
    ...semantic,
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
