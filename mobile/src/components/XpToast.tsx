import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Trophy, Zap } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { onColor } from '@/theme/color';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';
import { isHydrated, subscribe } from '@/lib/progress';
import { milestoneFor, yearXp } from '@/lib/xp';
import { useProfile } from '@/hooks/useProfile';

/**
 * The `+N XP` card that appears when a question is ticked.
 *
 * The web app has toasted every tick since the XP system was built, and the
 * native app had no toast component at all — so on a phone, ticking a question
 * did nothing you could see except a checkbox filling, and the number it fed
 * only appeared if you walked to My Progress. That is why the reader's report
 * of the streak card was "I think it's fake": the XP arrived with no evidence
 * it had arrived.
 *
 * Mounted once at the app root, like the web's GlobalCelebrations, so it fires
 * on whichever screen the tick happened on.
 */

interface Shown {
  delta: number;
  milestone: { kind: 'badge' | 'level'; text: string } | null;
  /** Bumped on every fire so a rapid second tick restarts the dismiss timer. */
  seq: number;
}

const VISIBLE_FOR = 1600;

export function XpToast() {
  const { colors } = useTheme();
  // The year decides which questions count, so a change of year is a change of
  // baseline rather than a windfall — see the effect below.
  const { yearKey } = useProfile();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<Shown | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  /*
   * The baseline, and the reason it is a ref rather than state.
   *
   * It starts at -1 for "not known yet". Hydration loads every question ever
   * ticked in one go, and a baseline of 0 would read that as a single tick
   * worth several hundred XP and announce it. So the first value the store
   * reports after hydration is adopted silently, and only what happens after
   * that is a tick.
   */
  const previous = useRef(-1);
  const seq = useRef(0);

  useEffect(() => {
    previous.current = -1;
  }, [yearKey]);

  useEffect(() => {
    const read = () => {
      if (!isHydrated()) {
        return;
      }
      const now = yearXp(yearKey);
      const before = previous.current;
      previous.current = now;
      // First reading after hydration, or an untick. Neither is a tick.
      if (before < 0 || now <= before) {
        return;
      }
      seq.current += 1;
      setShown(current => ({
        // Ticking three rows quickly is one "+3 XP", not three cards fighting
        // for the same corner.
        delta: (current?.delta ?? 0) + (now - before),
        milestone: milestoneFor(before, now) ?? current?.milestone ?? null,
        seq: seq.current,
      }));
    };
    read();
    return subscribe(read);
    // Switching year re-baselines: second year's count is not third year's,
    // and the difference between them is not something anybody just earned.
  }, [yearKey]);

  useEffect(() => {
    if (!shown) {
      return;
    }
    /*
     * Timings, not a keyframe animation: this can fire twice in a second, and
     * a timing retargets from wherever the value currently is while a keyframe
     * restarts from zero. Only opacity and translateY move — both composite on
     * the GPU, which matters on a card that appears while a list is scrolling.
     */
    anim.stopAnimation();
    Animated.timing(anim, {
      toValue: 1,
      duration: DURATION.base,
      easing: EASE.out,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: DURATION.fast,
        easing: EASE.out,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShown(null);
        }
      });
    }, VISIBLE_FOR);
    return () => clearTimeout(timer);
  }, [shown, anim]);

  if (!shown) {
    return null;
  }

  const celebrating = shown.milestone !== null;
  const ink = celebrating ? onColor(colors.accent) : colors.text;

  return (
    <Animated.View
      // Never in the way of the next tick: this floats over a list people are
      // working down, and a card that eats a press is worse than no card.
      pointerEvents="none"
      style={[
        styles.wrap,
        { bottom: insets.bottom + 96 },
        {
          opacity: anim,
          transform: reduced
            ? []
            : [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
        },
      ]}>
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.card,
          celebrating
            ? { backgroundColor: colors.accent, borderColor: colors.accent }
            : { backgroundColor: colors.cardElevated, borderColor: colors.border },
        ]}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: celebrating
                ? withAlpha(ink, 0.18)
                : withAlpha(colors.fuchsia, 0.16),
            },
          ]}>
          {shown.milestone?.kind === 'badge' ? (
            <Trophy size={16} color={celebrating ? ink : colors.fuchsia} />
          ) : shown.milestone?.kind === 'level' ? (
            <Flame size={16} color={celebrating ? ink : colors.fuchsia} />
          ) : (
            <Zap size={16} color={colors.fuchsia} />
          )}
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: ink }]}>+{shown.delta} XP</Text>
          <Text style={[styles.sub, { color: celebrating ? ink : colors.textMuted }]}>
            {shown.milestone ? shown.milestone.text : 'Keep going'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '86%',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 1,
  },
  title: {
    ...typeScale.bodyStrong,
  },
  sub: {
    ...typeScale.caption,
  },
});
