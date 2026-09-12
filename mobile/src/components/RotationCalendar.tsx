import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { onColor } from '@/theme/color';
import { typeScale } from '@/theme/typography';
import { tick } from '@/lib/haptics';
import { isoDate, parseDate } from '@/lib/attendance';

/**
 * The month grid a posting is entered on — its dates, and the days off inside
 * it.
 *
 * ## Why a calendar replaced a number
 *
 * The form used to ask "How many days does it run?", which is a subtraction the
 * reader does not have the numbers for. A college hands a rotation out as two
 * dates on a noticeboard, and turning those into a count means deciding whether
 * both ends are included — a question nobody should have to answer, and one
 * that is wrong by one about half the time.
 *
 * It also quietly fixed a worse bug: `startDate` used to be stamped with TODAY
 * whenever a posting was added, so anybody entering a rotation they were
 * already three weeks into had the whole thing measured from the wrong end.
 *
 * ## Holidays are marked, never guessed
 *
 * A holiday nobody subtracted is a day of margin somebody believes they have
 * and does not — the same failure as forgetting the Sundays, which is already
 * handled. So any date inside the range can be tapped off.
 *
 * What this deliberately does NOT do is fetch a holiday list. India's fixed
 * national holidays are offered by name (`FIXED_HOLIDAYS`) and everything else
 * is asked about, because the holidays that actually close a medical college
 * are its own and its state's, they move against the Gregorian calendar, and a
 * calendar pre-filled with dates that are wrong is worse than a blank one. It
 * would also mean sending somebody's posting dates to a server, and nothing on
 * this screen leaves the phone.
 *
 * ## Two modes rather than a hidden gesture
 *
 * Setting the range and marking days off are separate modes with a visible
 * switch. A long-press would be quicker for whoever knows about it and
 * unreachable for everybody else, TalkBack users first.
 *
 * The week starts on Monday so the working week reads as one block and Sunday
 * sits at the end, next to the rule that takes it out.
 */

export type CalendarMode = 'range' | 'holidays';

export interface RotationCalendarProps {
  /** ISO date, or '' while nothing is chosen yet. */
  startDate: string;
  endDate: string;
  /** ISO dates inside the range that are not working days. */
  holidays: string[];
  onChangeRange: (start: string, end: string) => void;
  onToggleHoliday: (iso: string) => void;
  mode: CalendarMode;
  onChangeMode: (mode: CalendarMode) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Monday-first column for a date, 0-6. `getDay()` is Sunday-first. */
function column(day: Date): number {
  return (day.getDay() + 6) % 7;
}

/** Every cell of the month grid, with leading blanks for the first week. */
function gridFor(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < column(first); i += 1) {
    cells.push(null);
  }
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d += 1) {
    cells.push(new Date(year, month, d));
  }
  return cells;
}

