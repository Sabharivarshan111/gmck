import React, { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Plus,
  Sparkles,
  Stethoscope,
  Trash2,
  Undo2,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { useTheme, withAlpha } from '@/theme';
import { onColor } from '@/theme/color';
import { typeScale } from '@/theme/typography';
import { tick } from '@/lib/haptics';
import {
  addAttendance,
  attendanceVersion,
  bestPossible,
  dayOfRotation,
  getAttendance,
  formatLocalIsoDate,
  getHolidayTitle,
  getMonthlyAttendance,
  markAttendance,
  parseLocalIsoDate,
  postingDurationDays,
  postingEndDate,
  percentOf,
  removeAttendance,
  setMonthlyTotalClasses,
  subscribeAttendance,
  undoAttendance,
  updateAttendance,
  verdictFor,
  workingDays,
  type AttendanceItem,
  type AttendanceKind,
} from '@/lib/attendance';

const TARGETS = [65, 75, 80];

const THEORY_SUGGESTIONS = [
  'Pathology',
  'Pharmacology',
  'Microbiology',
  'Forensic Medicine',
  'Community Medicine',
  'General Medicine',
  'General Surgery',
  'OBGYN',
  'Paediatrics',
  'Anatomy',
  'Physiology',
  'Biochemistry',
];

const POSTING_SUGGESTIONS = [
  'Paediatrics',
  'General Medicine',
  'General Surgery',
  'OBGYN',
  'Orthopaedics',
  'Ophthalmology',
  'ENT',
  'Casualty / Emergency',
  'Dermatology',
  'Psychiatry',
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Interactive Mini-Calendar for postings and college-specific holiday overrides. */
function RotationCalendar({
  startDateStr,
  totalDays,
  skipSundays,
  skipSaturdays,
  prepaidHolidays,
  customHolidays = [],
  gazettedWorkingDays = [],
  onToggleHoliday,
  onToggleGazettedWorkingDay,
  editable = true,
}: {
  startDateStr: string;
  totalDays: number;
  skipSundays: boolean;
  skipSaturdays: boolean;
  prepaidHolidays: boolean;
  customHolidays?: string[];
  gazettedWorkingDays?: string[];
  onToggleHoliday?: (isoDate: string) => void;
  onToggleGazettedWorkingDay?: (isoDate: string) => void;
  editable?: boolean;
}) {
  const { colors } = useTheme();
  const officialTap = useRef<Record<string, number>>({});

  const days = useMemo(() => {
    if (!startDateStr || !totalDays || totalDays <= 0) return [];
    const start = parseLocalIsoDate(startDateStr);
    if (!start) return [];

    const items = [];
    for (let i = 0; i < totalDays; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = formatLocalIsoDate(d);
      const dayOfWeek = d.getDay();
      const isSun = dayOfWeek === 0;
      const isSat = dayOfWeek === 6;
      const holidayTitle = getHolidayTitle(iso);
      const isGazetted = Boolean(holidayTitle);
      const isGazettedOverride = gazettedWorkingDays.includes(iso);
      const activeGazetted = prepaidHolidays && isGazetted && !isGazettedOverride;
      const isCustomHoliday = customHolidays.includes(iso);
      const isOff =
        (skipSundays && isSun) ||
        (skipSaturdays && isSat) ||
        activeGazetted ||
        isCustomHoliday;
      items.push({
        iso,
        date: d,
        dayNum: d.getDate(),
        monthShort: d.toLocaleString('en-US', { month: 'short' }),
        dayOfWeek,
        isSun,
        isSat,
        isGazetted,
        isGazettedOverride,
        activeGazetted,
        holidayTitle,
        isCustomHoliday,
        isOff,
      });
    }
    return items;
  }, [
    startDateStr,
    totalDays,
    skipSundays,
    skipSaturdays,
    prepaidHolidays,
    customHolidays,
    gazettedWorkingDays,
  ]);

  if (days.length === 0) return null;

  const sundaysCount = days.filter(d => d.isSun).length;
  const saturdaysCount = days.filter(d => d.isSat).length;
  const gazettedCount = days.filter(
    d =>
      d.activeGazetted &&
      (!d.isSun || !skipSundays) &&
      (!d.isSat || !skipSaturdays),
  ).length;
  const overriddenCount = days.filter(d => d.isGazetted && d.isGazettedOverride).length;
  const rainCount = days.filter(
    d =>
      (!d.isSun || !skipSundays) &&
      (!d.isSat || !skipSaturdays) &&
      !d.activeGazetted &&
      d.isCustomHoliday,
  ).length;
  const workingCount = days.filter(d => !d.isOff).length;

  const toggleOfficial = (iso: string) => {
    if (!editable) return;
    onToggleGazettedWorkingDay?.(iso);
  };

  const handlePress = (d: (typeof days)[number]) => {
    if (!editable) return;
    if (d.isGazetted && prepaidHolidays) {
      const now = Date.now();
      const previous = officialTap.current[d.iso] ?? 0;
      officialTap.current[d.iso] = now;
      if (now - previous <= 450) {
        officialTap.current[d.iso] = 0;
        toggleOfficial(d.iso);
      }
      return;
    }
    onToggleHoliday?.(d.iso);
  };

  return (
    <View style={[styles.calendarContainer, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}>
      <View style={styles.calendarHeader}>
        <View style={styles.calendarTitleRow}>
          <CalendarClock size={16} color={colors.accent} />
          <Text style={[styles.calendarTitle, { color: colors.text }]}>Rotation Calendar & Holidays</Text>
        </View>
        <Text style={[styles.calendarSummary, { color: colors.textMuted }]}>
          {totalDays} days · {workingCount} working days
        </Text>
      </View>

      <View style={styles.calendarWeekRow}>
        {WEEKDAY_NAMES.map((name, i) => (
          <Text key={i} style={[styles.calendarWeekCol, { color: i === 6 ? colors.danger : colors.textMuted }]}>
            {name}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map(d => {
          const selected = d.isCustomHoliday;
          const official = d.activeGazetted;
          const overridden = d.isGazetted && d.isGazettedOverride;
          const weekendOff = (d.isSun && skipSundays) || (d.isSat && skipSaturdays);
          return (
            <Touchable
              key={d.iso}
              onPress={() => handlePress(d)}
              disabled={!editable}
              label={`${d.monthShort} ${d.dayNum}${d.holidayTitle ? ` - ${d.holidayTitle}` : ''}${d.isOff ? ' - Holiday' : ' - Working day'}`}
              hint={
                d.isGazetted && prepaidHolidays
                  ? 'Double tap to switch this official holiday between holiday and working day for this posting'
                  : 'Tap to add or remove a college-specific holiday'
              }
              accessibilityActions={
                d.isGazetted && prepaidHolidays
                  ? [{ name: 'toggleOfficialHoliday', label: overridden ? 'Restore government holiday' : 'Treat as working day' }]
                  : undefined
              }
              onAccessibilityAction={name => {
                if (name === 'toggleOfficialHoliday') toggleOfficial(d.iso);
              }}
              style={[
                styles.calendarCell,
                {
                  borderColor: selected
                    ? colors.accent
                    : official
                      ? colors.warning
                      : overridden
                        ? colors.success
                      : d.isSun && skipSundays
                        ? withAlpha(colors.danger, 0.4)
                        : colors.border,
                  backgroundColor: selected
                    ? withAlpha(colors.accent, 0.22)
                    : official
                      ? withAlpha(colors.warning, 0.16)
                      : overridden
                        ? withAlpha(colors.success, 0.08)
                      : d.isSun && skipSundays
                        ? withAlpha(colors.danger, 0.08)
                        : weekendOff
                          ? withAlpha(colors.textMuted, 0.06)
                          : colors.card,
                },
              ]}>
              <Text
                style={[
                  styles.calendarCellText,
                  {
                    color: selected
                      ? colors.accent
                      : official
                        ? colors.warning
                        : overridden
                          ? colors.success
                        : d.isSun && skipSundays
                          ? colors.danger
                          : colors.text,
                    fontWeight: selected || d.isGazetted ? '700' : '500',
                  },
                ]}>
                {d.dayNum}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.calendarCellTag,
                  {
                    color: selected
                      ? colors.accent
                      : official
                        ? colors.warning
                        : overridden
                          ? colors.success
                        : d.isSun && skipSundays
                          ? colors.danger
                          : colors.textMuted,
                  },
                ]}>
                {selected
                  ? 'Rain/Event'
                  : overridden
                    ? 'Working*'
                    : official
                      ? 'TN Govt'
                      : d.isSun && skipSundays
                        ? 'Sun'
                        : d.isSat && skipSaturdays
                          ? 'Sat'
                          : d.monthShort}
              </Text>
            </Touchable>
          );
        })}
      </View>

      <View style={styles.calendarLegend}>
        {skipSundays ? (
          <View style={[styles.legendChip, { backgroundColor: withAlpha(colors.danger, 0.1) }]}>
            <Text style={[styles.legendText, { color: colors.danger }]}>{sundaysCount} Sundays off</Text>
          </View>
        ) : null}
        {skipSaturdays ? (
          <View style={[styles.legendChip, { backgroundColor: withAlpha(colors.textMuted, 0.1) }]}>
            <Text style={[styles.legendText, { color: colors.textMuted }]}>{saturdaysCount} Saturdays off</Text>
          </View>
        ) : null}
        {prepaidHolidays && gazettedCount > 0 ? (
          <View style={[styles.legendChip, { backgroundColor: withAlpha(colors.warning, 0.12) }]}>
            <Text style={[styles.legendText, { color: colors.warning }]}>
              {gazettedCount} TN Govt holiday{gazettedCount > 1 ? 's' : ''}
            </Text>
          </View>
        ) : null}
        {overriddenCount > 0 ? (
          <View style={[styles.legendChip, { backgroundColor: withAlpha(colors.success, 0.08) }]}>
            <Text style={[styles.legendText, { color: colors.success }]}>
              {overriddenCount} govt holiday{overriddenCount > 1 ? 's' : ''} treated as working
            </Text>
          </View>
        ) : null}
        {rainCount > 0 ? (
          <View style={[styles.legendChip, { backgroundColor: withAlpha(colors.accent, 0.15) }]}>
            <Text style={[styles.legendText, { color: colors.accent }]}>
              {rainCount} Rain/Event holiday{rainCount > 1 ? 's' : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {editable ? (
        <Text style={[styles.calendarHint, { color: colors.textMuted }]}>
          💡 Tap a normal date for a college closure. Double-tap a yellow TN Govt date to treat it as working; double-tap again to restore it.
        </Text>
      ) : null}
    </View>
  );
}

export function AttendanceTab() {
  const { colors } = useTheme();
  useSyncExternalStore(subscribeAttendance, attendanceVersion, attendanceVersion);
  const { items, hydrated } = getAttendance();

  const [kind, setKind] = useState<AttendanceKind>('theory');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [totalClassesStr, setTotalClassesStr] = useState('');
  const [startDate, setStartDate] = useState(() => formatLocalIsoDate(new Date()));
  const [days, setDays] = useState('28');
  const [endDate, setEndDate] = useState(
    () => postingEndDate(formatLocalIsoDate(new Date()), 28) ?? formatLocalIsoDate(new Date()),
  );
  const [skipSundays, setSkipSundays] = useState(true);
  const [skipSaturdays, setSkipSaturdays] = useState(false);
  const [prepaidHolidays, setPrepaidHolidays] = useState(true);
  const [customHolidays, setCustomHolidays] = useState<string[]>([]);
  const [gazettedWorkingDays, setGazettedWorkingDays] = useState<string[]>([]);
  const [target, setTarget] = useState(75);
  /** The last mark per item, so Undo knows what it is taking back. */
  const [lastMark, setLastMark] = useState<Record<string, boolean>>({});

  const shown = items.filter(item => item.kind === kind);

  const toggleFormHoliday = useCallback((iso: string) => {
    setCustomHolidays(prev => (prev.includes(iso) ? prev.filter(x => x !== iso) : [...prev, iso]));
  }, []);

  const toggleFormGazettedWorkingDay = useCallback((iso: string) => {
    setGazettedWorkingDays(prev =>
      prev.includes(iso) ? prev.filter(x => x !== iso) : [...prev, iso],
    );
  }, []);

  const changeStartDate = useCallback((next: string) => {
    setStartDate(next);
    const calculated = postingEndDate(next, Number(days));
    if (calculated) setEndDate(calculated);
  }, [days]);

  const changeDays = useCallback((next: string) => {
    setDays(next);
    const calculated = postingEndDate(startDate, Number(next));
    if (calculated) setEndDate(calculated);
  }, [startDate]);

  const changeEndDate = useCallback((next: string) => {
    setEndDate(next);
    const calculated = postingDurationDays(startDate, next);
    if (calculated) setDays(String(calculated));
  }, [startDate]);

  const submit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const total = Number(days);
    const hasTotal = kind === 'posting' && Number.isFinite(total) && total > 0;
    const totalClassesNum =
      kind === 'theory' && totalClassesStr.trim()
        ? Math.max(1, Math.round(Number(totalClassesStr) || 0))
        : undefined;

    const calculatedEnd =
      hasTotal && startDate ? postingEndDate(startDate, total) ?? undefined : undefined;

    await addAttendance({
      name: trimmed,
      kind,
      target,
      totalClasses: totalClassesNum,
      totalDays: hasTotal ? total : undefined,
      startDate: kind === 'posting' ? startDate : undefined,
      endDate: calculatedEnd,
      skipSundays: kind === 'posting' && skipSundays ? true : undefined,
      skipSaturdays: kind === 'posting' && skipSaturdays ? true : undefined,
      prepaidHolidays: kind === 'posting' && prepaidHolidays ? true : undefined,
      gazettedWorkingDays:
        kind === 'posting' && gazettedWorkingDays.length > 0 ? gazettedWorkingDays : undefined,
      holidays: kind === 'posting' && customHolidays.length > 0 ? customHolidays : undefined,
    });
    setName('');
    setTotalClassesStr('');
    setDays('28');
    setEndDate(postingEndDate(startDate, 28) ?? endDate);
    setCustomHolidays([]);
    setGazettedWorkingDays([]);
    setAdding(false);
  }, [
    name,
    totalClassesStr,
    days,
    kind,
    target,
    startDate,
    endDate,
    skipSundays,
    skipSaturdays,
    prepaidHolidays,
    customHolidays,
    gazettedWorkingDays,
  ]);

  const mark = useCallback(async (item: AttendanceItem, present: boolean) => {
    tick();
    setLastMark(current => ({ ...current, [item.id]: present }));
    await markAttendance(item.id, present);
  }, []);

  return (
    <KeyboardSafe>
      <View style={styles.wrap}>
        {/* Theory or clinical postings switcher */}
        <View style={[styles.switch, { backgroundColor: colors.cardElevated }]}>
          {(
            [
              { key: 'theory' as const, label: 'Theory', Icon: GraduationCap },
              { key: 'posting' as const, label: 'Clinical postings', Icon: Stethoscope },
            ]
          ).map(option => {
            const active = option.key === kind;
            return (
              <Touchable
                key={option.key}
                onPress={() => setKind(option.key)}
                role="tab"
                label={option.label}
                state={{ selected: active }}
                scale={false}
                style={[styles.switchTab, active && { backgroundColor: colors.background }]}>
                <option.Icon size={15} color={active ? colors.text : colors.textMuted} />
                <Text
                  numberOfLines={1}
                  style={[styles.switchText, { color: active ? colors.text : colors.textMuted }]}>
                  {option.label}
                </Text>
              </Touchable>
            );
          })}
        </View>

        {shown.length === 0 && hydrated ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {kind === 'theory' ? 'No theory subjects yet' : 'No clinical postings yet'}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
              {kind === 'theory'
                ? 'Add a subject below, then tap Present or Absent after class. Orbit calculates your safe bunks and exam eligibility.'
                : 'Add a rotation with start and end dates. Orbit can exclude Sundays, optional Saturdays and Tamil Nadu government holidays, lets you mark college closures, and calculates safe bunks.'}
            </Text>
          </View>
        ) : null}

        {shown.map(item => (
          <AttendanceCard
            key={item.id}
            item={item}
            onMark={mark}
            onSetTotalClasses={async next => updateAttendance(item.id, { totalClasses: next })}
            onSetMonthlyTotalClasses={async (monthKey, next) =>
              setMonthlyTotalClasses(item.id, monthKey, next)
            }
            onUndo={async () => {
              const was = lastMark[item.id];
              await undoAttendance(item.id, was ?? true);
            }}
            onTarget={async next => updateAttendance(item.id, { target: next })}
            onRemove={async () => removeAttendance(item.id)}
            onUpdateHolidays={async nextHolidays =>
              updateAttendance(item.id, { holidays: nextHolidays })
            }
            onUpdateGazettedWorkingDays={async nextDays =>
              updateAttendance(item.id, { gazettedWorkingDays: nextDays })
            }
          />
        ))}

        {adding ? (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Quick subject / posting suggestion pills */}
            <View>
              <Text style={[styles.formLabel, { color: colors.textMuted }]}>QUICK SUGGESTIONS</Text>
              <View style={styles.suggestionRow}>
                {(kind === 'theory' ? THEORY_SUGGESTIONS : POSTING_SUGGESTIONS).map(sug => (
                  <Touchable
                    key={sug}
                    onPress={() => setName(sug)}
                    label={`Select ${sug}`}
                    style={[
                      styles.suggestionChip,
                      {
                        borderColor: name === sug ? colors.accent : colors.border,
                        backgroundColor: name === sug ? withAlpha(colors.accent, 0.15) : 'transparent',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.suggestionText,
                        { color: name === sug ? colors.accent : colors.textMuted },
                      ]}>
                      {sug}
                    </Text>
                  </Touchable>
                ))}
              </View>
            </View>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={kind === 'theory' ? 'Subject, e.g. Pathology' : 'Posting, e.g. Paediatrics'}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={kind === 'theory' ? 'Subject name' : 'Posting name'}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />

            {kind === 'theory' ? (
              <View style={styles.totalClassesSection}>
                <Text style={[styles.formLabel, { color: colors.textMuted }]}>
                  TOTAL NUMBER OF CLASSES — ALL MONTHS (OPTIONAL)
                </Text>
                <View style={styles.totalPresets}>
                  {['60', '80', '100', '120', '150'].map(cnt => {
                    const active = totalClassesStr === cnt;
                    return (
                      <Touchable
                        key={cnt}
                        onPress={() => setTotalClassesStr(active ? '' : cnt)}
                        label={`Set ${cnt} total classes`}
                        style={[
                          styles.totalPresetChip,
                          {
                            borderColor: active ? colors.accent : colors.border,
                            backgroundColor: active ? withAlpha(colors.accent, 0.18) : 'transparent',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.totalPresetText,
                            {
                              color: active ? colors.accent : colors.textMuted,
                              fontWeight: active ? '700' : '500',
                            },
                          ]}>
                          {cnt}
                        </Text>
                      </Touchable>
                    );
                  })}
                </View>
                <TextInput
                  value={totalClassesStr}
                  onChangeText={setTotalClassesStr}
                  keyboardType="number-pad"
                  placeholder="e.g. 100 classes in total"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Total number of theory classes across all months"
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
            ) : null}

            {kind === 'posting' ? (
              <>
                <View style={styles.rowTwoCols}>
                  <View style={styles.flexOne}>
                    <Text style={[styles.formLabel, { color: colors.textMuted }]}>START DATE (YYYY-MM-DD)</Text>
                    <TextInput
                      value={startDate}
                      onChangeText={changeStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel="Posting start date"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                  </View>
                  <View style={styles.flexOne}>
                    <Text style={[styles.formLabel, { color: colors.textMuted }]}>END DATE (YYYY-MM-DD)</Text>
                    <TextInput
                      value={endDate}
                      onChangeText={changeEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel="Posting end date"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                  </View>
                </View>
                <View>
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>DURATION (CALENDAR DAYS)</Text>
                  <TextInput
                    value={days}
                    onChangeText={changeDays}
                    keyboardType="number-pad"
                    placeholder="e.g. 28"
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Posting duration in calendar days"
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>

                {/* Sunday toggle */}
                <Touchable
                  onPress={() => setSkipSundays(v => !v)}
                  label="Sundays do not count"
                  role="checkbox"
                  state={{ checked: skipSundays }}
                  style={[styles.checkboxRow, { borderColor: colors.border }]}>
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        borderColor: skipSundays ? colors.accent : colors.border,
                        backgroundColor: skipSundays ? colors.accent : 'transparent',
                      },
                    ]}>
                    {skipSundays ? <Check size={12} color={colors.onAccent} /> : null}
                  </View>
                  <View style={styles.flexOne}>
                    <Text style={[styles.checkboxTitle, { color: colors.text }]}>
                      Sundays do not count
                    </Text>
                    <Text style={[styles.checkboxSub, { color: colors.textMuted }]}>
                      Automatically excludes Sundays from required working days
                    </Text>
                  </View>
                </Touchable>

                <Touchable
                  onPress={() => setSkipSaturdays(v => !v)}
                  label="Saturdays do not count"
                  role="checkbox"
                  state={{ checked: skipSaturdays }}
                  style={[styles.checkboxRow, { borderColor: colors.border }]}>
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        borderColor: skipSaturdays ? colors.accent : colors.border,
                        backgroundColor: skipSaturdays ? colors.accent : 'transparent',
                      },
                    ]}>
                    {skipSaturdays ? <Check size={12} color={colors.onAccent} /> : null}
                  </View>
                  <View style={styles.flexOne}>
                    <Text style={[styles.checkboxTitle, { color: colors.text }]}>
                      Saturdays do not count
                    </Text>
                    <Text style={[styles.checkboxSub, { color: colors.textMuted }]}>
                      Optional — turn this on only when your posting has Saturdays off
                    </Text>
                  </View>
                </Touchable>

                {/* Tamil Nadu Government Holiday toggle */}
                <Touchable
                  onPress={() => setPrepaidHolidays(v => !v)}
                  label="Tamil Nadu government holidays do not count"
                  role="checkbox"
                  state={{ checked: prepaidHolidays }}
                  style={[styles.checkboxRow, { borderColor: colors.border }]}>
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        borderColor: prepaidHolidays ? colors.accent : colors.border,
                        backgroundColor: prepaidHolidays ? colors.accent : 'transparent',
                      },
                    ]}>
                    {prepaidHolidays ? <Check size={12} color={colors.onAccent} /> : null}
                  </View>
                  <View style={styles.flexOne}>
                    <Text style={[styles.checkboxTitle, { color: colors.text }]}>
                      Tamil Nadu government holidays do not count
                    </Text>
                    <Text style={[styles.checkboxSub, { color: colors.textMuted }]}>
                      Uses the Tamil Nadu Government 2026 public-holiday calendar
                    </Text>
                  </View>
                </Touchable>

                {/* Interactive Mini-Calendar */}
                {Number(days) > 0 ? (
                  <RotationCalendar
                    startDateStr={startDate}
                    totalDays={Number(days)}
                    skipSundays={skipSundays}
                    skipSaturdays={skipSaturdays}
                    prepaidHolidays={prepaidHolidays}
                    customHolidays={customHolidays}
                    gazettedWorkingDays={gazettedWorkingDays}
                    onToggleHoliday={toggleFormHoliday}
                    onToggleGazettedWorkingDay={toggleFormGazettedWorkingDay}
                    editable={true}
                  />
                ) : null}
              </>
            ) : null}

            <Text style={[styles.formLabel, { color: colors.textMuted }]}>
              REQUIRED ATTENDANCE TARGET
            </Text>
            <View style={styles.targets}>
              {TARGETS.map(value => {
                const active = value === target;
                return (
                  <Touchable
                    key={value}
                    onPress={() => setTarget(value)}
                    label={`Require ${value} percent`}
                    state={{ selected: active }}
                    style={[
                      styles.chip,
                      styles.chipWide,
                      {
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active ? withAlpha(colors.accent, 0.14) : 'transparent',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.accent : colors.textMuted },
                      ]}>
                      {value}%
                    </Text>
                  </Touchable>
                );
              })}
            </View>

            <View style={styles.formRow}>
              <Touchable
                onPress={() => {
                  setAdding(false);
                  setName('');
                  setDays('28');
                  setEndDate(postingEndDate(startDate, 28) ?? endDate);
                  setCustomHolidays([]);
                  setGazettedWorkingDays([]);
                }}
                label="Cancel"
                style={[styles.formButton, { borderColor: colors.border }]}>
                <Text style={[styles.formButtonText, { color: colors.textMuted }]}>Cancel</Text>
              </Touchable>
              <Touchable
                onPress={submit}
                label={kind === 'theory' ? 'Add this subject' : 'Add this posting'}
                style={[
                  styles.formButton,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}>
                <Text style={[styles.formButtonText, { color: colors.primaryText }]}>Add</Text>
              </Touchable>
            </View>
          </View>
        ) : (
          <Touchable
            onPress={() => setAdding(true)}
            label={kind === 'theory' ? 'Add a subject' : 'Add a posting'}
            style={[styles.add, { borderColor: colors.border }]}>
            <Plus size={16} color={colors.accent} />
            <Text style={[styles.addText, { color: colors.accent }]}>
              {kind === 'theory' ? 'Add a subject' : 'Add a posting'}
            </Text>
          </Touchable>
        )}
      </View>
    </KeyboardSafe>
  );
}

