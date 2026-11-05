import { GOOGLE_SIGN_IN_ENABLED } from '@/lib/authMode';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { type LocalProfile, type Year } from '@/lib/profile';
import { YEAR_LABEL } from '@/lib/questionBank';
import { YEAR_TO_KEY } from '@/lib/profile';
import {
  GoogleSignInCancelled,
  hasAuthenticatedGoogleOnce,
  signInWithGoogle,
} from '@/lib/googleAuth';
import { useProfile } from '@/hooks/useProfile';
import { setTourPaused } from '@/tour/store';
import { UniversityChoice } from '@/components/UniversityChoice';
import { validateDisplayName } from '@shared/profanity';
import type { University } from '@shared/university';
/*
 * Imported, not `require`d.
 *
 * Metro takes either; the preview harness is Vite, where `require` is not
 * defined at all — so a `require('...png')` here renders on a phone and throws
 * in the one place a screen can actually be driven and photographed. Vite
 * resolves this to a URL, Metro to an asset id, and `Image` takes both.
 */
import APP_ICON from '@/assets/app-icon.png';

const YEARS: Year[] = ['first', 'second', 'third', 'final'];
const DRAFT_KEY = '@orbit:first_run_draft_v2';

/** First run: welcome/sign-in, then study setup and Home.
 * Existing profiles skip setup; profile persistence happens when study setup is submitted.
 * Native authentication and the established reduced-motion primitives remain.
 */