export function RotationCalendar({
  startDate,
  endDate,
  holidays,
  onChangeRange,
  onToggleHoliday,
  mode,
  onChangeMode,
}: RotationCalendarProps) {
  const { colors } = useTheme();
  const today = useMemo(() => new Date(), []);
  /*
   * The month on screen opens on the rotation's start when there is one, so
   * reopening a posting does not land the reader in the current month with
   * their own dates somewhere off-screen.
   */
  const opening = parseDate(startDate) ?? today;
  const [cursor, setCursor] = useState(() => new Date(opening.getFullYear(), opening.getMonth(), 1));

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const cells = useMemo(
    () => gridFor(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const step = (by: number) => {
    setCursor(current => new Date(current.getFullYear(), current.getMonth() + by, 1));
  };

  const press = (day: Date) => {
    const iso = isoDate(day);
    tick();
    if (mode === 'holidays') {
      onToggleHoliday(iso);
      return;
    }
    /*
     * First tap sets the start. Second sets the end — unless it lands before
     * the start, which is far more likely to be somebody restarting than
     * somebody entering a backwards rotation, so it becomes the new start.
     * A complete range starts over, because the alternative is a trapped
     * reader with no way to correct a range except leaving the screen.
     */
    if (!start || (start && end)) {
      onChangeRange(iso, '');
      return;
    }
    if (day.getTime() < start.getTime()) {
      onChangeRange(iso, '');
      return;
    }
    onChangeRange(startDate, iso);
  };

  const modeChip = (value: CalendarMode, text: string, label: string) => {
    const active = mode === value;
    return (
      <Touchable
        onPress={() => onChangeMode(value)}
        label={label}
        state={{ selected: active }}
        style={[
          styles.modeChip,
          {
            borderColor: active ? colors.accent : colors.border,
            backgroundColor: active ? withAlpha(colors.accent, 0.14) : 'transparent',
          },
        ]}>
        <Text style={[styles.modeText, { color: active ? colors.accent : colors.textMuted }]}>
          {text}
        </Text>
      </Touchable>
    );
  };

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <View style={styles.modes}>
        {modeChip('range', 'Set dates', 'Set the rotation dates')}
        {modeChip('holidays', 'Mark days off', 'Mark days off inside the rotation')}
      </View>

      <View style={styles.header}>
        <Touchable
          onPress={() => step(-1)}
          label="Previous month"
          style={[styles.arrow, { borderColor: colors.border }]}>
          <ChevronLeft size={16} color={colors.text} />
        </Touchable>
        <Text style={[styles.month, { color: colors.text }]}>
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </Text>
        <Touchable
          onPress={() => step(1)}
          label="Next month"
          style={[styles.arrow, { borderColor: colors.border }]}>
          <ChevronRight size={16} color={colors.text} />
        </Touchable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((letter, index) => (
          <Text
            key={`${letter}-${index}`}
            style={[styles.weekday, { color: colors.textMuted }]}
            // The row is decoration: TalkBack reads each date in full, so
            // seven bare letters in front of it are noise.
            accessibilityElementsHidden
            importantForAccessibility="no">
            {letter}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }
          const iso = isoDate(day);
          const inRange =
            !!start && !!end && day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
          const isStart = !!start && day.getTime() === start.getTime();
          const isEnd = !!end && day.getTime() === end.getTime();
          const edge = isStart || isEnd;
          const holiday = holidays.indexOf(iso) !== -1;
          const sunday = day.getDay() === 0;
          const isToday = isoDate(today) === iso;

          /*
           * A day off is drawn struck through rather than merely dimmed. Dim
           * is what the cells outside the range already are, and a reader
           * cannot be asked to tell two greys apart to know whether their
           * margin is right.
           */
          const background = edge
            ? colors.accent
            : holiday
              ? withAlpha(colors.danger, 0.18)
              : inRange
                ? withAlpha(colors.accent, 0.12)
                : 'transparent';
          const ink = edge
            ? onColor(colors.accent)
            : holiday
              ? colors.danger
              : inRange
                ? colors.text
                : sunday
                  ? colors.textMuted
                  : colors.text;

          const spoken = `${day.getDate()} ${MONTHS[day.getMonth()]} ${day.getFullYear()}`;
          const said = holiday
            ? `${spoken}, marked as a day off`
            : isStart
              ? `${spoken}, the first day`
              : isEnd
                ? `${spoken}, the last day`
                : spoken;

          return (
            <Touchable
              key={iso}
              onPress={() => press(day)}
              label={said}
              hint={mode === 'holidays' ? 'Tap to mark this day off' : undefined}
              state={{ selected: inRange || edge }}
              scaleTo={0.88}
              style={[styles.cell, styles.day, { backgroundColor: background }]}>
              <Text
                style={[
                  styles.dayText,
                  { color: ink },
                  holiday && styles.struck,
                  isToday && styles.today,
                ]}>
                {day.getDate()}
              </Text>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 10, gap: 8 },
  modes: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 7,
  },
  modeText: { ...typeScale.caption, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  month: { ...typeScale.title3 },
  week: { flexDirection: 'row' },
  weekday: { ...typeScale.caption, flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // Seven to a row, and the height matches so the grid stays square-ish
  // whatever the text scale is doing.
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  dayText: { ...typeScale.footnote },
  struck: { textDecorationLine: 'line-through' },
  today: { fontWeight: '800' },
});
