import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/theme/motion';
import { onMicLevel } from '@/lib/speech';
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
 * The **amplitude is the microphone**, not a timer. Android's RecognitionListener
 * hands us a level several times a second while dictation runs; the module used
 * to discard it in an empty `onRmsChanged`, which is why this reacted to nothing
 * on a phone while the browser preview — which had its own Web Audio
 * implementation — looked perfect. The one place it worked was the one place it
 * did not ship.
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
  /**
   * How loud it is, 0..1, smoothed.
   *
   * This is the real microphone, not a timer. Android's RecognitionListener
   * delivers a level several times a second while the recogniser runs and the
   * native module now forwards it; before that this component had no audio
   * input at all and merely breathed on a loop, which is why it ignored the
   * voice it was drawn for.
   */
  const level = useRef(new Animated.Value(0)).current;
  const running = active && !reduceMotion && width > 0;

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    let last = 0;
    const stop = onMicLevel(next => {
      /*
       * Smoothed towards the new value rather than snapped to it. The raw
       * signal is spiky enough to make the wave jitter, and an attack that is
       * faster than the decay is what makes a voice read as a voice: it should
       * jump when you start speaking and settle when you stop, not flutter.
       */
      const rising = next > last;
      last = last + (next - last) * (rising ? 0.5 : 0.12);
      // No native driver: this drives a transform, but it is set from JS on
      // every sample rather than interpolated over time, so there is nothing
      // for the native driver to run.
      level.setValue(last);
    });
    return () => {
      stop();
      level.setValue(0);
    };
  }, [active, level]);

  useEffect(() => {
    if (!running) {
      drift.setValue(0);
      return undefined;
    }
    /*
     * Only the drift loops now. The swell used to come from a second timed
     * animation, which is what made this look alive while ignoring the
     * microphone entirely — amplitude is the voice, and it arrives from
     * onMicLevel above.
     */
    const loop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: DRIFT_MS,
        // Linear: a drift that eases is a drift that visibly restarts.
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, running]);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });
  /*
   * Amplitude is the voice. Silence still shows a living line rather than a flat
   * one — a wave that collapses to nothing reads as "the microphone is broken"
   * rather than "nobody is speaking" — so the floor is 0.35 and never 0.
   */
  const scaleY = level.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1.15],
    extrapolate: 'clamp',
  });

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
      {/*
        Two nested views, one transform each, and that is not a style choice.
        `translateX` runs on the native driver and `scaleY` is set from JS on
        every microphone sample; React Native throws the moment a JS-driven and
        a native-driven value share one `transform` array ("Attempting to run
        JS driven animation on an animated node that has been moved to native").
        Nesting keeps the endless drift on the GPU where it belongs and lets the
        amplitude stay on the thread that receives it.
      */}
      <Animated.View style={[styles.strip, { width: width * 2, transform: [{ translateX }] }]}>
        <Animated.View style={[styles.swell, { transform: [{ scaleY }] }]}>
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
  // Fills the strip, so the swell scales the drawing and nothing else.
  swell: {
    flex: 1,
    transformOrigin: 'center',
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
