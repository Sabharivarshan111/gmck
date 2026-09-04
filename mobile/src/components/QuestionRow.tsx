import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { SuccessCheckmark } from '@/components/SuccessCheckmark';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';
import { toggleQuestionDone } from '@/lib/progress';
import {
  countStars,
  extractPageNumber,
  getCleanQuestionText,
  importanceLabel,
  noteQuestionText,
} from '@/lib/questionText';
import { useQuestionDone } from '@/hooks/useProgress';
import { doubleTapPrompt, tripleTapPrompt } from '@/lib/askAi';
import type { ConfirmedPage } from '@/lib/pageRefs';

interface Props {
  question: string;
  index: number;
  /** Triple tap — the full worked answer, written up as a note. */
  onAskAi: (question: string) => void;
  /** Double tap — practice MCQs generated from this question. */
  onAskMcq?: (question: string) => void;
  /**
   * Triple tap — a handwritten note for this one question, when the screen can
   * supply the subject the notes function needs to ground it. Third year only,
   * matching the web app: those are the subjects it has a textbook for.
   * Without it, a triple tap falls back to Ask AI.
   */
  onNote?: (question: string, rawQuestion: string) => void;
  /**
   * Flash this row — the reader arrived from a search result and has to be
   * told which of sixty questions was the one they searched for.
   */
  highlighted?: boolean;
  /**
   * Open the textbook-page sheet. Absent when the reader has page references
   * switched off, which is also what stops the screen fetching them at all.
   */
  onPageRef?: (question: string, rawQuestion: string) => void;
  /**
   * The page three or more readers agreed on, if there is one. Handed down
   * from the screen's single batch fetch rather than fetched per row.
   */
  communityPage?: ConfirmedPage;
  /**
   * Whether the page shown is from the reader's OWN chosen book.
   *
   * When it is, the chip drops the book name — the header already says which
   * book once, and repeating it on five hundred rows is noise that also pushes
   * the page number, the only part that changes, off the end of the chip.
   * Without a chosen book the name stays: an unattributed page number is not
   * something a reader can act on.
   */
  myBook?: boolean;
}

/**
 * Matches the tap model of the published app, which the first native port had
 * flattened into "tap the row to tick it" plus a sparkle button:
 *
 *   • the checkbox      → mark done          (its own target, own hit slop)
 *   • double tap a row  → MCQs from it
 *   • triple tap a row  → the handwritten note / worked answer
 *
 * The 280ms window is the published app's value (QuestionCardEnhanced.tsx), not
 * a guess. A third tap fires immediately rather than waiting out the window,
 * because by then the intent is unambiguous — waiting would only add lag to the
 * deliberate gesture (apple-design §10: minimise disambiguation delays, and pay
 * the cost only where the ambiguity is real).
 *
 * Multi-tap is unusable with a screen reader, so the same two actions are also
 * exposed as `accessibilityActions`. TalkBack surfaces them in its actions
 * menu; nobody has to land three taps on a moving list to reach a feature.
 */
