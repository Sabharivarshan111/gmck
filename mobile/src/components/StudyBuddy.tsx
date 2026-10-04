import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Bot } from '@/components/Bot';
import {
  useBuddy,
  setBuddy,
  studyPlan,
  todayKey,
  BUDDY_COLORS,
  BUDDY_ANIMALS,
  BUDDY_VARIANTS,
  recommendedVariant,
} from '@/lib/studyBuddy';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { syncReminders } from '@/lib/reminderSync';
import type { StateId } from '@/bot/states';

export function BuddyAvatar({
  state = 'idle',
  size = 42,
  active = false,
  watchingInput = false,
  interaction = 0,
}: {
  state?: StateId;
  size?: number;
  active?: boolean;
  watchingInput?: boolean;
  interaction?: number;
}) {
  const buddy = useBuddy();
  if (!buddy.enabled) return null;
  return (
    <Bot
      state={state}
      size={size}
      active={active && !buddy.quiet}
      bodyColor={buddy.color}
      kind={buddy.kind}
      variant={buddy.variant}
      watchingInput={watchingInput}
      interaction={interaction}
    />
  );
}
export function BuddyReaction({
  correct,
  onReview,
}: {
  correct: boolean;
  onReview?: () => void;
}) {
  const buddy = useBuddy();
  const focused = useIsFocused();
  const [interaction, reactToTap] = useState(0);
  const { colors } = useTheme();
  if (!buddy.enabled) return null;
  return (
    <View
      style={[
        styles.reaction,
        {
          backgroundColor: withAlpha(
            correct ? colors.success : colors.warning,
            0.09,
          ),
        },
      ]}
    >
      <Touchable
        label={`Pet ${buddy.name}`}
        onPress={() => reactToTap(n => n + 1)}
      >
        <BuddyAvatar
          active={focused}
          interaction={interaction}
          state={correct ? 'wink' : 'dismay'}
        />
      </Touchable>
      <View style={styles.flex}>
        <Text style={[typeScale.footnote, { color: colors.text }]}>
          {buddy.name}:{' '}
          {correct
            ? 'Nice recall! Explain why the other options do not fit.'
            : 'We can learn from this. Compare your choice with the explanation below.'}
        </Text>
        {!correct && onReview ? (
          <Touchable
            label="Study Buddy explain this mistake"
            onPress={onReview}
            style={styles.action}
          >
            <Text style={{ color: colors.accent }}>Help me understand →</Text>
          </Touchable>
        ) : null}
      </View>
    </View>
  );
}
export function BuddyCoach({
  failed,
  onRecall,
}: {
  failed?: boolean;
  onRecall?: () => void;
}) {
  const buddy = useBuddy();
  const focused = useIsFocused();
  const [interaction, reactToTap] = useState(0);
  const { colors } = useTheme();
  if (!buddy.enabled) return null;
  return (
    <View style={styles.reaction}>
      <Touchable
        label={`Pet ${buddy.name}`}
        onPress={() => reactToTap(n => n + 1)}
      >
        <BuddyAvatar
          active={focused}
          interaction={interaction}
          state={failed ? 'exclaim' : 'wide'}
        />
      </Touchable>
      <View style={styles.flex}>
        <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
          {buddy.name}:{' '}
          {failed
            ? 'The answer did not arrive. Try again when your connection is ready.'
            : 'Before scrolling on, explain the main idea in your own words.'}
        </Text>
        {!failed && onRecall ? (
          <Touchable
            label="Study Buddy quiz me on this answer"
            onPress={onRecall}
            style={styles.action}
          >
            <Text style={{ color: colors.accent }}>Check my recall →</Text>
          </Touchable>
        ) : null}
      </View>
    </View>
  );
}
export function StudyBuddyPanel({
  onStudy,
}: {
  onStudy?: (prompt: string) => void;
}) {
  const buddy = useBuddy();
  const { colors } = useTheme();
  const change = (patch: Parameters<typeof setBuddy>[0]) => {
    setBuddy(patch);
    void syncReminders();
  };
  const [nameDraft, setNameDraft] = useState(buddy.name);
  const editingName = useRef(false);
  const focused = useIsFocused();
  const [petInteraction, reactToPet] = useState(0);
  useEffect(() => {
    if (!editingName.current) setNameDraft(buddy.name);
  }, [buddy.name]);
  const plan = studyPlan(buddy.minutes, buddy.topic);
  const done = buddy.day === todayKey() ? buddy.completed : [];
  const button = {
    ...styles.action,
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderWidth: 1,
  };
  return (
    <View style={styles.panel}>
      <View style={styles.reaction}>
        <Touchable
          label={`Pet ${buddy.name}`}
          onPress={() => reactToPet(n => n + 1)}
        >
          <BuddyAvatar
            size={60}
            active={focused}
            interaction={petInteraction}
            state={done.length === 3 ? 'wink' : 'idle'}
          />
        </Touchable>
        <View style={styles.flex}>
          <Text style={[typeScale.title3, { color: colors.text }]}>
            Your Study Buddy
          </Text>
          <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
            A small plan. Honest recall. One step at a time.
          </Text>
        </View>
      </View>
      <Touchable
        label="Show Study Buddy"
        role="switch"
        state={{ checked: buddy.enabled }}
        onPress={() => change({ enabled: !buddy.enabled })}
        style={button}
      >
        <Text style={{ color: colors.text }}>
          Study Buddy · {buddy.enabled ? 'On' : 'Hidden'}
        </Text>
      </Touchable>
      <View style={styles.wrap}>
        {[{ id: 'orb' as const, label: 'Orbit' }, ...BUDDY_ANIMALS].map(
          animal => (
            <Touchable
              key={animal.id}
              label={`Choose ${animal.id} buddy`}
              state={{ selected: buddy.kind === animal.id }}
              onPress={() =>
                change({
                  kind: animal.id,
                  variant: recommendedVariant(animal.id),
                })
              }
              style={[
                button,
                { minWidth: 88, alignItems: 'center' },
                buddy.kind === animal.id && { borderColor: colors.accent },
              ]}
            >
              <Bot
                state="idle"
                size={56}
                active={false}
                bodyColor={buddy.color}
                kind={animal.id}
                variant={recommendedVariant(animal.id)}
              />
              <Text style={{ color: colors.text }}>{animal.label}</Text>
            </Touchable>
          ),
        )}
      </View>
      {buddy.kind !== 'orb' ? (
        <>
          <Text style={[typeScale.callout, { color: colors.text }]}>
            Three designs · choose your favourite
          </Text>
          <View style={styles.wrap}>
            {BUDDY_VARIANTS.map(variant => (
              <Touchable
                key={variant}
                label={`Choose ${variant} ${buddy.kind} design`}
                state={{ selected: buddy.variant === variant }}
                onPress={() => change({ variant })}
                style={[
                  button,
                  { flex: 1, minWidth: 88, alignItems: 'center' },
                  buddy.variant === variant && { borderColor: colors.accent },
                ]}
              >
                <Bot
                  state="idle"
                  size={64}
                  active={false}
                  kind={buddy.kind}
                  variant={variant}
                  bodyColor={buddy.color}
                />
                <Text style={{ color: colors.text }}>
                  {variant === 'classic'
                    ? 'Classic'
                    : variant === 'soft'
                    ? 'Soft'
                    : 'Bold'}
                </Text>
                {variant === recommendedVariant(buddy.kind) ? (
                  <Text style={[typeScale.caption, { color: colors.accent }]}>
                    Recommended
                  </Text>
                ) : null}
              </Touchable>
            ))}
          </View>
          <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
            {BUDDY_ANIMALS.find(animal => animal.id === buddy.kind)?.reason}
          </Text>
        </>
      ) : null}
      <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
        Buddy name
      </Text>
      <TextInput
        accessibilityLabel="Study Buddy name"
        value={nameDraft}
        maxLength={24}
        onFocus={() => {
          editingName.current = true;
        }}
        onChangeText={name => {
          setNameDraft(name);
          setBuddy({ name });
        }}
        onBlur={() => {
          editingName.current = false;
          change({ name: nameDraft });
          setNameDraft(nameDraft.trim() || 'Orbit');
        }}
        onSubmitEditing={() => change({ name: nameDraft })}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border },
        ]}
      />
      <View style={styles.wrap}>
        {BUDDY_COLORS.map((color, i) => (
          <Touchable
            key={color}
            label={`Buddy colour ${i + 1}`}
            state={{ selected: buddy.color === color }}
            onPress={() => change({ color })}
            style={[
              button,
              {
                borderColor:
                  buddy.color === color ? colors.text : colors.border,
              },
            ]}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: color,
              }}
            />
          </Touchable>
        ))}
      </View>
      <Touchable
        label="Quiet Study Buddy motion"
        role="switch"
        state={{ checked: buddy.quiet }}
        onPress={() => change({ quiet: !buddy.quiet })}
        style={button}
      >
        <Text style={{ color: colors.text }}>
          Quiet motion · {buddy.quiet ? 'On' : 'Off'}
        </Text>
      </Touchable>
      <Text style={[typeScale.title3, { color: colors.text }]}>
        Today's study plan · {done.length}/3
      </Text>
      <TextInput
        accessibilityLabel="Study plan topic"
        placeholder="What are you studying today?"
        placeholderTextColor={colors.textMuted}
        value={buddy.topic}
        maxLength={100}
        onChangeText={topic => setBuddy({ topic, completed: [] })}
        onEndEditing={() => {
          void syncReminders();
        }}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border },
        ]}
      />
      <View style={styles.wrap}>
        {[15, 30, 60].map(minutes => (
          <Touchable
            key={minutes}
            label={`${minutes} minute study plan`}
            state={{ selected: buddy.minutes === minutes }}
            onPress={() => change({ minutes, completed: [] })}
            style={[
              button,
              buddy.minutes === minutes && { borderColor: colors.accent },
            ]}
          >
            <Text style={{ color: colors.text }}>{minutes} min</Text>
          </Touchable>
        ))}
      </View>
      {plan.map((step, i) => (
        <View
          key={step.title}
          style={[styles.step, { borderColor: colors.border }]}
        >
          <Text style={[typeScale.callout, { color: colors.text }]}>
            {i + 1}. {step.title} · {step.minutes} min
          </Text>
          <View style={styles.wrap}>
            {onStudy ? (
              <Touchable
                label={`Start study step ${i + 1}`}
                onPress={() => onStudy(step.prompt)}
                style={button}
              >
                <Text style={{ color: colors.accent }}>Start →</Text>
              </Touchable>
            ) : null}
            <Touchable
              label={`Mark study step ${i + 1} complete`}
              role="checkbox"
              state={{ checked: done.includes(i) }}
              onPress={() =>
                change({
                  day: todayKey(),
                  completed: done.includes(i)
                    ? done.filter(x => x !== i)
                    : [...done, i],
                })
              }
              style={button}
            >
              <Text style={{ color: colors.text }}>
                {done.includes(i) ? '✓ Done' : 'Mark done'}
              </Text>
            </Touchable>
          </View>
        </View>
      ))}
      <Text style={[typeScale.footnote, { color: colors.textMuted }]}>
        Your plan and attendance stay on this device. Enable Daily reminder in
        Settings before choosing these reminders.
      </Text>
      {(
        [
          ['remindPlan', 'Study plan reminder'],
          ['remindMcq', 'MCQ of the day reminder'],
        ] as const
      ).map(([key, label]) => (
        <Touchable
          key={key}
          label={label}
          role="switch"
          state={{ checked: buddy[key] }}
          onPress={() => change({ [key]: !buddy[key] })}
          style={button}
        >
          <Text style={{ color: colors.text }}>
            {label} · {buddy[key] ? 'On' : 'Off'}
          </Text>
        </Touchable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { gap: 12, paddingVertical: 12 },
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 12,
  },
  action: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 48, padding: 12 },
  step: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
});
