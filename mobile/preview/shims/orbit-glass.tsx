/**
 * Dev-only stand-in for the OrbitGlass native view.
 *
 * Reports **absent**, and that is the honest answer rather than a shortcut:
 * the harness is react-native-web in a desktop browser, there is no
 * `RuntimeShader` and no Android version to check, so a shim that pretended
 * otherwise would be showing a reviewer an effect no device would produce.
 *
 * What this does test is the branch that matters most — the one every phone
 * below Android 13 takes. With the component absent, `GlassSurface` must draw
 * a finished card from its own fill and bevel, and `check:smoke` and the
 * screenshots walk exactly that.
 */
import React from 'react';

export const GLASS_SHADER_AVAILABLE = false;

export function OrbitGlass(): React.ReactElement | null {
  return null;
}
