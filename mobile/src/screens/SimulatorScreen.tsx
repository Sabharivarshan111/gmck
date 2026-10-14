import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import NativeClinicalStudio from '@/components/NativeClinicalStudio';
import NativeIcuMonitor from '@/components/NativeIcuMonitor';
import NativeEcgTwelveLead from '@/components/NativeEcgTwelveLead';
import NativeClinicalCase from '@/components/NativeClinicalCase';
import NativeRadiologyViewer from '@/components/NativeRadiologyViewer';
import NativeClubbingTrainer from '@/components/NativeClubbingTrainer';
import { nativeClinicalRoute } from '@/lib/nativeSimulatorRouting';
import { simulatorNavigation } from '@/lib/simulatorNavigation';

/**
 * WIP Native Vercel parity migration.
 *
 * The discovery/skill/case selection screen is now actual React Native.
 * ICU telemetry and clinical case interventions are now native and share the
 * site's real physiology engine. Radiology also renders offline with native Android bitmaps. Anatomy and the remaining diagnostic tools
 * still use a hosted renderer; do not ship as full native parity.
 */
export default function SimulatorScreen({ onExit }: { onExit: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const web = useRef<WebView<unknown>>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [studioScenarioId, setStudioScenarioId] = useState('normal');
  const [studioTheme, setStudioTheme] = useState<'dark' | 'light'>('dark');
  const [nativeMode, setNativeMode] = useState<{kind: 'monitor' | 'case' | 'ecg' | 'radiology' | 'clubbing'; scenarioId: string} | null>(null);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const returnToNativeStudio = () => {
    setUrl(null);
    setNativeMode(null);
    setFailed(false);
    setCanGoBack(false);
  };

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('orbit-simulator-theme').then(value => {
      if (mounted && (value === 'dark' || value === 'light')) setStudioTheme(value);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const onToggleStudioTheme = () => {
    const next = studioTheme === 'dark' ? 'light' : 'dark';
    setStudioTheme(next);
    AsyncStorage.setItem('orbit-simulator-theme', next).catch(() => undefined);
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!focused) return false;
      if (nativeMode) {
        setNativeMode(null);
      } else if (url) {
        if (canGoBack && web.current) web.current.goBack();
        else returnToNativeStudio();
      } else {
        onExit();
      }
      return true;
    });
    return () => sub.remove();
  }, [canGoBack, focused, onExit, url, nativeMode]);

  if (nativeMode?.kind === 'monitor') return <NativeIcuMonitor scenarioId={nativeMode.scenarioId} onBack={returnToNativeStudio} />;
  if (nativeMode?.kind === 'ecg') return <NativeEcgTwelveLead scenarioId={nativeMode.scenarioId} onBack={returnToNativeStudio} />;
  if (nativeMode?.kind === 'case') return <NativeClinicalCase scenarioId={nativeMode.scenarioId} onBack={returnToNativeStudio} />;

  if (nativeMode?.kind === 'radiology') return <NativeRadiologyViewer onBack={returnToNativeStudio} />;

  if (nativeMode?.kind === 'clubbing') return <NativeClubbingTrainer onBack={returnToNativeStudio} />;

  if (!url) {
    return <NativeClinicalStudio onExit={onExit} scenarioId={studioScenarioId} onScenarioChange={setStudioScenarioId} theme={studioTheme} onToggleTheme={onToggleStudioTheme} onOpen={destination => {
      if (destination.kind === 'monitor') {
        setNativeMode({ kind: 'monitor', scenarioId: studioScenarioId });
        return;
      }
      if (destination.kind === 'case') {
        setStudioScenarioId(destination.id);
        setNativeMode({ kind: 'case', scenarioId: destination.id });
        return;
      }
      if (destination.kind === 'tool' && destination.id === 'ecg12') {
        setNativeMode({ kind: 'ecg', scenarioId: destination.scenario });
        return;
      }
      if (destination.kind === 'tool' && destination.id === 'radiology') {
        setNativeMode({ kind: 'radiology', scenarioId: destination.scenario });
        return;
      }
      if (destination.kind === 'tool' && destination.id === 'clubbing') {
        setNativeMode({ kind: 'clubbing', scenarioId: destination.scenario });
        return;
      }
      if (destination.kind === 'anatomy') setStudioScenarioId('normal');
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  message: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  retry: { minHeight: 44, alignItems: 'center', borderRadius: 12, justifyContent: 'center', padding: 12 },
});
