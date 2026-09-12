import React, { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Check, GraduationCap, Plus, Stethoscope, Trash2, Undo2, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { RotationCalendar, type CalendarMode } from '@/components/RotationCalendar';
import { useTheme, withAlpha } from '@/theme';
import { onColor } from '@/theme/color';
import { typeScale } from '@/theme/typography';
import { tick } from '@/lib/haptics';
import {
  addAttendance,
  attendanceVersion,
  fixedHolidaysBetween,
  spanDays,
  bestPossible,
  dayOfRotation,
  workingDays,
  getAttendance,
  markAttendance,
  removeAttendance,
  subscribeAttendance,
  undoAttendance,
  updateAttendance,
  verdictFor,
  type AttendanceItem,
  type AttendanceKind,
} from '@/lib/attendance';

/**
 * Attendance — theory and clinical postings, and how many you can miss.
 *
 * Replaces the Calendar tab, which was a month grid you could pin a note to
 * and almost nobody did. What a medical student actually counts every week is
 * whether they are above seventy-five, because below it you are barred from
 * the exam — and the sum is fiddly enough that people get it wrong on paper.
 *
 * ## Two lists, because they are two different problems
 *
 * A theory subject runs all year and nobody knows how many classes are left,
 * so "you can miss six more" is the whole answer. A posting is a fixed block:
 * six spare is meaningless if the rotation ends on Friday, so a posting knows
 * its length and the card says which of the two limits is the real one.
 *
 * ## Marking is two buttons, not a calendar
 *
 * Present and Absent, with one Undo. A month grid is what the reference apps
 * draw and it is a worse fit for the moment this gets used: a student marks it
 * walking out of a class, on a phone, with one thumb. Picking today's date out
 * of a grid first is three taps to record one fact. The one mistake worth
 * catching is the wrong button, and it is always noticed immediately, which is
 * exactly what an Undo is for.
 */

const TARGETS = [65, 75, 80];

export function AttendanceTab() {
  const { colors } = useTheme();
  useSyncExternalStore(subscribeAttendance, attendanceVersion, attendanceVersion);
  const { items, hydrated } = getAttendance();

  const [kind, setKind] = useState<AttendanceKind>('theory');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [holidays, setHolidays] = useState<string[]>([]);
  const [calMode, setCalMode] = useState<CalendarMode>('range');
  const [skipSundays, setSkipSundays] = useState(false);
  const [target, setTarget] = useState(75);
  /** The last mark per item, so Undo knows what it is taking back. */
  const [lastMark, setLastMark] = useState<Record<string, boolean>>({});

  const shown = items.filter(item => item.kind === kind);

  const submit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const posting = kind === 'posting';
    /*
     * A rotation with only one end chosen is stored with only that end. It is
     * still useful — the card can say when it started — and it is far better
     * than inventing the other date, which is what stamping TODAY on the start
     * used to do to anybody entering a posting they were already weeks into.
     */
    const dated = posting && startDate !== '';
    // Days off outside the range would never be walked, and would come back to
    // confuse whoever next edits the dates.
    const inside = holidays.filter(
      day => startDate !== '' && endDate !== '' && day >= startDate && day <= endDate,
    );
    await addAttendance({
      name: trimmed,
      kind,
      target,
      startDate: dated ? startDate : undefined,
      endDate: dated && endDate !== '' ? endDate : undefined,
      holidays: dated && inside.length > 0 ? inside : undefined,
      skipSundays: posting && skipSundays ? true : undefined,
    });
    setName('');
    setStartDate('');
    setEndDate('');
    setHolidays([]);
    setCalMode('range');
    setSkipSundays(false);
    setAdding(false);
  }, [name, startDate, endDate, holidays, kind, target, skipSundays]);

  /*
   * The working-day count for the range as it stands, phrased the way the card
   * will phrase it. Built from the same `spanDays`/`workingDays` the stored
   * item uses rather than counted again here — a second implementation of this
   * arithmetic is a second chance to tell somebody they can miss more classes
   * than they can.
   */
  const rangeSummary = useMemo(() => {
    if (startDate === '') {
      return 'Tap a date to set the first day.';
    }
    if (endDate === '') {
      return `Starts ${startDate}. Tap the last day.`;
    }
    const draft: AttendanceItem = {
      id: 'draft',
      name: '',
      kind: 'posting',
      target,
      held: 0,
      attended: 0,
      startDate,
      endDate,
      holidays,
      skipSundays: skipSundays ? true : undefined,
    };
    const span = spanDays(draft) ?? 0;
    const working = workingDays(draft) ?? span;
    const off = span - working;
    if (off === 0) {
      return `${span} days, all of them working days.`;
    }
    return `${span} days, ${working} of them working — ${off} off.`;
  }, [startDate, endDate, holidays, skipSundays, target]);

  /** The fixed national holidays that land inside the chosen range. */
  const suggested = useMemo(
    () => (startDate !== '' && endDate !== '' ? fixedHolidaysBetween(startDate, endDate) : []),
    [startDate, endDate],
  );

  /** Toggle a day off while the posting is still being written. */
  const toggleDraftHoliday = useCallback((iso: string) => {
    setHolidays(current =>
      current.indexOf(iso) === -1
        ? [...current, iso].sort()
        : current.filter(day => day !== iso),
    );
  }, []);

  const mark = useCallback(async (item: AttendanceItem, present: boolean) => {
    tick();
    setLastMark(current => ({ ...current, [item.id]: present }));
    await markAttendance(item.id, present);
  }, []);

  return (
    <KeyboardSafe>
      <View style={styles.wrap}>
        {/* Theory or postings. Two lists, not one filtered one — see above. */}
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
              {kind === 'theory' ? 'No subjects yet' : 'No postings yet'}
            </Text>
            {/*
              An empty state has to name the button. There is nothing to browse
              and nothing to sign into, so a blank list with no instruction
              reads as broken rather than as waiting — the same lesson the
              music player's empty state cost.
            */}
            <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
              {kind === 'theory'
                ? 'Add a subject with the button below, then tap Present or Absent after each class. Orbit works out how many you can still miss.'
                : 'Add a rotation and mark its dates on the calendar. Tick off Sundays and holidays, and Orbit counts down the working days left and tells you how many you can safely bunk.'}
            </Text>
          </View>
        ) : null}

        {shown.map(item => (
          <AttendanceCard
            key={item.id}
            item={item}
            onMark={mark}
            onUndo={async () => {
              const was = lastMark[item.id];
              await undoAttendance(item.id, was ?? true);
            }}
            onTarget={async next => updateAttendance(item.id, { target: next })}
            onRemove={async () => removeAttendance(item.id)}
          />
        ))}

        {adding ? (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={kind === 'theory' ? 'Subject, e.g. Pathology' : 'Posting, e.g. Paediatrics'}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={kind === 'theory' ? 'Subject name' : 'Posting name'}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            {kind === 'posting' ? (
              <>
                <RotationCalendar
                  startDate={startDate}
                  endDate={endDate}
                  holidays={holidays}
                  onChangeRange={(from, to) => {
                    setStartDate(from);
                    setEndDate(to);
                    // Days off are a property of a range. Moving the range and
                    // keeping them would leave marks stranded outside it,
                    // shortening a rotation by days nobody can see.
                    setHolidays(current =>
                      to === '' ? [] : current.filter(day => day >= from && day <= to),
                    );
                  }}
                  onToggleHoliday={toggleDraftHoliday}
                  mode={calMode}
                  onChangeMode={setCalMode}
                />
                {/*
                  What the dates actually came to, said in words.

                  The calendar shows the shape; this is the number every other
                  line on the card is derived from, and seeing it move as
                  Sundays and days off are ticked is the only way to catch a
                  range that is out by a week before it matters.
                */}
                <Text
                  // Addressable, because `check:attendance-ui` has to read this
                  // exact line. Matching it by its words picked up the empty
                  // state above instead, which also says "days" and "working".
                  testID="rotation-summary"
                  style={[styles.rangeSummary, { color: colors.textMuted }]}>
                  {rangeSummary}
                </Text>
                {/*
                  Offered, never applied. Four fixed national holidays are all
                  that can honestly be known — everything else moves, or belongs
                  to one college — and plenty of places work straight through
                  them. See FIXED_HOLIDAYS.
                */}
                {suggested.length > 0 ? (
                  <View style={styles.suggestions}>
                    {suggested.map(holiday => {
                      const on = holidays.indexOf(holiday.date) !== -1;
                      return (
                        <Touchable
                          key={holiday.date}
                          onPress={() => toggleDraftHoliday(holiday.date)}
                          label={`${holiday.name}, ${holiday.date}`}
                          hint="Mark this as a day off"
                          role="checkbox"
                          state={{ checked: on }}
                          style={[
                            styles.chip,
                            {
                              borderColor: on ? colors.accent : colors.border,
                              backgroundColor: on ? withAlpha(colors.accent, 0.14) : 'transparent',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.chipText,
                              { color: on ? colors.accent : colors.textMuted },
                            ]}>
                            {on ? '✓ ' : '+ '}
                            {holiday.name}
                          </Text>
                        </Touchable>
                      );
                    })}
                  </View>
                ) : null}
              </>
            ) : null}
            {/*
              Off by default, and that is deliberate.

              Plenty of postings run through the weekend, and a tracker that
              silently shortens a rotation nobody asked it to shorten is the
              same bug as one that forgets the Sundays — just pointing the other
              way. What it changes is real: a 28-day block starting on a Monday
              holds four Sundays, so leaving them in makes "only two days left"
              wrong by four, in the direction that gets somebody short.
            */}
            {kind === 'posting' ? (
              <Touchable
                onPress={() => setSkipSundays(v => !v)}
                label="Sundays are not working days"
                role="checkbox"
                state={{ checked: skipSundays }}
                style={[styles.sundayRow, { borderColor: colors.border }]}>
                <View
                  style={[
                    styles.sundayBox,
                    {
                      borderColor: skipSundays ? colors.accent : colors.border,
                      backgroundColor: skipSundays ? colors.accent : 'transparent',
                    },
                  ]}>
                  {skipSundays ? <Check size={12} color={colors.onAccent} /> : null}
                </View>
                <Text style={[styles.sundayText, { color: colors.text }]}>
                  Sundays do not count
                </Text>
              </Touchable>
            ) : null}

            <Text style={[styles.formLabel, { color: colors.textMuted }]}>
              REQUIRED ATTENDANCE
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
                  setStartDate('');
                  setEndDate('');
                  setHolidays([]);
                  setCalMode('range');
                  setSkipSundays(false);
                }}
                label="Cancel"
                style={[styles.formButton, { borderColor: colors.border }]}>
                <Text style={[styles.formButtonText, { color: colors.textMuted }]}>Cancel</Text>
              </Touchable>
              <Touchable
                onPress={submit}
                label={kind === 'theory' ? 'Add this subject' : 'Add this posting'}
                style={[styles.formButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
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
}: {
  item: AttendanceItem;
  onMark: (item: AttendanceItem, present: boolean) => void;
  onUndo: () => void;
  onTarget: (next: number) => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const verdict = verdictFor(item);
  const best = bestPossible(item);
  const day = dayOfRotation(item);
  const total = workingDays(item);

  /*
   * Green when safe, red when not. These are the semantic colours and they do
   * not follow the theme's accent, for the reason every theme keeps them
   * fixed: a number that means "you are barred from the exam" has to keep
   * meaning that on a purple theme.
   */
  const tone = verdict.safe ? colors.success : colors.danger;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <View style={styles.grow}>
          <Text numberOfLines={2} style={[styles.cardName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.cardCount, { color: colors.textMuted }]}>
            {item.attended} of {item.held} {item.kind === 'posting' ? 'days' : 'classes'}
            {verdict.remaining !== null ? ` · ${verdict.remaining} left` : ''}
          </Text>
          {/*
            Where you are in the rotation, which is the thing a posting student
            asks first and the counter above cannot answer. "12 of 28" is read
            off the calendar rather than off how many days have been tapped, so
            it stays right through a week of forgetting to mark anything.
          */}
          {day !== null && total !== null ? (
            <Text style={[styles.cardCount, { color: colors.textMuted }]}>
              Day {day} of {total}
              {item.skipSundays ? ' · Sundays off' : ''}
              {/*
                Days off are named on the card, not just silently subtracted.
                "Day 12 of 24" with no explanation is the reader's own count
                disagreeing with the app's, and the only way to tell which is
                right is to know what came out of it.
              */}
              {item.holidays && item.holidays.length > 0
                ? ` · ${item.holidays.length} ${item.holidays.length === 1 ? 'day' : 'days'} off`
                : ''}
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
          // The line you have to stay above, drawn where it actually is.
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
              ? `Below ${item.target}%, and attending every remaining day only reaches ${Math.round(best)}%.`
              : `Below ${item.target}%. Attend the next ${verdict.mustAttend} without missing one.`}
      </Text>

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
  rangeSummary: { ...typeScale.footnote },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sundayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  sundayBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sundayText: { fontSize: 13, fontWeight: '600' },
  wrap: { gap: 10 },
  grow: { flex: 1 },
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

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targets: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { ...typeScale.caption, fontWeight: '700' },
  /** The picker in the add form gets a real target size; the card's chips have hitSlop. */
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
