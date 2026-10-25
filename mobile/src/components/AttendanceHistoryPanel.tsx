import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  History,
  Minus,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Sheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { radius, space, TOUCH_MIN } from '@/theme/tokens';
import { springTo, useReducedMotion } from '@/theme/motion';
import { calendarWeeks } from '@/lib/calendarWeeks';
import {
  formatLocalIsoDate,
  parseLocalIsoDate,
  setAttendanceDay,
  setAttendanceCounts,
  updateAttendance,
  type AttendanceItem,
} from '@/lib/attendance';
import {
  countBalance,
  dayState,
  historyTotals,
  type AttendanceDayState,
} from '@/lib/attendanceHistory';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
function monthTitle(key: string) {
  return (
    parseLocalIsoDate(key + '-01')?.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    }) ?? key
  );
}

function CountField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={s.stack}>
      <Text style={[s.caption, { color: colors.textMuted }]}>{label}</Text>
      <View style={s.row}>
        <Touchable
          label={`Decrease ${label}`}
          disabled={disabled || Number(value) <= 0}
          onPress={() =>
            onChange(String(Math.max(0, (Number(value) || 0) - 1)))
          }
          style={[s.icon, { borderColor: colors.border }]}
        >
          <Minus size={18} color={colors.text} />
        </Touchable>
        <TextInput
          accessibilityLabel={label}
          editable={!disabled}
          keyboardType="number-pad"
          value={value}
          onChangeText={onChange}
          style={[
            s.input,
            s.grow,
            { color: colors.text, borderColor: colors.border },
          ]}
        />
        <Touchable
          label={`Increase ${label}`}
          disabled={disabled}
          onPress={() => onChange(String((Number(value) || 0) + 1))}
          style={[s.icon, { borderColor: colors.border }]}
        >
          <Plus size={18} color={colors.text} />
        </Touchable>
      </View>
    </View>
  );
}

