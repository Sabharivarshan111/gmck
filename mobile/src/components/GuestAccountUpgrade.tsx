import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ShieldCheck } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { GOOGLE_SIGN_IN_ENABLED } from '@/lib/authMode';
import {
  GoogleSignInCancelled,
  isCurrentUserAnonymous,
  signInWithGoogle,
} from '@/lib/googleAuth';

/**
 * Legacy Orbit installs can still have an anonymous Supabase session.
 *
 * This card is intentionally non-blocking: existing readers can keep studying
 * offline, while one Google tap protects their cloud progress. The auth helper
 * first tries an in-place identity link and falls back to the verified
 * guest-account merge when that Google identity already belongs to another
 * Orbit account.
 */
export function GuestAccountUpgrade({ forceVisible = false }: { forceVisible?: boolean } = {}) {
  const { colors } = useTheme();
  const [anonymous, setAnonymous] = useState(false);
  const [checking, setChecking] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (forceVisible) {
        setChecking(false);
        setAnonymous(true);
        return () => {
          active = false;
        };
      }
      if (Platform.OS !== 'android' || !GOOGLE_SIGN_IN_ENABLED) {
        setChecking(false);
        setAnonymous(false);
        return () => {
          active = false;
        };
      }

      setChecking(true);
      isCurrentUserAnonymous()
        .then(value => {
          if (active) setAnonymous(value);
        })
        .catch(() => {
          if (active) setAnonymous(false);
        })
        .finally(() => {
          if (active) setChecking(false);
        });

      return () => {
        active = false;
      };
    }, [forceVisible]),
  );

  const protect = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      await signInWithGoogle();
      const stillAnonymous = await isCurrentUserAnonymous();
      setAnonymous(stillAnonymous);
      if (stillAnonymous) {
        setError('Google sign-in completed, but the account could not be upgraded. Please try again.');
      }
    } catch (err) {
      if (!(err instanceof GoogleSignInCancelled)) {
        setError(err instanceof Error ? err.message : 'Could not protect your account.');
      }
    } finally {
      setWorking(false);
    }
  }, []);

  if (checking || !anonymous) return null;

  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.card,
        {
          borderColor: withAlpha(colors.accent, 0.35),
          backgroundColor: withAlpha(colors.accent, 0.09),
        },
      ]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: withAlpha(colors.accent, 0.14) }]}>
          <ShieldCheck size={20} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.text }]}>Protect your progress</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Link Google so your questions, streak and study progress survive a reinstall or phone change.
          </Text>
        </View>
      </View>

      <Touchable
        label="Protect progress with Google"
        hint="Upgrades this guest account without discarding study progress"
        onPress={protect}
        disabled={working}
        state={{ busy: working }}
        scaleTo={0.98}
        style={[styles.button, { backgroundColor: colors.text }]}>
        {working ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.background }]}>
            Protect progress with Google
          </Text>
        )}
      </Touchable>

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    minHeight: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  error: {
    fontSize: 12,
    lineHeight: 17,
  },
});
