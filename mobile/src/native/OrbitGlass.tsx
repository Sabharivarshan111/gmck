import React from 'react';
import {
  Platform,
  UIManager,
  requireNativeComponent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * The AGSL glass pane, when the phone has one.
 *
 * ## The gate, and why each half of it is there
 *
 * **Android 13.** `RuntimeShader` — programmable fragment shaders — arrived in
 * API 33. `minSdkVersion` here is 24, so most of the phones this app is for
 * may well not have it, and the answer for them is the drawn bevel
 * `GlassSurface` paints underneath. That is not a degraded mode bolted on
 * afterwards; it is the same card, without one extra layer over it.
 *
 * **A wallpaper.** This is the half that looks like a restriction and is
 * physics: a shader refracts what is behind it, and behind a card in this app
 * is either the reader's wallpaper or a flat theme colour. Refracting a flat
 * colour gives back a flat colour. Without a picture there is nothing for the
 * effect to be made of, and mounting it anyway would cost a full-screen bitmap
 * to produce an image identical to the one already on screen.
 *
 * It is also the only condition under which the capture is *honest*. What the
 * shader samples is a still, taken once; the wallpaper is genuinely still, and
 * the things that move — the cards, the lists — are its siblings rather than
 * part of it. Point this at a scrolling background and it would show a frozen
 * picture of it.
 *
 * **The component existing at all.** `hasViewManagerConfig` rather than an
 * assumption, for the reason the sound module exists as a cautionary tale in
 * this codebase: a native thing that is silently absent looks exactly like a
 * native thing that is quietly doing nothing.
 */

export interface OrbitGlassProps {
  style?: StyleProp<ViewStyle>;
  /** Must match the surface's own radius, or the corner refracts off-centre. */
  cornerRadius?: number;
  /** How far the rim bends what is behind it, as a fraction of the short side. */
  refraction?: number;
  /** How far apart the three channels are pushed. Colour fringing at the edge. */
  chromatic?: number;
  /** Fresnel brightness on the rim. */
  edgeGlow?: number;
  /** The theme's wash, mixed inside the shader rather than laid over it. */
  tint?: string;
  /** Bump to force a re-capture — a new wallpaper, and nothing else so far. */
  revision?: number;
}

/**
 * Whether this device can draw it.
 *
 * Read once. `Platform.Version` is the API level on Android and the flag
 * cannot change while the app is running.
 */
export const GLASS_SHADER_AVAILABLE: boolean =
  Platform.OS === 'android' &&
  typeof Platform.Version === 'number' &&
  Platform.Version >= 33 &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof (UIManager as any).hasViewManagerConfig === 'function' &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  !!(UIManager as any).hasViewManagerConfig('OrbitGlass');

const NativeOrbitGlass = GLASS_SHADER_AVAILABLE
  ? requireNativeComponent<OrbitGlassProps>('OrbitGlass')
  : null;

export function OrbitGlass(props: OrbitGlassProps) {
  if (!NativeOrbitGlass) {
    return null;
  }
  return <NativeOrbitGlass {...props} />;
}
