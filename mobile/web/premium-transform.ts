/** Build-only website adapters; native Android behavior is not changed here. */
export function transformWebsitePremium(code: string, id: string, accessModule: string): string {
  const replace = (from: string, to: string) => {
    if (!code.includes(from)) throw new Error(`Website premium adapter no longer matches ${id}: ${from.slice(0, 70)}`);
    code = code.replace(from, to);
  };
  if (id.endsWith('/mobile/src/screens/NotesScreen.tsx')) {
    code = `import { useVaultAccess, VaultPaywall, FlashcardsPreview } from '${accessModule}';\n` + code;
    replace('export default function NotesScreen() {', 'export default function NotesScreen() {\n  const vaultAccess = useVaultAccess();');
    replace('  if (simulatorOpen) return', `  if (flashcards && !vaultAccess.active) return <FlashcardsPreview onBack={() => setFlashcards(false)} />;\n  if ((datasetCasesOpen || caseLibraryOpen) && !vaultAccess.active) return <VaultPaywall onBack={() => { setSimulatorOpen(false); setFlashcards(false); setProformasOpen(false); setPgEntranceOpen(false); setDatasetCasesOpen(false); setCaseLibraryOpen(false); }} />;\n  if (simulatorOpen) return`);
    replace('  const textScale = useTextScale();\n  const entries = [', '  const textScale = useTextScale();\n  const vaultAccess = useVaultAccess();\n  const entries = [');
    replace('onPress={open} scaleTo={0.97}', `disabled={title !== 'Notes' && vaultAccess.loading} onPress={open} scaleTo={0.97}`);
    replace('<ChevronRight size={18} color={colors.accent} />\n      </Touchable>)}', `{title !== 'Notes' && !vaultAccess.active ? <Text style={{ color: colors.accent, fontSize: 12 }}>{vaultAccess.loading ? 'Checking…' : 'Free preview'}</Text> : <ChevronRight size={18} color={colors.accent} />}\n      </Touchable>)}`);
  }
  if (id.endsWith('/mobile/src/components/PgEntranceBankModal.tsx')) {
    code = `import { useVaultAccess, VaultTrialBanner } from '${accessModule}';\nimport { samplePracticeBank } from '@shared/vault-samples';\n` + code;
    replace("  const {colors} = useTheme();", "  const {colors} = useTheme();\n  const vaultAccess = useVaultAccess();");
    replace('  if (!visible) return null;', '  const sampleBank = React.useMemo(() => !installed || vaultAccess.active ? installed : samplePracticeBank(installed), [installed, vaultAccess.active]);\n  if (!visible) return null;');
    replace('  const choices = <View style={styles.choices}>', '  const choices = <View><VaultTrialBanner kind="practice" /><View style={styles.choices}>');
    replace('</Touchable>)}</View>;', '</Touchable>)}</View></View>;');
    replace('    installed={installed}', '    installed={sampleBank!}');
    replace("    initialQuestionId={exam === 'neet-pg' ? initialQuestionId : undefined}", "    initialQuestionId={vaultAccess.active && exam === 'neet-pg' ? initialQuestionId : undefined}");
    replace("onReplace={exam === 'neet-pg' ? () => {void install();} : undefined}", "onReplace={exam === 'neet-pg' ? () => { if (!vaultAccess.active) vaultAccess.requestPurchase('full question bank import'); else void install(); } : undefined}");
    replace("    if (installing || exam !== 'neet-pg') return;", "    if (!vaultAccess.active) { vaultAccess.requestPurchase('full question bank import'); return; }\n    if (installing || exam !== 'neet-pg') return;");
  }
  if (id.endsWith('/mobile/src/components/ClinicalProformaModal.tsx')) {
    code = `import { useVaultAccess, VaultTrialBanner } from '${accessModule}';\n` + code;
    replace('  const { colors } = useTheme();', '  const { colors } = useTheme();\n  const vaultAccess = useVaultAccess();');
    replace('const [activeProforma, setActiveProforma]', 'const [storedProforma, setStoredProforma]');
    replace('  const [activeTab, setActiveTab]', `  const activeProforma = vaultAccess.active || storedProforma?.id === 'cvs_proforma' ? storedProforma : null;
  const setActiveProforma = (proforma: ClinicalProforma | null) => { if (proforma && proforma.id !== 'cvs_proforma' && !vaultAccess.active) { vaultAccess.requestPurchase('all case proformas'); return; } setStoredProforma(proforma); };
  const [activeTab, setActiveTab]`);
    replace('            {/* Proforma Cards, grouped by department */}', '            <VaultTrialBanner kind="proforma" />\n            {/* Proforma Cards, grouped by department */}');
    replace('{proforma.title}\n                    </Text>', "{proforma.title}{!vaultAccess.active ? proforma.id === 'cvs_proforma' ? ' · Free sample' : ' · Premium' : ''}\n                    </Text>");
  }
  if (id.endsWith('/mobile/src/components/HomeMenuSheet.tsx')) {
    code = `import { useVaultAccess } from '${accessModule}';\n` + code;
    replace('  const { colors } = useTheme();', '  const { colors } = useTheme();\n  const websiteAccess = useVaultAccess();\n  adFreeUntil = websiteAccess.expiresAt?.slice(0, 10) ?? null;');
    code = code.replaceAll("'Remove ads'", "'Unlock Premium'").replace("'No ads'", "'Premium active'").replace('Ad-free until', 'Premium until');
  }
  return code;
}
