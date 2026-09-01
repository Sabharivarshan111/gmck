import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import { onColor, withAlpha } from '@/theme/color';
import { radius, space } from '@/theme/tokens';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';

/**
 * A question row to practise on, inside the walkthrough card.
 *
 * The three gestures a question responds to are the least discoverable thing
 * in the app and the most worth knowing, and there is no way to *tell*
 * somebody a triple tap in a sentence they will remember. So they do it once,
 * here, on a question that is not real: nothing is ticked, no XP is earned, no
 * request is sent.
 *
 * A rehearsal rather than the real thing on purpose. Spotlighting an actual
 * row would mean driving the reader three screens into the bank on their first
 * launch, landing them on an arbitrary chapter, and having a stray triple tap
 * fire a real generation. This is one card, in place, and the gesture they
 * learn is the same gesture.
 *
 * ## The timing is the real timing
 *
 * `TAP_WINDOW_MS` is 380 here because it is 380 in `QuestionRow`. If this
 * rehearsed a 250ms window the reader would learn a rhythm that then failed on
 * the actual list, which is worse than not rehearsing — they would conclude
 * the feature was broken rather than that they had been taught wrong.
 * `check:tour` pins the two numbers together.
 */

/** Must match QuestionRow's window, or the rehearsal teaches the wrong rhythm. */
const TAP_WINDOW_MS = 380;

type Learned = 'ticked' | 'mcq' | 'note';

const SAID: Record<Learned, string> = {
  ticked: 'Ticked. On a real question that earns XP and fills your streak.',
  mcq: 'Double tap → practice MCQs on that question, in Ask AI.',
  note: 'Triple tap → a handwritten note answering that question.',
};

export function TourGestureDemo() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const [done, setDone] = useState(false);
  const [said, setSaid] = useState<Learned | null>(null);
  const [learned, setLearned] = useState<Set<Learned>>(new Set());

  const taps = useRef(0);
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const learn = useCallback((what: Learned) => {
    setSaid(what);
    setLearned(prev => (prev.has(what) ? prev : new Set(prev).add(what)));
  }, []);

  /**
   * The same dispatcher `QuestionRow` uses, deliberately.
   *
   * A third tap fires immediately rather than waiting out the window — waiting
   * would put a third of a second between the last tap and the response, which
   * reads as the app having missed it.
   */
  const onTap = useCallback(() => {
    const now = Date.now();
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    taps.current = now - lastTap.current > TAP_WINDOW_MS ? 1 : taps.current + 1;
    lastTap.current = now;

    if (taps.current >= 3) {
      taps.current = 0;
      learn('note');
      return;
    }
    timer.current = setTimeout(() => {
      if (taps.current === 2) {
        learn('mcq');
      }
      taps.current = 0;
      timer.current = null;
    }, TAP_WINDOW_MS);
  }, [learn]);

  const xp = useRef(new Animated.Value(0)).current;
  const onTick = useCallback(() => {
    setDone(current => !current);
    learn('ticked');
    if (reduceMotion) {
      return;
    }
    xp.setValue(0);
    Animated.timing(xp, {
      toValue: 1,
      duration: DURATION.slow,
      easing: EASE.out,
      useNativeDriver: true,
    }).start();
  }, [learn, reduceMotion, xp]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Touchable
          onPress={onTick}
          label={done ? 'Practice question, mark as not done' : 'Practice question, mark as done'}
          role="checkbox"
          state={{ checked: done }}
          scaleTo={0.86}
          hitSlop={10}
          style={[
            styles.tick,
            {
              borderColor: done ? colors.accent : colors.border,
              backgroundColor: done ? colors.accent : 'transparent',
            },
          ]}>
          {done ? <Check size={13} color={onColor(colors.accent)} /> : null}
        </Touchable>

        <Touchable
          onPress={onTap}
          label="Practice question. Double tap for MCQs, triple tap for a handwritten note"
          scale={false}
          dim
          style={styles.text}>
          <Text style={[typeScale.footnote, { color: colors.text }]}>
            Describe the boundaries and contents of the axilla.
          </Text>
        </Touchable>

        {/* The XP flies from the tick, as it does on a real row. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.xp,
            {
              opacity: xp.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: xp.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) },
              ],
            },
          ]}>
          <Text style={[typeScale.caption, { color: colors.success }]}>+XP</Text>
        </Animated.View>
      </View>

      <Text
        style={[typeScale.caption, styles.said, { color: said ? colors.text : colors.textMuted }]}
        // The line is a live result, so it is announced when it changes rather
        // than silently replaced under a screen reader.
        accessibilityLiveRegion="polite">
        {said
          ? SAID[said]
          : 'Tap the circle to tick it. Double tap the question. Then triple tap it.'}
      </Text>

      <View style={styles.pips}>
        {(['ticked', 'mcq', 'note'] as Learned[]).map(what => (
          <View
            key={what}
            style={[
              styles.pip,
              {
                backgroundColor: learned.has(what) ? colors.accent : withAlpha(colors.text, 0.14),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm, marginTop: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  xp: { position: 'absolute', left: space.md, top: space.sm },
  said: { minHeight: 32, lineHeight: 16 },
  pips: { flexDirection: 'row', gap: space.xs },
  pip: { width: 18, height: 3, borderRadius: radius.pill },
});
