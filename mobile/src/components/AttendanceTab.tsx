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
  const [days, setDays] = useState('');
  const [target, setTarget] = useState(75);
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
      totalDays: kind === 'posting' && Number.isFinite(total) && total > 0 ? total : undefined,
      startDate: kind === 'posting' ? new Date().toISOString().slice(0, 10) : undefined,
    });
    setName('');
    setDays('');
    setAdding(false);
  }, [name, days, kind, target]);

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
              <TextInput
                value={days}
                onChangeText={setDays}
                keyboardType="number-pad"
                placeholder="How many days does it run?"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Length of the posting in days"
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
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
