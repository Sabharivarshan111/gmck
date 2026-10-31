import { GOOGLE_SIGN_IN_ENABLED } from '@/lib/authMode';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Lock } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Touchable } from '@/components/Touchable';
import { GradientFill } from '@/components/Gradient';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, SPRING, useReducedMotion } from '@/theme/motion';
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
import { openUnlock } from '@/lib/unlock';
import { usePremiumStatus } from '@/lib/premium';
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

/** First run: welcome/sign-in, study setup, then the annual Premium offer.
 * Existing profiles skip setup; profile persistence happens after step three.
 * Native authentication and the established reduced-motion primitives remain.
 */
export function FirstRun() {
  const { colors } = useTheme();
  const { local, hydrated, save } = useProfile();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const [stage, setStage] = useState<'splash' | 'you' | 'premium'>('splash');
  const premium = usePremiumStatus();
  const [goal, setGoal] = useState<LocalProfile['preparationGoal']>('university-pyqs');
  const [name, setName] = useState('');
  const [year, setYear] = useState<Year | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [googling, setGoogling] = useState(false);
  const isNative = Platform.OS === 'android';
  const [googleAuthenticated, setGoogleAuthenticated] = useState(!GOOGLE_SIGN_IN_ENABLED);
  const [checkingAccount, setCheckingAccount] = useState(GOOGLE_SIGN_IN_ENABLED);

  useEffect(() => {
    let active = true;
    if (GOOGLE_SIGN_IN_ENABLED) {
      hasAuthenticatedGoogleOnce()
        .then(ok => { if (active) setGoogleAuthenticated(ok); })
        .catch(() => { /* Keep the sign-in action available after a network failure. */ })
        .finally(() => { if (active) setCheckingAccount(false); });
    }
    return () => { active = false; };
  }, []);

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

  // ---- the welcome ---------------------------------------------------------
  const rise = useRef(new Animated.Value(0)).current;
  const icon = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!needed || stage !== 'splash') {
      return;
    }
    if (reduced) {
      rise.setValue(1);
      icon.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(rise, {
          toValue: 1,
          duration: DURATION.slow,
          easing: EASE.out,
          useNativeDriver: true,
        }),
        // From 0.9, never from 0: a mark that scales up out of nothing reads as
        // materialising rather than arriving (CLAUDE.md, "Nothing scales from
        // 0"). It is the app's own icon, and it should look like it was already
        // there.
        Animated.spring(icon, { toValue: 1, ...SPRING.default, useNativeDriver: true }),
      ]).start();
    }

  }, [needed, stage, reduced, rise, icon]);

  const start = useCallback(() => {
    if (isNative && !googleAuthenticated) {
      setError('Please sign in with Google above to safeguard your progress and unlock setup.');
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
    setError(null); setStage('premium');
  }, [isNative, googleAuthenticated, name, year, university]);

  /**
   * Google fills the name in and unlocks onboarding.
   */
  const withGoogle = useCallback(async () => {
    setGoogling(true);
    setError(null);
    try {
      const account = await signInWithGoogle();
      setGoogleAuthenticated(true);
      setStage('you');
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
      setGoogling(false);
    }
  }, [name]);

  if (!needed) {
    return null;
  }

  const splash = stage === 'splash';
  const finish = async (unlock: boolean) => {
    if (!year || !university || saving) return;
    setSaving(true); setError(null);
    try {
      await save({ display_name: name, year, university, preparationGoal: goal });
      if (unlock) openUnlock();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your setup.'); setSaving(false);
    }
  };

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
            paddingBottom: insets.bottom + 24,
          },
        ]}>
        {splash ? (
          <View style={styles.splash}>
            <Animated.View style={{ transform: [{ scale: icon }] }}>
              <Image
                source={APP_ICON}
                style={styles.icon}
                accessibilityLabel="Orbit"
              />
            </Animated.View>
            <Animated.View
              style={{
                opacity: rise,
                transform: reduced
                  ? []
                  : [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
              }}>
              <Text accessibilityRole="header" style={[styles.welcome, { color: colors.text }]}>
                Welcome to Orbit
              </Text>
              <Text style={[styles.label, { color: colors.accent, textAlign: 'center' }]}>STEP 1 OF 3</Text>
              <Text style={[styles.made, { color: colors.accent }]}>Made by the community</Text>
              <Text style={[styles.madeSub, { color: colors.textMuted }]}>
                Past papers, notes and clinical practice, together.
              </Text>
              <Touchable disabled={googling || checkingAccount} label={checkingAccount ? 'Checking your account' : GOOGLE_SIGN_IN_ENABLED && !googleAuthenticated ? 'Continue with Google' : 'Continue'}
                onPress={() => { if (GOOGLE_SIGN_IN_ENABLED && !googleAuthenticated) void withGoogle(); else setStage('you'); }}
                style={[styles.google, { borderColor: colors.accent, marginTop: 24 }]}>
                {googling || checkingAccount ? <ActivityIndicator color={colors.accent} /> : <Text style={[styles.googleText, { color: colors.accent }]}>{GOOGLE_SIGN_IN_ENABLED && !googleAuthenticated ? 'Continue with Google' : 'Continue'}</Text>}
              </Touchable>
              {!isNative && GOOGLE_SIGN_IN_ENABLED && !googleAuthenticated ? <Touchable label="Continue on this device" onPress={() => setStage('you')} style={styles.google}><Text style={[styles.googleText, { color: colors.textMuted }]}>Continue on this device</Text></Touchable> : null}
              {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
            </Animated.View>
          </View>
        ) : stage === 'premium' ? (
          <ScrollView key="premium" contentContainerStyle={[styles.form, { gap: 18 }]}>
            <Text style={[styles.label, { color: colors.accent }]}>STEP 3 OF 3</Text>
            <Image source={APP_ICON} style={styles.iconSmall} accessibilityLabel="Orbit" />
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{premium ? 'Your Premium is active' : 'Unlock Premium'}</Text>
            <View style={{ padding: 24, gap: 18, borderRadius: 22, borderWidth: 1, borderColor: colors.accent, backgroundColor: withAlpha(colors.accent, 0.08) }}>
              <Text style={[typeScale.title1, { color: colors.text }]}>₹300 / 1 year</Text>
              <Text style={[typeScale.bodyStrong, { color: colors.text }]}>One year of ORBIT Premium</Text>
              {['Every anatomy organ', 'Patient simulator and clinical cases', 'Auscultation, ECG, X-ray and POCUS', 'Full access to practice questions'].map(text => <View key={text} style={{ flexDirection: 'row', gap: 10 }}><CheckCircle2 size={18} color={colors.accent} /><Text style={[typeScale.body, { color: colors.text, flex: 1 }]}>{text}</Text></View>)}
            </View>
            <Touchable label={premium ? 'Start studying' : 'Unlock Premium — ₹300'} disabled={saving} state={{ busy: saving }} onPress={() => { void finish(!premium); }} style={[styles.google, { backgroundColor: colors.accent }]}>
              {saving ? <ActivityIndicator color={colors.onAccent} /> : <Text style={[styles.googleText, { color: colors.onAccent }]}>{premium ? 'Start studying' : 'Unlock Premium — ₹300'}</Text>}
            </Touchable>
            {!premium ? <Touchable label="Continue with free preview" disabled={saving} onPress={() => { void finish(false); }} style={[styles.google, { borderColor: colors.border }]}><Text style={[styles.googleText, { color: colors.text }]}>Continue with free preview</Text></Touchable> : null}
            <Touchable label="Back to your study setup" disabled={saving} onPress={() => setStage('you')} style={styles.google}><Text style={[styles.googleText, { color: colors.textMuted }]}>Back</Text></Touchable>
            <Text style={[styles.footnote, { color: colors.textMuted }]}>Use the same Google account to restore your Premium access.</Text>
            {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          </ScrollView>
        ) : (
          <ScrollView key="study-setup"
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: colors.accent }]}>STEP 2 OF 3</Text>
            <Image
              source={APP_ICON}
              style={styles.iconSmall}
              accessibilityLabel="Orbit"
            />
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              Make Orbit yours
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Choose your year and university to get the right past papers.
            </Text>

            {/* Profile Setup: Display Name & Year (Gated on Google Sign-In for native) */}
            <View style={!googleAuthenticated && isNative ? styles.lockedSection : undefined}>
              {!googleAuthenticated && isNative ? (
                <View style={styles.lockNoticeRow}>
                  <Lock size={14} color={colors.accent} />
                  <Text style={[styles.lockNoticeText, { color: colors.accent }]}>
                    Sign in with Google above to unlock profile setup
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.label, { color: colors.textMuted }]}>UNIVERSITY — PICK ONE</Text>
              <UniversityChoice value={university} onChange={setUniversity} />
              <Text style={[styles.label, { color: colors.textMuted }]}>DISPLAY NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                editable={googleAuthenticated || !isNative}
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
                    opacity: !googleAuthenticated && isNative ? 0.6 : 1,
                  },
                ]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>
                {year ? 'YEAR' : 'YEAR — PICK ONE'}
              </Text>
              <View style={[styles.grid, !googleAuthenticated && isNative && { opacity: 0.6 }]}>
                {YEARS.map(option => {
                  const active = option === year;
                  const optionLabel = YEAR_LABEL[YEAR_TO_KEY[option]];
                  return (
                    <Touchable
                      key={option}
                      onPress={() => {
                        if (!googleAuthenticated && isNative) {
                          setError('Please sign in with Google above first.');
                          return;
                        }
                        setYear(option);
                      }}
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
              <Text style={[styles.footnote, { color: colors.textMuted }]}>Every choice takes you to your home screen. You can change it later.</Text>
            </View>

            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.error, { color: colors.danger }]}>
                {error}
              </Text>
            ) : null}

            <Touchable
              onPress={start}
              testID="first-run-continue-to-premium"
              // Live with no year on purpose: a dead button explains nothing,
              // and the reader who has not noticed the year row is exactly the
              // one who would press this. It says what is missing instead.
              disabled={saving}
              state={{ busy: saving }}
              label={!year ? 'Choose your year first' : !university ? 'Choose your university first' : 'Continue to Premium'}
              style={[styles.startButton, (!year || !university) && styles.startPending]}>
              <GradientFill from="#FFFFFF" to={colors.fuchsia} borderRadius={14} />
              {saving ? (
                <ActivityIndicator color="#1A0A1F" />
              ) : (
                <Text style={styles.startText}>Continue to Premium</Text>
              )}
            </Touchable>
            <Text style={[styles.footnote, { color: colors.textMuted }]}>
              You can change your year and university later in Settings.
            </Text>
          </ScrollView>
        )}
      </KeyboardSafe>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
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
    paddingBottom: 32,
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
    minHeight: 48,
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
  lockedSection: {
    position: 'relative',
  },
  lockNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: -8,
  },
  lockNoticeText: {
    fontSize: 12,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    overflow: 'hidden',
  },
  startPending: {
    opacity: 0.55,
  },
  startText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A0A1F',
  },
  footnote: {
    ...typeScale.caption,
    textAlign: 'center',
    marginTop: 12,
  },
});
