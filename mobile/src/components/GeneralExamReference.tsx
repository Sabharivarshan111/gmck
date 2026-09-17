import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  FlaskConical,
  Lightbulb,
  ListChecks,
  Search,
  Stethoscope,
  TriangleAlert,
  X,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { ClinicalSignFigure } from '@/components/ClinicalSignFigure';
import { useTheme, withAlpha } from '@/theme';
import {
  CLINICAL_SIGNS,
  PICCLE_ORDER,
  type ClinicalSign,
  type SignBlock,
} from '@/lib/clinical/generalExamination';
import { GENERAL_SURVEY } from '@/lib/clinical/generalExamSurvey';
import { LAB_PANELS, type LabPanel } from '@/lib/clinical/labValues';
import { SCORING_SYSTEMS, type ScoringSystem } from '@/lib/clinical/scoringSystems';

/**
 * The general examination reference, reached from above the proforma search.
 *
 * Three tabs, because there are three genuinely different questions a student
 * has open in front of a patient: *how do I look for this sign*, *is this
 * number normal*, and *what does this score come to*. Putting them on one
 * scrolling page would mean scrolling past the whole of PICCLE to reach a
 * potassium range.
 *
 * Search spans all three at once, since nobody knows in advance which tab
 * "Bishop" or "cyanosis" lives on.
 */

export interface GeneralExamReferenceProps {
  onClose: () => void;
}

type Tab = 'exam' | 'labs' | 'scores';

const TABS: { key: Tab; label: string; Icon: typeof Stethoscope }[] = [
  { key: 'exam', label: 'General Exam', Icon: Stethoscope },
  { key: 'labs', label: 'Lab Values', Icon: FlaskConical },
  { key: 'scores', label: 'Scoring', Icon: ListChecks },
];

const ALL_SIGNS: ClinicalSign[] = [...CLINICAL_SIGNS, ...GENERAL_SURVEY];

