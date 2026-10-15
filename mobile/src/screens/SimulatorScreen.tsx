import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, StatusBar, StyleSheet, View } from 'react-native';
import LocalSimulator from '@/native/LocalSimulator';
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
import { PhysiologyKernel } from '@simulator/engine/PhysiologyKernel';
import { restoreClinicalSnapshot } from '@/lib/clinicalSnapshot';
import { nativeClinicalRoute } from '@/lib/nativeSimulatorRouting';

/**
 * WIP Native Vercel parity migration.
 *
 * The discovery/skill/case selection screen is now actual React Native.
 * ICU telemetry and clinical case interventions are now native and share the
 * site's real physiology engine. Radiology renders offline with native Android bitmaps. Anatomy and the remaining
 * diagnostic tools use the locally bundled canonical WebGL renderer with
 * checksum-pinned model caching. Device visual parity still needs certification.
 */
export default function SimulatorScreen({ onExit }: { onExit: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const caseEngine = useRef<PhysiologyKernel | null>(null);
  const [initialPatient, setInitialPatient] = useState<string | undefined>();
  const [url, setUrl] = useState<string | null>(null);
  const [studioScenarioId, setStudioScenarioId] = useState('normal');
  const [studioTheme, setStudioTheme] = useState<'dark' | 'light'>('dark');
  const [rendererTheme, setRendererTheme] = useState<'dark' | 'light'>('dark');
  const [nativeMode, setNativeMode] = useState<{kind: 'monitor' | 'case' | 'ecg' | 'radiology' | 'clubbing'; scenarioId: string} | null>(null);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [backRequest, setBackRequest] = useState(0);
  const wrap = (child: React.ReactNode) => <>{focused && <StatusBar barStyle={nativeMode?.kind === 'monitor' || nativeMode?.kind === 'ecg' ? 'light-content' : studioTheme === 'light' ? 'dark-content' : 'light-content'} />}{child}</>;
  const returnToNativeStudio = () => {
    setUrl(null);
    setNativeMode(null);
    setFailed(false);
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
      if (url) {
        if (failed) {
          setUrl(null); setFailed(false);
          if (nativeMode?.kind !== 'case') setNativeMode(null);
        } else setBackRequest(value => value + 1);
      } else if (nativeMode) {
        setNativeMode(null);
      } else {
        onExit();
      }
      return true;
    });
    return () => sub.remove();
  }, [focused, onExit, url, nativeMode, failed]);

  if (nativeMode?.kind === 'monitor') return wrap(<NativeIcuMonitor scenarioId={nativeMode.scenarioId} onBack={returnToNativeStudio} />);
  if (nativeMode?.kind === 'ecg') return wrap(<NativeEcgTwelveLead scenarioId={nativeMode.scenarioId} onBack={returnToNativeStudio} />);
  if (nativeMode?.kind === 'case' && !url) return wrap(<NativeClinicalCase scenarioId={nativeMode.scenarioId}
    engine={caseEngine.current || undefined} theme={studioTheme} onToggleTheme={onToggleStudioTheme}
    onScenarioChange={id => { setStudioScenarioId(id); setNativeMode({ kind: 'case', scenarioId: id }); }}
    onOpen={query => {
      setRendererTheme(studioTheme);
      setInitialPatient(JSON.stringify(caseEngine.current));
      setBackRequest(0); setFailed(false); setLoading(true);
      setUrl('https://orbitmbbs.vercel.app/simulator?' + query);
    }} onBack={returnToNativeStudio} />);

  if (nativeMode?.kind === 'radiology') return wrap(<NativeRadiologyViewer theme={studioTheme} onBack={returnToNativeStudio} />);

  if (nativeMode?.kind === 'clubbing') return wrap(<NativeClubbingTrainer theme={studioTheme} onBack={returnToNativeStudio} />);

  if (!url) {
    return wrap(<NativeClinicalStudio onExit={onExit} scenarioId={studioScenarioId} onScenarioChange={setStudioScenarioId} theme={studioTheme} onToggleTheme={onToggleStudioTheme} onOpen={destination => {
      if (destination.kind === 'monitor') {
        setNativeMode({ kind: 'monitor', scenarioId: studioScenarioId });
        return;
      }
      if (destination.kind === 'case') {
        setStudioScenarioId(destination.id);
        caseEngine.current = new PhysiologyKernel(destination.id);
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
      setInitialPatient(undefined);
      setRendererTheme(studioTheme);
      setFailed(false);
      setLoading(true);
      setBackRequest(0);
      setUrl(nativeClinicalRoute(destination));
    }} />);
  }

  return wrap(
    <View style={[styles.screen, { backgroundColor: studioTheme==='light'?'#f7f7fa':'#000', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {!failed ? (
        <View style={styles.screen}>
          <LocalSimulator
            testID="orbit-local-anatomy-renderer"
            route={url.replace('https://orbitmbbs.vercel.app', '') + '&nativeTheme=' + rendererTheme}
            initialPatient={initialPatient}
            active={focused && active}
            backRequest={backRequest}
            style={[styles.screen, { backgroundColor: colors.background }]}
            onStatus={({ nativeEvent }) => {
              if (nativeEvent.status === 'vault') onExit();
              if (nativeEvent.status === 'patient' && nativeEvent.patient) {
                try {
                  const theme = JSON.parse(nativeEvent.patient).nativeTheme;
                  if ((theme === 'light' || theme === 'dark') && theme !== studioTheme) {
                    setStudioTheme(theme); AsyncStorage.setItem('orbit-simulator-theme', theme).catch(() => undefined);
                  }
                } catch { /* Incomplete bridge message. */ }
              }
              if (nativeEvent.status === 'exit') {
                setUrl(null); setFailed(false);
                if (nativeMode?.kind !== 'case') setNativeMode(null);
              }
              if (nativeEvent.status === 'patient' && nativeEvent.patient && nativeMode?.kind === 'case' && caseEngine.current) {
                if (restoreClinicalSnapshot(caseEngine.current, nativeEvent.patient)) {
                  const id = caseEngine.current.currentScenario.id;
                  if (nativeMode.scenarioId !== id) { setStudioScenarioId(id); setNativeMode({ kind: 'case', scenarioId: id }); }
                }
              }
              if (nativeEvent.status === 'loading') setLoading(true);
              if (nativeEvent.status === 'ready') setLoading(false);
              if (nativeEvent.status === 'error') { setFailed(true); setLoading(false); }
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
            'The interactive renderer could not open. Retry or return to the studio. Anatomy models need an initial connection, then remain cached on this device.' :
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