export function FirstRun() {
  const { colors } = useTheme();
  const { local, hydrated, save } = useProfile();
  const insets = useSafeAreaInsets();

  const [goal, setGoal] = useState<LocalProfile['preparationGoal']>('university-pyqs');
  const [name, setName] = useState('');
  const [year, setYear] = useState<Year | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [googling, setGoogling] = useState(false);
  // Prevent duplicate native account-picker requests before React re-renders.
  const googleSignInInFlight = useRef(false);
  const [googleAuthenticated, setGoogleAuthenticated] = useState(!GOOGLE_SIGN_IN_ENABLED);
  const [checkingAccount, setCheckingAccount] = useState(GOOGLE_SIGN_IN_ENABLED);
  const [draftHydrated, setDraftHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    if (GOOGLE_SIGN_IN_ENABLED) {
      // v27 initialized the Google SDK only on the user's tap. Restore that
      // known-working ordering; an early native initialize in v30 preceded
      // the reported fatal activity crash on Samsung Android.
      hasAuthenticatedGoogleOnce()
        .then(ok => { if (active && !googleSignInInFlight.current) setGoogleAuthenticated(ok); })
        .catch(() => { /* Keep the sign-in action available after a network failure. */ })
        .finally(() => { if (active) setCheckingAccount(false); });
    }
    return () => { active = false; };
  }, []);

  // Drafts survive Google account chooser, cancellation and Android activity recreation.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(DRAFT_KEY)
      .then(raw => {
        if (!active || !raw) return;
        try {
          const draft = JSON.parse(raw);
          if (typeof draft.name === 'string') setName(draft.name);
          if (YEARS.includes(draft.year)) setYear(draft.year);
          if (typeof draft.university === 'string') setUniversity(draft.university as University);
          if (['university-pyqs', 'neet-pg', 'both'].includes(draft.goal)) setGoal(draft.goal);
        } catch { /* Corrupt draft must never block setup. */ }
      })
      .catch(() => {})
      .finally(() => { if (active) setDraftHydrated(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!draftHydrated || !hydrated || local) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ name, year, university, goal })).catch(() => {});
  }, [draftHydrated, hydrated, local, name, year, university, goal]);

  const needed = hydrated && !local;

  /*
   * Nothing may compete with this. The walkthrough is a modal drawn above the
   * app tree, and a tour explaining a screen the reader cannot reach yet is
   * the worst of both — the same reason the profile sheet stands it down.
   */
  useEffect(() => {
    if (!needed) {
      return;
    }
    setTourPaused(true);
    return () => setTourPaused(false);
  }, [needed]);

  const start = useCallback(async () => {
    if (saving) return;
    if (GOOGLE_SIGN_IN_ENABLED && !googleAuthenticated) {
      setError('Continue with Google before entering Orbit. Your study choices stay saved on this screen.');
      return;
    }
    if (!year) {
      setError('Choose your year — it decides which question bank you get.');
      return;
    }
    if (!university) {
      setError('Choose your university — it decides which past papers you see.');
      return;
    }
    const check = validateDisplayName(name);
    if (!check.ok) { setError(check.reason ?? 'Enter your name.'); return; }
    setSaving(true);
    setError(null);
    try {
      await save({ display_name: name.trim(), year, university, preparationGoal: goal });
      AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your setup.');
    } finally {
      setSaving(false);
    }
  }, [googleAuthenticated, name, year, university, goal, save, saving]);

  /**
   * Google fills an empty name, never overwriting a name typed before sign-in.
   */
  const withGoogle = useCallback(async () => {
    if (googleSignInInFlight.current) return;
    googleSignInInFlight.current = true;
    setGoogling(true);
    setError(null);
    try {
      const account = await signInWithGoogle();
      setGoogleAuthenticated(true);
      if (account?.name && !name.trim()) {
        setName(account.name.split(' ')[0] ?? account.name);
      }
    } catch (err) {
      // Backing out says nothing. The reader closed Google's own sheet on
      // purpose, and reporting that as a failure blames them for a decision.
      if (!(err instanceof GoogleSignInCancelled)) {
        setError(err instanceof Error ? err.message : 'Google sign-in did not complete.');
      }
    } finally {
      googleSignInInFlight.current = false;
      setGoogling(false);
    }
  }, [name]);

  if (!needed) {
    return null;
  }

  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
      {/*
        A Modal is its own window and nothing insets it — the navigator's
        SafeAreaView is in a different tree entirely, so without this the
        welcome sits under the clock and the button under the gesture bar
        (CLAUDE.md, "A full-screen Modal is its own window").
      */}
      {/*
        The name field is a text input near the bottom of a full-screen page,
        which since Android 15 means it sits UNDER the keyboard: the window no
        longer shrinks for the IME when the app targets 35+, so `adjustResize`
        is inert. `check:keyboard` caught this one before a device did.
      */}
      <KeyboardSafe
        style={[
          styles.page,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 8,
          },
        ]}>
        <ScrollView
          key="first-run-setup"
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}>
          <Image source={APP_ICON} style={styles.iconSmall} accessibilityLabel="Orbit" />
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            Welcome to Orbit
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Enter your details or sign in with Google first. Either order works.
          </Text>

          {/* v27 parity: account picker and study setup belong to this same screen.
              The one-tap Google action is pinned in the thumb-friendly footer. */}
          {GOOGLE_SIGN_IN_ENABLED ? (
            <Text style={[styles.footnote, { color: colors.textMuted, marginBottom: 4 }]}>
              {googleAuthenticated
                ? 'Google account connected. Finish your study setup below.'
                : 'You can fill out your study details before connecting Google.'}
            </Text>
          ) : null}

            {/* Study choices are editable before Google sign-in, as in the original one-screen flow. */}
            <View>

              <Text style={[styles.label, { color: colors.textMuted }]}>UNIVERSITY — PICK ONE</Text>
              <UniversityChoice value={university} onChange={setUniversity} />
              <Text style={[styles.label, { color: colors.textMuted }]}>DISPLAY NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                editable={!saving}
                testID="first-run-display-name"
                placeholder="e.g. Phantom"
                placeholderTextColor={colors.textMuted}
                maxLength={40}
                autoCorrect={false}
                accessibilityLabel="Display name"
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
                      testID={`first-run-year-${option}`}
                      onPress={() => { setYear(option); setError(null); }}
                      role="radio"
                      label={optionLabel}
                      state={{ checked: active }}
                      scaleTo={0.97}
                      style={[
                        styles.yearCard,
                        {
                          backgroundColor: active
                            ? withAlpha(colors.accent, 0.14)
                            : colors.cardElevated,
                          borderColor: active ? colors.accent : colors.border,
                          borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.yearName,
                          { color: active ? colors.accent : colors.text },
                        ]}>
                        {optionLabel}
                      </Text>
                    </Touchable>
                  );
                })}
              </View>
              <Text style={[styles.label, { color: colors.textMuted }]}>WHAT ARE YOU PREPARING FOR?</Text>
              <View style={[styles.grid, { flexWrap: 'wrap' }]}>
                {([['university-pyqs', 'University PYQs'], ['neet-pg', 'NEET PG'], ['both', 'Both']] as const).map(([value, label]) => {
                  const selected = goal === value;
                  return <Touchable
                    key={value}
                    testID={`first-run-goal-${value}`}
                    label={label}
                    role="radio"
                    state={{ checked: selected }}
                    onPress={() => { setGoal(value); setError(null); }}
                    style={[styles.yearCard, {
                      borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected ? withAlpha(colors.accent, 0.14) : colors.cardElevated,
                    }]}>
                    <Text style={[styles.yearName, { color: selected ? colors.accent : colors.text }]}>{label}</Text>
                  </Touchable>;
                })}
              </View>
              <Text style={[styles.footnote, { color: colors.textMuted }]}>Your choices will be saved when you continue to Orbit. You can change them later.</Text>
            </View>

          </ScrollView>

          {/* Thumb-friendly footer: visible on every screen size and on both sides of Google sign-in. */}
          <View style={[styles.actionBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            {error ? (
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite"
                style={[styles.error, { color: colors.danger }]}>
                {error}
              </Text>
            ) : null}
            {GOOGLE_SIGN_IN_ENABLED && !googleAuthenticated ? (
              <Touchable
                testID="first-run-google-sign-in"
                label="Continue with Google"
                state={{ busy: googling }}
                disabled={googling}
                scaleTo={0.98}
                onPress={() => { void withGoogle(); }}
                style={[styles.google, { borderColor: colors.accent, backgroundColor: colors.accent }]}>
                {googling ? <ActivityIndicator color={colors.onAccent} /> : (
                  <Text style={[styles.googleText, { color: colors.onAccent }]}>Continue with Google</Text>
                )}
              </Touchable>
            ) : (
              <Touchable
                onPress={start}
                testID="first-run-start-studying"
                disabled={saving}
                state={{ busy: saving }}
                label="Continue to Orbit"
                style={[styles.startButton, { backgroundColor: colors.accent }]}>
                {saving ? <ActivityIndicator color={colors.onAccent} /> : (
                  <Text style={[styles.startText, { color: colors.onAccent }]}>Continue to Orbit</Text>
                )}
              </Touchable>
            )}
            <Text accessibilityLiveRegion="polite" style={[styles.footnote, { color: colors.textMuted, marginTop: 6 }]}>
              {googling
                ? 'Opening Google account chooser…'
                : checkingAccount && !googleAuthenticated
                  ? 'Checking saved account. One tap will open Google.'
                  : googleAuthenticated
                    ? 'You can change your year and university later in Settings.'
                    : 'One-time Google sign-in secures your study progress.'}
            </Text>
          </View>
      </KeyboardSafe>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 20,
  },
  actionBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 12,
    flexShrink: 0,
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  icon: {
    width: 108,
    height: 108,
    borderRadius: 26,
  },
  iconSmall: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: 14,
  },
  welcome: {
    ...typeScale.title1,
    textAlign: 'center',
  },
  made: {
    ...typeScale.bodyStrong,
    textAlign: 'center',
    marginTop: 8,
  },
  madeSub: {
    ...typeScale.caption,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  form: {
    paddingBottom: 16,
    justifyContent: 'center',
    flexGrow: 1,
  },
  title: {
    ...typeScale.title1,
    textAlign: 'center',
  },
  subtitle: {
    ...typeScale.caption,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    marginBottom: 20,
  },
  google: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  googleText: {
    ...typeScale.bodyStrong,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  signedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optional: {
    ...typeScale.caption,
    marginTop: 8,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '600',
    marginTop: 22,
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
  startButton: {
    borderRadius: 14,
    paddingVertical: 17,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  startText: {
    fontSize: 16,
    fontWeight: '800',
  },
  footnote: {
    ...typeScale.caption,
    textAlign: 'center',
    marginTop: 12,
  },
});
