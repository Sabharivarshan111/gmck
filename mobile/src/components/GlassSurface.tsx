import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme, withAlpha } from '@/theme';
import { radius } from '@/theme/tokens';

/**
 * A card surface that knows whether the theme is solid or glass.
 *
 * Under `solid` it is what it always was: an opaque card with a hairline
 * border. Under `glass` it becomes Apple's Liquid Glass treatment, as far as
 * React Native can honestly take it.
 *
 * ## What actually makes it read as glass
 *
 * Not the blur. The reference this was rebuilt against — kokonutui's Liquid
 * Glass card — runs an SVG `feDisplacementMap` through a CSS `backdrop-filter`,
 * and over the flat page it is shown on, **that filter changes almost nothing
 * you can see**. What carries the whole effect is its shadow stack, and every
 * load-bearing entry in it is an *inset*: a faint rim at the top-left, a much
 * brighter one at the bottom-right, a thin bright line all the way round, and
 * a soft white glow spreading inwards from the edge.
 *
 * That is a bevel, and a bevel is drawable. It is what this component now
 * draws, in the order the eye reads it:
 *
 * **1. The rim.** A stroked rounded rect whose gradient runs corner to corner:
 * bright where the light lands, dim across the middle, brightest on the far
 * edge where the pane's thickness catches it. A flat border of one colour is
 * what a piece of glass never looks like, and drawing one is what made this
 * surface read as a pale card before.
 *
 * **2. The specular highlight.** A bright wash along the top edge fading to
 * nothing, as if a light sits above the screen.
 *
 * **3. The inner glow.** White at the rim falling off inwards, elliptical so
 * it follows the surface's own proportions rather than pooling in the middle
 * of a wide card. This is the `inset 0 0 6px 6px` entry, and it is what stops
 * the interior looking like flat paint inside a bright outline.
 *
 * **4. Translucency and float.** The fill is a wash at partial alpha so the
 * page reads through, over a soft shadow so the pane sits above the page
 * rather than being cut into it.
 *
 * Still deliberately missing: the backdrop blur and the edge lensing. Both
 * need a real backdrop filter, React Native has none without a native module,
 * and a lighter rectangle pretending to be a blur is exactly what makes an
 * imitation look cheap. If `react-native-blur` is ever added, this is the one
 * component that changes.
 *
 * The rim is drawn with react-native-svg — already a dependency — and is
 * `pointerEvents="none"`, so it never intercepts a tap meant for the content.
 * It is also **measured**: a stroke has width, and a rect at `100%` would push
 * half of that width past the edge, where the parent's clip would remove
 * precisely the brightest part of the bevel.
 */
