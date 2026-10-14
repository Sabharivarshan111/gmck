import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import NativeClinicalStudio from '@/components/NativeClinicalStudio';
import { nativeClinicalRoute } from '@/lib/nativeSimulatorRouting';
import { simulatorNavigation } from '@/lib/simulatorNavigation';

/**
 * WIP Native Vercel parity migration.
 *
 * The discovery/skill/case selection screen is now actual React Native.
 * Detailed interactive modules are STILL WEB-RENDERED until each RN port
 * passes screenshots and functional checks. Do not ship as "fully native".
 */
export default function SimulatorScreen({ onExit }: { onExit: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const web = useRef<WebView<unknown>>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const returnToNativeStudio = () => {
    setUrl(null);
    setFailed(false);
    setCanGoBack(false);
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!focused) return false;
      if (url) {
        if (canGoBack && web.current) web.current.goBack();
        else returnToNativeStudio();
      } else {
        onExit();
      }
      return true;
    });
    return () => sub.remove();
  }, [canGoBack, focused, onExit, url]);

  if (!url) {
    return <NativeClinicalStudio onExit={onExit} onOpen={destination => {
      setFailed(false);
      setLoading(true);
      setCanGoBack(false);
      setUrl(nativeClinicalRoute(destination));
    }} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {focused && active && !failed ? (
        <View style={styles.screen}>
          <WebView<unknown>
            ref={web}
            testID="orbit-simulator-deep-module-temporary-web"
            source={{ uri: url }}
            style={[styles.screen, { backgroundColor: colors.background }]}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['https://*', 'about:blank']}
            mixedContentMode="never"
            allowFileAccess={false}
            setSupportMultipleWindows={false}
            mediaPlaybackRequiresUserAction
            allowsInlineMediaPlayback
            incognito
            cacheEnabled={false}
            cacheMode="LOAD_NO_CACHE"
            onLoadStart={() => { setLoading(true); }}
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
          {loading && <View pointerEvents="none" style={[styles.loading, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.accent} />
            <Text style={{ color: colors.textMuted }}>Opening the teaching module…</Text>
          </View>}
        </View>
      ) : (
        <View style={styles.message}>
          <Text style={{ color: colors.text }}>{failed ?
            'This advanced interactive tool still uses the online renderer during the native port. Reconnect and retry, or return to the native studio.' :
            'The teaching module pauses while ORBIT is in the background.'}</Text>
          {failed && <Touchable label="Retry simulator" onPress={() => { setFailed(false); setLoading(true); }} style={[styles.retry, { backgroundColor: colors.accent }]}>
            <Text style={{ color: colors.onAccent }}>Try again</Text>
          </Touchable>}
        </View>
      )}
      <Touchable label="Return to native clinical studio" onPress={returnToNativeStudio}
        style={[styles.back, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>← Clinical studio</Text>
      </Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  message: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  retry: { minHeight: 44, alignItems: 'center', borderRadius: 12, justifyContent: 'center', padding: 12 },
  back: { minHeight: 44, borderTopWidth: 1, padding: 12, alignItems: 'center', justifyContent: 'center' },
});
