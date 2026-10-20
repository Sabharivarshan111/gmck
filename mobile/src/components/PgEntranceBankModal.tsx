import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import { installedNeetBank } from '@/lib/neetPgInstalledBank';
import { loadBundledNeetBank } from '@/lib/neetPgBundledBank';
import { NeetPgOfflineModal } from '@/components/NeetPgOfflineModal';
import type { InstalledReader } from '@shared/neetPgInstall';

export function PgEntranceBankModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [installed, setInstalled] = useState<InstalledReader | null>(null);
  const [checked, setChecked] = useState(false);
  const [installing, setInstalling] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setChecked(false);
    void installedNeetBank.load().catch(() => null).then(async value => value ?? await loadBundledNeetBank()).then(value => { if (!cancelled) setInstalled(value); })
      .catch(error => { if (!cancelled) Alert.alert('Offline bank unavailable', error instanceof Error ? error.message : 'The installed bank could not be opened.'); })
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [visible]);
  const install = async () => {
    if (installing) return;
    setInstalling(true);
    try {
      const value = await installedNeetBank.install();
      if (value) setInstalled(value);
    } catch (error) {
      Alert.alert('Bank was not replaced', error instanceof Error ? error.message : 'The complete bank could not be installed.');
    } finally { setInstalling(false); }
  };
  if (!visible) return null;
  if (!checked) return <Modal visible onRequestClose={onClose}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} accessibilityLabel="Opening offline bank" /><Touchable label="Close opening offline bank" onPress={onClose} style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}><Text style={{ color: colors.primary }}>Back</Text></Touchable></View></Modal>;
  if (!installed) return <Modal visible onRequestClose={onClose}><View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: colors.background }}><Text style={{ color: colors.text }}>The offline bank could not be opened.</Text><Touchable label="Import complete offline bank" onPress={() => { void install(); }} disabled={installing} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.primary }}>Import bank</Text></Touchable><Touchable label="Close offline bank" onPress={onClose} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.primary }}>Back</Text></Touchable></View></Modal>;
  return <NeetPgOfflineModal key={installed.file.fileId} visible={visible} onClose={onClose} installed={installed} onReplace={() => { void install(); }} installing={installing} />;
}
