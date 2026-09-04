import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { typeScale } from '@/theme/typography';
import { useTheme, withAlpha } from '@/theme';
import { onColor } from '@/theme/color';
import {
  normalizePathway,
  pathwayStepLabel,
  type CardPathway,
} from '@shared/pathwayCards';

/**
 * The chain on the back of a pathway flashcard.
 *
 * ## Why this exists at all
 *
 * A first-year paper does not ask a student to recognise a metabolic map; it
 * asks for the sequence, the enzyme at each step, the energetics and the block.
 * The plate answers "what does it look like"; this answers "what does it do",
 * and on a phone it is the half that is actually legible — a 220dp-high
 * thumbnail of a glycolysis diagram is a picture of some text, not text.
 *
 * It is also the card's floor. `imageFailed` used to leave a pathway card
 * reading "This diagram could not be loaded" over a one-line back, which is a
 * card that teaches nothing; with the chain present, a plate that will not load
 * costs the reader a picture and not the question.
 *
 * ## The drawing
 *
 * A rail down the left with a numbered node per step, and the step's box beside
 * it. That is deliberately the same vocabulary as the notes renderer's
 * flowchart (`NotesContentView`, `case 'flowchart'`) — one mental model for
 * "this is an ordered process" across notes and flashcards — but drawn as a
 * *rail* rather than as stacked boxes with ↓ between them, because a flashcard
 * back is read in three seconds and a continuous line is what makes six boxes
 * read as one chain at a glance.
 *
 * The connector is drawn **behind** the node, from the node's centre to the
 * next node's centre, so the line never appears to stop short of a circle. It
 * is `withAlpha(accent, …)` rather than the accent itself: at full strength six
 * saturated rails compete with the labels they are there to organise.
 *
 * No animation. This is the back of a card that has just been revealed — the
 * reveal is the motion, and a chain that draws itself in afterwards makes the
 * reader wait to read the thing they asked for.
 */
export function PathwayFlow({
  pathway,
  compact,
}: {
  pathway: CardPathway | unknown;
  /** Drop the details and keep the spine — for a preview row, not for study. */
  compact?: boolean;
}) {
  const { colors } = useTheme();
  /*
   * Read through the shared normaliser, never off the raw payload. The model
   * returns `{label, detail}` objects usually and bare strings sometimes, and
   * the one thing that must never happen is an object reaching a <Text>, which
   * prints as `[object Object]`. That is not hypothetical: it shipped in the
   * notes renderer and was invisible in the demo because the fixture used
   * strings.
   */
  const value = normalizePathway(pathway);
  if (!value) {
    return null;
  }
  const { steps, title, caption } = value;
  const nodeInk = onColor(colors.accent);

  return (
    <View style={styles.root}>
      {title ? (
        <Text style={[styles.title, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      ) : null}

      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <View
            key={`${index}-${step.label}`}
            style={styles.row}
            accessible
            accessibilityLabel={pathwayStepLabel(step, index, steps.length)}>
            <View style={styles.rail}>
              {/*
                The connector first, so the node is drawn on top of it and the
                line runs to the circle's centre rather than to its edge.
              */}
              {last ? null : (
                <View
                  style={[styles.connector, { backgroundColor: withAlpha(colors.accent, 0.35) }]}
                />
              )}
              <View style={[styles.node, { backgroundColor: colors.accent }]}>
                <Text style={[styles.nodeText, { color: nodeInk }]}>{index + 1}</Text>
              </View>
            </View>

            <View
              style={[
                styles.step,
                last && styles.stepLast,
                { backgroundColor: colors.cardElevated, borderColor: colors.border },
              ]}>
              <Text style={[styles.stepLabel, { color: colors.text }]}>{step.label}</Text>
              {step.detail && !compact ? (
                <Text style={[styles.stepDetail, { color: colors.textMuted }]}>{step.detail}</Text>
              ) : null}
            </View>
          </View>
        );
      })}

      {caption && !compact ? (
        <View
          style={[
            styles.caption,
            {
              backgroundColor: withAlpha(colors.warning, 0.1),
              borderColor: withAlpha(colors.warning, 0.4),
            },
          ]}>
          <Text style={[styles.captionLabel, { color: colors.warning }]}>HIGH-YIELD</Text>
          <Text style={[styles.captionText, { color: colors.text }]}>{caption}</Text>
        </View>
      ) : null}
    </View>
  );
}

const NODE = 24;

const styles = StyleSheet.create({
  root: {
    marginTop: 4,
  },
  title: {
    ...typeScale.overline,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  rail: {
    width: NODE,
    alignItems: 'center',
  },
  connector: {
    position: 'absolute',
    top: NODE / 2,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: {
    ...typeScale.caption,
    fontWeight: '800',
  },
  step: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepLast: {
    marginBottom: 0,
  },
  stepLabel: {
    ...typeScale.bodyStrong,
  },
  stepDetail: {
    ...typeScale.caption,
    marginTop: 3,
  },
  caption: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  captionLabel: {
    ...typeScale.overline,
    marginBottom: 3,
  },
  captionText: {
    ...typeScale.caption,
  },
});
