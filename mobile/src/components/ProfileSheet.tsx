import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { Sheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { GradientFill } from '@/components/Gradient';
import { useTheme } from '@/theme';
import { DisplayNameError, type LocalProfile, type Year } from '@/lib/profile';
import { YEAR_LABEL } from '@/lib/questionBank';
import { YEAR_TO_KEY } from '@/lib/profile';
import { setTourPaused } from '@/tour/store';

const YEARS: Year[] = ['first', 'second', 'third', 'final'];

/**
 * Name + year editor, also used as first-run onboarding. The name goes through
 * the same blocklist the web app uses (shared, not duplicated).
 */
export function ProfileSheet({
  visible,
  profile,
  onClose,
  onSave,
  dismissable = true,
}: {
  visible: boolean;
  profile: LocalProfile | null;
  onClose: () => void;
  onSave: (next: LocalProfile) => Promise<void>;
  dismissable?: boolean;
}) {
  const { colors } = useTheme();

  /*
   * Non-dismissable and visible means this is the fresh-install gate, and
   * nothing may compete with it. The walkthrough is told so it can stand down
   * — it is a modal, it is above everything drawn in the app tree, and a tour
   * arguing with a form the reader cannot escape is the worst of both.
   */
  const blocking = visible && !dismissable;
  useEffect(() => {
    if (!blocking) {
      return;
    }
    setTourPaused(true);
    return () => setTourPaused(false);
  }, [blocking]);

  const [name, setName] = useState('');
  /*
   * Null on a fresh install, and that is the fix rather than an oversight.
   *
   * It opened with Second Year already selected, so a reader who did not
   * notice the row — the name field is what the sheet asks for first, and the
   * button below says "Start studying" — tapped straight through and was
   * silently enrolled in somebody else's syllabus. Every question, every
   * count, every leaderboard position wrong, with nothing on screen to say a
   * choice had been made on their behalf. Reported as "why ut shows defualt
   * secodn eyar".
   *
   * A default is right for a preference and wrong for an identity. So first
   * run starts with none of the four chosen and the button will not submit
   * until one is; EDITING a profile still opens on the year that is stored,
   * because there the reader has already answered.
   */
  const [year, setYear] = useState<Year | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(profile?.display_name ?? '');
      setYear(profile?.year ?? null);
      setError(null);
    }
  }, [visible, profile]);

  const submit = async () => {
    if (!year) {
      // Said in the same place every other problem with this form is said, so
      // there is one place to look rather than two.
      setError('Choose your year — it decides which question bank you get.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ display_name: name, year });
      onClose();
    } catch (err) {
      setError(
        err instanceof DisplayNameError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Could not save your profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  const isOnboarding = !profile;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      // First run has no "cancel": there is nothing behind it to go back to,
      // so no stray tap, swipe or back press may strand the user on an empty
      // app.
      dismissable={dismissable}
      title={isOnboarding ? 'Welcome to Orbit' : 'Edit profile'}>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {isOnboarding
          ? 'Pick a name and your year to get started.'
          : 'Your name appears on the leaderboard.'}
      </Text>

      <Text nativeID="profile-name-label" style={[styles.label, { color: colors.textMuted }]}>
        DISPLAY NAME
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Phantom"
        placeholderTextColor={colors.textMuted}
        maxLength={40}
        autoCorrect={false}
        accessibilityLabel="Display name"
        // Validation is announced inline, not saved up for the submit button
        // (SKILL §16 — validate inline, not on submit).
        accessibilityHint={error ?? undefined}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.cardElevated,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.textMuted }]}>
        {year ? 'YEAR' : 'YEAR — PICK ONE'}
      </Text>
      <View style={styles.grid}>
        {YEARS.map(option => {
          const active = option === year;
          const optionLabel = YEAR_LABEL[YEAR_TO_KEY[option]];
          return (
            <Touchable
              key={option}
              onPress={() => setYear(option)}
              role="radio"
              label={optionLabel}
              state={{ checked: active }}
              scaleTo={0.97}
              style={[
                styles.yearCard,
                {
                  backgroundColor: colors.cardElevated,
                  borderColor: active ? colors.text : colors.border,
                  borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                },
              ]}>
              <Text style={[styles.yearName, { color: colors.text }]}>{optionLabel}</Text>
            </Touchable>
          );
        })}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}

      <Touchable
        onPress={submit}
        // Deliberately still pressable with no year chosen. A dead button
        // explains nothing, and the reader who has not noticed the year row is
        // exactly the one who would tap this — so it stays live and `submit`
        // says what is missing. `state.disabled` is not the way to express
        // that here: Touchable folds it into the Pressable's own `disabled`,
        // which would swallow the press and the explanation with it.
        disabled={saving}
        state={{ busy: saving }}
        // What TalkBack reads, so the requirement is spoken rather than only
        // drawn in the label above the four cards.
        label={
          year ? (isOnboarding ? 'Start studying' : 'Save') : 'Choose your year first, then start studying'
        }
        style={[styles.saveButton, !year && styles.savePending]}>
        <GradientFill from="#FFFFFF" to={colors.fuchsia} borderRadius={14} />
        {saving ? (
          <ActivityIndicator color="#1A0A1F" />
        ) : (
          <Text style={styles.saveText}>{isOnboarding ? 'Start studying' : 'Save'}</Text>
        )}
      </Touchable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  yearCard: {
    // Was `width: '47%'` with `flexGrow: 1`, which let each card expand into
    // whatever space was left — so the two cards in a row ended up different
    // widths. A fixed half-width with space-between is symmetric by
    // construction.
    width: '48.5%',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  yearName: {
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    fontSize: 13,
    marginTop: 14,
  },
  savePending: {
    // Reads as not-yet-ready without being unpressable — pressing it is how
    // the reader finds out what is missing.
    opacity: 0.55,
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 20,
  },
  saveText: {
    color: '#1A0A1F',
    fontSize: 17,
    fontWeight: '800',
  },
});
