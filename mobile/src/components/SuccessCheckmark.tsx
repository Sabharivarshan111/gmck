import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useReducedMotion } from '@/theme/motion';

interface SuccessCheckmarkProps {
  checked: boolean;
  size?: number;
  color?: string;
  borderColor?: string;
}

const CIRCLE_CIRCUMFERENCE = 285; // 2 * PI * 45 ≈ 282.7
const CHECK_LENGTH = 90; // Total length of path ≈ 66.5px, safely exceeded by dasharray

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/*
 * The stroke animations run on the JS driver, deliberately.
 *
 * `strokeDashoffset` and an SVG `opacity` *attribute* are not style props, and
 * the native driver only knows transform and style opacity. Asking it to drive
 * stroke geometry on Android does not fall back — it throws, or the value
 * simply never arrives and the tick never draws. This was written as
 * `useNativeDriver: Platform.OS !== 'web'`, which is exactly backwards: web is
 * where the flag is harmless (react-native-web ignores it) and Android is where
 * it breaks. ProgressRing carries the same note for the same reason.
 *
 * The glow is a real Animated.View with a transform and a style opacity, so
 * that one does run natively — and it is the part that would actually be seen
 * to stutter.
 */

export const SuccessCheckmark = memo(function SuccessCheckmark({
  checked,
  size = 24,
  color = '#22d98a',
  borderColor = 'rgba(255, 255, 255, 0.25)',
}: SuccessCheckmarkProps) {
  const reduceMotion = useReducedMotion();
  const firstMount = useRef(true);

  // Animation values
  const circleProgress = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const checkProgress = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const checkOpacity = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const glowScale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      circleProgress.setValue(checked ? 1 : 0);
      checkProgress.setValue(checked ? 1 : 0);
      checkOpacity.setValue(checked ? 1 : 0);
      return;
    }

    if (reduceMotion) {
      circleProgress.setValue(checked ? 1 : 0);
      checkProgress.setValue(checked ? 1 : 0);
      checkOpacity.setValue(checked ? 1 : 0);
      glowOpacity.setValue(0);
      return;
    }

    if (checked) {
      circleProgress.setValue(0);
      checkProgress.setValue(0);
      checkOpacity.setValue(1);
      glowScale.setValue(0.6);
      glowOpacity.setValue(0);

      Animated.parallel([
        // 1. Circle draws closed (0 to 1 over 360ms)
        Animated.timing(circleProgress, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        // 2. Checkmark draws completely in after circle starts closing
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(checkProgress, {
            toValue: 1,
            duration: 300,
            easing: Easing.bezier(0.6, 0, 0.3, 1),
            useNativeDriver: false,
          }),
        ]),
        // 3. Radial glow pulse
        Animated.sequence([
          Animated.delay(150),
          Animated.parallel([
            Animated.timing(glowScale, {
              toValue: 1.5,
              duration: 500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(glowOpacity, {
                toValue: 0.85,
                duration: 160,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(glowOpacity, {
                toValue: 0,
                duration: 340,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(circleProgress, {
          toValue: 0,
          duration: 120,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(checkProgress, {
          toValue: 0,
          duration: 120,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(checkOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [checked, reduceMotion, circleProgress, checkProgress, checkOpacity, glowScale, glowOpacity]);

  const circleDashOffset = circleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_CIRCUMFERENCE, 0],
  });

  const checkDashOffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CHECK_LENGTH, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Radial Glow Pulse */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: (size * 1.8) / 2,
            backgroundColor: color,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* SVG Canvas with Circle and Checkmark */}
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={StyleSheet.absoluteFill}
      >
        {/* Inactive Base Ring */}
        <Circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={borderColor}
          strokeWidth="6"
        />

        {/* Animated Green Active Ring */}
        <AnimatedCircle
          cx="50"
          cy="50"
          r="45"
          fill={checked ? 'rgba(34, 217, 138, 0.15)' : 'none'}
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${CIRCLE_CIRCUMFERENCE}`}
          strokeDashoffset={circleDashOffset}
        />

        {/* Animated Full Success Checkmark (only visible when active/animating) */}
        <AnimatedPath
          d="M28 50 L42 66 L74 34"
          fill="none"
          stroke={color}
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={checkOpacity}
          strokeDasharray={`${CHECK_LENGTH}`}
          strokeDashoffset={checkDashOffset}
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});
