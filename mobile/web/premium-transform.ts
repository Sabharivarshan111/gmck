/** Build-only website adapters; native Android behavior is not changed here. */
export function transformWebsitePremium(code: string, id: string, accessModule: string): string {
  const replace = (from: string, to: string) => {
    if (!code.includes(from)) throw new Error(`Website premium adapter no longer matches ${id}: ${from.slice(0, 70)}`);
    code = code.replace(from, to);
  };
  if (id.endsWith('/mobile/src/screens/NotesScreen.tsx')) {
    code = `import { useVaultAccess, VaultPaywall } from '${accessModule}';\n` + code;
    replace('export default function NotesScreen() {', 'export default function NotesScreen() {\n  const vaultAccess = useVaultAccess();');
    replace('  if (simulatorOpen) return', `  if ((simulatorOpen || flashcards || proformasOpen || pgEntranceOpen || datasetCasesOpen || caseLibraryOpen) && !vaultAccess.active) return <VaultPaywall onBack={() => { setSimulatorOpen(false); setFlashcards(false); setProformasOpen(false); setPgEntranceOpen(false); setDatasetCasesOpen(false); setCaseLibraryOpen(false); }} />;\n  if (simulatorOpen) return`);
    replace('  const textScale = useTextScale();\n  const entries = [', '  const textScale = useTextScale();\n  const vaultAccess = useVaultAccess();\n  const entries = [');
    replace('onPress={open} scaleTo={0.97}', `disabled={title !== 'Notes' && vaultAccess.loading} onPress={() => { if (title !== 'Notes' && !vaultAccess.active) vaultAccess.requestPurchase(title); else open(); }} scaleTo={0.97}`);
    replace('<ChevronRight size={18} color={colors.accent} />\n      </Touchable>)}', `{title !== 'Notes' && !vaultAccess.active ? <Text style={{ color: colors.accent, fontSize: 12 }}>{vaultAccess.loading ? 'Checking…' : '🔒 Premium'}</Text> : <ChevronRight size={18} color={colors.accent} />}\n      </Touchable>)}`);
  }
  if (id.endsWith('/mobile/src/components/HomeMenuSheet.tsx')) {
    code = `import { useVaultAccess } from '${accessModule}';\n` + code;
    replace('  const { colors } = useTheme();', '  const { colors } = useTheme();\n  const websiteAccess = useVaultAccess();\n  adFreeUntil = websiteAccess.expiresAt?.slice(0, 10) ?? null;');
    code = code.replaceAll("'Remove ads'", "'Unlock Premium'").replace("'No ads'", "'Premium active'").replace('Ad-free until', 'Premium until');
  }
  return code;
}
