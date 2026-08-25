import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useReducedMotion } from '@/theme/motion';

interface SuccessCheckmarkProps {
  checked: boolean;
  size?: number;
  color?: string;
  borderColor?: string;
}

const CIRCLE_CIRCUMFERENCE = 295; // 2 * PI * 47
const CHECK_LENGTH = 48;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

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
  const glowScale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      circleProgress.setValue(checked ? 1 : 0);
      checkProgress.setValue(checked ? 1 : 0);
      return;
    }

    if (reduceMotion) {
      circleProgress.setValue(checked ? 1 : 0);
      checkProgress.setValue(checked ? 1 : 0);
      glowOpacity.setValue(0);
      return;
    }

    if (checked) {
      circleProgress.setValue(0);
      checkProgress.setValue(0);
      glowScale.setValue(0.6);
      glowOpacity.setValue(0);

      Animated.parallel([
        // Circle draws closed (0 to 1 over 380ms)
        Animated.timing(circleProgress, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        // Sequence checkmark draw starting right after circle begins
        Animated.sequence([
          Animated.delay(220),
          Animated.timing(checkProgress, {
            toValue: 1,
            duration: 320,
            easing: Easing.bezier(0.6, 0, 0.3, 1),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        // Glow pulse sequence (scales and fades out)
        Animated.sequence([
          Animated.delay(180),
          Animated.parallel([
            Animated.timing(glowScale, {
              toValue: 1.5,
              duration: 550,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(glowOpacity, {
                toValue: 0.85,
                duration: 180,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(glowOpacity, {
                toValue: 0,
                duration: 370,
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
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(checkProgress, {
          toValue: 0,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [checked, reduceMotion, circleProgress, checkProgress, glowScale, glowOpacity]);

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
          r="47"
          fill="none"
          stroke={borderColor}
          strokeWidth="6"
        />

        {/* Animated Green Active Ring */}
        <AnimatedCircle
          cx="50"
          cy="50"
          r="47"
          fill={checked ? 'rgba(34, 217, 138, 0.15)' : 'none'}
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${CIRCLE_CIRCUMFERENCE}`}
          strokeDashoffset={circleDashOffset}
        />

        {/* Animated Success Checkmark */}
        <AnimatedPath
          d="M28 52 L44 67 L73 35"
          fill="none"
          stroke={color}
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
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