export function AttendanceHistoryPanel({ item }: { item: AttendanceItem }) {
  const { colors } = useTheme();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [countsOpen, setCountsOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const today = formatLocalIsoDate(new Date());
  const [month, setMonth] = useState(today.slice(0, 7));
  const [scope, setScope] = useState('earlier');
  const [selected, setSelected] = useState<string | null>(null);
  const [present, setPresent] = useState('0');
  const [absent, setAbsent] = useState('0');
  const [off, setOff] = useState(false);
  const [fromBalance, setFromBalance] = useState(false);
  const [name, setName] = useState(item.name);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const known = historyTotals(item.daily);
  const undated = Math.max(0, item.held - known.present - known.absent);
  const tones: Record<AttendanceDayState, string> = {
    present: colors.success,
    absent: colors.danger,
    mixed: colors.warning,
    off: colors.textMuted,
    unmarked: colors.border,
  };
  const monthOptions = Array.from(
    new Set([today.slice(0, 7), ...Object.keys(item.monthly ?? {})]),
  )
    .sort()
    .reverse();
  const first = parseLocalIsoDate(month + '-01')!;
  const days = Array.from(
    {
      length: new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
    },
    (_, i) => {
      const date = new Date(first.getFullYear(), first.getMonth(), i + 1, 12);
      return {
        iso: formatLocalIsoDate(date),
        number: i + 1,
        dayOfWeek: date.getDay(),
      };
    },
  );
  const weeks = calendarWeeks(days);
  const validCounts =
    /^\d+$/.test(present) &&
    /^\d+$/.test(absent) &&
    Number.isSafeInteger(Number(present)) &&
    Number.isSafeInteger(Number(absent));
  async function perform(action: () => Promise<void>, done?: () => void) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
      done?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  function pickDate(iso: string) {
    const row = item.daily?.[iso];
    setFromBalance(false);
    setSelected(iso);
    setPresent(String(row?.present ?? 0));
    setAbsent(String(row?.absent ?? 0));
    setOff(row?.off ?? false);
    setError('');
  }
  function pickScope(next: string) {
    const balance = countBalance(item, next);
    setScope(next);
    setPresent(String(balance.present));
    setAbsent(String(balance.absent));
    setError('');
  }
  const button = (
    label: string,
    onPress: () => void,
    primary = false,
    disabled = false,
  ) => (
    <Touchable
      key={label}
      label={label}
      disabled={busy || disabled}
      onPress={onPress}
      style={[
        s.button,
        {
          borderColor: colors.border,
          backgroundColor: primary ? colors.accent : colors.cardElevated,
          opacity: busy || disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text
        style={[s.body, { color: primary ? colors.onAccent : colors.text }]}
      >
        {label.startsWith('Edit counts for ') ? 'Edit counts' : label}
      </Text>
    </Touchable>
  );
  const summary = [
    ['Total', item.held],
    ['Attended', item.attended],
    ['Missed', item.held - item.attended],
    ['Off-days', known.off],
    [
      'Current',
      item.held ? `${Math.round((item.attended / item.held) * 100)}%` : '—',
    ],
  ];
  return (
    <View style={s.stack}>
      <View style={s.wrap}>
        <Touchable
          label={`Attendance history for ${item.name}`}
          onPress={() => {
            setSelected(null);
            setError('');
            setHistoryOpen(true);
          }}
          style={[s.button, s.row, { borderColor: colors.border }]}
        >
          <History size={16} color={colors.accent} />
          <Text style={[s.body, { color: colors.accent }]}>History</Text>
        </Touchable>
        {button(`Edit counts for ${item.name}`, () => {
          pickScope(
            countBalance(item, 'earlier').present +
              countBalance(item, 'earlier').absent >
              0 || !Object.keys(item.monthly ?? {}).length
              ? 'earlier'
              : monthOptions[0],
          );
          setCountsOpen(true);
        })}
        <Touchable
          label={`Edit name for ${item.name}`}
          onPress={() => {
            setName(item.name);
            setError('');
            setMetadataOpen(true);
          }}
          style={[s.icon, { borderColor: colors.border }]}
        >
          <Pencil size={16} color={colors.accent} />
        </Touchable>
      </View>
      <Text style={[s.caption, { color: colors.textMuted }]}>
        Missed: {item.held - item.attended}
        {item.updatedAt
          ? ` · Updated ${new Date(item.updatedAt).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : ' · Earlier records kept'}
      </Text>
      <Sheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={`${item.name} · History`}
      >
        <View style={s.stack}>
          <View style={s.wrap}>
            {summary.map(([label, value]) => (
              <View
                key={label}
                style={[s.metric, { backgroundColor: colors.cardElevated }]}
              >
                <Text style={[s.title, { color: colors.text }]}>{value}</Text>
                <Text style={[s.caption, { color: colors.textMuted }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[s.caption, { color: colors.textMuted }]}>
            Off-days show explicitly recorded closures and do not add classes to
            your percentage.
            {undated
              ? ` ${undated} earlier classes have no exact date; their totals are preserved.`
              : ''}
          </Text>
          <View style={s.wrap}>
            {(['present', 'absent', 'mixed', 'off', 'unmarked'] as const).map(
              state => (
                <View key={state} style={s.row}>
                  <View style={[s.dot, { backgroundColor: tones[state] }]} />
                  <Text style={[s.caption, { color: colors.textMuted }]}>
                    {state === 'off'
                      ? 'Off-day'
                      : state[0].toUpperCase() + state.slice(1)}
                  </Text>
                </View>
              ),
            )}
          </View>
          <View style={s.row}>
            <Touchable
              label={`Previous history month for ${item.name}`}
              disabled={busy}
              onPress={() => {
                const d = new Date(
                  first.getFullYear(),
                  first.getMonth() - 1,
                  1,
                  12,
                );
                setMonth(formatLocalIsoDate(d).slice(0, 7));
                setSelected(null);
              }}
              style={s.icon}
            >
              <ChevronLeft size={20} color={colors.text} />
            </Touchable>
            <Text
              style={[
                s.title,
                s.grow,
                { color: colors.text, textAlign: 'center' },
              ]}
            >
              {monthTitle(month)}
            </Text>
            <Touchable
              label={`Next history month for ${item.name}`}
              disabled={busy || month >= today.slice(0, 7)}
              onPress={() => {
                const d = new Date(
                  first.getFullYear(),
                  first.getMonth() + 1,
                  1,
                  12,
                );
                setMonth(formatLocalIsoDate(d).slice(0, 7));
                setSelected(null);
              }}
              style={s.icon}
            >
              <ChevronRight size={20} color={colors.text} />
            </Touchable>
          </View>
          <View style={s.week}>
            {DAYS.map((day, i) => (
              <Text key={i} style={[s.weekday, { color: colors.textMuted }]}>
                {day}
              </Text>
            ))}
          </View>
          <View style={s.stackSmall}>
            {weeks.map((week, i) => (
              <View key={i} style={s.week}>
                {week.map((day, col) => {
                  if (!day) return <View key={`empty-${col}`} style={s.day} />;
                  const state = dayState(item.daily?.[day.iso]);
                  const disabled =
                    busy ||
                    day.iso > today ||
                    (item.kind === 'posting' &&
                      Boolean(
                        (item.startDate && day.iso < item.startDate) ||
                          (item.endDate && day.iso > item.endDate),
                      ));
                  const record = item.daily?.[day.iso];
                  return (
                    <Touchable
                      key={day.iso}
                      label={`${day.iso}, ${state}${
                        record && !record.off
                          ? `, ${record.present} present, ${record.absent} absent`
                          : ''
                      }`}
                      state={{ selected: selected === day.iso, disabled }}
                      disabled={disabled}
                      scale={false}
                      hitSlop={0}
                      onPress={() => pickDate(day.iso)}
                      style={[
                        s.day,
                        {
                          borderColor:
                            selected === day.iso ? colors.accent : tones[state],
                          backgroundColor:
                            state === 'unmarked'
                              ? colors.cardElevated
                              : withAlpha(tones[state], 0.18),
                          opacity: disabled ? 0.3 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.body,
                          {
                            color:
                              state === 'unmarked' ? colors.text : tones[state],
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {day.number}
                      </Text>
                      <Text style={[s.dayMark, { color: tones[state] }]}>
                        {
                          {
                            present: 'P',
                            absent: 'A',
                            mixed: 'M',
                            off: 'O',
                            unmarked: '·',
                          }[state]
                        }
                      </Text>
                    </Touchable>
                  );
                })}
              </View>
            ))}
          </View>
          {!selected && (
            <Text style={[s.body, { color: colors.textMuted }]}>
              Tap a date to enter or correct attendance. Multiple classes can be
              recorded on one day.
            </Text>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Text>
          )}
          {!!selected && (
            <View style={[s.editor, { borderColor: colors.border }]}>
              <Text style={[s.title, { color: colors.text }]}>{selected}</Text>
              <View style={s.wrap}>
                {button('Present day', () => {
                  setPresent('1');
                  setAbsent('0');
                  setOff(false);
                })}
                {button('Absent day', () => {
                  setPresent('0');
                  setAbsent('1');
                  setOff(false);
                })}
                {button('Mixed day', () => {
                  setPresent('1');
                  setAbsent('1');
                  setOff(false);
                })}
                {button('Off-day', () => {
                  setPresent('0');
                  setAbsent('0');
                  setOff(true);
                  setFromBalance(false);
                })}
              </View>
              <Text style={[s.caption, { color: colors.textMuted }]}>
                {off
                  ? 'Off-day selected: excluded from held classes.'
                  : 'Class counts for this date. Saving replaces this date only.'}
              </Text>
              {!off &&
                undated > 0 &&
                !(
                  item.daily?.[selected]?.present ||
                  item.daily?.[selected]?.absent
                ) && (
                  <Touchable
                    label="Use existing attendance balance"
                    role="checkbox"
                    state={{ checked: fromBalance }}
                    disabled={busy}
                    onPress={() => setFromBalance(value => !value)}
                    style={[
                      s.button,
                      {
                        borderColor: fromBalance
                          ? colors.accent
                          : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text }}>
                      {fromBalance ? '✓ ' : ''}Move from existing undated totals
                    </Text>
                    <Text style={[s.caption, { color: colors.textMuted }]}>
                      Dates an earlier class without increasing overall counts.
                    </Text>
                  </Touchable>
                )}
              {!off && (
                <>
                  <CountField
                    label="Present classes on selected date"
                    value={present}
                    onChange={setPresent}
                    disabled={busy}
                  />
                  <CountField
                    label="Absent classes on selected date"
                    value={absent}
                    onChange={setAbsent}
                    disabled={busy}
                  />
                </>
              )}
              {button(
                'Save date attendance',
                () => {
                  void perform(
                    () =>
                      setAttendanceDay(
                        item.id,
                        selected,
                        {
                          present: Number(present),
                          absent: Number(absent),
                          off,
                        },
                        fromBalance,
                      ),
                    () => setSelected(null),
                  );
                },
                true,
                !validCounts,
              )}
              {button('Clear date attendance', () => {
                void perform(
                  () =>
                    setAttendanceDay(item.id, selected, {
                      present: 0,
                      absent: 0,
                      off: false,
                    }),
                  () => setSelected(null),
                );
              })}
            </View>
          )}
        </View>
      </Sheet>
      <Sheet
        visible={countsOpen}
        onClose={() => setCountsOpen(false)}
        title="Edit attendance counts"
      >
        <View style={s.stack}>
          <Text style={[s.body, { color: colors.textMuted }]}>
            Choose the period being corrected. Dated records are protected;
            change them in History.
          </Text>
          <View style={s.wrap}>
            {['earlier', ...monthOptions].map(key =>
              button(
                key === 'earlier'
                  ? 'Earlier balance (no month)'
                  : monthTitle(key),
                () => pickScope(key),
                key === scope,
              ),
            )}
          </View>
          <Text style={[s.title, { color: colors.text }]}>
            {scope === 'earlier'
              ? 'Earlier balance without a month'
              : monthTitle(scope)}
          </Text>
          <CountField
            label="Attended count"
            value={present}
            onChange={setPresent}
            disabled={busy}
          />
          <CountField
            label="Missed count"
            value={absent}
            onChange={setAbsent}
            disabled={busy}
          />
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Text>
          )}
          {button(
            'Save attendance counts',
            () => {
              void perform(
                () =>
                  setAttendanceCounts(
                    item.id,
                    scope,
                    Number(present),
                    Number(absent),
                  ),
                () => setCountsOpen(false),
              );
            },
            true,
            !validCounts,
          )}
        </View>
      </Sheet>
      <Sheet
        visible={metadataOpen}
        onClose={() => setMetadataOpen(false)}
        title="Edit subject name"
      >
        <View style={s.stack}>
          <TextInput
            accessibilityLabel="Attendance subject name"
            value={name}
            onChangeText={setName}
            style={[
              s.input,
              { color: colors.text, borderColor: colors.border },
            ]}
          />
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Text>
          )}
          {button(
            'Save attendance name',
            () => {
              void perform(
                () => updateAttendance(item.id, { name: name.trim() }),
                () => setMetadataOpen(false),
              );
            },
            true,
            !name.trim(),
          )}
        </View>
      </Sheet>
    </View>
  );
}

/** A short horizontal swipe reveals deletion; the caller still asks for confirmation. */
export function SwipeAttendanceCard({
  children,
  label,
  onDelete,
}: {
  children: React.ReactNode;
  label: string;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const translate = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const [open, setOpen] = useState(false);
  const animate = (next: number) => {
    offset.current = next;
    setOpen(next !== 0);
    springTo(translate, next, { reduceMotion }).start();
  };
  const animateRef = useRef(animate);
  animateRef.current = animate;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 16 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.6,
        onPanResponderGrant: () =>
          translate.stopAnimation(value => {
            offset.current = value;
          }),
        onPanResponderMove: (_event, gesture) =>
          translate.setValue(
            Math.max(-80, Math.min(0, offset.current + gesture.dx)),
          ),
        onPanResponderRelease: (_event, gesture) =>
          animateRef.current(offset.current + gesture.dx < -40 ? -80 : 0),
        onPanResponderTerminate: () => animateRef.current(0),
      }),
    [translate],
  );
  return (
    <View
      style={[s.swipe, { backgroundColor: withAlpha(colors.danger, 0.12) }]}
    >
      {open && (
        <Touchable
          label={`Swipe delete ${label}`}
          onPress={() => {
            animate(0);
            onDelete();
          }}
          style={s.delete}
        >
          <Trash2 size={22} color={colors.danger} />
          <Text style={{ color: colors.danger }}>Delete</Text>
        </Touchable>
      )}
      <Animated.View
        {...pan.panHandlers}
        style={{ transform: [{ translateX: translate }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
const s = StyleSheet.create({
  stack: { gap: space.md },
  stackSmall: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  grow: { flex: 1 },
  title: { ...typeScale.bodyStrong },
  body: { ...typeScale.callout },
  caption: { ...typeScale.caption },
  input: {
    ...typeScale.body,
    minHeight: TOUCH_MIN,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: space.sm,
    textAlign: 'center',
  },
  button: {
    minHeight: TOUCH_MIN,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    minWidth: TOUCH_MIN,
    minHeight: TOUCH_MIN,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metric: {
    minWidth: 60,
    flexGrow: 1,
    borderRadius: radius.md,
    padding: space.sm,
    alignItems: 'center',
    gap: space.xs,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  week: { flexDirection: 'row', gap: 2 },
  weekday: { flex: 1, textAlign: 'center', ...typeScale.caption },
  day: {
    flex: 1,
    minHeight: TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  dayMark: { ...typeScale.caption },
  editor: {
    gap: space.md,
    padding: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  swipe: { overflow: 'hidden', borderRadius: radius.lg },
  delete: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
});
