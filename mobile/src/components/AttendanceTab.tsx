import React, { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
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
  getHolidayTitle,
  markAttendance,
  percentOf,
  removeAttendance,
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

/** Interactive Mini-Calendar for Postings to view and toggle custom rain/event holidays */
function RotationCalendar({
  startDateStr,
  totalDays,
  skipSundays,
  prepaidHolidays,
  customHolidays = [],
  onToggleHoliday,
  editable = true,
}: {
  startDateStr: string;
  totalDays: number;
  skipSundays: boolean;
  prepaidHolidays: boolean;
  customHolidays?: string[];
  onToggleHoliday?: (isoDate: string) => void;
  editable?: boolean;
}) {
  const { colors } = useTheme();

  const days = useMemo(() => {
    if (!startDateStr || !totalDays || totalDays <= 0) {
      return [];
    }
    const start = new Date(`${startDateStr}T00:00:00`);
    if (Number.isNaN(start.getTime())) {
      return [];
    }
    const items = [];
    for (let i = 0; i < totalDays; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
      const isSun = dayOfWeek === 0;
      const holidayTitle = getHolidayTitle(iso);
      const isGazetted = Boolean(holidayTitle);
      const isCustomHoliday = customHolidays.includes(iso);
      const isOff = (skipSundays && isSun) || (prepaidHolidays && isGazetted) || isCustomHoliday;
      items.push({
        iso,
        date: d,
        dayNum: d.getDate(),
        monthShort: d.toLocaleString('en-US', { month: 'short' }),
        dayOfWeek,
        isSun,
        isGazetted,
        holidayTitle,
        isCustomHoliday,
        isOff,
      });
    }
    return items;
  }, [startDateStr, totalDays, skipSundays, prepaidHolidays, customHolidays]);

  if (days.length === 0) {
    return null;
  }

  const sundaysCount = days.filter(d => d.isSun).length;
  const gazettedCount = days.filter(d => (!d.isSun || !skipSundays) && d.isGazetted).length;
  const rainCount = days.filter(
    d => (!d.isSun || !skipSundays) && (!d.isGazetted || !prepaidHolidays) && d.isCustomHoliday,
  ).length;
  const workingCount = days.filter(d => !d.isOff).length;

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

      {/* Weekday labels */}
      <View style={styles.calendarWeekRow}>
        {WEEKDAY_NAMES.map((name, i) => (
          <Text key={i} style={[styles.calendarWeekCol, { color: i === 6 ? colors.danger : colors.textMuted }]}>
            {name}
          </Text>
        ))}
      </View>

      {/* Day tiles */}
      <View style={styles.calendarGrid}>
        {days.map(d => {
          const isSelectedHoliday = d.isCustomHoliday;
          return (
            <Touchable
              key={d.iso}
              onPress={() => editable && onToggleHoliday?.(d.iso)}
              disabled={!editable}
              label={`${d.monthShort} ${d.dayNum}${d.isOff ? ' - Holiday' : ' - Working day'}`}
              style={[
                styles.calendarCell,
                {
                  borderColor: isSelectedHoliday
                    ? colors.accent
                    : d.isGazetted && prepaidHolidays
                      ? colors.warning
                      : d.isSun && skipSundays
                        ? withAlpha(colors.danger, 0.4)
                        : colors.border,
                  backgroundColor: isSelectedHoliday
                    ? withAlpha(colors.accent, 0.22)
                    : d.isGazetted && prepaidHolidays
                      ? withAlpha(colors.warning, 0.16)
                      : d.isSun && skipSundays
                        ? withAlpha(colors.danger, 0.08)
                        : colors.card,
                },
              ]}>
              <Text
                style={[
                  styles.calendarCellText,
                  {
                    color: isSelectedHoliday
                      ? colors.accent
                      : d.isGazetted && prepaidHolidays
                        ? colors.warning
                        : d.isSun && skipSundays
                          ? colors.danger
                          : colors.text,
                    fontWeight: isSelectedHoliday || d.isGazetted ? '700' : '500',
                  },
                ]}>
                {d.dayNum}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.calendarCellTag,
                  {
                    color: isSelectedHoliday
                      ? colors.accent
                      : d.isGazetted && prepaidHolidays
                        ? colors.warning
                        : d.isSun && skipSundays
                          ? colors.danger
                          : colors.textMuted,
                  },
                ]}>
                {isSelectedHoliday
                  ? 'Rain/Event'
                  : d.isGazetted && prepaidHolidays
                    ? 'Holiday'
                    : d.isSun && skipSundays
                      ? 'Sun'
                      : d.monthShort}
              </Text>
            </Touchable>
          );
        })}
      </View>

      {/* Breakdown chips */}
      <View style={styles.calendarLegend}>
        {skipSundays ? (
          <View style={[styles.legendChip, { backgroundColor: withAlpha(colors.danger, 0.1) }]}>
            <Text style={[styles.legendText, { color: colors.danger }]}>
              {sundaysCount} Sundays off
            </Text>
          </View>
        ) : null}
        {prepaidHolidays && gazettedCount > 0 ? (
          <View style={[styles.legendChip, { backgroundColor: withAlpha(colors.warning, 0.12) }]}>
            <Text style={[styles.legendText, { color: colors.warning }]}>
              {gazettedCount} Gazetted holiday{gazettedCount > 1 ? 's' : ''}
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
          💡 Tap any date to add or remove rain holidays, college fests, or strike days.
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
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState('28');
  const [skipSundays, setSkipSundays] = useState(true);
  const [prepaidHolidays, setPrepaidHolidays] = useState(true);
  const [customHolidays, setCustomHolidays] = useState<string[]>([]);
  const [target, setTarget] = useState(75);
  /** The last mark per item, so Undo knows what it is taking back. */
  const [lastMark, setLastMark] = useState<Record<string, boolean>>({});

  const shown = items.filter(item => item.kind === kind);

  const toggleFormHoliday = useCallback((iso: string) => {
    setCustomHolidays(prev => (prev.includes(iso) ? prev.filter(x => x !== iso) : [...prev, iso]));
  }, []);

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

    let calculatedEnd: string | undefined;
    if (hasTotal && startDate) {
      const d = new Date(`${startDate}T00:00:00`);
      d.setDate(d.getDate() + total - 1);
      calculatedEnd = d.toISOString().slice(0, 10);
    }

    await addAttendance({
      name: trimmed,
      kind,
      target,
      totalClasses: totalClassesNum,
      totalDays: hasTotal ? total : undefined,
      startDate: kind === 'posting' ? startDate : undefined,
      endDate: calculatedEnd,
      skipSundays: kind === 'posting' && skipSundays ? true : undefined,
      prepaidHolidays: kind === 'posting' && prepaidHolidays ? true : undefined,
      holidays: kind === 'posting' && customHolidays.length > 0 ? customHolidays : undefined,
    });
    setName('');
    setTotalClassesStr('');
    setDays('28');
    setCustomHolidays([]);
    setAdding(false);
  }, [name, totalClassesStr, days, kind, target, startDate, skipSundays, prepaidHolidays, customHolidays]);

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
                : 'Add a rotation with start date and duration. Orbit displays an interactive calendar, excludes Sundays and prepaid holidays, lets you mark rain days, and calculates safe bunks.'}
            </Text>
          </View>
        ) : null}

        {shown.map(item => (
          <AttendanceCard
            key={item.id}
            item={item}
            onMark={mark}
            onSetTotalClasses={async next => updateAttendance(item.id, { totalClasses: next })}
            onUndo={async () => {
              const was = lastMark[item.id];
              await undoAttendance(item.id, was ?? true);
            }}
            onTarget={async next => updateAttendance(item.id, { target: next })}
            onRemove={async () => removeAttendance(item.id)}
            onUpdateHolidays={async nextHolidays =>
              updateAttendance(item.id, { holidays: nextHolidays })
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
                  TOTAL CLASSES PLANNED (OPTIONAL)
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
                  placeholder="e.g. 100 total classes"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Total planned classes"
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
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                  </View>
                  <View style={styles.flexOne}>
                    <Text style={[styles.formLabel, { color: colors.textMuted }]}>DURATION (DAYS)</Text>
                    <TextInput
                      value={days}
                      onChangeText={setDays}
                      keyboardType="number-pad"
                      placeholder="e.g. 28"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                  </View>
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

                {/* Prepaid / Gazetted Holiday toggle */}
                <Touchable
                  onPress={() => setPrepaidHolidays(v => !v)}
                  label="Official gazetted holidays do not count"
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
                      Prepaid / Gazetted holidays do not count
                    </Text>
                    <Text style={[styles.checkboxSub, { color: colors.textMuted }]}>
                      Auto-excludes official holidays (Republic Day, Pongal, May Day, Diwali, etc.)
                    </Text>
                  </View>
                </Touchable>

                {/* Interactive Mini-Calendar */}
                {Number(days) > 0 ? (
                  <RotationCalendar
                    startDateStr={startDate}
                    totalDays={Number(days)}
                    skipSundays={skipSundays}
                    prepaidHolidays={prepaidHolidays}
                    customHolidays={customHolidays}
                    onToggleHoliday={toggleFormHoliday}
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
                  setCustomHolidays([]);
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
  onUpdateHolidays,
}: {
  item: AttendanceItem;
  onMark: (item: AttendanceItem, present: boolean) => void;
  onUndo: () => void;
  onTarget: (next: number) => void;
  onRemove: () => void;
  onSetTotalClasses: (count?: number) => void;
  onUpdateHolidays: (holidays: string[]) => void;
}) {
  const { colors } = useTheme();
  const verdict = verdictFor(item);
  const best = bestPossible(item);
  const day = dayOfRotation(item);
  const total = workingDays(item);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const tone = verdict.safe ? colors.success : colors.danger;

  const toggleHoliday = (isoDate: string) => {
    const list = item.holidays ?? [];
    const next = list.includes(isoDate) ? list.filter(x => x !== isoDate) : [...list, isoDate];
    onUpdateHolidays(next);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <View style={styles.grow}>
          <Text numberOfLines={2} style={[styles.cardName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.cardCount, { color: colors.textMuted }]}>
            {item.attended} of {item.held} {item.kind === 'posting' ? 'days' : 'classes'}
            {item.kind === 'theory' && item.totalClasses
              ? ` · ${item.totalClasses} total (${Math.max(0, item.totalClasses - item.held)} left)`
              : verdict.remaining !== null
                ? ` · ${verdict.remaining} left`
                : ''}
          </Text>
          {day !== null && total !== null ? (
            <Text style={[styles.cardCount, { color: colors.textMuted }]}>
              Day {day} of {total}
              {item.skipSundays ? ' · Sundays off' : ''}
              {item.prepaidHolidays ? ' · Gazetted off' : ''}
              {item.holidays?.length ? ` · ${item.holidays.length} rain/event off` : ''}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.cardPct, { color: tone }]}>
          {item.held === 0 ? '—' : `${Math.round(verdict.percent)}%`}
        </Text>
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
            Total classes planned:
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
                <Text style={[styles.simHeader, { color: colors.textMuted }]}>If you attend next:</Text>
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
              prepaidHolidays={Boolean(item.prepaidHolidays)}
              customHolidays={item.holidays ?? []}
              onToggleHoliday={toggleHoliday}
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
  cardPct: { ...typeScale.title3, fontWeight: '800' },

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

