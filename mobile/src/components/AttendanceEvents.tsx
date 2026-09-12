import React, { useCallback, useState, useSyncExternalStore } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { CalendarClock, Plus, Trash2, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Reveal } from '@/components/Reveal';
import { RotationCalendar } from '@/components/RotationCalendar';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { tick } from '@/lib/haptics';
import {
  addAttendanceEvent,
  attendanceEventsVersion,
  daysToEvent,
  EVENT_KINDS,
  getAttendanceEvents,
  kindLabel,
  removeAttendanceEvent,
  subscribeAttendanceEvents,
  type AttendanceEventKind,
} from '@/lib/attendanceEvents';

/**
 * Exams, posting exams and seminars, with a date and a countdown.
 *
 * ## Why it sits in the Attendance tab
 *
 * These have no tally — they are a name and a date, and the only question they
 * answer is how long you have got. But the tab is already where a student goes
 * to ask a question about their timetable, and a seminar in three days is the
 * same kind of worry as a posting that ends on Friday.
 *
 * ## The date is picked, not typed
 *
 * `RotationCalendar` is reused in its range mode with both ends set to the same
 * day, which is what a single date is. A free-text date field means parsing
 * whatever somebody types, in whatever order their country writes it, and
 * getting it wrong silently — the countdown would just be a different number
 * and nothing would say so.
 *
 * ## What reaches the evening reminder
 *
 * The soonest of these and the synced exam, through the digest's existing exam
 * slot. The receiver already says "three days to X", so nothing in Android had
 * to change. See `reminderSync`.
 *
 * It stays on the phone. `check:cloud-ids` holds `attendanceEvents.ts` to that.
 */
export function AttendanceEvents() {
  const { colors } = useTheme();
  useSyncExternalStore(
    subscribeAttendanceEvents,
    attendanceEventsVersion,
    attendanceEventsVersion,
  );
  const events = getAttendanceEvents();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AttendanceEventKind>('exam');
  const [date, setDate] = useState('');

  const reset = useCallback(() => {
    setTitle('');
    setKind('exam');
    setDate('');
    setAdding(false);
  }, []);

  const submit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || date === '') {
      return;
    }
    tick();
    await addAttendanceEvent({ title: trimmed, kind, date });
    reset();
  }, [title, kind, date, reset]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.textMuted }]}>
        EXAMS, POSTING EXAMS AND SEMINARS
      </Text>

      {events.length === 0 && !adding ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Add a date and Orbit counts down to it, and reminds you the evening
          before.
        </Text>
      ) : null}

      {events.map(event => {
        const days = daysToEvent(event);
        const past = days !== null && days < 0;
        /* Inside a week is the point at which it stops being a diary entry. */
        const urgent = days !== null && days >= 0 && days <= 7;
        const tone = urgent ? colors.danger : colors.warning;
        return (
          <View
            key={event.id}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: withAlpha(tone, 0.14) }]}>
              <CalendarClock size={16} color={past ? colors.textMuted : tone} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                {kindLabel(event.kind)} · {event.date}
                {days === null
                  ? ''
                  : past
                    ? ' · done'
                    : days === 0
                      ? ' · today'
                      : days === 1
                        ? ' · tomorrow'
                        : ` · ${days} days`}
              </Text>
            </View>
            <Touchable
              onPress={async () => {
                tick();
                await removeAttendanceEvent(event.id);
              }}
              label={`Remove ${event.title}`}
              style={styles.remove}>
              <Trash2 size={15} color={colors.textMuted} />
            </Touchable>
          </View>
        );
      })}

      <Reveal open={adding}>
        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What is it? e.g. Pharmacology"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Name of the exam or seminar"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <View style={styles.kinds}>
            {EVENT_KINDS.map(entry => {
              const active = entry.key === kind;
              return (
                <Touchable
                  key={entry.key}
                  onPress={() => setKind(entry.key)}
                  label={`It is a ${entry.label.toLowerCase()}`}
                  state={{ selected: active }}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? withAlpha(colors.accent, 0.14) : 'transparent',
                    },
                  ]}>
                  <Text
                    style={[styles.chipText, { color: active ? colors.accent : colors.textMuted }]}>
                    {entry.label}
                  </Text>
                </Touchable>
              );
            })}
          </View>

          {/*
            One day rather than a range: both ends of the picker are set to the
            same date. Reusing the calendar means the date cannot be typed
            wrong, and it is the control the reader already learned when they
            added a posting.
          */}
          <RotationCalendar
            startDate={date}
            endDate={date}
            holidays={[]}
            onChangeRange={from => setDate(from)}
            onToggleHoliday={() => {}}
            mode="range"
            onChangeMode={() => {}}
          />
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {date === '' ? 'Tap the day it happens.' : `On ${date}.`}
          </Text>

          <View style={styles.formRow}>
            <Touchable
              onPress={reset}
              label="Cancel"
              style={[styles.button, { borderColor: colors.border }]}>
              <Text style={[styles.buttonText, { color: colors.textMuted }]}>Cancel</Text>
            </Touchable>
            <Touchable
              onPress={submit}
              label="Add this date"
              style={[styles.button, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={[styles.buttonText, { color: colors.primaryText }]}>Add</Text>
            </Touchable>
          </View>
        </View>
      </Reveal>

      <Touchable
        onPress={() => {
          tick();
          adding ? reset() : setAdding(true);
        }}
        label={adding ? 'Close the date form' : 'Add an exam or seminar date'}
        state={{ expanded: adding }}
        style={[styles.add, { borderColor: colors.border }]}>
        {adding ? (
          <X size={15} color={colors.textMuted} />
        ) : (
          <Plus size={15} color={colors.textMuted} />
        )}
        <Text style={[styles.addText, { color: colors.textMuted }]}>
          {adding ? 'Close' : 'Add an exam or seminar'}
        </Text>
      </Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 18 },
  heading: { ...typeScale.overline },
  empty: { ...typeScale.footnote },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { ...typeScale.bodyStrong },
  rowMeta: { ...typeScale.caption },
  remove: { padding: 6 },
  form: { padding: 12, gap: 10, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typeScale.body,
  },
  kinds: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 7,
  },
  chipText: { ...typeScale.caption, fontWeight: '600' },
  hint: { ...typeScale.footnote },
  formRow: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonText: { ...typeScale.bodyStrong },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addText: { ...typeScale.footnote, fontWeight: '600' },
});
