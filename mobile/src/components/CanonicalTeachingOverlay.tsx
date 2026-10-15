import React, { useState } from 'react';
import { ActivityIndicator, Modal, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocalSimulator from '@/native/LocalSimulator';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';

/** Advanced teaching uses the same locally bundled renderer as anatomy.
 * The native monitor/paper remains mounted, retaining its controls and patient.
 */
export default function CanonicalTeachingOverlay({ route, patient, active, onPatient, onClose }: {
  route: string; patient: string; active: boolean;
  onPatient?: (snapshot: string) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [backRequest, setBackRequest] = useState(0);
  return <Modal visible animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={() => {
    if (failed) onClose(); else setBackRequest(value => value + 1);
  }}>
    <StatusBar barStyle="light-content" />
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {failed ? <View style={styles.message}>
        <Text style={styles.text}>The teaching module could not open. Retry or return to your current patient.</Text>
        <Touchable label="Retry teaching module" onPress={() => { setFailed(false); setLoading(true); setRetry(value => value + 1); }} style={styles.button}><Text style={styles.text}>Retry</Text></Touchable>
        <Touchable label="Return to patient" onPress={onClose} style={styles.button}><Text style={styles.text}>Return</Text></Touchable>
      </View> : <LocalSimulator key={retry} route={route} initialPatient={patient} active={active} backRequest={backRequest} style={styles.root} onStatus={({ nativeEvent }) => {
        if (nativeEvent.status === 'patient' && nativeEvent.patient) onPatient?.(nativeEvent.patient);
        if (nativeEvent.status === 'exit' || nativeEvent.status === 'vault') onClose();
        if (nativeEvent.status === 'loading') setLoading(true);
        if (nativeEvent.status === 'ready') setLoading(false);
        if (nativeEvent.status === 'error') { setFailed(true); setLoading(false); }
      }} />}
      {loading && !failed && <View pointerEvents="none" style={styles.loading}><ActivityIndicator color="#e879f9" /><Text style={styles.text}>Opening tutorial…</Text></View>}
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  message: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  text: { color: '#f5f5f7', fontSize: 14, lineHeight: 21 },
  button: { minHeight: 44, padding: 12, backgroundColor: '#30303a', borderRadius: 12, alignItems: 'center' },
  loading: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#000' },
});