function QuestionRowBase({
  question,
  index,
  onAskAi,
  onAskMcq,
  onNote,
  highlighted = false,
  onPageRef,
  communityPage,
  myBook = false,
}: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  // Subscribes to *this* question only, so ticking one row does not re-render
  // every other row mounted in the list.
  const done = useQuestionDone(question);

  const stars = countStars(question);
  const page = extractPageNumber(question);
  const importance = importanceLabel(stars);
  const text = getCleanQuestionText(question);

  /**
   * The arrival flash, for a question reached from a search result.
   *
   * A pulse rather than a permanent mark: it lights, holds long enough to be
   * found by eye, and leaves. Under reduced motion it shows and hides without
   * the ramp — "this is the one you searched for" is information, not
   * decoration, so it is not dropped, only the movement is.
   */
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!highlighted) {
      glow.setValue(0);
      return;
    }
    if (reduceMotion) {
      glow.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.timing(glow, {
        toValue: 1,
        duration: DURATION.fast,
        easing: EASE.out,
        useNativeDriver: false,
      }),
      Animated.delay(1200),
      Animated.timing(glow, {
        toValue: 0,
        duration: DURATION.slow,
        easing: EASE.out,
        useNativeDriver: false,
      }),
    ]).start();
  }, [highlighted, reduceMotion, glow]);
  const toggle = useCallback(() => {
    toggleQuestionDone(question);
  }, [question]);

  // Both prompts are built in src/lib/askAi.ts, which owns the markers and
  // intent flags the edge function needs. Hand-writing the prose here is what
  // previously sent MCQ requests down the generic-chatbot path.
  const askAnswer = useCallback(() => {
    if (onNote) {
      // noteQuestionText, not getCleanQuestionText: the notes function's cache
      // key is a hash of this string, and the web app hashes the version that
      // still has its stars and year on it.
      //
      // The bank's raw string goes too. It is the only thing that can find a
      // diagram filed under a numbered question, because the note key must
      // stay the stripped form and the two disagree by exactly that number.
      onNote(noteQuestionText(question), question);
      return;
    }
    onAskAi(tripleTapPrompt(getCleanQuestionText(question)));
  }, [onAskAi, onNote, question]);

  const askMcq = useCallback(() => {
    const prompt = doubleTapPrompt(getCleanQuestionText(question));
    (onAskMcq ?? onAskAi)(prompt);
  }, [onAskAi, onAskMcq, question]);

  // ---- tap disambiguation --------------------------------------------------
  const taps = useRef(0);
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const onRowTap = useCallback(() => {
    const now = Date.now();
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    taps.current = now - lastTap.current > TAP_WINDOW_MS ? 1 : taps.current + 1;
    lastTap.current = now;

    if (taps.current >= 3) {
      taps.current = 0;
      askAnswer();
      return;
    }

    timer.current = setTimeout(() => {
      if (taps.current === 2) {
        askMcq();
      }
      taps.current = 0;
      timer.current = null;
    }, TAP_WINDOW_MS);
  }, [askAnswer, askMcq]);

  const importanceColor =
    importance === 'must-know'
      ? colors.danger
      : importance === 'important'
      ? colors.warning
      : colors.textMuted;

  return (
    <Touchable
      onPress={onRowTap}
      label={text}
      hint="Double tap twice for MCQs, three times for a written answer"
      // The gestures above are unreachable with a screen reader; these are.
      accessibilityActions={[
        { name: 'mcqs', label: 'Practice MCQs' },
        { name: 'answer', label: 'Written answer' },
      ]}
      onAccessibilityAction={name => {
        if (name === 'mcqs') {
          askMcq();
        } else if (name === 'answer') {
          askAnswer();
        }
      }}
      scaleTo={0.985}
      style={[
        styles.row,
        {
          // A done question reads as a green card with a ticked box, not as
          // crossed-out text. Both said "finished"; only one of them still
          // lets you revise from it, which is the entire reason to keep a
          // question you have already answered on the screen.
          backgroundColor: done ? withAlpha(colors.success, 0.1) : colors.card,
          borderColor: done ? colors.success : colors.border,
        },
      ]}
    >
      {/* Drawn first, so it sits behind the row's content rather than tinting
          it. Touchable is not an Animated component, which is why the flash is
          its own layer instead of the row's own border and background. */}
      {highlighted ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flash,
            {
              opacity: glow,
              borderColor: colors.cyan,
              backgroundColor: withAlpha(colors.cyan, 0.16),
            },
          ]}
        />
      ) : null}

      <View style={styles.main}>
        {/* Its own control, so ticking never has to survive tap counting. */}
        <Touchable
          onPress={toggle}
          role="checkbox"
          state={{ checked: done }}
          label={done ? 'Mark as not done' : 'Mark as done'}
          hitSlop={14}
          scaleTo={0.85}
        >
          <SuccessCheckmark
            checked={done}
            size={22}
            color={colors.success}
            borderColor={colors.border}
          />
        </Touchable>

        <View style={styles.body}>
          <Text style={[styles.affordance, { color: colors.cyan }]}>
            {onNote ? 'Triple tap → handwritten note' : 'Triple tap to ask AI'}
          </Text>

          <Text
            style={[
              typeScale.callout,
              styles.text,
              // Full strength either way. The tick and the green card carry
              // "done"; dimming and striking the text carried it twice over
              // and made the question harder to read than an untouched one.
              { color: colors.text },
            ]}
          >
            {index + 1}. {text}
          </Text>

          <View style={styles.meta}>
            {stars > 0 ? (
              <Text style={[styles.metaText, { color: importanceColor }]}>
                {'★'.repeat(Math.min(stars, 5))}
              </Text>
            ) : null}
            {page ? (
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Pg. {page}
              </Text>
            ) : null}
          </View>

          {/* A page other readers agreed on, in a book they named.
            *
            * Kept separate from the "Pg." above, and always carrying the book's
            * name, because they are not the same claim: that one is the page in
            * whichever book the bank was compiled from, this one is a page in a
            * book three readers say they are holding. Printing a bare number
            * for both would merge two different books into one wrong reference.
            */}
          {onPageRef ? (
            <Touchable
              label={
                communityPage
                  ? `Page ${communityPage.page} in ${communityPage.bookName}. Change or add a page reference.`
                  : 'Add a textbook page for this question'
              }
              onPress={() => onPageRef(text, noteQuestionText(question))}
              hitSlop={6}
              style={[
                styles.pageChip,
                {
                  backgroundColor: communityPage
                    ? withAlpha(colors.success, 0.12)
                    : colors.cardElevated,
                  borderColor: communityPage ? colors.success : colors.border,
                },
              ]}
            >
              {/* Label first, icon after it.
                *
                * The icon led, and on the shortest state ("Add textbook page")
                * that put a symbol before the reader had been told what the
                * control was — the eye lands on the glyph, then travels right
                * to find out what it meant. Trailing, it reads as a mark on the
                * end of a phrase, which is what it is. */}
              <Text
                numberOfLines={1}
                style={[
                  styles.pageChipText,
                  { color: communityPage ? colors.success : colors.textMuted },
                ]}
              >
                {communityPage
                  ? myBook
                    ? `p.${communityPage.page}`
                    : `${communityPage.bookName}${
                        communityPage.edition ? ` ${communityPage.edition}` : ''
                      } · p.${communityPage.page}`
                  : 'Add textbook page'}
              </Text>
              <BookOpen
                size={11}
                color={communityPage ? colors.success : colors.textMuted}
              />
            </Touchable>
          ) : null}

          <Text style={[styles.affordanceMcq, { color: colors.cyan }]}>
            DOUBLE TAP FOR MCQS
          </Text>
        </View>

        {/* How many times this has been asked in past papers. */}
        {stars > 0 ? (
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: colors.cardElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.countText, { color: colors.text }]}>
              {stars}
            </Text>
          </View>
        ) : null}
      </View>
    </Touchable>
  );
}

/** Reliable disambiguation window so triple-taps register smoothly on Android touch screens. */
const TAP_WINDOW_MS = 380;

const styles = StyleSheet.create({
  row: {
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    overflow: 'hidden',
  },
  checkboxFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  body: {
    flex: 1,
  },
  affordance: {
    ...typeScale.caption,
    fontWeight: '600',
  },
  text: {
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  affordanceMcq: {
    ...typeScale.caption,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  countBadge: {
    height: 26,
    width: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 4,
    // A long book name must not push the row's width around.
    maxWidth: '100%',
  },
  pageChipText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
});

export const QuestionRow = memo(QuestionRowBase);
