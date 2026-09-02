import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { TourGestureDemo } from '@/components/TourGestureDemo';
import { useTheme } from '@/theme';
import { onColor, withAlpha } from '@/theme/color';
import { radius, space } from '@/theme/tokens';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';
import { goToTab } from '@/navigation/ref';
import { chapterOf, STEPS, type TourStep } from '@/tour/script';
import {
  endTour,
  measureTourTarget,
  nextStep,
  previousStep,
  useTourState,
  type TargetRect,
} from '@/tour/store';

/**
 * The walkthrough, drawn over the running app.
 *
 * ## It is a hole, not a picture of one
 *
 * The scrim is **four rectangles** — above, below, left and right of the
 * target — rather than one full-screen view with a mask. React Native has no
 * cut-out on Android without a mask view or a shader, and four plain Views cost
 * nothing; but the reason that matters is not the drawing. Four rectangles
 * leave the target genuinely uncovered, so the reader can *press the real
 * control*, and the real control really works. A tour that dims the screen and
 * asks you to imagine tapping something teaches less than one where the thing
 * you tap is the thing itself.
 *
 * That is also why the root is `pointerEvents="box-none"`: the container must
 * not eat touches, only its four scrim panels may.
 *
 * ## Nothing here is load-bearing
 *
 * Every step degrades to a plain centred card. A target that cannot be
 * measured — its screen is not showing, it scrolled off, the label was renamed
 * — is a normal outcome, not an error: the caption still explains the feature
 * and Next still works. The one thing a walkthrough must never do is trap
 * somebody behind a control that is not there, so there is no state in which
 * the only way forward is a press on a spotlight.
 *
 * ## Not a Modal
 *
 * A `<Modal>` is its own window: it would sit above the app but the app
 * underneath would stop receiving touches, which is exactly the thing this
 * needs. So it is an ordinary absolutely-positioned view mounted inside the
 * NavigationContainer — above the tab bar in paint order, and transparent to
 * touches everywhere it is not drawing. Being outside the navigator's
 * SafeAreaView, it insets its own card; `check:edges` only walks Modals, so
 * that is done here by hand rather than by a rule catching it.
 */

/** How far the ring stands off the control it is drawing round. */
const HALO = 6;
/** Gap between the ring and the caption card. */
const GAP = 14;
/** The arrow's half-width; its height is the same, drawn as a triangle. */
const ARROW = 9;

interface Placement {
  /** Null while measuring, or when this step points at nothing. */
  rect: TargetRect | null;
  /** Whether the card sits below the target rather than above it. */
  below: boolean;
}

