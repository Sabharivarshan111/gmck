import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { animalArtwork, type AnimalArtworkKey } from '@/bot/animalArtwork';
import type { StateId } from '@/bot/states';
import {
  DURATION,
  EASE,
  SPRING,
  springConfig,
  useReducedMotion,
} from '@/theme/motion';

/** A two-eye puppet over unmodified original art. No bitmap animation frames,
 * no React updates per frame, and no scheduler on an inactive/quiet avatar. */
export function AnimalBot({
  artwork,
  state,
  size,
  active,
  watchingInput,
  interaction = 0,
}: {
  artwork: AnimalArtworkKey;
  state: StateId;
  size: number;
  active: boolean;
  watchingInput: boolean;
  interaction?: number;
}) {
  const reduced = useReducedMotion();
  const moving = active && !reduced && state !== 'sleep';
  const art = animalArtwork[artwork];
  const pose = useRef(new Animated.Value(0)).current;
  const gazeX = useRef(new Animated.Value(0)).current;
  const gazeY = useRef(new Animated.Value(0)).current;
  const lids = useRef([new Animated.Value(1), new Animated.Value(1)]).current;
  const touchAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const thinkingAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const blinkAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const k = size / 384;
  const timing = (v: Animated.Value, toValue: number) =>
    Animated.timing(v, {
      toValue,
      duration: DURATION.instant,
      easing: EASE.out,
      useNativeDriver: true,
    });

  useEffect(() => {
    touchAnimation.current?.stop();
    thinkingAnimation.current?.stop();
    thinkingAnimation.current = null;
    blinkAnimation.current?.stop();
    if (!moving) {
      pose.setValue(0);
      gazeX.setValue(0);
      gazeY.setValue(0);
      lids.forEach(lid => lid.setValue(state === 'sleep' ? 0.08 : 1));
      return;
    }
    const reaction =
      interaction > 0
        ? 1
        : state === 'dismay'
        ? -1
        : state === 'wink' || state === 'wide' || state === 'exclaim'
        ? 1
        : 0;
    const motion = Animated.sequence([
      Animated.spring(pose, {
        ...springConfig(SPRING.snappy),
        toValue: reaction,
      }),
      Animated.spring(pose, { ...springConfig(SPRING.momentum), toValue: 0 }),
    ]);
    if (state !== 'thinking') motion.start();
    if (state === 'thinking') {
      const sway = Animated.loop(
        Animated.sequence([
          Animated.timing(pose, {
            toValue: -0.5,
            duration: DURATION.slow * 3,
            easing: EASE.inOut,
            useNativeDriver: true,
          }),
          Animated.timing(pose, {
            toValue: 0.5,
            duration: DURATION.slow * 3,
            easing: EASE.inOut,
            useNativeDriver: true,
          }),
        ]),
      );
      sway.start();
      thinkingAnimation.current = sway;
    }
    lids.forEach(lid => lid.setValue(1));
    const blink = Animated.loop(
      Animated.sequence([
        Animated.delay(state === 'thinking' ? 2400 : 3900),
        Animated.parallel(lids.map(lid => timing(lid, 0.08))),
        Animated.parallel(lids.map(lid => timing(lid, 1))),
      ]),
    );
    blinkAnimation.current = blink;
    blink.start();
    if (state === 'wink' || interaction > 0)
      Animated.sequence([
        timing(lids[1], 0.08),
        Animated.delay(DURATION.fast),
        timing(lids[1], 1),
      ]).start();
    return () => {
      motion.stop();
      thinkingAnimation.current?.stop();
      thinkingAnimation.current = null;
      touchAnimation.current?.stop();
      blink.stop();
      lids.forEach(lid => lid.stopAnimation());
      gazeX.stopAnimation();
      gazeY.stopAnimation();
    };
    // Animated values are stable; the state transition owns the animation lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moving, state, artwork, interaction]);

  useEffect(() => {
    if (!moving) return;
    const animation = Animated.parallel([
      Animated.spring(gazeX, {
        ...springConfig(SPRING.snappy),
        toValue: watchingInput ? -size * 0.006 : 0,
      }),
      Animated.spring(gazeY, {
        ...springConfig(SPRING.snappy),
        toValue: watchingInput ? size * 0.006 : 0,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [moving, watchingInput, gazeX, gazeY, size]);

  const touch = (event: GestureResponderEvent) => {
    if (!moving) return;
    const { locationX, locationY } = event.nativeEvent;
    Animated.parallel([
      Animated.spring(gazeX, {
        ...springConfig(SPRING.snappy),
        toValue:
          Math.max(-1, Math.min(1, (locationX / size) * 2 - 1)) * size * 0.006,
      }),
      Animated.spring(gazeY, {
        ...springConfig(SPRING.snappy),
        toValue:
          Math.max(-1, Math.min(1, (locationY / size) * 2 - 1)) * size * 0.006,
      }),
    ]).start();
    touchAnimation.current?.stop();
    thinkingAnimation.current?.stop();
    touchAnimation.current = Animated.sequence([
      Animated.spring(pose, { ...springConfig(SPRING.snappy), toValue: 1 }),
      Animated.spring(pose, { ...springConfig(SPRING.momentum), toValue: 0 }),
    ]);
    touchAnimation.current.start(({ finished }) => {
      if (finished) thinkingAnimation.current?.start();
    });
    blinkAnimation.current?.stop();
    Animated.sequence([
      timing(lids[1], 0.08),
      Animated.delay(DURATION.fast),
      timing(lids[1], 1),
    ]).start(({ finished }) => {
      if (finished) blinkAnimation.current?.start();
    });
  };

  return (
    <View onTouchStart={touch} style={{ width: size, height: size }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.24,
          overflow: 'hidden',
          opacity: state === 'sleep' ? 0.65 : 1,
          transform: [
            {
              rotate: pose.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: ['-7deg', '0deg', '7deg'],
              }),
            },
            {
              translateY: pose.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [size * 0.025, 0, -size * 0.035],
              }),
            },
            {
              scale: pose.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0.97, 1, 1.035],
              }),
            },
          ],
        }}
      >
        <Image
          source={art.source}
          resizeMode="contain"
          style={{ width: size, height: size }}
        />
        {art.eyes.map((eye, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: eye.x * k,
              top: eye.y * k,
              width: eye.w * k,
              height: eye.h * k,
              backgroundColor: eye.skin,
              borderRadius: (eye.w * k) / 2,
            }}
          >
            <Animated.View
              style={{
                width: eye.w * k,
                height: eye.h * k,
                overflow: 'hidden',
                borderRadius: (eye.w * k) / 2,
                transform: [
                  { translateX: gazeX },
                  { translateY: gazeY },
                  { scaleY: lids[i] },
                ],
              }}
            >
              <Image
                source={art.source}
                resizeMode="stretch"
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  left: -eye.x * k,
                  top: -eye.y * k,
                }}
              />
            </Animated.View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
