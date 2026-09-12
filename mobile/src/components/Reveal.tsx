import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';

/**
 * A block that grows in under the control that opened it.
 *
 * ## Why the height is measured rather than guessed
 *
 * Animating to a fixed height means picking a number, and the number is wrong
 * the moment the content or the reader's text size changes. So the body is
 * laid out once, its height recorded, and the wrapper animates to that.
 *
 * **Opening waits for the measurement; closing never does** — the card on
 * screen has already been measured, and waiting on a re-measure would stall
 * the close for a frame.
 *
 * ## It grows, it does not appear
 *
 * Two animations in parallel, and both are needed. The wrapper's HEIGHT is a
 * layout property, so it runs on the JS thread with `useNativeDriver: false`;
 * that is what pushes the content below it down rather than drawing over it.
 * The body's opacity and transform are composited, so they run native. A
 * single opacity fade would make the card appear on top of whatever is under
 * it, which is what "it just pops in" looks like.
 *
 * Nothing scales from 0: the body enters at 0.94, per the house rule.
 *
 * ## Extracted, rather than written twice
 *
 * The music player on the Timer had this logic inline. The exam pill needs the
 * identical behaviour, and two copies of an animation is how three components
 * ended up quoting the same stale measurement at each other in this repo
 * before. `check:music` drives the real music player and asserts the card
 * "grew rather than appeared", so it guards this for both callers.
 */
export function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [measured, setMeasured] = useState(0);
  const grow = useRef(new Animated.Value(open ? 1 : 0)).current;
  const enter = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
    if (reduceMotion) {
      grow.setValue(open ? 1 : 0);
      enter.setValue(open ? 1 : 0);
      if (!open) {
        setMounted(false);
      }
      return;
    }
    if (open && measured === 0) {
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(grow, {
        toValue: open ? 1 : 0,
        duration: open ? DURATION.slow : DURATION.base,
        easing: EASE.drawer,
        useNativeDriver: false,
      }),
      Animated.timing(enter, {
        toValue: open ? 1 : 0,
        duration: open ? DURATION.slow : DURATION.fast,
        easing: EASE.out,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished && !open) {
        setMounted(false);
      }
    });
    return () => animation.stop();
  }, [enter, grow, measured, open, reduceMotion]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.reveal,
        measured > 0
          ? { height: grow.interpolate({ inputRange: [0, 1], outputRange: [0, measured] }) }
          : null,
      ]}>
      <Animated.View
        onLayout={event => setMeasured(event.nativeEvent.layout.height)}
        style={[
          styles.body,
          {
            opacity: enter,
            transform: [
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
              { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
            ],
          },
        ]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  reveal: { overflow: 'hidden' },
  body: { width: '100%' },
});

/** Exported for the callers that still lay their own body out. */
export const RevealSpacer = View;