function AttendanceCard({
  item,
  onMark,
  onUndo,
  onTarget,
  onRemove,
  onSetTotalClasses,
  onSetMonthlyTotalClasses,
  onUpdateHolidays,
  onUpdateGazettedWorkingDays,
}: {
  item: AttendanceItem;
  onMark: (item: AttendanceItem, present: boolean) => void;
  onUndo: () => void;
  onTarget: (next: number) => void;
  onRemove: () => void;
  onSetTotalClasses: (count?: number) => void;
  onSetMonthlyTotalClasses: (monthKey: string, count?: number) => void;
  onUpdateHolidays: (holidays: string[]) => void;
  onUpdateGazettedWorkingDays: (dates: string[]) => void;
}) {
  const { colors } = useTheme();
  const verdict = verdictFor(item);
  const best = bestPossible(item);
  const day = dayOfRotation(item);
  const total = workingDays(item);
  const currentMonthKey = formatLocalIsoDate(new Date()).slice(0, 7);
  const thisMonth = getMonthlyAttendance(item, currentMonthKey);
  const monthPct = percentOf(thisMonth.attended, thisMonth.held);
  const monthTone =
    thisMonth.held === 0 || monthPct >= item.target ? colors.success : colors.danger;
  const monthName = new Date().toLocaleString('en-US', { month: 'short' });
  const monthOptions = Array.from(
    new Set([currentMonthKey, ...Object.keys(item.monthly ?? {})]),
  ).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const selectedMonthly = getMonthlyAttendance(item, selectedMonth);
  const selectedMonthLabel = (() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, Math.max(0, month - 1), 1).toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  })();
  const [monthlyTotalInput, setMonthlyTotalInput] = useState(
    selectedMonthly.totalClasses ? String(selectedMonthly.totalClasses) : '',
  );
  const monthlyTotals = Object.values(item.monthly ?? {})
    .map(entry => Number(entry.totalClasses) || 0)
    .filter(value => value > 0);
  const monthlyTotalSum = monthlyTotals.reduce((sum, value) => sum + value, 0);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const tone = verdict.safe ? colors.success : colors.danger;

  const toggleHoliday = (isoDate: string) => {
    const list = item.holidays ?? [];
    const next = list.includes(isoDate) ? list.filter(x => x !== isoDate) : [...list, isoDate];
    onUpdateHolidays(next);
  };

  const toggleGazettedWorkingDay = (isoDate: string) => {
    const list = item.gazettedWorkingDays ?? [];
    const next = list.includes(isoDate) ? list.filter(x => x !== isoDate) : [...list, isoDate];
    onUpdateGazettedWorkingDays(next);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <View style={styles.grow}>
          <Text numberOfLines={2} style={[styles.cardName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.cardCount, { color: colors.textMuted }]}>
            {item.kind === 'theory' ? 'Overall attendance: ' : ''}
            {item.attended} of {item.held} {item.kind === 'posting' ? 'days' : 'classes'}
            {item.kind === 'theory' && item.totalClasses
              ? ` · Total classes: ${item.totalClasses} · ${Math.max(0, item.totalClasses - item.held)} left`
              : verdict.remaining !== null
                ? ` · ${verdict.remaining} left`
                : ''}
          </Text>
          {item.kind === 'posting' && item.startDate ? (
            <Text style={[styles.cardCountSub, { color: colors.accent }]}>
              {item.startDate} → {item.endDate ?? postingEndDate(item.startDate, item.totalDays ?? 0) ?? '—'}
            </Text>
          ) : null}
          {item.kind === 'theory' ? (
            <Text style={[styles.cardCountSub, { color: colors.accent }]}>
              This Month ({monthName}): {thisMonth.attended} of {thisMonth.held} attended
              {thisMonth.totalClasses ? ` · ${thisMonth.totalClasses} total classes this month` : ''}
              {' · '}
              {thisMonth.held === 0 ? '—' : `${Math.round(monthPct)}%`}
            </Text>
          ) : null}
          {day !== null && total !== null ? (
            <Text style={[styles.cardCount, { color: colors.textMuted }]}>
              Day {day} of {total}
              {item.skipSundays ? ' · Sundays off' : ''}
              {item.skipSaturdays ? ' · Saturdays off' : ''}
              {item.prepaidHolidays ? ' · TN Govt holidays off' : ''}
              {item.gazettedWorkingDays?.length ? ` · ${item.gazettedWorkingDays.length} govt override` : ''}
              {item.holidays?.length ? ` · ${item.holidays.length} rain/event off` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.dualPctRow}>
          <View
            style={[
              styles.dualPctBadge,
              { borderColor: withAlpha(tone, 0.35), backgroundColor: withAlpha(tone, 0.08) },
            ]}>
            <Text style={[styles.dualPctLabel, { color: colors.textMuted }]}>OVERALL</Text>
            <Text style={[styles.dualPctVal, { color: tone }]}>
              {item.held === 0 ? '—' : `${Math.round(verdict.percent)}%`}
            </Text>
          </View>
          {item.kind === 'theory' ? (
            <View
              style={[
                styles.dualPctBadge,
                { borderColor: withAlpha(monthTone, 0.35), backgroundColor: withAlpha(monthTone, 0.08) },
              ]}>
              <Text style={[styles.dualPctLabel, { color: colors.textMuted }]}>{monthName.toUpperCase()}</Text>
              <Text style={[styles.dualPctVal, { color: monthTone }]}>
                {thisMonth.held === 0 ? '—' : `${Math.round(monthPct)}%`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* The bar, against the target line. */}
      <View style={[styles.track, { backgroundColor: withAlpha(colors.text, 0.12) }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(100, verdict.percent)}%`, backgroundColor: tone },
          ]}
        />
        <View
          style={[styles.targetLine, { left: `${item.target}%`, backgroundColor: colors.text }]}
        />
      </View>

      <Text style={[styles.verdict, { color: verdict.safe ? colors.textMuted : colors.danger }]}>
        {item.held === 0
          ? `Target ${item.target}%. Mark a class to start counting.`
          : verdict.safe
            ? verdict.canMiss === 0
              ? `Exactly on ${item.target}% — you cannot miss another one.`
              : verdict.cappedByEnd
                ? `You can miss all ${verdict.canMiss} remaining and still finish above ${item.target}%.`
                : `You can safely miss ${verdict.canMiss} more.`
            : best !== null && best < item.target
              ? `Even with 100% attendance from here, max finish is ${Math.round(best)}%.`
              : `Attend the next ${verdict.mustAttend} classes to get back above ${item.target}%.`}
      </Text>

      {/* Present / absent actions */}
      <View style={styles.actions}>
        <Touchable
          onPress={() => onMark(item, true)}
          label={`Mark present for ${item.name}`}
          style={[styles.action, { backgroundColor: withAlpha(colors.success, 0.16) }]}>
          <Check size={15} color={colors.success} />
          <Text style={[styles.actionText, { color: colors.success }]}>Present</Text>
        </Touchable>
        <Touchable
          onPress={() => onMark(item, false)}
          label={`Mark absent for ${item.name}`}
          style={[styles.action, { backgroundColor: withAlpha(colors.danger, 0.16) }]}>
          <X size={15} color={colors.danger} />
          <Text style={[styles.actionText, { color: colors.danger }]}>Absent</Text>
        </Touchable>
        <Touchable
          onPress={onUndo}
          label={`Undo the last mark for ${item.name}`}
          disabled={item.held === 0}
          hitSlop={8}
          style={[styles.icon, { borderColor: colors.border, opacity: item.held === 0 ? 0.4 : 1 }]}>
          <Undo2 size={15} color={colors.textMuted} />
        </Touchable>
      </View>

      {/* Theory enhancement: Option to select / change total number of classes */}
      {item.kind === 'theory' ? (
        <View style={styles.totalClassesSection}>
          <Text style={[styles.totalClassesLabel, { color: colors.textMuted }]}>
            Total number of classes (all months):
          </Text>
          <View style={styles.totalPresets}>
            {[60, 80, 100, 120, 150].map(cnt => {
              const active = item.totalClasses === cnt;
              return (
                <Touchable
                  key={cnt}
                  onPress={() => onSetTotalClasses(active ? undefined : cnt)}
                  label={`Select ${cnt} total classes for ${item.name}`}
                  style={[
                    styles.totalPresetChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? withAlpha(colors.accent, 0.18) : 'transparent',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.totalPresetText,
                      {
                        color: active ? colors.accent : colors.textMuted,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}>
                    {cnt}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        </View>
      ) : null}

      {item.kind === 'theory' ? (
        <View style={styles.totalClassesSection}>
          <Text style={[styles.totalClassesLabel, { color: colors.textMuted }]}>
            Classes per month
          </Text>
          <Text style={[styles.cardCountSub, { color: colors.textMuted }]}>
            Set the total number of classes separately for each month. This is not an average.
            {monthlyTotalSum > 0
              ? ` Monthly totals entered so far: ${monthlyTotalSum} classes across ${monthlyTotals.length} month${monthlyTotals.length === 1 ? '' : 's'}.`
              : ''}
          </Text>

          <View style={styles.totalPresets}>
            {monthOptions.map(key => {
              const active = selectedMonth === key;
              const [year, month] = key.split('-').map(Number);
              const label = new Date(year, Math.max(0, month - 1), 1).toLocaleString('en-US', {
                month: 'short',
                year: '2-digit',
              });
              const monthly = getMonthlyAttendance(item, key);
              return (
                <Touchable
                  key={key}
                  onPress={() => {
                    setSelectedMonth(key);
                    setMonthlyTotalInput(monthly.totalClasses ? String(monthly.totalClasses) : '');
                  }}
                  label={`Edit ${label} class total`}
                  state={{ selected: active }}
                  style={[
                    styles.totalPresetChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? withAlpha(colors.accent, 0.18) : 'transparent',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.totalPresetText,
                      { color: active ? colors.accent : colors.textMuted },
                    ]}>
                    {label}{monthly.totalClasses ? ` · ${monthly.totalClasses}` : ''}
                  </Text>
                </Touchable>
              );
            })}
          </View>

          <Text style={[styles.formLabel, { color: colors.textMuted }]}>
            {selectedMonthLabel.toUpperCase()} — TOTAL CLASSES
          </Text>
          <View style={styles.totalPresets}>
            {[10, 15, 20, 25, 30, 40].map(count => {
              const active = selectedMonthly.totalClasses === count;
              return (
                <Touchable
                  key={count}
                  onPress={() => {
                    const next = active ? undefined : count;
                    setMonthlyTotalInput(next ? String(next) : '');
                    onSetMonthlyTotalClasses(selectedMonth, next);
                  }}
                  label={`Set ${selectedMonthLabel} total to ${count} classes`}
                  style={[
                    styles.totalPresetChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? withAlpha(colors.accent, 0.18) : 'transparent',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.totalPresetText,
                      { color: active ? colors.accent : colors.textMuted },
                    ]}>
                    {count}
                  </Text>
                </Touchable>
              );
            })}
          </View>
          <TextInput
            value={monthlyTotalInput}
            onChangeText={setMonthlyTotalInput}
            onEndEditing={() => {
              const value = Number(monthlyTotalInput);
              const next =
                monthlyTotalInput.trim() && Number.isFinite(value) && value > 0
                  ? Math.round(value)
                  : undefined;
              onSetMonthlyTotalClasses(selectedMonth, next);
            }}
            keyboardType="number-pad"
            placeholder={`e.g. 24 classes in ${selectedMonthLabel}`}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={`Total number of classes in ${selectedMonthLabel}`}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          {selectedMonthly.totalClasses ? (
            <Text style={[styles.cardCountSub, { color: colors.accent }]}>
              {selectedMonthly.held} held so far · {Math.max(0, selectedMonthly.totalClasses - selectedMonthly.held)} classes left in {selectedMonthLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Theory enhancement: Bunk & target simulation tool */}
      {item.kind === 'theory' ? (
        <View style={styles.accordionWrap}>
          <Touchable
            onPress={() => setShowSimulator(v => !v)}
            label="Bunk and target simulator"
            style={[styles.accordionToggle, { borderColor: colors.border }]}>
            <View style={styles.accordionHeaderLeft}>
              <Sparkles size={14} color={colors.accent} />
              <Text style={[styles.accordionTitle, { color: colors.text }]}>
                Bunk & Target Simulator
              </Text>
            </View>
            {showSimulator ? (
              <ChevronUp size={16} color={colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={colors.textMuted} />
            )}
          </Touchable>

          {showSimulator ? (
            <View style={[styles.simulatorBox, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}>
              {item.totalClasses ? (
                <View style={styles.courseProjectionBox}>
                  <Text style={[styles.courseProjectionTitle, { color: colors.accent }]}>
                    Full Course Projection ({item.totalClasses} classes total)
                  </Text>
                  <Text style={[styles.simulatorLead, { color: colors.text, marginTop: 4 }]}>
                    {(() => {
                      const neededOverall = Math.ceil((item.totalClasses * item.target) / 100);
                      const stillNeeded = Math.max(0, neededOverall - item.attended);
                      const classesRemaining = Math.max(0, item.totalClasses - item.held);
                      const canBunkRest = Math.max(0, classesRemaining - stillNeeded);
                      if (item.attended >= neededOverall) {
                        return `🎉 You already secured ${item.attended} classes! You met the ${item.target}% requirement for the entire course. You can safely bunk all remaining ${classesRemaining} classes.`;
                      }
                      if (stillNeeded > classesRemaining) {
                        return `⚠️ Even attending all ${classesRemaining} remaining classes, max possible is ${Math.round(percentOf(item.attended + classesRemaining, item.totalClasses))}%. Attend all of them!`;
                      }
                      return `🎯 You need ${neededOverall} of ${item.totalClasses} classes (${stillNeeded} more). Out of ${classesRemaining} remaining classes, you can safely bunk ${canBunkRest}!`;
                    })()}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.simulatorLead, { color: colors.text }]}>
                  {verdict.safe
                    ? `🎉 You can safely bunk ${verdict.canMiss} classes and stay above ${item.target}%.`
                    : `⚠️ Attend the next ${verdict.mustAttend} classes in a row to get back to ${item.target}%.`}
                </Text>
              )}
              <View style={styles.simTable}>
                {item.kind === 'theory' ? (
                  <View style={styles.simMonthlySummary}>
                    <Text style={[styles.simMonthlyText, { color: colors.text }]}>
                      📅 <Text style={styles.boldText}>This Month ({monthName}):</Text>{' '}
                      {thisMonth.attended} of {thisMonth.held} attended ({thisMonth.held === 0 ? '—' : `${Math.round(monthPct)}%`})
                    </Text>
                    <Text style={[styles.simMonthlyText, { color: colors.text }]}>
                      📊 <Text style={styles.boldText}>Overall (All Months):</Text>{' '}
                      {item.attended} of {item.held} attended ({item.held === 0 ? '—' : `${Math.round(verdict.percent)}%`})
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.simHeader, { color: colors.textMuted, marginTop: item.kind === 'theory' ? 6 : 0 }]}>
                  If you attend next:
                </Text>
                <View style={styles.simRow}>
                  <Text style={[styles.simLabel, { color: colors.text }]}>+1 class</Text>
                  <Text style={[styles.simVal, { color: colors.accent }]}>
                    {Math.round(percentOf(item.attended + 1, item.held + 1))}%
                  </Text>
                  <Text style={[styles.simLabel, { color: colors.text }]}>+3 classes</Text>
                  <Text style={[styles.simVal, { color: colors.accent }]}>
                    {Math.round(percentOf(item.attended + 3, item.held + 3))}%
                  </Text>
                  <Text style={[styles.simLabel, { color: colors.text }]}>+5 classes</Text>
                  <Text style={[styles.simVal, { color: colors.accent }]}>
                    {Math.round(percentOf(item.attended + 5, item.held + 5))}%
                  </Text>
                </View>
                <Text style={[styles.simHeader, { color: colors.textMuted, marginTop: 8 }]}>
                  If you miss next:
                </Text>
                <View style={styles.simRow}>
                  <Text style={[styles.simLabel, { color: colors.text }]}>1 miss</Text>
                  <Text style={[styles.simVal, { color: colors.danger }]}>
                    {Math.round(percentOf(item.attended, item.held + 1))}%
                  </Text>
                  <Text style={[styles.simLabel, { color: colors.text }]}>2 misses</Text>
                  <Text style={[styles.simVal, { color: colors.danger }]}>
                    {Math.round(percentOf(item.attended, item.held + 2))}%
                  </Text>
                  <Text style={[styles.simLabel, { color: colors.text }]}>3 misses</Text>
                  <Text style={[styles.simVal, { color: colors.danger }]}>
                    {Math.round(percentOf(item.attended, item.held + 3))}%
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Clinical postings calendar view */}
      {item.kind === 'posting' && item.startDate && item.totalDays ? (
        <View style={styles.accordionWrap}>
          <Touchable
            onPress={() => setShowCalendar(v => !v)}
            label="View Rotation Calendar and Holidays"
            style={[styles.accordionToggle, { borderColor: colors.border }]}>
            <View style={styles.accordionHeaderLeft}>
              <CalendarClock size={14} color={colors.accent} />
              <Text style={[styles.accordionTitle, { color: colors.text }]}>
                Rotation Calendar & Holidays
              </Text>
            </View>
            {showCalendar ? (
              <ChevronUp size={16} color={colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={colors.textMuted} />
            )}
          </Touchable>

          {showCalendar ? (
            <RotationCalendar
              startDateStr={item.startDate}
              totalDays={item.totalDays}
              skipSundays={Boolean(item.skipSundays)}
              skipSaturdays={Boolean(item.skipSaturdays)}
              prepaidHolidays={Boolean(item.prepaidHolidays)}
              customHolidays={item.holidays ?? []}
              gazettedWorkingDays={item.gazettedWorkingDays ?? []}
              onToggleHoliday={toggleHoliday}
              onToggleGazettedWorkingDay={toggleGazettedWorkingDay}
              editable={true}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.targets}>
          {TARGETS.map(value => {
            const active = value === item.target;
            return (
              <Touchable
                key={value}
                onPress={() => onTarget(value)}
                label={`Require ${value} percent for ${item.name}`}
                state={{ selected: active }}
                hitSlop={6}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accent : 'transparent',
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? onColor(colors.accent) : colors.textMuted },
                  ]}>
                  {value}%
                </Text>
              </Touchable>
            );
          })}
        </View>
        <Touchable
          onPress={onRemove}
          label={`Remove ${item.name}`}
          hitSlop={8}
          style={styles.icon}>
          <Trash2 size={15} color={colors.textMuted} />
        </Touchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  grow: { flex: 1 },
  flexOne: { flex: 1 },
  switch: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  switchText: { ...typeScale.footnote, fontWeight: '700' },

  empty: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  emptyTitle: { ...typeScale.bodyStrong },
  emptyBody: { ...typeScale.footnote },

  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardName: { ...typeScale.bodyStrong },
  cardCount: { ...typeScale.caption, marginTop: 2 },
  cardCountSub: { ...typeScale.caption, marginTop: 2, fontWeight: '600' },
  cardPct: { ...typeScale.title3, fontWeight: '800' },
  dualPctRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dualPctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  dualPctLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  dualPctVal: { ...typeScale.footnote, fontWeight: '800' },

  track: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  fill: { height: '100%', borderRadius: 4 },
  targetLine: { position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.7 },

  verdict: { ...typeScale.footnote },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
  },
  actionText: { ...typeScale.footnote, fontWeight: '700' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },

  totalClassesSection: {
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  totalClassesLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  totalPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalPresetText: {
    fontSize: 12,
  },
  courseProjectionBox: {
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  courseProjectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  simMonthlySummary: {
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    gap: 3,
  },
  simMonthlyText: {
    fontSize: 12,
  },
  boldText: {
    fontWeight: '700',
  },

  accordionWrap: { marginTop: 4, gap: 6 },
  accordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accordionTitle: { fontSize: 12, fontWeight: '600' },

  simulatorBox: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  simulatorLead: { fontSize: 12, fontWeight: '600' },
  simTable: { gap: 4 },
  simHeader: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  simRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  simLabel: { fontSize: 12 },
  simVal: { fontSize: 12, fontWeight: '700' },

  calendarContainer: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calendarTitle: { fontSize: 13, fontWeight: '700' },
  calendarSummary: { fontSize: 12 },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  calendarWeekCol: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarCell: {
    width: '13.5%',
    minHeight: 46,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  calendarCellText: { fontSize: 12 },
  calendarCellTag: { fontSize: 8 },
  calendarLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  legendChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  legendText: { fontSize: 10, fontWeight: '700' },
  calendarHint: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },

  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 11, fontWeight: '600' },

  rowTwoCols: { flexDirection: 'row', gap: 8 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxTitle: { fontSize: 13, fontWeight: '600' },
  checkboxSub: { fontSize: 11, marginTop: 1 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targets: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { ...typeScale.caption, fontWeight: '700' },
  chipWide: { paddingHorizontal: 16, paddingVertical: 11, minHeight: 44, justifyContent: 'center' },

  form: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  formLabel: { ...typeScale.overline },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typeScale.body,
    minHeight: 44,
  },
  formRow: { flexDirection: 'row', gap: 8 },
  formButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  formButtonText: { ...typeScale.footnote, fontWeight: '700' },

  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    minHeight: 44,
  },
  addText: { ...typeScale.footnote, fontWeight: '700' },
});

