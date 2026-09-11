import React, { useCallback, useState, useSyncExternalStore } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Check, GraduationCap, Plus, Stethoscope, Trash2, Undo2, X } from 'lucide-react-native';
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
  isoDay,
  monthsOf,
  SATURDAY_RULES,
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
  type SaturdayRule,
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
  const [days, setDays] = useState('');
  const [skipSundays, setSkipSundays] = useState(false);
  /*
     A switch of its own, not half of a "weekends" one.

     The owner asked for it that way and the reason is the local timetable: in
     most Indian medical colleges Sunday is off and Saturday is not — a half or
     full day of theory, and clinical postings straight through it. One
     "skip weekends" control would make the commonest case pick between two
     wrong answers.
  */
  const [saturdays, setSaturdays] = useState<SaturdayRule>('none');
  const [holidayDraft, setHolidayDraft] = useState('');
  const [holidays, setHolidays] = useState<string[]>([]);
  const [target, setTarget] = useState(75);
  /** Which card has its month breakdown open. One at a time. */
  const [openMonths, setOpenMonths] = useState<string | null>(null);
  /** The last mark per item, so Undo knows what it is taking back. */
  const [lastMark, setLastMark] = useState<Record<string, boolean>>({});

  const shown = items.filter(item => item.kind === kind);

  const submit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const total = Number(days);
    await addAttendance({
      name: trimmed,
      kind,
      target,
      /*
         The length is offered for a theory subject too now.

         It was postings only, on the reasoning that nobody knows when a theory
         block ends. The owner asked for it — "in theory how many days does it
         run option not there" — and they are right: a term is a fixed block,
         and somebody who knows theirs runs ninety days gets the same "and
         there are only eleven left" that a posting gets. Still optional, so a
         subject left blank behaves exactly as it did.
      */
      totalDays: Number.isFinite(total) && total > 0 ? total : undefined,
      startDate: Number.isFinite(total) && total > 0 ? isoDay(new Date()) : undefined,
      skipSundays: skipSundays ? true : undefined,
      saturdays: saturdays === 'none' ? undefined : saturdays,
      holidays: holidays.length > 0 ? holidays : undefined,
    });
    setName('');
    setDays('');
    setSkipSundays(false);
    setSaturdays('none');
    setHolidays([]);
    setHolidayDraft('');
    setAdding(false);
  }, [name, days, kind, target, skipSundays, saturdays, holidays]);

  /*
     A typed date, accepted only when it is a real one.

     `new Date('2026-02-31')` rolls over to 3 March rather than throwing, so a
     regex alone would let a day that does not exist onto the list, where it
     would sit looking accepted and never match anything. Round-tripping it
     through `isoDay` is what catches that.
  */
  const addHoliday = useCallback(() => {
    const text = holidayDraft.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return;
    }
    const date = new Date(`${text}T00:00:00`);
    if (Number.isNaN(date.getTime()) || isoDay(date) !== text) {
      return;
    }
    setHolidays((current) => (current.includes(text) ? current : [...current, text].sort()));
    setHolidayDraft('');
  }, [holidayDraft]);

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
                : 'Add a rotation and how many days it runs. Orbit counts down the days left and tells you how many you can safely bunk.'}
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
            monthsOpen={openMonths === item.id}
            onToggleMonths={() =>
              setOpenMonths(current => (current === item.id ? null : item.id))
            }
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
            {/*
              Offered for a subject as well as a posting.

              This was `kind === 'posting'`, and the owner asked why a theory
              subject could not say how long it runs. Nothing in the arithmetic
              ever cared which kind it was — `workingDays` reads a length and a
              start date — so the gate was the only thing stopping it.
            */}
            <TextInput
              value={days}
              onChangeText={setDays}
              keyboardType="number-pad"
              placeholder="How many days does it run? (optional)"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={
                kind === 'theory'
                  ? 'How many days the subject runs'
                  : 'How many days the posting runs'
              }
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            {/*
              Off by default, and that is deliberate.

              Plenty of postings run through the weekend, and a tracker that
              silently shortens a rotation nobody asked it to shorten is the
              same bug as one that forgets the Sundays — just pointing the other
              way. What it changes is real: a 28-day block starting on a Monday
              holds four Sundays, so leaving them in makes "only two days left"
              wrong by four, in the direction that gets somebody short.
            */}
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
            {/*
              Saturdays are a rule, not a tick.

              Its own control rather than half of a "weekends" one, because
              Sunday off and Saturday on is the commonest timetable there is.
              And four choices rather than two, because the owner named the
              rule most colleges actually run: "every second saturday is
              automatic holiday". Neither "all" nor "none" can say that, and
              typing those dates into the holiday list by hand is six to twelve
              entries a term, every term.
            */}
            <Text style={[styles.formLabel, { color: colors.textMuted }]}>SATURDAYS</Text>
            <View style={styles.holidayWrap}>
              {SATURDAY_RULES.map(rule => {
                const active = rule.value === saturdays;
                return (
                  <Touchable
                    key={rule.value}
                    onPress={() => setSaturdays(rule.value)}
                    label={rule.label}
                    state={{ selected: active }}
                    hitSlop={6}
                    style={[
                      styles.chip,
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
                      {rule.label}
                    </Text>
                  </Touchable>
                );
              })}
            </View>

            {/*
              Government holidays, festivals, a strike.

              The other half of "holidays reduce total working days": a block
              with Diwali and Republic Day in it is days shorter than its
              calendar length, and without them the tracker hands somebody days
              they have not got. A date outside the block never matches, so one
              list of the college's holidays can be pasted at every subject
              without pruning it first.
            */}
            <Text style={[styles.formLabel, { color: colors.textMuted }]}>
              HOLIDAYS (OPTIONAL)
            </Text>
            <View style={styles.formRow}>
              <TextInput
                value={holidayDraft}
                onChangeText={setHolidayDraft}
                onSubmitEditing={addHoliday}
                autoCapitalize="none"
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Holiday date, year month day"
                style={[styles.input, styles.inputGrow, { color: colors.text, borderColor: colors.border }]}
              />
              <Touchable
                onPress={addHoliday}
                label="Add this holiday"
                style={[styles.formButton, { borderColor: colors.border }]}>
                <Text style={[styles.formButtonText, { color: colors.text }]}>Add day</Text>
              </Touchable>
            </View>
            {holidays.length > 0 ? (
              <View style={styles.holidayWrap}>
                {holidays.map(day => (
                  <Touchable
                    key={day}
                    onPress={() => setHolidays(current => current.filter(d => d !== day))}
                    label={`Remove the holiday on ${day}`}
                    hitSlop={6}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: withAlpha(colors.accent, 0.12) },
                    ]}>
                    <Text style={[styles.chipText, { color: colors.text }]}>{day}</Text>
                    <X size={11} color={colors.textMuted} />
                  </Touchable>
                ))}
              </View>
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
                  setDays('');
                  setSkipSundays(false);
                  setSaturdays('none');
                  setHolidays([]);
                  setHolidayDraft('');
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
  monthsOpen,
  onToggleMonths,
}: {
  item: AttendanceItem;
  onMark: (item: AttendanceItem, present: boolean) => void;
  onUndo: () => void;
  onTarget: (next: number) => void;
  onRemove: () => void;
  monthsOpen: boolean;
  onToggleMonths: () => void;
}) {
  const { colors } = useTheme();
  const verdict = verdictFor(item);
  /*
     The block, month by month.

     Asked for as "select option to see about each month", and it answers what
     one percentage cannot: a rotation that looks fine overall can hold a month
     where almost everything was missed, and a term with a long festival break
     in it has far fewer classes that month than the average implies.

     Two different things sit in a row and they stay apart. The working and off
     days come from the CALENDAR and exist before anything is marked; the held
     and attended come from the LOG, which only holds what has actually been
     tapped. A single percentage made of both would be half a plan and half a
     record.
  */
  const months = monthsOf(item);
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
              {item.saturdays && item.saturdays !== 'none'
                ? ` · ${SATURDAY_RULES.find(r => r.value === item.saturdays)?.label ?? ''}`
                : ''}
              {item.holidays && item.holidays.length > 0
                ? ` · ${item.holidays.length === 1 ? '1 holiday' : `${item.holidays.length} holidays`}`
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

      {months.length > 0 ? (
        <Touchable
          onPress={onToggleMonths}
          label={
            monthsOpen
              ? `Hide the month by month breakdown for ${item.name}`
              : `See ${item.name} month by month`
          }
          role="button"
          state={{ expanded: monthsOpen }}
          hitSlop={6}
          style={styles.monthRow}>
          <Text style={[styles.monthName, { color: colors.accent }]}>
            {monthsOpen ? 'Hide months' : 'See each month'}
          </Text>
          <Text style={[styles.monthFacts, { color: colors.textMuted }]}>
            {months.length === 1 ? '1 month' : `${months.length} months`}
          </Text>
        </Touchable>
      ) : null}

      {monthsOpen ? (
        <View style={[styles.monthTable, { borderTopColor: colors.border }]}>
          {months.map(month => (
            <View key={month.key} style={styles.monthRow}>
              <Text style={[styles.monthName, { color: colors.text }]}>{month.label}</Text>
              <Text style={[styles.monthFacts, { color: colors.textMuted }]}>
                {month.working > 0
                  ? `${month.working} working${month.off > 0 ? ` · ${month.off} off` : ''}`
                  : 'no scheduled days'}
                {month.held > 0 ? ` · marked ${month.attended}/${month.held}` : ''}
              </Text>
            </View>
          ))}
          {months.every(month => month.held === 0) ? (
            // Said out loud rather than left as an empty column, because a
            // subject marked before the log existed has counters and no dates,
            // and a blank there reads as the feature being broken.
            <Text style={[styles.monthFacts, { color: colors.textMuted }]}>
              Marks are counted per month from the day you record them.
            </Text>
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
  /** The date field takes the row and the button takes what it needs. */
  inputGrow: { flex: 1, marginBottom: 0 },
  holidayWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 7,
  },
  monthName: { ...typeScale.footnote, fontWeight: '700' },
  monthFacts: { ...typeScale.caption },
  monthTable: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, paddingTop: 4 },
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