export function GlassSurface({
  children,
  style,
  /** Raised surfaces sit brighter, the way a nearer pane catches more light. */
  elevated = false,
  borderRadius = radius.lg,
  bevel = false,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  borderRadius?: number;
  /**
   * Draw the glass bevel even under a solid theme.
   *
   * The material and the *fill* are separable: what makes the reference card
   * read as glass is its lit rim and inner glow, and those sit just as well on
   * an opaque dark card as on a translucent one — the picture it comes from is
   * a solid near-black card with a bright bevel on it. Translucency still
   * belongs to the theme, so a solid theme keeps its own card colour and gains
   * only the light.
   *
   * For the one or two surfaces that are *about* being glass. Turning it on
   * everywhere would put a rim round every list row in the app and undo the
   * distinction it exists to draw.
   */
  bevel?: boolean;
}) {
  const { colors, theme } = useTheme();
  const glass = colors.material === 'glass';
  const lit = glass || bevel;
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize(current =>
      Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5
        ? current
        : { width, height },
    );
  };

  if (!lit) {
    return (
      <View
        style={[
          {
            backgroundColor: elevated ? colors.cardElevated : colors.card,
            borderColor: colors.border,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius,
          },
          style,
        ]}>
        {children}
      </View>
    );
  }

  /*
   * The rim is thin on a small control and thicker on a card. A 1.5dp bevel
   * around a 34dp button is a ring; the same ring around a full-width card is
   * a hairline nobody sees.
   */
  /*
   * The bevel is drawn in the ink the surface is *not*.
   *
   * White, on a dark pane, is the highlight the reference draws in dark mode.
   * On a light one it is invisible — a white rim on a white card over a pale
   * page is nothing at all, which is exactly what this surface looked like
   * before — so a light theme gets the same bevel in near-black, which is what
   * the reference itself switches to in light mode. The alphas are lower
   * because dark ink on a light ground carries much further than the reverse.
   */
  const dark = theme === 'dark';
  const ink = dark ? '#FFFFFF' : '#0B1B33';
  const a = (onDark: number, onLight: number) => String(dark ? onDark : onLight);

  const rim = borderRadius >= radius.lg ? 1.6 : 1.2;
  const inset = rim / 2;
  const width = Math.max(size.width - rim, 0);
  const height = Math.max(size.height - rim, 0);
  const drawable = width > 1 && height > 1;
  // A unique-enough suffix so two surfaces on one screen cannot share a
  // gradient id — SVG defs are document-global, and the second surface would
  // otherwise silently take the first one's geometry.
  const key = `${Math.round(size.width)}x${Math.round(size.height)}r${borderRadius}`;
  /*
   * The specular is a *hairline*, and its length is measured in dp rather than
   * in a fraction of the surface.
   *
   * As a fraction it scaled with the card: a third of the way down a 200dp
   * player is 66dp of white wash, which turns a near-black card grey and reads
   * as fog rather than as a lit edge. The reference's card is almost pure
   * black and glows only at its edges. Capped in dp, a button and a card get
   * the same thin line of light, which is what a single light source above the
   * screen would actually put there.
   */
  const specular = Math.min(size.height * 0.5, 20);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.glass,
        {
          // The wash, not the colour. Alpha is what lets the page read
          // through, and how much is now the theme's to say — a custom theme
          // with a wallpaper behind it has something worth showing, which is
          // the one thing four picked colours could never tell us.
          //
          // Elevated surfaces let less through rather than more: they are
          // nearer the front, and a hierarchy where the top layer is the most
          // see-through reads as a mistake.
          // Translucency is the theme's, not the bevel's: a solid theme asked
          // for an opaque card and gets one, with the light drawn over it.
          backgroundColor: glass
            ? withAlpha(colors.card, 1 - colors.translucency * (elevated ? 0.72 : 1))
            : elevated
              ? colors.cardElevated
              : colors.card,
          borderRadius,
        },
        style,
      ]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}>
        {drawable ? (
          <Svg width={size.width} height={size.height}>
            <Defs>
              <LinearGradient
                id={`spec${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2={specular}
                gradientUnits="userSpaceOnUse">
                {/* Bright at the lit edge, gone within a couple of
                    millimetres — light falls off fast on a curved rim. */}
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={a(0.5, 0.85)} />
                <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={a(0.1, 0.28)} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
              {/* The bevel. Dim across the middle and brightest at the far
                  corner: the near edge catches the light, the far edge is lit
                  *through* the pane's thickness, which is the brighter of the
                  two and the detail that says "this has depth". */}
              <LinearGradient id={`rim${key}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={ink} stopOpacity={a(0.62, 0.28)} />
                <Stop offset="0.4" stopColor={ink} stopOpacity={a(0.16, 0.07)} />
                <Stop offset="0.72" stopColor={ink} stopOpacity={a(0.24, 0.1)} />
                <Stop offset="1" stopColor={ink} stopOpacity={a(0.95, 0.42)} />
              </LinearGradient>
              {/* Inner glow: nothing in the middle, white by the edge. Sized
                  to the surface, so a wide card glows along its long edges
                  instead of pooling into a circle in the centre. */}
              <RadialGradient
                id={`glow${key}`}
                cx={size.width / 2}
                cy={size.height / 2}
                rx={size.width / 2}
                ry={size.height / 2}
                gradientUnits="userSpaceOnUse">
                <Stop offset="0.55" stopColor={ink} stopOpacity="0" />
                <Stop offset="0.88" stopColor={ink} stopOpacity={a(0.03, 0.025)} />
                <Stop offset="1" stopColor={ink} stopOpacity={a(0.1, 0.07)} />
              </RadialGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={size.width}
              height={size.height}
              rx={borderRadius}
              fill={`url(#spec${key})`}
            />
            <Rect
              x="0"
              y="0"
              width={size.width}
              height={size.height}
              rx={borderRadius}
              fill={`url(#glow${key})`}
            />
            <Rect
              x={inset}
              y={inset}
              width={width}
              height={height}
              rx={Math.max(borderRadius - inset, 0)}
              fill="none"
              stroke={`url(#rim${key})`}
              strokeWidth={rim}
            />
          </Svg>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    // Float. Glass has no weight of its own; the shadow is what says it is a
    // pane above the page rather than a panel set into it. The rim above is
    // the whole border now — a flat `borderWidth` under a drawn bevel reads as
    // a second, wrong outline.
    elevation: 6,
    shadowColor: '#0B1B33',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
});
