import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme, withAlpha } from '@/theme';
import { DURATION, EASE, SPRING, springConfig, useReducedMotion } from '@/theme/motion';
import { Bell } from 'lucide-react-native';

/** One full damped swing. Matches the reference's 820ms. */
const RING_MS = 820;

/**
 * The bell beside the reminder switch: it rings when you turn reminders on.
 *
 * Three things happen on the same frame, which is what makes it read as one
 * event rather than three effects: the bell swings, a ring expands out of it,
 * and the count pops in. Splitting them by even 60ms turns a single "ding" into
 * a sequence, and a sequence invites you to watch it — which is wrong for a
 * control you are meant to flip and move on from.
 *
 * It rings **on the transition, never on a loop.** The reference animation
 * auto-cycles every two seconds, and something moving forever in a settings
 * sheet is a thing you learn to ignore and then cannot un-see. This fires once,
 * when the answer changes, and then holds still.
 *
 * Under reduced motion the bell and badge simply appear in their final state:
 * "reminders are on" is the information, and the swing is the decoration.
 */
export function NotificationBell({ enabled }: { enabled: boolean }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const swing = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(enabled ? 1 : 0)).current;

  // Skips the first run, so opening Settings with reminders already on does
  // not ring at a reader who changed nothing.
  const previous = useRef(enabled);

  useEffect(() => {
    const changed = previous.current !== enabled;
    previous.current = enabled;

    if (reduceMotion) {
      swing.setValue(0);
      ripple.setValue(0);
      badge.setValue(enabled ? 1 : 0);
      return;
    }

    if (!enabled) {
      Animated.timing(badge, {
        toValue: 0,
        duration: DURATION.fast,
        easing: EASE.out,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.spring(badge, {
      toValue: 1,
      // The one place overshoot is right: the badge is arriving, not settling
      // into place, and a little bounce is what says "new".
      ...springConfig(SPRING.momentum),
      useNativeDriver: true,
    }).start();

    if (!changed) {
      return;
    }

    swing.setValue(0);
    ripple.setValue(0);
    Animated.parallel([
      Animated.timing(swing, {
        toValue: 1,
        // Longer than any DURATION token, deliberately: a bell that stops
        // ringing in 280ms reads as a glitch rather than a sound.
        duration: RING_MS,
        easing: EASE.inOut,
        useNativeDriver: true,
      }),
      Animated.timing(ripple, {
        toValue: 1,
        duration: RING_MS,
        easing: EASE.out,
        useNativeDriver: true,
      }),
    ]).start();
  }, [enabled, reduceMotion, swing, ripple, badge]);

  return (
    <View style={styles.root}>
      {/* Behind the bell, so the ring reads as coming out of it. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            borderColor: colors.warning,
            opacity: ripple.interpolate({
              inputRange: [0, 0.15, 1],
              outputRange: [0, 0.7, 0],
            }),
            transform: [
              { scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }) },
            ],
          },
        ]}
      />

      <Animated.View
        style={{
          transform: [
            {
              rotate: swing.interpolate({
                // The reference's damped swing, as a rotation over one run:
                // a hard first throw, then progressively smaller returns.
                inputRange: [0, 0.17, 0.34, 0.5, 0.67, 0.84, 1],
                outputRange: ['0deg', '-16deg', '14deg', '-10deg', '7deg', '-4deg', '0deg'],
              }),
            },
          ],
        }}>
        <Bell
          size={20}
          color={enabled ? colors.warning : colors.textMuted}
          fill={enabled ? colors.warning : 'transparent'}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.badge,
          {
            backgroundColor: colors.danger,
            opacity: badge,
            transform: [{ scale: badge }],
          },
        ]}>
        <Text style={[styles.badgeText, { color: withAlpha('#FFFFFF', 1) }]}>1</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
