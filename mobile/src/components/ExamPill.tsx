import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CalendarClock, ChevronDown, Minus } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Reveal } from '@/components/Reveal';
import { ExamCountdownCard } from '@/components/ExamCountdownCard';
import { useExam } from '@/hooks/useExam';
import { daysUntil } from '@/lib/exam';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { tick } from '@/lib/haptics';

/**
 * The exam countdown on the Timer, as a pill you can open.
 *
 * ## What was wrong with the strip it replaces
 *
 * The Timer already drew a countdown, and it was correct — but it only existed
 * once an exam had been set, and the only place to set one is a card in My
 * Progress. So the reader who most needs it, the one who has never set a date,
 * saw nothing at all and had no way to find out the feature existed.
 *
 * The pill is there either way now. With no exam it reads "Set an exam date"
 * and is the control that sets it; with one it reads the countdown, which is
 * what the strip did.
 *
 * ## It expands rather than navigating away
 *
 * Asked for by the app's owner: tap it and it opens, with a button to put it
 * back. Sending somebody to another tab to type a date, mid-session, is how a
 * running timer gets abandoned — and the Timer is the screen where the days
 * remaining actually mean something.
 *
 * What it opens is `ExamCountdownCard`, the same component My Progress uses.
 * Not a second date editor: two of those is two chances for one to write a
 * different shape into the same store, and the store is shared with the web
 * app through `exam_targets`.
 *
 * ## The colour is the deadline, not decoration
 *
 * Amber normally, red inside a week. `danger` and `warning` keep their meaning
 * in every theme by rule, which is exactly why they are the right tokens for a
 * date that is close.
 */
export function ExamPill({ year }: { year?: string }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const exam = useExam(year);
  const days = exam ? daysUntil(exam) : null;

  /* Past exams stop counting rather than going negative. */
  const live = exam !== null && days !== null && days >= 0;
  const urgent = live && days <= 7;
  const tone = urgent ? colors.danger : colors.warning;

  const label = !live
    ? 'Set an exam date'
    : days === 0
      ? `${exam.name} is today`
      : `${days} ${days === 1 ? 'day' : 'days'} to ${exam.name}`;

  return (
    <View style={styles.wrap}>
      <Touchable
        onPress={() => {
          tick();
          setOpen(value => !value);
        }}
        label={open ? 'Hide the exam date' : live ? `${label}. Open the exam date` : 'Set an exam date'}
        hint={open ? undefined : 'Opens the exam countdown'}
        state={{ expanded: open }}
        scaleTo={0.97}
        style={[
          styles.pill,
          {
            backgroundColor: live ? withAlpha(tone, 0.12) : 'transparent',
            borderColor: live ? withAlpha(tone, 0.4) : colors.border,
          },
        ]}>
        <CalendarClock size={15} color={live ? tone : colors.textMuted} />
        <Text
          style={[styles.text, { color: live ? colors.text : colors.textMuted }]}
          numberOfLines={1}>
          {label}
        </Text>
        {/*
          The affordance has to be visible. A pill that silently expands is one
          nobody taps, which is the same defect the note card had when its
          title was the only way to open it.
        */}
        {open ? (
          <Minus size={14} color={colors.textMuted} />
        ) : (
          <ChevronDown size={14} color={colors.textMuted} />
        )}
      </Touchable>

      <Reveal open={open}>
        <View style={styles.card}>
          <ExamCountdownCard year={year} />
          <Touchable
            onPress={() => {
              tick();
              setOpen(false);
            }}
            label="Minimise the exam date"
            style={[styles.minimise, { borderColor: colors.border }]}>
            <Minus size={14} color={colors.textMuted} />
            <Text style={[styles.minimiseText, { color: colors.textMuted }]}>Minimise</Text>
          </Touchable>
        </View>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { ...typeScale.footnote, fontWeight: '600', flexShrink: 1 },
  card: { paddingTop: 10, gap: 8 },
  minimise: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  minimiseText: { ...typeScale.caption, fontWeight: '600' },
});