export function GeneralExamReference({ onClose }: GeneralExamReferenceProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('exam');
  const [query, setQuery] = useState('');
  const [openSign, setOpenSign] = useState<ClinicalSign | null>(null);
  const [openScore, setOpenScore] = useState<ScoringSystem | null>(null);
  const [openPanel, setOpenPanel] = useState<string | null>(LAB_PANELS[0]?.id ?? null);

  const q = query.trim().toLowerCase();

  const signs = useMemo(() => {
    if (!q) return ALL_SIGNS;
    return ALL_SIGNS.filter(s => signHaystack(s).includes(q));
  }, [q]);

  const panels = useMemo(() => {
    if (!q) return LAB_PANELS;
    return LAB_PANELS.filter(p => panelHaystack(p).includes(q));
  }, [q]);

  const scores = useMemo(() => {
    if (!q) return SCORING_SYSTEMS;
    return SCORING_SYSTEMS.filter(s => scoreHaystack(s).includes(q));
  }, [q]);

  /* ─────────────────────────────────────────── one sign, expanded ───── */
  if (openSign) {
    return (
      <SignDetail sign={openSign} onBack={() => setOpenSign(null)} onClose={onClose} />
    );
  }

  if (openScore) {
    return (
      <ScoreDetail score={openScore} onBack={() => setOpenScore(null)} onClose={onClose} />
    );
  }

  const counts: Record<Tab, number> = {
    exam: signs.length,
    labs: panels.length,
    scores: scores.length,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Clinical Reference"
        subtitle="General examination · Normal values · Scoring systems"
        onClose={onClose}
      />

      {/* Search across all three tabs at once */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={17} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cyanosis, potassium, Bishop, clubbing…"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query ? (
            <Touchable onPress={() => setQuery('')} label="Clear reference search" hitSlop={12}>
              <X size={17} color={colors.textMuted} />
            </Touchable>
          ) : null}
        </View>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <Touchable
              key={t.key}
              onPress={() => setTab(t.key)}
              label={`${t.label} tab`}
              state={{ selected: active }}
              scale={false}
              dim
              style={[styles.tab, active && { borderBottomColor: colors.primary }]}>
              <t.Icon size={15} color={active ? colors.primary : colors.textMuted} />
              <Text
                style={[styles.tabLabel, { color: active ? colors.primary : colors.textMuted }]}
                numberOfLines={1}>
                {t.label}
              </Text>
              {q ? (
                <Text style={[styles.tabCount, { color: colors.textMuted }]}>{counts[t.key]}</Text>
              ) : null}
            </Touchable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}
        keyboardShouldPersistTaps="handled">
        {tab === 'exam' ? (
          <>
            {!q ? <PiccleKey /> : null}
            {signs.map(sign => (
              <Touchable
                key={sign.id}
                onPress={() => setOpenSign(sign)}
                label={`Open ${sign.name}`}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View
                  style={[
                    styles.rowBadge,
                    {
                      backgroundColor: sign.letter
                        ? withAlpha(colors.accent, 0.16)
                        : withAlpha(colors.primary, 0.1),
                    },
                  ]}>
                  {sign.letter ? (
                    <Text style={[styles.rowBadgeText, { color: colors.accent }]}>{sign.letter}</Text>
                  ) : (
                    <Activity size={16} color={colors.primary} />
                  )}
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{sign.name}</Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>{sign.summary}</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Touchable>
            ))}
            {signs.length === 0 ? <Empty query={query} /> : null}
          </>
        ) : null}

        {tab === 'labs' ? (
          <>
            {panels.map(panel => {
              const open = openPanel === panel.id || Boolean(q);
              return (
                <View
                  key={panel.id}
                  style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Touchable
                    onPress={() => setOpenPanel(open && !q ? null : panel.id)}
                    label={`${open ? 'Collapse' : 'Expand'} ${panel.name}`}
                    state={{ expanded: open }}
                    scale={false}
                    dim
                    style={styles.panelHead}>
                    <View style={styles.panelHeadText}>
                      <Text style={[styles.panelTitle, { color: colors.text }]}>{panel.name}</Text>
                      <Text style={[styles.panelSpecimen, { color: colors.textMuted }]}>
                        {panel.specimen}
                      </Text>
                    </View>
                    <ChevronRight
                      size={18}
                      color={colors.textMuted}
                      style={open ? styles.rotated : undefined}
                    />
                  </Touchable>

                  {open ? (
                    <View style={styles.panelBody}>
                      {panel.caveat ? (
                        <Callout tone="warn" text={panel.caveat} />
                      ) : null}
                      {panel.rows.map(r => (
                        <View
                          key={r.analyte}
                          style={[styles.labRow, { borderTopColor: colors.border }]}>
                          <Text style={[styles.labName, { color: colors.text }]}>{r.analyte}</Text>
                          <Text style={[styles.labNormal, { color: colors.primary }]}>{r.normal}</Text>
                          {r.si ? (
                            <Text style={[styles.labSi, { color: colors.textMuted }]}>SI: {r.si}</Text>
                          ) : null}
                          {r.note ? (
                            <Text style={[styles.labNote, { color: colors.textMuted }]}>{r.note}</Text>
                          ) : null}
                          {r.critical ? (
                            <Text style={[styles.labCritical, { color: colors.danger }]}>
                              CRITICAL — {r.critical}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
            {panels.length === 0 ? <Empty query={query} /> : null}
          </>
        ) : null}

        {tab === 'scores' ? (
          <>
            {scores.map(score => (
              <Touchable
                key={score.id}
                onPress={() => setOpenScore(score)}
                label={`Open ${score.name}`}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.rowBadge, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                  <ListChecks size={16} color={colors.primary} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{score.name}</Text>
                  <Text style={[styles.rowTag, { color: colors.accent }]}>{score.system}</Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>{score.use}</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Touchable>
            ))}
            {scores.length === 0 ? <Empty query={query} /> : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────────────────────────────────── sub-views ───── */

function PiccleKey() {
  const { colors } = useTheme();
  return (
    <View style={[styles.piccle, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.piccleTitle, { color: colors.text }]}>PICCLE — and why in this order</Text>
      <Text style={[styles.piccleIntro, { color: colors.textMuted }]}>
        The order is not alphabetical and not arbitrary: it is the order that moves you down the
        patient once, without going back.
      </Text>
      {PICCLE_ORDER.map((p, i) => (
        <View key={`${p.letter}-${i}`} style={styles.piccleRow}>
          <View style={[styles.piccleLetter, { backgroundColor: withAlpha(colors.accent, 0.16) }]}>
            <Text style={[styles.piccleLetterText, { color: colors.accent }]}>{p.letter}</Text>
          </View>
          <View style={styles.piccleBody}>
            <Text style={[styles.piccleStands, { color: colors.text }]}>{p.stands}</Text>
            <Text style={[styles.piccleWhy, { color: colors.textMuted }]}>{p.why}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function SignDetail({
  sign,
  onBack,
  onClose,
}: {
  sign: ClinicalSign;
  onBack: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={sign.name} subtitle={sign.summary} onBack={onBack} onClose={onClose} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}>
        <Callout tone="warn" title="Examiner's trap" text={sign.examinerTrap} />

        <ClinicalSignFigure kind={sign.figure} />

        {sign.mnemonics?.map(m => (
          <View
            key={m.word}
            style={[styles.mnemonic, { backgroundColor: colors.card, borderColor: withAlpha(colors.accent, 0.35) }]}>
            <Text style={[styles.mnemonicWord, { color: colors.accent }]}>{m.word}</Text>
            <Text style={[styles.mnemonicAnswers, { color: colors.textMuted }]}>{m.answers}</Text>
            {m.letters.map((l, i) => (
              <View key={`${l.letter}-${i}`} style={styles.mnemonicRow}>
                <Text style={[styles.mnemonicLetter, { color: colors.accent }]}>{l.letter}</Text>
                <View style={styles.mnemonicText}>
                  <Text style={[styles.mnemonicStands, { color: colors.text }]}>{l.stands}</Text>
                  {l.detail ? (
                    <Text style={[styles.mnemonicDetail, { color: colors.textMuted }]}>{l.detail}</Text>
                  ) : null}
                </View>
              </View>
            ))}
            {m.caveat ? (
              <Text style={[styles.mnemonicCaveat, { color: colors.warning }]}>
                What it leaves out — {m.caveat}
              </Text>
            ) : null}
          </View>
        ))}

        {sign.blocks.map((b, i) => (
          <Block key={`${b.heading}-${i}`} block={b} />
        ))}
      </ScrollView>
    </View>
  );
}

function ScoreDetail({
  score,
  onBack,
  onClose,
}: {
  score: ScoringSystem;
  onBack: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={score.name} subtitle={score.use} onBack={onBack} onClose={onClose} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}>
        <View style={[styles.tagRow]}>
          <Text style={[styles.tag, { color: colors.accent, borderColor: withAlpha(colors.accent, 0.4) }]}>
            {score.system}
          </Text>
        </View>

        <Text style={[styles.blockHeading, { color: colors.text }]}>Parameters</Text>
        {score.parameters.map((p, i) => (
          <View
            key={`${p.name}-${i}`}
            style={[styles.paramCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.paramName, { color: colors.text }]}>{p.name}</Text>
            {p.options.map((o, j) => (
              <View key={`${o}-${j}`} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: colors.accent }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.textMuted }]}>{o}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={[styles.blockHeading, { color: colors.text }]}>Interpretation</Text>
        {score.bands.map((b, i) => (
          <View
            key={`${b.band}-${i}`}
            style={[styles.bandRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.bandLabel, { color: colors.primary }]}>{b.band}</Text>
            <Text style={[styles.bandMeaning, { color: colors.textMuted }]}>{b.meaning}</Text>
          </View>
        ))}

        <Callout tone="info" title="What it changes" text={score.whatItChanges} />
        {score.pitfall ? <Callout tone="warn" title="Pitfall" text={score.pitfall} /> : null}
      </ScrollView>
    </View>
  );
}

function Block({ block }: { block: SignBlock }) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <Text style={[styles.blockHeading, { color: colors.text }]}>{block.heading}</Text>
      {block.body ? (
        <Text style={[styles.blockBody, { color: colors.textMuted }]}>{block.body}</Text>
      ) : null}
      {block.bullets?.map((b, i) => (
        <View key={`${i}-${b.slice(0, 12)}`} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, { color: colors.accent }]}>•</Text>
          <Text style={[styles.bulletText, { color: colors.textMuted }]}>{b}</Text>
        </View>
      ))}
      {block.table ? <Table columns={block.table.columns} rows={block.table.rows} /> : null}
    </View>
  );
}

/**
 * A comparison table.
 *
 * Rendered as stacked label/value pairs rather than as real columns, because
 * a three-column table of prose does not fit a phone: at 360dp each column
 * gets 110dp, which is about nine characters, and every cell wraps to five
 * lines. Stacking keeps every cell readable and keeps the comparison adjacent,
 * which is the whole point of the table.
 */
function Table({ columns, rows }: { columns: string[]; rows: string[][] }) {
  const { colors } = useTheme();
  const [head, ...rest] = columns;
  return (
    <View style={[styles.table, { borderColor: colors.border, backgroundColor: colors.card }]}>
      {rows.map((row, i) => (
        <View
          key={`${i}-${row[0]}`}
          style={[styles.tableRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
          <Text style={[styles.tableRowLabel, { color: colors.text }]}>
            {row[0] || head}
          </Text>
          {rest.map((col, j) => {
            const cell = row[j + 1];
            if (!cell) return null;
            return (
              <View key={`${col}-${j}`} style={styles.tableCell}>
                <Text style={[styles.tableCellHead, { color: colors.accent }]}>{col}</Text>
                <Text style={[styles.tableCellText, { color: colors.textMuted }]}>{cell}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Callout({
  tone,
  title,
  text,
}: {
  tone: 'warn' | 'info';
  title?: string;
  text: string;
}) {
  const { colors } = useTheme();
  const hue = tone === 'warn' ? colors.warning : colors.primary;
  const Icon = tone === 'warn' ? TriangleAlert : Lightbulb;
  return (
    <View
      style={[
        styles.callout,
        { backgroundColor: withAlpha(hue, 0.1), borderColor: withAlpha(hue, 0.4) },
      ]}>
      <View style={styles.calloutHead}>
        <Icon size={15} color={hue} />
        <Text style={[styles.calloutTitle, { color: hue }]}>{title ?? 'Note'}</Text>
      </View>
      <Text style={[styles.calloutText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function Header({
  title,
  subtitle,
  onBack,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      {onBack ? (
        <Touchable
          onPress={onBack}
          label="Back to the reference list"
          style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ArrowLeft size={19} color={colors.text} />
        </Touchable>
      ) : (
        <View style={[styles.headerBtn, { backgroundColor: withAlpha(colors.primary, 0.12), borderColor: 'transparent' }]}>
          <Stethoscope size={19} color={colors.primary} />
        </View>
      )}
      <View style={styles.headerText}>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Touchable
        onPress={onClose}
        label="Close clinical reference"
        style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <X size={19} color={colors.text} />
      </Touchable>
    </View>
  );
}

function Empty({ query }: { query: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        Nothing here matches “{query}”. Try a sign (cyanosis, clubbing), an analyte (potassium,
        bilirubin) or a score (Bishop, Alvarado).
      </Text>
    </View>
  );
}

/* ───────────────────────────────────────────────────────── search ───── */

function signHaystack(s: ClinicalSign) {
  return [
    s.name,
    s.summary,
    s.examinerTrap,
    ...(s.mnemonics ?? []).flatMap(m => [m.word, m.answers, ...m.letters.map(l => `${l.stands} ${l.detail ?? ''}`)]),
    ...s.blocks.flatMap(b => [
      b.heading,
      b.body ?? '',
      ...(b.bullets ?? []),
      ...(b.table?.rows.flat() ?? []),
    ]),
  ]
    .join(' ')
    .toLowerCase();
}

function panelHaystack(p: LabPanel) {
  return [p.name, p.specimen, p.caveat ?? '', ...p.rows.flatMap(r => [r.analyte, r.normal, r.note ?? ''])]
    .join(' ')
    .toLowerCase();
}

function scoreHaystack(s: ScoringSystem) {
  return [
    s.name,
    s.system,
    s.use,
    s.whatItChanges,
    s.pitfall ?? '',
    ...s.parameters.flatMap(p => [p.name, ...p.options]),
    ...s.bands.flatMap(b => [b.band, b.meaning]),
  ]
    .join(' ')
    .toLowerCase();
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  tabBar: { flexDirection: 'row', marginTop: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 12.5, fontWeight: '700' },
  tabCount: { fontSize: 11 },

  scroll: { padding: 16, gap: 12 },

  piccle: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10 },
  piccleTitle: { fontSize: 14, fontWeight: '700' },
  piccleIntro: { fontSize: 12, lineHeight: 17 },
  piccleRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  piccleLetter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  piccleLetterText: { fontSize: 14, fontWeight: '800' },
  piccleBody: { flex: 1 },
  piccleStands: { fontSize: 13, fontWeight: '700' },
  piccleWhy: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowBadgeText: { fontSize: 16, fontWeight: '800' },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowTag: { fontSize: 10.5, fontWeight: '700' },
  rowSub: { fontSize: 11.5, lineHeight: 16 },

  panel: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  panelHeadText: { flex: 1, gap: 3 },
  panelTitle: { fontSize: 14, fontWeight: '700' },
  panelSpecimen: { fontSize: 11, lineHeight: 15 },
  panelBody: { paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  rotated: { transform: [{ rotate: '90deg' }] },

  labRow: { paddingTop: 10, gap: 3, borderTopWidth: StyleSheet.hairlineWidth },
  labName: { fontSize: 13, fontWeight: '600' },
  labNormal: { fontSize: 13, fontWeight: '700' },
  labSi: { fontSize: 11 },
  labNote: { fontSize: 11.5, lineHeight: 16 },
  labCritical: { fontSize: 11.5, lineHeight: 16, fontWeight: '700' },

  block: { gap: 6, marginTop: 4 },
  blockHeading: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  blockBody: { fontSize: 12.5, lineHeight: 19 },
  bulletRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  bulletDot: { fontSize: 13, lineHeight: 19 },
  bulletText: { flex: 1, fontSize: 12.5, lineHeight: 19 },

  table: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginTop: 6 },
  tableRow: { padding: 12, gap: 8 },
  tableRowLabel: { fontSize: 13, fontWeight: '700' },
  tableCell: { gap: 2 },
  tableCellHead: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.4 },
  tableCellText: { fontSize: 12, lineHeight: 17 },

  paramCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 6 },
  paramName: { fontSize: 13, fontWeight: '700' },

  bandRow: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 3 },
  bandLabel: { fontSize: 13, fontWeight: '800' },
  bandMeaning: { fontSize: 12, lineHeight: 17 },

  tagRow: { flexDirection: 'row' },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },

  mnemonic: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  mnemonicWord: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  mnemonicAnswers: { fontSize: 11.5, lineHeight: 16, marginTop: -4 },
  mnemonicRow: { flexDirection: 'row', gap: 10 },
  mnemonicLetter: { fontSize: 14, fontWeight: '800', width: 16 },
  mnemonicText: { flex: 1 },
  mnemonicStands: { fontSize: 12.5, fontWeight: '600' },
  mnemonicDetail: { fontSize: 11.5, lineHeight: 16, marginTop: 1 },
  mnemonicCaveat: { fontSize: 11.5, lineHeight: 16, fontStyle: 'italic', marginTop: 4 },

  callout: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  calloutHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calloutTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  calloutText: { fontSize: 12.5, lineHeight: 19 },

  empty: { padding: 24 },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
