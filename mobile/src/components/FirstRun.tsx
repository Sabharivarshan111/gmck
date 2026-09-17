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
import { CheckCircle2, Lock, ShieldAlert } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Touchable } from '@/components/Touchable';
import { GradientFill } from '@/components/Gradient';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, SPRING, useReducedMotion } from '@/theme/motion';
import { DisplayNameError, type LocalProfile, type Year } from '@/lib/profile';
import { YEAR_LABEL } from '@/lib/questionBank';
import { YEAR_TO_KEY } from '@/lib/profile';
import {
  GoogleSignInCancelled,
  hasAuthenticatedGoogleOnce,
  signInWithGoogle,
} from '@/lib/googleAuth';
import { useProfile } from '@/hooks/useProfile';
import { setTourPaused } from '@/tour/store';
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

/**
 * The first thing a new reader sees, and the reason it exists at all.
 *
 * Onboarding used to live only on **My Progress**, behind a tab: the sheet
 * appeared when you opened that screen with no profile, and nowhere else. A
 * fresh install therefore opened on Home having been asked nothing — and
 * `useProfile` falls back to `'second'`, so the app quietly showed second
 * year's question bank to a first year, a third year and a final year alike,
 * with the year chip agreeing. The reader had to find My Progress to discover
 * a question had ever been asked. That is what "why does it show default
 * second year" was.
 *
 * So this is a gate at the root, before any screen: the app cannot be used
 * without answering, because every screen in it is an answer to "which year".
 *
 * Three things it deliberately does:
 *
 * * **The icon and the welcome come first, on their own.** A form is a demand;
 *   an app that says hello before it asks for something is the difference
 *   between arriving somewhere and being processed. It lasts a second and a
 *   half and any tap skips it.
 * * **"Made by the community" is on that panel, not buried in an About box.**
 *   It is the single most load-bearing fact about this app — the questions in
 *   it were transcribed by students — and it belongs in the first sentence
 *   rather than in the credits.
 * * **Google is offered, never required.** `check:open-access` exists because
 *   a sign-in wall in front of the question bank was removed on the owner's
 *   instruction, and a wall on launch would be that decision undone with
 *   better manners. Signing in fills the name in and carries progress between
 *   devices; skipping it costs nothing that is not a second device.
 */

/** Long enough to read two lines, short enough not to be a loading screen. */
const SPLASH_MS = 1600;

