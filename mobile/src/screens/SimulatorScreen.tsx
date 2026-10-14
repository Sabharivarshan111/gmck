import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import { simulatorNavigation } from '@/lib/simulatorNavigation';

/**
 * V27 simulator visual parity: the website is the only renderer for this
 * screen. A simplified anatomy substitute is NOT equivalent to the
 * Vercel renderer and must never be presented as feature parity.
 *
 * This provides live visual/feature parity while online. Do not advertise
 * offline 3D: those assets and their Three.js renderer are not bundled in
 * the native binary. Local notes, proformas and question data remain native.
 */
const SIMULATOR_URL = 'https://orbitmbbs.vercel.app/simulator?orbit_native_build=27';

export default function SimulatorScreen({ onExit }: { onExit: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const web = useRef<WebView<unknown>>(null);
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!focused) return false;
      if (canGoBack && web.current) web.current.goBack();
      else onExit();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack, focused, onExit]);

  return (
    <View testID="orbit-simulator-parity-screen" style={[styles.screen, {
      backgroundColor: colors.background,
      paddingTop: insets.top,
    }]}>
      {focused && active && !failed ? (
        <View style={styles.screen}>
          <WebView<unknown>
            key={attempt}
            ref={web}
            testID="orbit-simulator-vercel-webview"
            source={{ uri: SIMULATOR_URL }}
            style={[styles.screen, { backgroundColor: colors.background }]}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['https://*', 'about:blank']}
            mixedContentMode="never"
            allowFileAccess={false}
            setSupportMultipleWindows={false}
            mediaPlaybackRequiresUserAction
            allowsInlineMediaPlayback
            // A newly installed binary must not display last month's offline
            // SW shell or pre-upgrade WebView cache instead of the live studio.
            incognito
            cacheEnabled={false}
            cacheMode="LOAD_NO_CACHE"
            onLoadStart={() => { setLoading(true); setCanGoBack(false); }}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setFailed(true); setLoading(false); }}
            onHttpError={({ nativeEvent }) => {
              if (nativeEvent.url.startsWith('https://orbitmbbs.vercel.app/simulator') && nativeEvent.statusCode >= 400) {
                setFailed(true);
                setLoading(false);
              }
            }}
            onRenderProcessGone={() => { setFailed(true); setLoading(false); }}
            onNavigationStateChange={state => setCanGoBack(state.canGoBack)}
            onShouldStartLoadWithRequest={request => {
              const action = simulatorNavigation(request.url);
              if (action === 'vault') onExit();
              if (action === 'external') void Linking.openURL(request.url).catch(() => undefined);
              return action === 'allow';
            }}
          />
          {loading && (
            <View pointerEvents="none" style={[styles.loading, { backgroundColor: colors.background }]}>
              <ActivityIndicator color={colors.accent} />
              <Text style={{ color: colors.textMuted }}>Opening the clinical simulator…</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.message}>
          <Text style={{ color: colors.text }}>
            {failed
              ? 'The full website simulator needs an internet connection. Its 3D anatomy and clinical tools are not yet available offline in this native app.'
              : 'The simulator is paused while ORBIT is in the background.'}
          </Text>
          {failed && (
            <Touchable label="Retry simulator" onPress={() => {
              setFailed(false);
              setLoading(true);
              setAttempt(n => n + 1);
            }} style={[styles.retry, { backgroundColor: colors.accent }]}>
              <Text style={{ color: colors.onAccent }}>Try again</Text>
            </Touchable>
          )}
          <Touchable label="Back to Vault" onPress={onExit} style={[styles.back, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>Back to Vault</Text>
          </Touchable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  message: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  retry: { minHeight: 44, alignItems: 'center', borderRadius: 12, justifyContent: 'center', padding: 12 },
  back: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12, padding: 12 },
});
