import { useVaultPremium, VaultTrialBanner } from '@/components/VaultPremium';
import { samplePracticeBank } from '@shared/vault-samples';
import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Modal, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from '@/components/Text';
import {Touchable} from '@/components/Touchable';
import {useTheme, withAlpha} from '@/theme';
import {space, radius} from '@/theme/tokens';
import {typeScale} from '@/theme/typography';
import {installedNeetBank} from '@/lib/neetPgInstalledBank';
import {loadBundledNeetBank} from '@/lib/neetPgBundledBank';
import {loadBundledRecallBank, type RecallExam} from '@/lib/pgRecallBundledBank';
import {NeetPgOfflineModal} from '@/components/NeetPgOfflineModal';
import type {InstalledReader} from '@shared/neetPgInstall';

type Exam = 'neet-pg' | RecallExam;
const EXAMS = [
  {id: 'neet-pg', label: 'NEET-PG'},
  {id: 'aiims-pg', label: 'AIIMS PG'},
  {id: 'ini-cet', label: 'INI-CET'},
] as const;

export function PgEntranceBankModal({visible, onClose, initialQuestionId}: {visible: boolean; onClose: () => void; initialQuestionId?: string}) {
  const {colors} = useTheme();
  const premium = useVaultPremium();
  const insets = useSafeAreaInsets();
  const [exam, setExam] = useState<Exam>('neet-pg');
  const [installed, setInstalled] = useState<InstalledReader | null>(null);
  const [checked, setChecked] = useState(false);
  const [loadedExam, setLoadedExam] = useState<Exam | null>(null);
  const [installing, setInstalling] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {mounted.current = true; return () => {mounted.current = false;};}, []);
  // A question-of-the-day deep link always belongs to the existing NEET bank.
  useEffect(() => {if (visible && initialQuestionId) setExam('neet-pg');}, [visible, initialQuestionId]);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setChecked(false);
    setInstalled(null);
    const loading = exam === 'neet-pg'
      ? installedNeetBank.load().catch(() => null).then(async value => value ?? await loadBundledNeetBank())
      : loadBundledRecallBank(exam);
    void loading.then(value => {if (!cancelled) {setInstalled(value); setLoadedExam(exam);}})
      .catch(error => {if (!cancelled) Alert.alert('Offline bank unavailable', error instanceof Error ? error.message : 'The bank could not be opened.');})
      .finally(() => {if (!cancelled) {setChecked(true); setLoadedExam(exam);}});
    return () => {cancelled = true;};
  }, [visible, exam]);
  const install = async () => {
    if (!premium.active) { premium.requestPurchase('full question bank'); return; }
    if (installing || exam !== 'neet-pg') return;
    setInstalling(true);
    try {
      const value = await installedNeetBank.install();
      if (value && mounted.current) setInstalled(value);
    } catch (error) {
      if (mounted.current) Alert.alert('Bank was not replaced', error instanceof Error ? error.message : 'The complete bank could not be installed.');
    } finally {if (mounted.current) setInstalling(false);}
  };
  const availableBank = React.useMemo(() => installed && !premium.active ? samplePracticeBank(installed) : installed, [installed, premium.active]);
  if (!visible) return null;
  const choices = <View><VaultTrialBanner kind="practice" /><View style={styles.choices}>{EXAMS.map(item => <Touchable
    key={item.id}
    label={'Open ' + item.label + ' practice'}
    role="button"
    state={{selected: exam === item.id}}
    disabled={installing || !checked || loadedExam !== exam}
    onPress={() => setExam(item.id)}
    style={[styles.choice, {borderColor: exam === item.id ? colors.primary : colors.border, backgroundColor: exam === item.id ? withAlpha(colors.primary, 0.1) : colors.card}]}
  ><Text style={[typeScale.footnote, {color: colors.text}]}>{item.label}</Text></Touchable>)}</View></View>;
  const loadingCurrent = !checked || loadedExam !== exam;
  if (loadingCurrent || !installed) return <Modal visible onRequestClose={onClose}><View style={[styles.loading, {paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg, backgroundColor: colors.background}]}>
    {loadingCurrent ? <ActivityIndicator color={colors.primary} accessibilityLabel="Opening offline bank" /> : <Text style={{color: colors.text}}>The offline bank could not be opened.</Text>}
    {choices}
    {checked && exam === 'neet-pg' ? <Touchable label="Import complete offline bank" onPress={() => {void install();}} disabled={installing} style={styles.back}><Text style={{color: colors.primary}}>Import bank</Text></Touchable> : null}
    <Touchable label="Close opening offline bank" onPress={onClose} style={styles.back}><Text style={{color: colors.primary}}>Back</Text></Touchable>
  </View></Modal>;
  return <NeetPgOfflineModal
    key={installed.file.fileId}
    visible={visible}
    initialQuestionId={premium.active && exam === 'neet-pg' ? initialQuestionId : undefined}
    onClose={onClose}
    installed={availableBank!}
    bankLabel={EXAMS.find(item => item.id === exam)!.label}
    examChoices={choices}
    onReplace={exam === 'neet-pg' ? () => {void install();} : undefined}
    installing={installing}
  />;
}

const styles = StyleSheet.create({
  choices: {flexDirection: 'row', flexWrap: 'wrap', gap: space.sm},
  choice: {minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1, flexGrow: 1},
  loading: {flex: 1, paddingHorizontal: space.lg, justifyContent: 'center', gap: space.lg},
  back: {minHeight: 44, minWidth: 44, justifyContent: 'center'},
});
