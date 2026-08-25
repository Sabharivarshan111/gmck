import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/theme/motion';
import { typeScale } from '@/theme/typography';

interface WaveformRiverProps {
  active?: boolean;
  color?: string;
  height?: number;
}

let seq = 0;

/** One tile of the wave, in viewBox units. The strip draws two of them. */
const TILE = 360;
const DRIFT_MS = 2600;

/**
 * The wave, sampled once.
 *
 * Every component period divides TILE, so `wave(x + TILE) === wave(x)` and two
 * copies laid side by side meet without a seam — which is what lets the whole
 * strip be *translated* rather than redrawn.
 */
function wavePath(height: number): string {
  const mid = height / 2;
  const amp = Math.min(14, height * 0.27);
  const points: string[] = [];
  for (let x = 0; x <= TILE * 2; x += 6) {
    const t = (x / TILE) * Math.PI * 2;
    const y =
      mid +
      Math.sin(t) * amp +
      Math.sin(t * 2 + 1.2) * amp * 0.45 +
      Math.sin(t * 3 + 0.4) * amp * 0.22;
    points.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(2)}`);
  }
  return points.join(' ');
}

/**
 * The "listening" visualiser under the composer.
 *
 * A **static** path that is translated, not a path recomputed per frame. The
 * first version advanced a `useState` from `requestAnimationFrame`, which is a
 * React re-render and a fresh path string sixty times a second — on the JS
 * thread, on a cheap phone, while the speech recogniser is already running on
 * it. Translating a drawn path is a transform: it composites on the GPU, runs
 * on the native driver, and re-renders nothing.
 *
 * The breathing is `scaleY` for the same reason. It is anchored at the centre,
 * which is where the wave's own midline sits, so the strip swells about its
 * axis rather than drifting off it.
 */
export function WaveformRiver({ active = true, color = '#22d3ee', height = 52 }: WaveformRiverProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  // Unique per instance: a fixed id collides the moment two of these are ever
  // on screen together, and an SVG paint server is resolved by id document-wide.
  const gradientId = useMemo(() => {
    seq += 1;
    return `waveRiver${seq}`;
  }, []);

  const path = useMemo(() => wavePath(height), [height]);
  /*
   * The strip is measured rather than sized in percent, because the translate
   * has to be *exactly* one tile and a transform is in dp. Sliding by a
   * percentage of something else, or by the viewBox's own 360, lands the second
   * copy a few pixels off and the loop shows a seam every couple of seconds.
   */
  const [width, setWidth] = useState(0);

  const drift = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const running = active && !reduceMotion && width > 0;

  useEffect(() => {
    if (!running) {
      drift.setValue(0);
      breathe.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(drift, {
          toValue: 1,
          duration: DRIFT_MS,
          // Linear: a drift that eases is a drift that visibly restarts.
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(breathe, {
            toValue: 1,
            duration: DRIFT_MS / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breathe, {
            toValue: 0,
            duration: DRIFT_MS / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, drift, running]);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  // Never from 0 — nothing in this app scales from nothing.
  const scaleY = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });

  return (
    <View
      style={[styles.container, { height, backgroundColor: colors.card, borderColor: colors.border }]}
      // One sentence, not three fragments. It is decoration over a state the
      // screen already announces, so it says what it means and nothing more.
      accessibilityRole="image"
      accessibilityLabel="Listening"
      onLayout={event => {
        const next = Math.round(event.nativeEvent.layout.width);
        setWidth(previous => (previous === next ? previous : next));
      }}>
      <Animated.View
        style={[styles.strip, { width: width * 2, transform: [{ translateX }, { scaleY }] }]}>
        <Svg width={width * 2} height={height} viewBox={`0 0 ${TILE * 2} ${height}`}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color} stopOpacity="0.05" />
              <Stop offset="0.7" stopColor={color} stopOpacity="0.24" />
              <Stop offset="1" stopColor={color} stopOpacity="0.52" />
            </LinearGradient>
          </Defs>
          <Path d={`${path} L ${TILE * 2} ${height} L 0 ${height} Z`} fill={`url(#${gradientId})`} />
          <Path d={path} stroke={color} strokeWidth="1.8" fill="none" />
        </Svg>
      </Animated.View>

      <View style={styles.badgeRow}>
        <View style={[styles.liveDot, { backgroundColor: color }]} />
        <Text style={[typeScale.caption, styles.liveLabel, { color }]}>LISTENING…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strip: {
    // Written out rather than spread from StyleSheet.absoluteFill, which is a
    // registered style *id* — a number — so spreading it contributes nothing
    // and the strip silently lays out in flow. `right` is deliberately absent:
    // the width is set, and pinning both edges would override it.
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    // Anchored centre, so the breathing swells about the wave's own midline.
    transformOrigin: 'center',
  },
  badgeRow: {
    position: 'absolute',
    top: 6,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveLabel: {
    fontWeight: '700',
    letterSpacing: 1,
  },
});
