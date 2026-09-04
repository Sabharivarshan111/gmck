import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme, withAlpha } from '@/theme';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';

interface Props {
  /** How many readers have entered this page. */
  votes: number;
  /** How many are needed. */
  quorum: number;
  /** Small enough to sit inside a row; the default suits a sheet. */
  compact?: boolean;
  /**
   * Fill the segments on the way in, after this many milliseconds.
   *
   * Off by default, because most mounts are not an entrance — a row scrolling
   * back into view is the same fact arriving again, and re-running the fill
   * there is the twitch every recycled list gets wrong. The sheet passes it
   * once, on the claims it has just loaded, which is the one moment the
   * *shape* of the rule is worth drawing rather than stating.
   */
  enterDelay?: number;
}

/**
 * How close a page number is to being shown to everybody.
 *
 * The rule is the feature — three readers have to agree — and it was being
 * carried entirely by the words "2 of 3 so far", which is a sentence you have
 * to read. Three segments that fill is the same fact at a glance, and it makes
 * the *shape* of the rule obvious without anyone explaining it: you can see
 * there are three, and you can see one is missing.
 *
 * Each segment fades and grows in place rather than sliding, because they are
 * a measure and not a list. Nothing scales from 0 (the repo's rule): an empty
 * segment is drawn at full size in the muted colour, so filling it changes its
 * colour and not its existence.
 *
 * With `enterDelay` the segments fill on arrival as well as on a vote landing,
 * which is what turns "three readers have to agree" from a sentence into
 * something you watch happen. Without it a mount draws the current state
 * outright — see the prop.
 */
export function QuorumPips({
  votes,
  quorum,
  compact = false,
  enterDelay,
}: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const complete = votes >= quorum;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: quorum, now: Math.min(votes, quorum) }}
      accessibilityLabel={
        complete
          ? `Confirmed by ${votes} readers`
          : `${votes} of ${quorum} readers so far`
      }
    >
      {Array.from({ length: quorum }, (_, index) => (
        <Pip
          key={index}
          filled={index < votes}
          index={index}
          compact={compact}
          enterDelay={enterDelay}
          reduceMotion={reduceMotion}
          onColor={complete ? colors.success : colors.warning}
          offColor={withAlpha(colors.textMuted, 0.28)}
        />
      ))}
    </View>
  );
}

function Pip({
  filled,
  index,
  compact,
  enterDelay,
  reduceMotion,
  onColor,
  offColor,
}: {
  filled: boolean;
  index: number;
  compact: boolean;
  enterDelay?: number;
  reduceMotion: boolean;
  onColor: string;
  offColor: string;
}) {
  // Drives colour and a small lift together, so a vote landing reads as an
  // event rather than a repaint.
  //
  // It starts empty only when the caller asked for an entrance. Everywhere else
  // it starts where it belongs, so a remount is not an animation.
  const entering = enterDelay !== undefined && !reduceMotion;
  const on = useRef(new Animated.Value(filled && !entering ? 1 : 0)).current;
  const first = useRef(true);

  useEffect(() => {
    const target = filled ? 1 : 0;
    const arriving = first.current;
    first.current = false;
    if (reduceMotion || (arriving && !entering)) {
      on.setValue(target);
      return;
    }
    Animated.timing(on, {
      toValue: target,
      duration: DURATION.fast,
      easing: EASE.out,
      // A stagger only when they are arriving, and short enough to read as one
      // gesture rather than a queue.
      delay: (arriving ? (enterDelay ?? 0) : 0) + (filled ? index * 45 : 0),
      useNativeDriver: false,
    }).start();
    // `entering` and `enterDelay` are read for the first pass only; a later
    // change to them must not re-run the fill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled, index, on, reduceMotion]);

  return (
    <Animated.View
      style={[
        compact ? styles.pipCompact : styles.pip,
        {
          backgroundColor: on.interpolate({
            inputRange: [0, 1],
            outputRange: [offColor, onColor],
          }),
          transform: [
            {
              scaleY: on.interpolate({
                inputRange: [0, 1],
                // Never from 0 — an unfilled segment is a real thing that is
                // waiting, not an absence.
                outputRange: [0.72, 1],
              }),
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pip: {
    width: 16,
    height: 5,
    borderRadius: 3,
  },
  pipCompact: {
    width: 9,
    height: 4,
    borderRadius: 2,
  },
});
