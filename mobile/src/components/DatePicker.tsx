import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

/**
 * A month grid, written here rather than taken from a package.
 *
 * `@react-native-community/datetimepicker` would be the obvious choice and is
 * the wrong one for this app: it is a native module, and this project has
 * already shipped one that was invisible under the New Architecture with no
 * crash and nothing in a log. A month grid is a hundred lines of arithmetic
 * with no native side to be missing, and it renders in the preview harness,
 * where a native picker would be a hole in every screenshot.
 *
 * It also gets to look like the rest of the app instead of like Android.
 */

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfDay(at: number): number {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function DatePicker({
  value,
  onChange,
  minDate,
}: {
  /** Epoch ms, or null for nothing chosen yet. */
  value: number | null;
  onChange: (date: number) => void;
  /** Days before this are shown but not selectable. */
  minDate?: number;
}) {
  const { colors } = useTheme();
  const today = startOfDay(Date.now());
  const floor = minDate === undefined ? undefined : startOfDay(minDate);

  // Which month is on screen — the chosen date's, or this one.
  const [cursor, setCursor] = useState(() => {
    const at = new Date(value ?? Date.now());
    return { year: at.getFullYear(), month: at.getMonth() };
  });

  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    // Leading blanks so the 1st lands under its weekday.
    const cells: (number | null)[] = Array(first.getDay()).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day);
    }
    return cells;
  }, [cursor]);

  const step = (by: number) => {
    const next = new Date(cursor.year, cursor.month + by, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Touchable
          label="Previous month"
          onPress={() => step(-1)}
          hitSlop={12}
          scaleTo={0.85}
          style={[styles.arrow, { borderColor: colors.border }]}>
          <ChevronLeft size={18} color={colors.text} />
        </Touchable>
        <Text style={[typeScale.callout, styles.month, { color: colors.text }]}>
          {MONTHS[cursor.month]} {cursor.year}
        </Text>
        <Touchable
          label="Next month"
          onPress={() => step(1)}
          hitSlop={12}
          scaleTo={0.85}
          style={[styles.arrow, { borderColor: colors.border }]}>
          <ChevronRight size={18} color={colors.text} />
        </Touchable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((day, i) => (
          <Text key={i} style={[styles.weekday, { color: colors.textMuted }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {grid.map((day, i) => {
          if (day === null) {
            return <View key={`blank-${i}`} style={styles.cell} />;
          }
          const stamp = new Date(cursor.year, cursor.month, day).getTime();
          const selected = value !== null && startOfDay(value) === stamp;
          const isToday = stamp === today;
          const disabled = floor !== undefined && stamp < floor;

          return (
            <Touchable
              key={day}
              label={`${day} ${MONTHS[cursor.month]} ${cursor.year}`}
              state={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(stamp)}
              scaleTo={0.88}
              style={styles.cell}>
              <View
                style={[
                  styles.day,
                  selected
                    ? { backgroundColor: colors.primary }
                    : isToday
                      ? { borderColor: colors.primary, borderWidth: 1 }
                      : null,
                ]}>
                <Text
                  style={[
                    typeScale.footnote,
                    {
                      color: selected
                        ? colors.primaryText
                        : disabled
                          ? withAlpha(colors.text, 0.25)
                          : colors.text,
                    },
                  ]}>
                  {day}
                </Text>
              </View>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    fontWeight: '600',
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    // Seven equal columns, matching the grid below.
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
