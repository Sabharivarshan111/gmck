import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Sheet } from '@/components/Sheet';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';
import { collectAllQuestions, getTopicChildren, type BankNode } from '@/lib/questionBank';
import { useCountDone } from '@/hooks/useProgress';

/**
 * What a heatmap tile means, once you tap it.
 *
 * A tile saying "Forensic Medicine 0%" tells you where you are behind and
 * nothing about what to do next. This is the useful half: every topic in the
 * subject, its own percentage, and how many questions it actually holds — so
 * the answer is "Postmortem Changes, 15 questions" rather than "study more".
 *
 * Ordered weakest first for the same reason the tiles are: the list exists to
 * be started at the top.
 */
export function SubjectBreakdownSheet({
  subject,
  onClose,
}: {
  /** Null closes it. */
  subject: { key: string; name: string; node: BankNode } | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const countDone = useCountDone();

  const summary = useMemo(() => {
    if (!subject) {
      return null;
    }
    const all = collectAllQuestions(subject.node);
    const done = countDone(all);
    /**
     * Papers are not topics.
     *
     * Second-year subjects are split into Paper 1 and Paper 2 before they are
     * split into anything you would revise, so listing the direct children
     * gives two rows of two hundred questions each — true, and useless for
     * deciding what to open. When every child is a paper, this descends one
     * level and lists what is actually inside them, keeping the paper as a
     * prefix so the row still says where it lives.
     */
    const children = getTopicChildren(subject.node);
    const allPapers = children.length > 0 && children.every(c => /^paper-\d+$/.test(c.key));
    const leaves = allPapers
      ? children.flatMap(paper =>
          getTopicChildren(paper.node).map(topic => ({
            ...topic,
            key: `${paper.key}/${topic.key}`,
            name: `${paper.name} · ${topic.name}`,
          })),
        )
      : children;

    const topics = leaves
      .map(topic => {
        const questions = collectAllQuestions(topic.node);
        const topicDone = countDone(questions);
        return {
          key: topic.key,
          name: topic.name,
          done: topicDone,
          total: questions.length,
          pct: questions.length ? Math.round((topicDone / questions.length) * 100) : 0,
        };
      })
      // Empty topics are noise in a list meant to be worked down.
      .filter(topic => topic.total > 0)
      .sort((a, b) => a.pct - b.pct || b.total - a.total);

    return {
      done,
      total: all.length,
      pct: all.length ? Math.round((done / all.length) * 100) : 0,
      topics,
    };
  }, [subject, countDone]);

  return (
    <Sheet
      visible={subject !== null}
      onClose={onClose}
      title={subject?.name ?? ''}
      scrollable
      contentStyle={styles.content}>
      {summary ? (
        <>
          <View
            style={[
              styles.overall,
              {
                backgroundColor: withAlpha(colors.danger, 0.12),
                borderColor: withAlpha(colors.danger, 0.4),
              },
            ]}>
            <Text style={[typeScale.footnote, { color: colors.textMuted }]}>Overall</Text>
            <Text style={[styles.overallPct, { color: colors.danger }]}>{summary.pct}%</Text>
            <Text style={[typeScale.footnote, { color: colors.text }]}>
              {summary.done} / {summary.total} questions done
            </Text>
          </View>

          <Text style={[styles.section, { color: colors.textMuted }]}>SUBTOPICS</Text>

          {summary.topics.map((topic, index) => (
            <TopicRow
              key={topic.key}
              name={topic.name}
              pct={topic.pct}
              done={topic.done}
              total={topic.total}
              index={index}
            />
          ))}
        </>
      ) : null}
    </Sheet>
  );
}

/**
 * One topic, with its bar growing in on arrival.
 *
 * `scaleX` with a left origin, never an animated width: width is a layout
 * property, so animating it costs layout, paint and composite every frame on
 * the JS thread — for every bar in a list that can be forty long. A transform
 * composites on the GPU.
 *
 * The stagger is capped rather than per-row: a forty-item list with 30ms each
 * would take over a second to finish arriving, and the bottom of the list
 * would still be animating after the reader has started reading the top.
 */
function TopicRow({
  name,
  pct,
  done,
  total,
  index,
}: {
  name: string;
  pct: number;
  done: number;
  total: number;
  index: number;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const grow = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      grow.setValue(1);
      return;
    }
    const animation = Animated.timing(grow, {
      toValue: 1,
      duration: DURATION.slow,
      delay: Math.min(index, 8) * 40,
      easing: EASE.out,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [grow, index, reduceMotion]);

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowHead}>
        <Text style={[typeScale.callout, styles.flex, { color: colors.text }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[typeScale.footnote, styles.pct, { color: pct > 0 ? colors.success : colors.textMuted }]}>
          {pct}%
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: withAlpha(colors.text, 0.1) }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: pct > 0 ? colors.success : 'transparent',
              transform: [
                {
                  scaleX: grow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.max(pct, 0) / 100],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
        {done} / {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  overall: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 2,
  },
  overallPct: {
    fontSize: 30,
    fontWeight: '700',
  },
  section: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  row: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pct: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    width: '100%',
    borderRadius: 3,
    // Grows from the left edge rather than from its centre.
    transformOrigin: 'left',
  },
});
