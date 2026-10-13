import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import { simulatorNavigation } from '@/lib/simulatorNavigation';

/** Dedicated simulator only; the rest of ORBIT remains native. Requires internet. */
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
  return <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <Touchable label="Back to Vault" onPress={onExit} style={styles.back}><ArrowLeft size={20} color={colors.text} /></Touchable>
      <View style={styles.title}><Text style={{ color: colors.text, fontWeight: '700' }}>Simulator & Anatomy</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>Online clinical studio</Text></View>
    </View>
    {focused && active && !failed ? <View style={styles.screen}>
      <WebView<unknown> key={attempt} ref={web} source={{ uri: 'https://orbitmbbs.vercel.app/simulator' }}
        style={[styles.screen, { backgroundColor: colors.background }]}
        javaScriptEnabled domStorageEnabled originWhitelist={['https://*', 'about:blank']}
        mixedContentMode="never" allowFileAccess={false} setSupportMultipleWindows={false}
        mediaPlaybackRequiresUserAction allowsInlineMediaPlayback
        onLoadStart={() => { setLoading(true); setCanGoBack(false); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setFailed(true); setLoading(false); }}
        onHttpError={({ nativeEvent }) => { if (nativeEvent.url.startsWith('https://orbitmbbs.vercel.app/simulator') && nativeEvent.statusCode >= 400) setFailed(true); }}
        onRenderProcessGone={() => { setFailed(true); setLoading(false); }}
        onNavigationStateChange={state => setCanGoBack(state.canGoBack)}
        onShouldStartLoadWithRequest={request => {
          const action = simulatorNavigation(request.url);
          if (action === 'vault') onExit();
          if (action === 'external') void Linking.openURL(request.url).catch(() => undefined);
          return action === 'allow';
        }} />
      {loading && <View pointerEvents="none" style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.accent} /><Text style={{ color: colors.textMuted }}>Loading clinical studio…</Text></View>}
    </View> : <View style={styles.message}>
      <Text style={{ color: colors.text }}>{failed ? 'The simulator could not load. Check your internet connection and try again.' : 'The simulator pauses when ORBIT is in the background. Reopening starts a fresh session.'}</Text>
      {failed && <Touchable label="Retry simulator" onPress={() => { setFailed(false); setLoading(true); setAttempt(n => n + 1); }} style={[styles.retry, { backgroundColor: colors.accent }]}><Text style={{ color: colors.onAccent }}>Try again</Text></Touchable>}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, gap: 2 },
  loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  message: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  retry: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 12 },
});
