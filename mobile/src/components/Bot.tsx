import React, { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { BotEngine, HALF_BOX, RADIUS, type BotFrame } from '@/bot/engine';
import type { StateId } from '@/bot/states';
import { useReducedMotion } from '@/theme/motion';
import { useTheme } from '@/theme';
import { onColor } from '@/theme/color';

/**
 * The avatar, drawn.
 *
 * Three `<Path>`s and a `<Circle>` — the body, and two eyes carrying the
 * tangent matrix the engine composed. `react-native-svg` is already a
 * dependency (`GlassSurface` and every lucide icon use it), so this costs no
 * size at all.
 *
 * ## Colour, and the trap in it
 *
 * The reference is one dark body with **white** eyes, and hardcoding that is
 * how this goes blind: the body here takes `colors.accent`, and an accent can
 * be amber or cyan, on which white is unreadable. So the eyes are `onColor` of
 * the body — the same rule the theme states for text on a filled accent, and
 * the same helper. There is no case where the eyes are simply white.
 *
 * ## The scheduler, and why it is not a frame loop
 *
 * `sample(t)` is cheap but it is not free, and this repo's focus tree already
 * settles the question: redrawing vector nodes every frame, for minutes, is
 * what makes a cheap phone unusable. So the loop **stops on its own** as soon
 * as `frame.settled` says nothing further will change — which is true of
 * `sleep` immediately after its morph, and of every other state as soon as its
 * blink schedule and drift are switched off.
 *
 * A state that is genuinely alive (idle, thinking) does keep ticking, and that
 * is the honest cost of a face. It is bounded three ways: it runs at ~24fps
 * rather than 60, because nothing here moves fast enough to need more; it
 * stops entirely when `active` goes false, which the screen sets on blur; and
 * under reduced motion it never starts at all.
 */

/** Frames a second while something is moving. Not 60, and deliberately. */
const FPS = 24;

export interface BotProps {
  /** What the bot is doing. Changing it starts a morph from wherever it was. */
  state: StateId;
  /** Diameter in dp. */
  size?: number;
  /**
   * True while the reader is typing.
   *
   * The bot looks down towards the composer. On the web the reference follows
   * the mouse; a phone has no pointer, and what it has instead is knowing what
   * the reader is doing — which is the better signal anyway.
   */
  watchingInput?: boolean;
  /**
   * False when the screen is not in front of the reader.
   *
   * The loop stops dead. A bot animating on a screen nobody is looking at is
   * pure cost, and this is the app's most common case by a distance.
   */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Bot({ state, size = 56, active = true, watchingInput = false, style }: BotProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const engine = useRef<BotEngine | null>(null);
  if (engine.current === null) {
    engine.current = new BotEngine(RADIUS);
  }

  const started = useRef(Date.now());
  const [frame, setFrame] = useState<BotFrame>(() => engine.current!.sample(0));

  useEffect(() => {
    const now = (Date.now() - started.current) / 1000;
    engine.current!.setState(state, now);
    // Draw the first frame of the new state immediately rather than waiting
    // for the next tick, so a state change is never up to 40ms late.
    setFrame(engine.current!.sample(now));
  }, [state]);

  useEffect(() => {
    // Down and slightly in, towards where the composer sits. Small, because a
    // face that swings its eyes to the corner reads as alarmed rather than
    // attentive.
    engine.current!.setGlance(watchingInput ? -9 : 0, watchingInput ? -14 : 0);
  }, [watchingInput]);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (reduceMotion) {
      /*
       * One frame, well past every morph, and then nothing. Not a slower
       * animation: somebody who has asked for less motion has asked for none
       * here, and a face that still drifts and blinks is the opposite of what
       * the setting means.
       */
      setFrame(engine.current!.sample(1000));
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const tick = () => {
      if (stopped) {
        return;
      }
      const now = (Date.now() - started.current) / 1000;
      const next = engine.current!.sample(now);
      setFrame(next);
      // The loop ends itself. Nothing outside has to know when a state has
      // finished moving, which is the whole point of `settled`.
      if (!next.settled) {
        timer = setTimeout(tick, 1000 / FPS);
      }
    };
    tick();

    return () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [active, reduceMotion, state, watchingInput]);

  const body = colors.accent;
  const eye = onColor(body);

  return (
    <View
      style={[{ width: size, height: size }, style]}
      /*
       * Decorative, and hidden from TalkBack on purpose. Everything it says is
       * said in words elsewhere — the screen carries `aria-busy` while a
       * request is in flight, and an error is a sentence. A screen reader
       * announcing "thinking face" adds nothing and interrupts the answer.
       */
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox={`0 0 ${HALF_BOX * 2} ${HALF_BOX * 2}`}>
        <Circle cx={frame.cx} cy={frame.cy} r={frame.r} fill={body} />
        {frame.eyes.map((it, index) => (
          <G key={index} transform={it.transform} opacity={it.opacity}>
            <Path d={it.d} fill={eye} />
          </G>
        ))}
      </Svg>
    </View>
  );
}
