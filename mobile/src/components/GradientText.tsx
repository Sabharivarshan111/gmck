import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { FONT_FAMILY } from '@/theme/typography';
import { useReducedMotion } from '@/theme/motion';

let seq = 0;

/**
 * The sweep, as gradient stops.
 *
 * Six stops ending on the colour it starts with, so the band can be slid by
 * exactly its own width and land where it began — that is what makes a loop
 * with no seam in it. Change the first colour and you must change the last.
 */
const SHIMMER = ['#ff2e97', '#ff8a00', '#ffe600', '#00ffd5', '#5d6bff', '#ff2e97'];

/*
 * Fourteen seconds, not the six it started at. A heading that is *always*
 * moving has to move slowly enough to sit behind the reading rather than
 * compete with it — at six it read as an effect, which is the wrong amount of
 * attention for a title.
 */
const SWEEP_MS = 14000;

/**
 * Roughly how wide one character is, as a fraction of the font size.
 *
 * Bold Roboto, mixed case, averaged over the subject names in the bank. It is
 * an estimate and it is allowed to be: it only decides how far the size steps
 * down, and `textLength` below is what actually guarantees the fit.
 */
const AVG_ADVANCE = 0.58;

/**
 * How small a heading may get before shrinking stops being the right answer.
 *
 * Past this the title is no longer the biggest thing on the screen and stops
 * reading as a heading at all; the tracking clamp takes over instead.
 */
const MIN_SIZE = 15;

/**
 * react-native-svg's props go through the Animated bridge like any other, so
 * the gradient's x-coordinates can be interpolated directly. Nothing about
 * this can use the native driver — the native driver only handles transform
 * and opacity — which is why the sweep is slow and why it stops the moment it
 * is not being looked at.
 */
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * A heading with an iridescent sweep running through the letters.
 *
 * Drawn as SVG text filled with a moving gradient, which is the only way to
 * clip a gradient to glyphs without a masking library. One rendering path, on
 * every platform: the previous version branched to a `<div>`/`<h1>` with a CSS
 * animation on web, so the preview harness shimmered while the phone showed a
 * still rainbow — and the harness is the thing we check against.
 */
export function GradientText({
  children,
  size = 24,
  weight = '800',
  letterSpacing = 0,
  align = 'center',
}: {
  children: string;
  size?: number;
  weight?: string;
  letterSpacing?: number;
  align?: 'center' | 'left';
}) {
  const id = useMemo(() => {
    seq += 1;
    return `gt${seq}`;
  }, []);

  const reduceMotion = useReducedMotion();
  // Same rule the subject cards' foil follows: a decoration that animates
  // forever must stop when its screen is not the one on top. Otherwise every
  // heading ever mounted is still driving the JS thread from behind whatever
  // the reader is actually looking at.
  const focused = useIsFocused();
  const running = focused && !reduceMotion;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!running) {
      // Parked at the start rather than wherever it happened to be, so a
      // heading looks the same every time it comes back.
      progress.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: SWEEP_MS,
        // Linear on purpose. An eased sweep speeds up and slows down in the
        // middle of a loop that has no beginning, which reads as a stutter.
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, running]);

  /*
   * SVG text does not wrap and does not shrink.
   *
   * That is the whole bug this measurement exists for: at a fixed 24px,
   * "Obstetrics & Gynaecology" is wider than the header it sits in, and
   * because it is centred it overflowed BOTH edges — the first letter
   * disappeared under the back button and the last one off the right of the
   * screen. It looked like the text was broken; it was drawn correctly and
   * simply did not fit.
   *
   * `width: '100%'` on the wrapper made this invisible to every layout check,
   * because the wrapper was always exactly the right size. Only the glyphs
   * overflowed it.
   */
  const [box, setBox] = useState(0);
  const estimated = size * AVG_ADVANCE * children.length;
  const fits = box === 0 || estimated <= box;
  /** Step the size down towards the box, but never below a heading's floor. */
  const fitted = fits ? size : Math.max(MIN_SIZE, Math.floor((box / estimated) * size));
  /*
   * And a hard stop for the one case shrinking cannot solve.
   *
   * `textLength` forces the string to exactly this width — which means it
   * STRETCHES text that is narrower as readily as it tightens text that is
   * wider. Applying it whenever the title did not fit at full size was wrong
   * for that reason: the shrink had already made it fit, and the clamp then
   * pulled the letters back out to the full width of the header. It is only
   * correct once the size has bottomed out at the floor and the string is
   * still too wide, and then `lengthAdjust="spacing"` spends the difference on
   * the gaps rather than on the glyphs — squashing the letters themselves is
   * the option that looks cheap.
   */
  const clamp = !fits && fitted <= MIN_SIZE ? box : undefined;

  const height = Math.round(size * 1.35);

  /*
   * The band is two widths wide and slides one width left. Because the last
   * stop repeats the first, the frame it ends on is identical to the frame it
   * started on, so the loop has no visible jump.
   */
  const x1 = progress.interpolate({ inputRange: [0, 1], outputRange: ['-100%', '0%'] });
  const x2 = progress.interpolate({ inputRange: [0, 1], outputRange: ['100%', '200%'] });

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(event: LayoutChangeEvent) => setBox(event.nativeEvent.layout.width)}>
      <Svg width="100%" height={height}>
        <Defs>
          <AnimatedLinearGradient id={id} x1={x1} y1="0" x2={x2} y2="0">
            {SHIMMER.map((color, index) => (
              <Stop
                key={color + String(index)}
                offset={String(index / (SHIMMER.length - 1))}
                stopColor={color}
              />
            ))}
          </AnimatedLinearGradient>
        </Defs>
        <SvgText
          x={align === 'center' ? '50%' : '0'}
          // Baseline follows the size the text is actually drawn at, or a
          // shrunken title sits high in a box built for the full one.
          y={fitted}
          fontSize={fitted}
          textLength={clamp}
          lengthAdjust="spacing"
          // Roboto by name, not "sans-serif". React Native follows the system
          // font and OEM skins replace it — MIUI ships MiSans, One UI ships
          // SamsungOne — so a heading left to the default is re-typeset on
          // those phones while the text beside it is not.
          fontFamily={FONT_FAMILY}
          fontWeight={weight}
          letterSpacing={letterSpacing}
          textAnchor={align === 'center' ? 'middle' : 'start'}
          fill={`url(#${id})`}>
          {children}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
});
