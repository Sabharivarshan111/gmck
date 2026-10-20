import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  ArrowRight,
  CalendarDays,
  Check,
  RotateCcw,
  Target,
} from 'lucide-react-native';
import { Text } from './Text';
import { KeyboardSafe } from './KeyboardSafe';
import { Touchable } from './Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { radius, space } from '@/theme/tokens';
import {
  defaultNeetPlan,
  planCoverage,
  studyDay,
  validStudyDate,
  type NeetPlan,
  type NeetStudy,
} from '@/lib/neetPgPlan';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function NeetPgPlanPanel({
  total,
  state,
  ready,
  storageError,
  subjects,
  onSave,
  onStart,
  onLibrary,
}: {
  total: number;
  state: NeetStudy;
  ready: boolean;
  storageError: boolean;
  subjects: { id: string; name: string }[];
  onSave: (plan: NeetPlan) => void;
  onStart: () => void;
  onLibrary: () => void;
}) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(!state.plan);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<NeetPlan>(state.plan ?? defaultNeetPlan());
  const day = studyDay();
  const plan = state.plan;
  const attempts = Object.values(state.attempts);
  const today = attempts.filter(a => a.day === day);
  const due = attempts.filter(a => a.due <= day).length;
  const correct = attempts.filter(a => a.correct === true).length;
  const scored = attempts.filter(a => a.correct !== null).length;
  const session = state.session?.day === day ? state.session : null;
  const restDay = plan && !plan.days.includes(new Date().getDay());
  const text = { color: colors.text };
  const muted = { color: colors.textMuted };
  const coverage = planCoverage(
    draft,
    Math.max(0, total - attempts.length),
    day,
  );
  const card = { backgroundColor: colors.card, borderColor: colors.border };
  const chip = (label: string, selected: boolean, press: () => void) => (
    <Touchable
      key={label}
      label={label}
      state={{ selected }}
      onPress={press}
      style={[
        s.chip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          typeScale.callout,
          { color: selected ? colors.primaryText : colors.text },
        ]}
      >
        {label}
        {selected ? ' ✓' : ''}
      </Text>
    </Touchable>
  );
  const action = (label: string, press: () => void, disabled = false) => (
    <Touchable
      label={label}
      disabled={disabled}
      onPress={press}
      style={[s.action, { backgroundColor: colors.primary }]}
    >
      <Text style={[typeScale.bodyStrong, { color: colors.primaryText }]}>
        {label}
      </Text>
      <ArrowRight size={19} color={colors.primaryText} />
    </Touchable>
  );
  return (
    <KeyboardSafe style={s.flex}>
      <ScrollView
        contentContainerStyle={s.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.heading}>
          <View
            style={[s.mark, { backgroundColor: withAlpha(colors.accent, 0.1) }]}
          >
            <Target color={colors.accent} size={24} />
          </View>
          <Text style={[typeScale.overline, muted]}>ORBIT / NEET-PG</Text>
        </View>
        <Text accessibilityRole="header" style={[typeScale.display, text]}>
          {editing ? 'A plan that fits your life.' : 'Make today count.'}
        </Text>
        <Text style={[typeScale.callout, muted]}>
          {editing
            ? 'Choose your pace. We’ll organise practice around your time and priorities.'
            : day + ' · Your practice, saved on this device'}
        </Text>
        {storageError ? (
          <Text
            accessibilityRole="alert"
            style={[typeScale.callout, { color: colors.danger }]}
          >
            Couldn’t save progress on this device. Keep this session open and
            check available storage.
          </Text>
        ) : null}
        {!ready ? (
          <Text style={[typeScale.body, muted]}>Opening your study plan…</Text>
        ) : editing ? (
          <>
            <View style={s.steps}>
              {['Goal', 'Time', 'Priorities', 'Review'].map((name, index) => (
                <View
                  key={name}
                  style={[
                    s.step,
                    {
                      borderColor:
                        index === step ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typeScale.caption,
                      index === step ? { color: colors.accent } : muted,
                    ]}
                  >
                    {index + 1} {name}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[s.card, card]}>
              <Text accessibilityRole="header" style={[typeScale.title2, text]}>
                {
                  [
                    'What are you working towards?',
                    'Your practice budget',
                    'Where should we begin?',
                    'Your starting plan',
                  ][step]
                }
              </Text>
              {step === 0 ? (
                <>
                  <Text style={[typeScale.callout, muted]}>
                    Your goal is a personal preference, never a rank prediction.
                  </Text>
                  <View style={s.wrap}>
                    {[
                      'Build consistency',
                      'Top 1,000',
                      'Top 10,000',
                      'My best score',
                    ].map(value =>
                      chip(value, draft.target === value, () =>
                        setDraft({ ...draft, target: value }),
                      ),
                    )}
                  </View>
                  <Text style={[typeScale.bodyStrong, text]}>
                    Exam date · optional
                  </Text>
                  <TextInput
                    accessibilityLabel="NEET PG target exam date"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    value={draft.examDate}
                    onChangeText={examDate => setDraft({ ...draft, examDate })}
                    maxLength={10}
                    autoCapitalize="none"
                    style={[
                      s.input,
                      typeScale.body,
                      text,
                      { borderColor: colors.border },
                    ]}
                  />
                  {draft.examDate &&
                  (!validStudyDate(draft.examDate) || draft.examDate < day) ? (
                    <Text style={[typeScale.caption, { color: colors.danger }]}>
                      Enter a valid future date, or leave it blank.
                    </Text>
                  ) : null}
                </>
              ) : null}
              {step === 1 ? (
                <>
                  <Text style={[typeScale.bodyStrong, text]}>
                    Minutes per study day
                  </Text>
                  <View style={s.wrap}>
                    {[10, 20, 30, 45, 60].map(value =>
                      chip(`${value} min`, draft.minutes === value, () =>
                        setDraft({ ...draft, minutes: value }),
                      ),
                    )}
                  </View>
                  <Text style={[typeScale.bodyStrong, text]}>
                    Choose your study days
                  </Text>
                  <View style={s.wrap}>
                    {DAY_NAMES.map((name, index) =>
                      chip(name, draft.days.includes(index), () =>
                        setDraft({
                          ...draft,
                          days: draft.days.includes(index)
                            ? draft.days.filter(d => d !== index)
                            : [...draft.days, index],
                        }),
                      ),
                    )}
                  </View>
                  <Text style={[typeScale.callout, muted]}>
                    About two minutes per question, including explanation
                    review. Your actual pace may vary.
                  </Text>
                </>
              ) : null}
              {step === 2 ? (
                <>
                  <Text style={[typeScale.bodyStrong, text]}>
                    Preparation today
                  </Text>
                  <View style={s.wrap}>
                    {[
                      'Starting fresh',
                      'Building momentum',
                      'Revision mode',
                    ].map(value =>
                      chip(value, draft.preparation === value, () =>
                        setDraft({ ...draft, preparation: value }),
                      ),
                    )}
                  </View>
                  <Text style={[typeScale.bodyStrong, text]}>
                    Subjects to prioritise · optional
                  </Text>
                  <Text style={[typeScale.caption, muted]}>
                    Pick up to three. Leave empty for balanced practice.
                  </Text>
                  <View style={s.wrap}>
                    {subjects.map(value =>
                      chip(value.name, draft.subjects.includes(value.id), () =>
                        setDraft({
                          ...draft,
                          subjects: draft.subjects.includes(value.id)
                            ? draft.subjects.filter(id => id !== value.id)
                            : [...draft.subjects, value.id].slice(-3),
                        }),
                      ),
                    )}
                  </View>
                </>
              ) : null}
              {step === 3 ? (
                <>
                  <Text style={[typeScale.title1, text]}>
                    {Math.floor(draft.minutes / 2)} questions / study day
                  </Text>
                  <Text style={[typeScale.body, text]}>
                    {draft.minutes} minutes · {draft.days.length} days a week
                  </Text>
                  <Text style={[typeScale.callout, muted]}>
                    {draft.target} · {draft.preparation}
                    {draft.examDate ? ` · ${draft.examDate}` : ''}
                  </Text>
                  <Text style={[typeScale.callout, muted]}>
                    {draft.subjects.length
                      ? subjects
                          .filter(su => draft.subjects.includes(su.id))
                          .map(su => su.name)
                          .join(' + ') + ' first.'
                      : 'Balanced across available chapters.'}
                  </Text>
                  {coverage ? (
                    <Text style={[typeScale.callout, muted]}>
                      {coverage.sessions} study days until your exam. A first
                      pass through your remaining bank would need about{' '}
                      {coverage.neededPerSession} new questions per study day;
                      your budget is {coverage.budget} questions including
                      reviews.{' '}
                      {coverage.neededPerSession > coverage.budget
                        ? 'Consider increasing your time or narrowing your priorities.'
                        : 'Allow extra time for repeat reviews.'}
                    </Text>
                  ) : null}
                  <Text style={[typeScale.callout, muted]}>
                    Due reviews come first, followed by new questions. Correct
                    answers return after 1, 3, 7 and 14 days; missed or unscored
                    questions return the next day. This is ORBIT’s practice
                    schedule.
                  </Text>
                  <Text style={[typeScale.caption, muted]}>
                    Plans, answers and saved progress work offline. Ask ACEV
                    requires internet. A plan covers this installed bank; it is
                    not a full-syllabus or rank guarantee.
                  </Text>
                </>
              ) : null}
            </View>
            {action(
              step === 3 ? 'Save my NEET PG plan' : 'Continue plan setup',
              () => {
                if (step === 3) {
                  onSave(draft);
                  setEditing(false);
                } else setStep(step + 1);
              },
              (step === 0 &&
                !!draft.examDate &&
                (!validStudyDate(draft.examDate) || draft.examDate < day)) ||
                (step === 1 && !draft.days.length),
            )}
            {step > 0 ? (
              <Touchable
                label="Previous plan step"
                onPress={() => setStep(step - 1)}
                style={s.secondary}
              >
                <Text style={[typeScale.bodyStrong, text]}>Back</Text>
              </Touchable>
            ) : null}
            <Touchable
              label="Skip plan and browse NEET PG bank"
              onPress={onLibrary}
              style={s.secondary}
            >
              <Text style={[typeScale.callout, muted]}>
                Browse the bank instead
              </Text>
            </Touchable>
          </>
        ) : (
          <>
            <View style={[s.card, card]}>
              <Text style={[typeScale.overline, { color: colors.accent }]}>
                TODAY’S PRACTICE
              </Text>
              <Text style={[typeScale.title1, text]}>
                {restDay ? 'A little breathing room.' : 'One focused session.'}
              </Text>
              <Text style={[typeScale.callout, muted]}>
                {restDay
                  ? 'Today is outside your selected study days. Optional practice is always here.'
                  : `${plan?.minutes ?? 20} minutes · up to ${Math.floor(
                      (plan?.minutes ?? 20) / 2,
                    )} questions`}
              </Text>
              <View style={s.metrics}>
                <View>
                  <Text style={[typeScale.title1, text]}>{today.length}</Text>
                  <Text style={[typeScale.caption, muted]}>reviewed today</Text>
                </View>
                <View>
                  <Text style={[typeScale.title1, text]}>{due}</Text>
                  <Text style={[typeScale.caption, muted]}>due for review</Text>
                </View>
                <View>
                  <Text style={[typeScale.title1, text]}>
                    {scored ? Math.round((correct / scored) * 100) + '%' : '—'}
                  </Text>
                  <Text style={[typeScale.caption, muted]}>
                    latest accuracy
                  </Text>
                </View>
              </View>
              {!session && attempts.length >= total && !due ? (
                <Text style={[typeScale.bodyStrong, text]}>
                  You’ve reviewed every question in this bank. Your next
                  scheduled reviews will appear here.
                </Text>
              ) : (
                action(
                  session
                    ? 'Resume today’s session'
                    : restDay
                    ? 'Start optional practice'
                    : 'Start today’s session',
                  onStart,
                )
              )}
            </View>
            <View style={[s.card, card]}>
              <View style={s.heading}>
                <CalendarDays size={20} color={colors.accent} />
                <Text style={[typeScale.title3, text]}>Your weekly rhythm</Text>
              </View>
              <Text style={[typeScale.body, text]}>
                {plan?.days.map(d => DAY_NAMES[d]).join(' · ')}
              </Text>
              <Text style={[typeScale.callout, muted]}>
                {plan?.target}
                {plan?.examDate ? ` · Exam ${plan.examDate}` : ''}
              </Text>
              <Text style={[typeScale.caption, muted]}>
                Progress is local to this device. Review answers to add them to
                your practice history.
              </Text>
              <Touchable
                label="Edit NEET PG plan"
                onPress={() => {
                  setDraft(plan ?? defaultNeetPlan());
                  setStep(0);
                  setEditing(true);
                }}
                style={s.secondary}
              >
                <View style={s.heading}>
                  <RotateCcw size={16} color={colors.accent} />
                  <Text
                    style={[typeScale.bodyStrong, { color: colors.accent }]}
                  >
                    Adjust my plan
                  </Text>
                </View>
              </Touchable>
            </View>
            <Touchable
              label="Browse NEET PG chapter library"
              onPress={onLibrary}
              style={[s.card, card]}
            >
              <View style={s.heading}>
                <Check size={20} color={colors.accent} />
                <Text style={[typeScale.title3, text]}>
                  Explore your chapter library
                </Text>
                <ArrowRight size={20} color={colors.text} />
              </View>
              <Text style={[typeScale.callout, muted]}>
                All years. Your saved questions. Your next concept.
              </Text>
            </Touchable>
          </>
        )}
      </ScrollView>
    </KeyboardSafe>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1 },
  page: {
    padding: space.xl,
    gap: space.lg,
    width: '100%',
    maxWidth: 780,
    alignSelf: 'center',
    paddingBottom: space.xxl * 2,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  mark: { padding: space.sm, borderRadius: radius.md },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
  },
  action: {
    minHeight: 52,
    borderRadius: radius.md,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  secondary: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  steps: { flexDirection: 'row', gap: space.xs },
  step: { flex: 1, paddingVertical: space.sm, borderBottomWidth: 2 },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
  },
});