export function TourOverlay() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { index, run, paused } = useTourState();

  /*
   * Paused means a mandatory sheet is up — the tour keeps its place and draws
   * nothing. `step` is nulled rather than the return being short-circuited
   * later, so the measuring and navigating effects below stand down too: a
   * tour that kept navigating behind a form the reader cannot leave would move
   * the app under them while they filled it in.
   */
  const step: TourStep | null =
    index === null || paused ? null : (STEPS[run[index]] ?? null);
  const stepId = step?.id ?? null;

  const [placement, setPlacement] = useState<Placement>({ rect: null, below: true });
  const window = Dimensions.get('window');

  /*
   * Measuring is retried, not attempted once.
   *
   * A step that changes tab is asking for a control on a screen that is still
   * mounting, so the first measure legitimately finds nothing. The retries are
   * a short bounded ladder rather than a poll: if it is not there by three
   * quarters of a second it is not coming, and the step becomes a plain card.
   */
  useEffect(() => {
    if (!step?.target) {
      setPlacement({ rect: null, below: true });
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const attempt = async () => {
      if (cancelled) {
        return;
      }
      const rect = await measureTourTarget(step.target!, step.targetRole);
      if (cancelled || !rect) {
        return;
      }
      setPlacement({
        rect,
        // The card goes on whichever side has more room. A control in the top
        // half gets its card underneath; the bottom bar gets its card above.
        below: rect.y + rect.height / 2 < window.height / 2,
      });
    };
    setPlacement({ rect: null, below: true });
    attempt();
    for (const delay of [120, 320, 700]) {
      timers.push(setTimeout(attempt, delay));
    }
    return () => {
      cancelled = true;
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [stepId, step, window.height]);

  // ---- The ring's breath ---------------------------------------------------
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!placement.rect || reduceMotion) {
      /*
       * Under reduced motion the ring is simply drawn, at full strength. Not a
       * slower pulse: the ring is the whole signal for where to look, so it
       * has to be legible standing still, and someone who asked for less
       * motion has asked for none — not for the same loop taken gently.
       */
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: EASE.inOut,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: EASE.inOut,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [placement.rect, pulse, reduceMotion]);

  // ---- The card's entrance -------------------------------------------------
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!stepId) {
      return;
    }
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: reduceMotion ? 0 : DURATION.fast,
      // Named, never left to default. React Native's default is an ease-in-out
      // that starts slow, which delays the exact moment the reader is looking.
      easing: EASE.out,
      useNativeDriver: true,
    }).start();
  }, [stepId, enter, reduceMotion]);

  const advance = useCallback(() => {
    const at = index === null ? null : run[index];
    const upcoming = at === null ? null : STEPS[run[(index ?? 0) + 1]];
    if (upcoming?.tab) {
      // Navigate first, so the next step's target has a screen to be measured
      // on by the time its retry ladder starts.
      goToTab(upcoming.tab);
    }
    nextStep();
  }, [index, run]);

  const goBack = useCallback(() => {
    const previous = index === null ? null : STEPS[run[index - 1]];
    if (previous?.tab) {
      goToTab(previous.tab);
    }
    previousStep();
  }, [index, run]);

  /*
   * A step declaring a tab navigates there on arrival too, not only when Next
   * is pressed — a chapter replay from Settings starts in the middle of the
   * script, on whatever screen the reader happened to be on.
   */
  useEffect(() => {
    if (step?.tab) {
      goToTab(step.tab);
    }
  }, [stepId, step]);

  const scrims = useMemo(() => {
    const ink = withAlpha(colors.background, 0.86);
    if (!placement.rect) {
      return [{ key: 'all', style: StyleSheet.absoluteFill as object, ink }];
    }
    const { x, y, width, height } = placement.rect;
    const top = Math.max(0, y - HALO);
    const left = Math.max(0, x - HALO);
    const right = x + width + HALO;
    const bottom = y + height + HALO;
    return [
      { key: 'top', style: { left: 0, right: 0, top: 0, height: top }, ink },
      { key: 'bottom', style: { left: 0, right: 0, top: bottom, bottom: 0 }, ink },
      { key: 'left', style: { left: 0, width: left, top, height: bottom - top }, ink },
      { key: 'right', style: { left: right, right: 0, top, height: bottom - top }, ink },
    ];
  }, [colors.background, placement.rect]);

  if (!step) {
    return null;
  }

  const chapter = chapterOf(step.chapter);
  const position = (index ?? 0) + 1;
  const total = run.length;
  const isLast = position === total;
  const primary = step.cta ?? (isLast ? 'Finish' : 'Next');

  const ring = placement.rect;
  const cardTop = ring && placement.below ? ring.y + ring.height + HALO + GAP + ARROW : undefined;
  const cardBottom =
    ring && !placement.below ? window.height - (ring.y - HALO) + GAP + ARROW : undefined;

  return (
    // box-none, so the container itself never swallows a touch — only the four
    // scrim panels and the card do. This is what keeps the hole live.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {scrims.map(panel => (
        <View
          key={panel.key}
          // Each panel is `auto`: it blocks presses on the parts of the app the
          // reader should not be poking at during a step.
          pointerEvents="auto"
          style={[styles.scrim, panel.style, { backgroundColor: panel.ink }]}
        />
      ))}

      {ring ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              left: ring.x - HALO,
              top: ring.y - HALO,
              width: ring.width + HALO * 2,
              height: ring.height + HALO * 2,
              borderColor: colors.accent,
              // Nothing scales from 0, and nothing here scales from 1 either:
              // the breath is a few per cent, because a ring that visibly
              // throbs pulls the eye off the control it is drawing round.
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] }) },
              ],
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] }),
            },
          ]}
        />
      ) : null}

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.cardWrap,
          /*
           * With nothing to point at, the card fills the screen and centres
           * itself. Not `top: undefined` on the anchored style: an absolutely
           * positioned box with left and right but neither top nor bottom
           * resolves to **zero height**, so the card drew where it should but
           * was untouchable, and on the web preview a control behind it took
           * every press aimed at Next.
           */
          ring ? { top: cardTop, bottom: cardBottom } : styles.cardWrapCentred,
          {
            paddingTop: insets.top + space.md,
            paddingBottom: insets.bottom + space.md,
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [placement.below ? -10 : 10, 0],
                }),
              },
            ],
          },
        ]}>
        {ring ? (
          <View
            pointerEvents="none"
            style={[
              styles.arrow,
              placement.below ? styles.arrowUp : styles.arrowDown,
              {
                // Clamped to the card's own width so the point never hangs off
                // the corner radius when the target is at the screen edge.
                left: Math.min(
                  Math.max(ring.x + ring.width / 2 - ARROW, space.xl),
                  window.width - space.xl - ARROW * 2,
                ),
                ...(placement.below
                  ? { borderBottomColor: colors.cardElevated }
                  : { borderTopColor: colors.cardElevated }),
              },
            ]}
          />
        ) : null}

        <View
          pointerEvents="auto"
          style={[
            styles.card,
            { backgroundColor: colors.cardElevated, borderColor: colors.border },
          ]}>
          <View style={styles.head}>
            <Text style={[typeScale.overline, { color: colors.accent }]}>
              {chapter.name.toUpperCase()} · {position} OF {total}
            </Text>
            <Touchable
              onPress={endTour}
              label="Skip the walkthrough"
              hint="You can start it again from Settings"
              scaleTo={0.9}
              hitSlop={12}
              style={styles.skip}>
              <Text style={[typeScale.footnote, { color: colors.textMuted }]}>Skip</Text>
              <X size={14} color={colors.textMuted} />
            </Touchable>
          </View>

          <Text style={[typeScale.title3, styles.title, { color: colors.text }]}>{step.title}</Text>
          <Text style={[typeScale.callout, styles.body, { color: colors.textMuted }]}>
            {step.body}
          </Text>

          {step.demo === 'gestures' ? <TourGestureDemo /> : null}

          {step.tapToAdvance && ring ? (
            <Text style={[typeScale.caption, styles.hint, { color: colors.accent }]}>
              Tap the highlighted button to try it — or press {primary}.
            </Text>
          ) : null}

          <View style={styles.actions}>
            {position > 1 ? (
              <Touchable
                onPress={goBack}
                label="Previous step"
                scaleTo={0.94}
                style={[styles.back, { borderColor: colors.border }]}>
                <ChevronLeft size={16} color={colors.text} />
                <Text style={[typeScale.footnote, { color: colors.text }]}>Back</Text>
              </Touchable>
            ) : (
              <View />
            )}
            <Touchable
              onPress={isLast ? endTour : advance}
              label={isLast ? 'Finish the walkthrough' : `${primary}: step ${position + 1} of ${total}`}
              scaleTo={0.94}
              style={[styles.next, { backgroundColor: colors.accent }]}>
              <Text style={[typeScale.bodyStrong, { color: onColor(colors.accent) }]}>
                {primary}
              </Text>
              {isLast ? null : <ChevronRight size={16} color={onColor(colors.accent)} />}
            </Touchable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute' },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: radius.lg,
  },
  cardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: space.lg,
  },
  cardWrapCentred: { top: 0, bottom: 0, justifyContent: 'center' },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW,
    borderRightWidth: ARROW,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  // A triangle from borders: the only way to draw one without an SVG, and this
  // overlay should not pull in a renderer for two dozen pixels.
  arrowUp: { top: -ARROW, borderBottomWidth: ARROW },
  arrowDown: { bottom: -ARROW, borderTopWidth: ARROW },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  title: { marginTop: space.xs },
  body: { lineHeight: 20 },
  hint: { marginTop: space.xs },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
  },
});
