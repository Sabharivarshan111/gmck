import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { NotesContentView } from '@/components/NotesContentView';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';
import { getCleanQuestionText, noteQuestionText } from '@/lib/questionText';
import { fetchSingleQuestionNote, type NotesContent } from '@/lib/handwrittenNotes';
import type { Grade, ReviewCard } from '@/lib/spacedRepetition';
import { complete, tick } from '@/lib/haptics';

/**
 * One pass through today's due cards.
 *
 * The answer is the handwritten note a triple tap already generates, fetched
 * under the same cache key — so a question studied once is instant to revise,
 * for free, and the note is the one the reader has already seen rather than a
 * second version of it that disagrees.
 *
 * The question comes first and the answer is hidden behind a tap on purpose.
 * Spaced repetition works because retrieval is effortful; showing both at once
 * turns recall into recognition and the schedule stops measuring anything.
 */

/**
 * The four the server accepts.
 *
 * `review_question` rejects anything else outright — these strings are the
 * contract, not a local vocabulary that gets mapped on the way out.
 */
const GRADE_BUTTONS: { quality: Grade; label: string; hint: string }[] = [
  { quality: 'again', label: 'Again', hint: 'No idea — back to one day' },
  { quality: 'hard', label: 'Hard', hint: 'Got there, slowly' },
  { quality: 'good', label: 'Good', hint: 'Recalled it' },
  { quality: 'easy', label: 'Easy', hint: 'Instant' },
];

export function ReviseSheet({
  visible,
  cards,
  yearLabel,
  onClose,
  onGraded,
}: {
  visible: boolean;
  /** Today's queue, hardest first. */
  cards: ReviewCard[];
  yearLabel: string;
  onClose: () => void;
  onGraded: (card: ReviewCard, quality: Grade) => void;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [note, setNote] = useState<NotesContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const card = cards[index];
  const runId = useRef(0);

  // A fresh queue each time it opens, or reopening lands mid-way through
  // yesterday's session.
  useEffect(() => {
    if (visible) {
      setIndex(0);
      setRevealed(false);
      setNote(null);
      setError(null);
    }
  }, [visible]);

  /**
   * The answer fades and rises rather than appearing.
   *
   * It replaces nothing — it arrives under a question that stays put — so the
   * motion says "here is more" rather than "the screen changed".
   */
  const reveal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      reveal.setValue(revealed ? 1 : 0);
      return;
    }
    Animated.timing(reveal, {
      toValue: revealed ? 1 : 0,
      duration: revealed ? DURATION.base : DURATION.fast,
      easing: EASE.out,
      useNativeDriver: true,
    }).start();
  }, [revealed, reduceMotion, reveal]);

  const show = useCallback(async () => {
    if (!card) {
      return;
    }
    setRevealed(true);
    tick();
    if (note) {
      return;
    }
    const run = ++runId.current;
    setLoading(true);
    setError(null);
    try {
      const content = await fetchSingleQuestionNote({
        question: noteQuestionText(card.question),
        subjectKey: card.subject,
        subjectName: card.subject,
        yearLabel,
      });
      if (runId.current === run) {
        setNote(content);
      }
    } catch (e) {
      if (runId.current === run) {
        setError((e as Error).message || "Couldn't load the note.");
      }
    } finally {
      if (runId.current === run) {
        setLoading(false);
      }
    }
  }, [card, note, yearLabel]);

  const answer = useCallback(
    (quality: Grade) => {
      if (!card) {
        return;
      }
      onGraded(card, quality);
      runId.current += 1;
      setNote(null);
      setError(null);
      setRevealed(false);
      if (index + 1 >= cards.length) {
        complete();
        onClose();
        return;
      }
      tick();
      setIndex(index + 1);
    },
    [card, cards.length, index, onClose, onGraded],
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={cards.length ? `Revise · ${Math.min(index + 1, cards.length)} / ${cards.length}` : 'Revise'}
      contentStyle={styles.content}>
      {card ? (
        <>
          <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
            {card.subject} · interval {card.interval}d
          </Text>

          <View
            style={[
              styles.question,
              { backgroundColor: colors.cardElevated, borderColor: colors.border },
            ]}>
            <Text style={[typeScale.callout, { color: colors.text }]}>
              {getCleanQuestionText(card.question)}
            </Text>
          </View>

          {revealed ? (
            <Animated.View
              style={{
                opacity: reveal,
                transform: [
                  { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                ],
              }}>
              {loading ? (
                <View style={styles.centre}>
                  <ActivityIndicator color={colors.fuchsia} />
                  <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
                    Fetching your note…
                  </Text>
                </View>
              ) : null}

              {error ? (
                <View
                  style={[
                    styles.error,
                    {
                      backgroundColor: withAlpha(colors.danger, 0.1),
                      borderColor: withAlpha(colors.danger, 0.4),
                    },
                  ]}>
                  <Text style={[typeScale.footnote, { color: colors.text }]}>{error}</Text>
                </View>
              ) : null}

              {note ? <NotesContentView content={note} /> : null}
            </Animated.View>
          ) : null}

          {revealed ? (
            <View style={styles.grades}>
              {GRADE_BUTTONS.map(option => (
                <Touchable
                  key={option.label}
                  label={option.label}
                  hint={option.hint}
                  onPress={() => answer(option.quality)}
                  style={[
                    styles.grade,
                    {
                      backgroundColor:
                        option.quality === 'again'
                          ? withAlpha(colors.danger, 0.14)
                          : withAlpha(colors.success, 0.12),
                      borderColor:
                        option.quality === 'again'
                          ? withAlpha(colors.danger, 0.5)
                          : withAlpha(colors.success, 0.4),
                    },
                  ]}>
                  <Text
                    style={[
                      typeScale.footnote,
                      styles.gradeText,
                      { color: option.quality === 'again' ? colors.danger : colors.success },
                    ]}>
                    {option.label}
                  </Text>
                </Touchable>
              ))}
            </View>
          ) : (
            <Touchable
              label="Show answer"
              onPress={show}
              style={[styles.reveal, { backgroundColor: colors.primary }]}>
              <Text style={[typeScale.callout, styles.revealText, { color: colors.primaryText }]}>
                Show answer
              </Text>
            </Touchable>
          )}
        </>
      ) : (
        <Text style={[typeScale.callout, styles.done, { color: colors.textMuted }]}>
          Nothing due — you are caught up.
        </Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  question: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  centre: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  error: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  grades: {
    flexDirection: 'row',
    gap: 8,
  },
  grade: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: 'center',
  },
  gradeText: {
    fontWeight: '600',
  },
  reveal: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  revealText: {
    fontWeight: '600',
  },
  done: {
    textAlign: 'center',
    paddingVertical: 24,
  },
});
