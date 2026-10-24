import React, { createContext, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Dialog } from '@/components/Dialog';
import { useTheme } from '@/theme';
import { typeScale } from '@/theme/typography';
import { usePremiumStatus } from '@/lib/premium';
import { LINK_OUT, openUnlock } from '@/lib/unlock';

const Context = createContext({ active: false, requestPurchase: (_feature: string) => {} });
export const useVaultPremium = () => useContext(Context);
export function VaultPremiumProvider({ children }: { children: React.ReactNode }) {
  const until = usePremiumStatus();
  const [feature, setFeature] = useState<string | null>(null);
  useEffect(() => { if (until) setFeature(null); }, [until]);
  return <Context.Provider value={{ active: !!until, requestPurchase: setFeature }}>
    {children}
    <Dialog visible={!!feature && !until} onDismiss={() => setFeature(null)} title={'Unlock ' + (feature ?? 'Premium')}
      message="Keep exploring the free preview, or get Premium for all organs, sounds, cases and practice questions. Premium also removes ads. General Notes stay free."
      actions={LINK_OUT ? [{ label: 'Explore Premium', tone: 'primary', onPress: () => { setFeature(null); openUnlock(); } }, { label: 'Continue free preview', tone: 'secondary', onPress: () => setFeature(null) }] : [{ label: 'Continue free preview', tone: 'secondary', onPress: () => setFeature(null) }]} />
  </Context.Provider>;
}
export function VaultTrialBanner({ kind }: { kind: 'practice' | 'proforma' | 'simulator' }) {
  const access = useVaultPremium();
  const { colors } = useTheme();
  if (access.active) return null;
  const text = kind === 'practice' ? '10 questions per exam' : kind === 'proforma' ? 'CVS master proforma' : 'Heart, lungs & brain · normal sounds';
  return <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, backgroundColor: colors.card }}>
    <Text style={[typeScale.caption, { color: colors.textMuted, flex: 1 }]}>Free preview · {text}</Text>
    <Touchable label="Unlock all Premium features" onPress={() => access.requestPurchase('all Premium features')} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={[typeScale.caption, { color: colors.accent }]}>Unlock all →</Text></Touchable>
  </View>;
}