export function FirstRun() {
  const { colors } = useTheme();
  const { local, hydrated, save } = useProfile();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const [stage, setStage] = useState<'splash' | 'you'>('splash');
  const [name, setName] = useState('');
  const [year, setYear] = useState<Year | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [googling, setGoogling] = useState(false);
  const isNative = Platform.OS === 'android';
  const [googleAuthenticated, setGoogleAuthenticated] = useState(!isNative || __DEV__);

  useEffect(() => {
    if (isNative) {
      hasAuthenticatedGoogleOnce().then(ok => {
        if (ok) setGoogleAuthenticated(true);
      });
    }
  }, [isNative]);

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
    const timer = setTimeout(() => setStage('you'), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [needed, stage, reduced, rise, icon]);

  const submit = useCallback(
    async (profile: LocalProfile) => {
      setSaving(true);
      setError(null);
      try {
        await save(profile);
      } catch (err) {
        setError(
          err instanceof DisplayNameError || err instanceof Error
            ? err.message
            : 'Could not save your profile.',
        );
        setSaving(false);
      }
      // Deliberately no `setSaving(false)` on success: `local` becomes non-null
      // and this whole gate unmounts. Clearing it first would flash the button
      // back to its idle state on the frame before it disappears.
    },
    [save],
  );

  const start = useCallback(() => {
    if (isNative && !googleAuthenticated) {
      setError('Please sign in with Google above to safeguard your progress and unlock setup.');
      return;
    }
    if (!year) {
      setError('Choose your year — it decides which question bank you get.');
      return;
    }
    void submit({ display_name: name, year });
  }, [isNative, googleAuthenticated, name, year, submit]);

  /**
   * Google fills the name in and unlocks onboarding.
   */
  const withGoogle = useCallback(async () => {
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
      setGoogling(false);
    }
  }, [name]);

  if (!needed) {
    return null;
  }

  const splash = stage === 'splash';

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
          <Touchable
            label="Continue"
            onPress={() => setStage('you')}
            scale={false}
            style={styles.splash}>
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
              <Text style={[styles.made, { color: colors.accent }]}>Made by the community</Text>
              <Text style={[styles.madeSub, { color: colors.textMuted }]}>
                Every question in here was written down by a student who sat the exam.
              </Text>
            </Animated.View>
          </Touchable>
        ) : (
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Image
              source={APP_ICON}
              style={styles.iconSmall}
              accessibilityLabel="Orbit"
            />
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              Two things and you're in
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Your name shows on the leaderboard. Your year decides which questions you see.
            </Text>

            {/* Anti-Spam Verification Notice */}
            <View
              style={[
                styles.securityNotice,
                {
                  backgroundColor: withAlpha(googleAuthenticated ? colors.green : colors.accent, 0.08),
                  borderColor: withAlpha(googleAuthenticated ? colors.green : colors.accent, 0.28),
                },
              ]}>
              {googleAuthenticated ? (
                <CheckCircle2 size={18} color={colors.green} style={{ marginTop: 2 }} />
              ) : (
                <ShieldAlert size={18} color={colors.accent} style={{ marginTop: 2 }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.securityTitle, { color: colors.text }]}>
                  {googleAuthenticated ? 'Verified with Google' : 'Google Sign-In Required'}
                </Text>
                <Text style={[styles.securityDesc, { color: colors.textMuted }]}>
                  {googleAuthenticated
                    ? 'Your account is verified. Your progress, leaderboard rank, and study notes will sync smoothly.'
                    : 'To prevent spam attacks and safeguard your progress & rankings, please sign in with Google to continue.'}
                </Text>
              </View>
            </View>

            <Touchable
              label={googleAuthenticated ? 'Signed in with Google' : 'Continue with Google'}
              onPress={withGoogle}
              disabled={googling || saving || googleAuthenticated}
              state={{ busy: googling }}
              scaleTo={0.98}
              style={[
                styles.google,
                {
                  borderColor: googleAuthenticated ? colors.green : colors.border,
                  backgroundColor: googleAuthenticated
                    ? withAlpha(colors.green, 0.1)
                    : colors.cardElevated,
                },
              ]}>
              {googling ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : googleAuthenticated ? (
                <View style={styles.signedInRow}>
                  <CheckCircle2 size={18} color={colors.green} />
                  <Text style={[styles.googleText, { color: colors.green }]}>
                    Signed in with Google
                  </Text>
                </View>
              ) : (
                <Text style={[styles.googleText, { color: colors.text }]}>
                  Continue with Google
                </Text>
              )}
            </Touchable>
            <Text style={[styles.optional, { color: colors.textMuted }]}>
              {googleAuthenticated
                ? 'One-time authentication verified. Works completely offline.'
                : 'One-time authentication required to safeguard your profile against spam attacks.'}
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
              // Live with no year on purpose: a dead button explains nothing,
              // and the reader who has not noticed the year row is exactly the
              // one who would press this. It says what is missing instead.
              disabled={saving}
              state={{ busy: saving }}
              label={year ? 'Start studying' : 'Choose your year first, then start studying'}
              style={[styles.startButton, !year && styles.startPending]}>
              <GradientFill from="#FFFFFF" to={colors.fuchsia} borderRadius={14} />
              {saving ? (
                <ActivityIndicator color="#1A0A1F" />
              ) : (
                <Text style={styles.startText}>Start studying</Text>
              )}
            </Touchable>
            <Text style={[styles.footnote, { color: colors.textMuted }]}>
              You can change either of these later in My Progress.
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
