import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Pattern, Rect, Stop } from 'react-native-svg';
import { Touchable } from '@/components/Touchable';
import { EASE, useReducedMotion } from '@/theme/motion';

let holoSeq = 0;

/** How far the card leans. Small: six of these tilt at once, in a grid. */
const TILT = 3.5;
/** One full there-and-back drift. Slow enough to read as light, not wobble. */
const PERIOD = 7000;
/** Offset between neighbouring cards, so the light crosses the grid. */
const STAGGER = 900;

export function HoloCard({
  from,
  to,
  bgImageUri,
  borderRadius = 16,
  borderColor,
  style,
  innerStyle,
  index = 0,
  label,
  onPress,
  disabled = false,
  children,
}: {
  from: string;
  to: string;
  bgImageUri?: string | null;
  borderRadius?: number;
  borderColor: string;
  /** The card's box in its parent: width, height. */
  style?: StyleProp<ViewStyle>;
  /** Everything inside the tilt: padding, border, radius. */
  innerStyle?: StyleProp<ViewStyle>;
  /** Position in the grid. Only used to stagger the drift. */
  index?: number;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const [width, setWidth] = useState(0);
  /** Reset per picture, so replacing a broken one is enough to try again. */
  const [bgFailed, setBgFailed] = useState(false);
  useEffect(() => {
    setBgFailed(false);
  }, [bgImageUri]);

  const ids = useMemo(() => {
    holoSeq += 1;
    return {
      base: `holoBase${holoSeq}`,
      grain: `holoGrain${holoSeq}`,
      sheen: `holoSheen${holoSeq}`,
    };
  }, []);

  // One oscillator per card, 0 ↔ 1, driving the lean and the sheen together.
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion || !focused) {
      drift.setValue(0);
      return;
    }
    const swing = (toValue: number) =>
      Animated.timing(drift, {
        toValue,
        duration: PERIOD / 2,
        // inOut, not the house `out`: this turns around at both ends rather
        // than arriving somewhere, and easing only one end reads as a twitch.
        easing: EASE.inOut,
        useNativeDriver: true,
      });
    const animation = Animated.sequence([
      Animated.delay(index * STAGGER),
      Animated.loop(Animated.sequence([swing(1), swing(0)]), {
        iterations: -1,
        // The sequence already returns the value to 0, and resetting would
        // snap it there a frame early.
        resetBeforeIteration: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [drift, focused, index, reduceMotion]);

  // The band is far wider than the card so it can leave the frame entirely at
  // both ends of the drift — a highlight that stops at the edge and turns
  // around in view is a rectangle, not a reflection.
  const band = width * 2.2;
  const sheenStyle = {
    width: band,
    transform: [
      {
        translateX: drift.interpolate({
          inputRange: [0, 1],
          outputRange: [-width * 1.4, width * 0.2],
        }),
      },
    ],
  };

  const tilt = reduceMotion
    ? undefined
    : {
        transform: [
          { perspective: 900 },
          {
            // Twice the frequency of the lean, so the two axes trace a figure
            // rather than a straight line back and forth.
            rotateX: drift.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [`${TILT * 0.6}deg`, `-${TILT * 0.6}deg`, `${TILT * 0.6}deg`],
            }),
          },
          {
            rotateY: drift.interpolate({
              inputRange: [0, 1],
              outputRange: [`-${TILT}deg`, `${TILT}deg`],
            }),
          },
        ],
      };

  const content = (
    <>
      {/* Custom user-uploaded background or default holographic gradient */}
      {bgImageUri && !bgFailed ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}>
          <Image
            source={{ uri: bgImageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            /*
             * A picture that will not load falls back to the card's own
             * gradient. The alternative is what shipped: the scrim drawn over
             * nothing, which is a black tile — indistinguishable from the app
             * being broken, and it is what a reader sees once Android has
             * emptied the cache the picker's file was sitting in.
             */
            onError={() => setBgFailed(true)}
          />
          {/* Dark glass overlay scrim so white text, emoji and progress bar have 100% contrast */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
            ]}
          />
        </View>
      ) : (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={ids.base} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={from} />
                <Stop offset="1" stopColor={to} />
              </LinearGradient>
              <Pattern
                id={ids.grain}
                width="5"
                height="5"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(25)">
                <Rect x="0" y="0" width="2" height="5" fill="#FFFFFF" opacity="0.05" />
              </Pattern>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${ids.base})`} />
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${ids.grain})`} />
          </Svg>
        </View>
      )}

      {reduceMotion || width === 0 ? null : (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}>
          <Animated.View
            renderToHardwareTextureAndroid
            style={[styles.sheen, sheenStyle]}>
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={ids.sheen} x1="0" y1="0.25" x2="1" y2="0.75">
                  <Stop offset="0" stopColor="#22D3EE" stopOpacity="0" />
                  <Stop offset="0.38" stopColor="#22D3EE" stopOpacity="0.55" />
                  <Stop offset="0.5" stopColor="#FF5CA8" stopOpacity="0.6" />
                  <Stop offset="0.62" stopColor="#7C5CFF" stopOpacity="0.55" />
                  <Stop offset="1" stopColor="#7C5CFF" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${ids.sheen})`} />
            </Svg>
          </Animated.View>
        </View>
      )}

      {children}
    </>
  );

  return (
    <Animated.View
      renderToHardwareTextureAndroid={!reduceMotion}
      style={[style, tilt]}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
      {disabled ? (
        <View style={[innerStyle, { borderColor }]}>{content}</View>
      ) : (
        <Touchable onPress={onPress} label={label} scaleTo={0.975} style={[innerStyle, { borderColor }]}>
          {content}
        </Touchable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    // No blend mode exists in React Native, so the band is a wash at partial
    // alpha. The web original dodges, which is brighter and cleaner; this is
    // as close as the platform gets without faking it.
    opacity: 0.34,
  },
});
