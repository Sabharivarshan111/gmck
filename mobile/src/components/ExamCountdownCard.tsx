import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { DatePicker } from '@/components/DatePicker';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, SPRING, springConfig, useReducedMotion } from '@/theme/motion';
import { CalendarClock } from 'lucide-react-native';
import { daysUntil, setExam } from '@/lib/exam';
import { useExam } from '@/hooks/useExam';
import { tick } from '@/lib/haptics';

/**
 * How long until the exam, and the one place it is set.
 *
 * The count is derived at render rather than stored, because it changes at
 * midnight and nothing would tell a screen left open overnight to recompute
 * it — a stored number would be a day stale by morning, on exactly the screen
 * someone checks first thing.
 */
export function ExamCountdownCard({ year }: { year?: string }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const exam = useExam(year);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState<number | null>(null);

  const days = exam ? daysUntil(exam) : null;
  const urgent = days !== null && days <= 7;

  /**
   * The editor grows in rather than appearing.
   *
   * Height is a layout property and animating it costs a layout pass per
   * frame, so this is opacity and a small translate — the card below moves
   * once, when the tree changes, and the editor slides into the space rather
   * than being revealed by a snapping layout.
   */
  const reveal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      reveal.setValue(editing ? 1 : 0);
      return;
    }
    Animated.timing(reveal, {
      toValue: editing ? 1 : 0,
      duration: editing ? DURATION.base : DURATION.fast,
      easing: EASE.out,
      useNativeDriver: true,
    }).start();
  }, [editing, reduceMotion, reveal]);

  /**
   * The number itself pulses when it changes.
   *
   * Not decoration: the count only ever moves when the day rolls over or an
   * exam is set, and both are worth one moment of attention on a screen that
   * is otherwise static.
   */
  const beat = useRef(new Animated.Value(1)).current;
  const lastDays = useRef(days);
  useEffect(() => {
    if (days === lastDays.current) {
      return;
    }
    lastDays.current = days;
    if (days === null || reduceMotion) {
      return;
    }
    beat.setValue(0.9);
    Animated.spring(beat, {
      toValue: 1,
      ...springConfig(SPRING.momentum),
      useNativeDriver: true,
    }).start();
  }, [days, reduceMotion, beat]);

  const open = useCallback(() => {
    setName(exam?.name ?? '');
    setDate(exam?.date ?? null);
    setEditing(true);
  }, [exam]);

  const save = useCallback(() => {
    if (!date) {
      return;
    }
    setExam({ name: name.trim() || 'Exam', date }, year);
    setEditing(false);
    tick();
  }, [date, name, year]);

  const clear = useCallback(() => {
    setExam(null, year);
    setEditing(false);
  }, [year]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.head}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: withAlpha(urgent ? colors.danger : colors.warning, 0.15),
            },
          ]}>
          <CalendarClock size={18} color={urgent ? colors.danger : colors.warning} />
        </View>

        <View style={styles.flex}>
          <Text style={[typeScale.callout, styles.title, { color: colors.text }]}>
            {exam ? exam.name : 'Exam countdown'}
          </Text>
          {exam && days !== null ? (
            <View style={styles.countRow}>
              <Animated.View style={{ transform: [{ scale: beat }] }}>
                <Text
                  style={[
                    styles.count,
                    { color: urgent ? colors.danger : colors.text },
                  ]}>
                  {days < 0 ? 'Done' : days === 0 ? 'Today' : days}
                </Text>
              </Animated.View>
              {days > 0 ? (
                <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
                  {days === 1 ? 'day to go' : 'days to go'}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
              Set your exam date to see a daily countdown.
            </Text>
          )}
        </View>

        {editing ? null : (
          <Touchable
            label={exam ? 'Change the exam date' : 'Set an exam date'}
            onPress={open}
            style={[styles.action, { borderColor: colors.border }]}>
            <Text style={[typeScale.footnote, { color: colors.text }]}>
              {exam ? 'Change' : 'Set date'}
            </Text>
          </Touchable>
        )}
      </View>

      {editing ? (
        <Animated.View
          style={[
            styles.editor,
            {
              opacity: reveal,
              transform: [
                { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
              ],
            },
          ]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Exam name (e.g. Forensic Paper 1)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            accessibilityLabel="Exam name"
          />

          <DatePicker value={date} onChange={setDate} minDate={Date.now()} />

          <View style={styles.actions}>
            <Touchable
              label="Save the exam date"
              onPress={save}
              disabled={!date}
              style={[
                styles.primary,
                { backgroundColor: date ? colors.primary : withAlpha(colors.text, 0.12) },
              ]}>
              <Text
                style={[
                  typeScale.footnote,
                  styles.primaryText,
                  { color: date ? colors.primaryText : colors.textMuted },
                ]}>
                Save
              </Text>
            </Touchable>
            <Touchable
              label="Cancel"
              onPress={() => setEditing(false)}
              style={[styles.secondary, { borderColor: colors.border }]}>
              <Text style={[typeScale.footnote, { color: colors.text }]}>Cancel</Text>
            </Touchable>
            {exam ? (
              <Touchable label="Remove the exam" onPress={clear} style={styles.clear}>
                <Text style={[typeScale.footnote, { color: colors.danger }]}>Remove</Text>
              </Touchable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  count: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  action: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editor: {
    gap: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primary: {
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  primaryText: {
    fontWeight: '600',
  },
  secondary: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  clear: {
    marginLeft: 'auto',
    paddingVertical: 10,
  },
});
