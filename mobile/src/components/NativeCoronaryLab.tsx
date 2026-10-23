import React, { useMemo, useRef, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, RotateCcw, Sun, Moon } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Slider } from '@/components/Slider';
import CoronaryLabScene from '@/components/CoronaryLabScene';
import {
  angleLabel,
  boundedAngles,
  clamp,
  coronaryTree,
  CORONARY_REFERENCES,
  CORONARY_VIEWS,
  crossingCount,
  foreshortening,
  type Angles,
  type Dominance,
} from '@/lib/coronaryLab';
import { space, radius } from '@/theme/tokens';
import { typeScale } from '@/theme/typography';

type Panel = 'Views' | 'Vessels' | 'Learn' | 'Challenge';
type Mode = 'anatomy' | 'projection' | 'room';
const challenges = [
  {
    stem: 'In a left-dominant circulation, which artery gives rise to the PDA?',
    options: ['Circumflex artery', 'LAD', 'Acute marginal branch'],
    answer: 0,
    why: 'The posterior descending artery arises from the circumflex in left dominance. Switch dominance in Vessels and follow the PDA back to its parent.',
  },
  {
    stem: 'A vessel points towards the detector. What happens to its projected length?',
    options: [
      'It looks longer',
      'It looks shorter',
      'It always stays unchanged',
    ],
    answer: 1,
    why: 'The component parallel to the viewing direction disappears in a parallel projection. This is foreshortening.',
  },
  {
    stem: 'Why examine a coronary artery in complementary projections?',
    options: [
      'One view shows every branch',
      'To remove anatomical variation',
      'To uncover overlap and foreshortening',
    ],
    answer: 2,
    why: 'A single 2D image can conceal part of a 3D vessel. Another projection can separate structures, but no preset is optimal for every patient.',
  },
];

function LabFrame({ short, children }: { short: boolean; children: React.ReactNode }) {
  return short ? <ScrollView style={{flex:1}} contentContainerStyle={{flexGrow:1}}>{children}</ScrollView> : <View style={{flex:1}}>{children}</View>;
}

/** Offline native learning tool. Original design, authored schematic and projection engine. */
export default function NativeCoronaryLab({
  onBack,
  theme = 'dark',
  onToggleTheme,
}: {
  onBack: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}) {
  const insets = useSafeAreaInsets(),
    { width, height } = useWindowDimensions();
  const [localTheme, setLocalTheme] = useState(theme);
  const dark = (onToggleTheme ? theme : localTheme) === 'dark';
  const c = dark
    ? {
        bg: '#101018',
        card: '#1c1927',
        ink: '#f7f1ff',
        muted: '#b9b0c9',
        border: '#3d354c',
        accent: '#e8a1f8',
        on: '#28132e',
      }
    : {
        bg: '#f7f4fb',
        card: '#ffffff',
        ink: '#292036',
        muted: '#64576f',
        border: '#d7cbe0',
        accent: '#87299b',
        on: '#ffffff',
      };
  const [angles, setAngles] = useState<Angles>({ oblique: 45, tilt: -30 });
  const [orbit, setOrbit] = useState<Angles>({ oblique: -15, tilt: 12 });
  const [dominance, setDominance] = useState<Dominance>('right');
  const [system, setSystem] = useState<'both' | 'left' | 'right'>('both');
  const [selected, setSelected] = useState('LM');
  const [panel, setPanel] = useState<Panel>('Views');
  const [mode, setMode] = useState<Mode>('anatomy');
  const [shell, setShell] = useState(true),
    [labels, setLabels] = useState(true),
    [zoom, setZoom] = useState(1);
  const [question, setQuestion] = useState(0),
    [answer, setAnswer] = useState<number | null>(null);
  const [linkError, setLinkError] = useState(false);
  const drag = useRef<{ x: number; y: number; angles: Angles } | null>(null);
  const tree = useMemo(() => coronaryTree(dominance), [dominance]);
  const vessels = useMemo(
    () => tree.filter(v => system === 'both' || v.system === system),
    [tree, system],
  );
  const active = vessels.find(v => v.id === selected) ?? vessels[0];
  const shortening = useMemo(
    () => foreshortening(active.points, angles),
    [active, angles],
  );
  const crossings = useMemo(
    () => crossingCount(active, vessels, angles),
    [active, vessels, angles],
  );
  const preset = CORONARY_VIEWS.find(
    v => v.oblique === angles.oblique && v.tilt === angles.tilt,
  );
  const quiz = challenges[question];
  const compact = height < 740,
    wide = width >= 720;
  const reset = () => {
    setAngles({ oblique: 45, tilt: -30 });
    setOrbit({ oblique: -15, tilt: 12 });
    setZoom(1);
    setMode('anatomy');
    setDominance('right');
    setSystem('both');
    setSelected('LM');
    setShell(true);
    setLabels(true);
  };
  const chooseSystem = (s: typeof system) => {
    setSystem(s);
    if (s !== 'both' && tree.find(v => v.id === selected)?.system !== s)
      setSelected(s === 'left' ? 'LM' : 'pRCA');
  };
  const button = (
    label: string,
    onPress: () => void,
    chosen = false,
    testID?: string,
    spoken?: string,
  ) => (
    <Touchable
      key={label}
      label={spoken ?? label}
      testID={testID}
      state={{ selected: chosen }}
      onPress={onPress}
      style={[
        styles.button,
        {
          borderColor: chosen ? c.accent : c.border,
          backgroundColor: chosen ? c.accent : c.card,
        },
      ]}
    >
      <Text
        style={[
          typeScale.caption,
          { color: chosen ? c.on : c.ink, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </Touchable>
  );
  const stage = (sceneMode: Mode) => (
    <View
      style={{ flex: 1, minHeight: 0 }}
      testID={`coronary-${sceneMode}-scene`}
      onStartShouldSetResponder={() => false}
      onMoveShouldSetResponder={() => sceneMode === 'anatomy'}
      onResponderGrant={e => {
        drag.current = {
          x: e.nativeEvent.pageX,
          y: e.nativeEvent.pageY,
          angles: orbit,
        };
      }}
      onResponderMove={e => {
        const d = drag.current;
        if (d)
          setOrbit(
            boundedAngles({
              oblique: Math.round(
                d.angles.oblique + (e.nativeEvent.pageX - d.x) * 0.55,
              ),
              tilt: Math.round(
                d.angles.tilt - (e.nativeEvent.pageY - d.y) * 0.4,
              ),
            }),
          );
      }}
      onResponderRelease={() => {
        drag.current = null;
      }}
      onResponderTerminate={() => {
        drag.current = null;
      }}
    >
      <CoronaryLabScene
        vessels={vessels}
        selected={active.id}
        onSelect={setSelected}
        angles={angles}
        orbit={orbit}
        mode={sceneMode}
        shell={shell}
        labels={labels}
        zoom={zoom}
      />
    </View>
  );
  return (
    <LabFrame short={height < 650}>
      <View
        testID="native-coronary-lab"
        style={[
          styles.screen,
          {
            minHeight: height < 650 ? 760 : undefined,
            backgroundColor: c.bg,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <Touchable
            label="Back to clinical studio"
            onPress={onBack}
            style={styles.icon}
          >
            <ArrowLeft size={22} color={c.ink} />
          </Touchable>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typeScale.caption,
                { color: c.accent, letterSpacing: 1.5 },
              ]}
            >
              ORBIT · CARDIOVASCULAR
            </Text>
            <Text style={[typeScale.title3, { color: c.ink }]}>
              Coronary Lab
            </Text>
          </View>
          <Touchable
            label={
              dark ? 'Switch lab to light theme' : 'Switch lab to dark theme'
            }
            onPress={() =>
              onToggleTheme
                ? onToggleTheme()
                : setLocalTheme(dark ? 'light' : 'dark')
            }
            style={styles.icon}
          >
            {dark ? (
              <Sun size={21} color={c.ink} />
            ) : (
              <Moon size={21} color={c.ink} />
            )}
          </Touchable>
          <Touchable
            label="Reset coronary lab"
            onPress={reset}
            style={styles.icon}
          >
            <RotateCcw size={20} color={c.ink} />
          </Touchable>
        </View>
        <View
          style={[
            styles.workspace,
            { height: wide ? 340 : compact ? 218 : 280, borderColor: c.border },
          ]}
        >
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {stage(mode)}
            {wide && mode === 'anatomy' && stage('projection')}
          </View>
        </View>
        <View style={styles.modeRow}>
          {(['anatomy', 'projection', 'room'] as const).map(m =>
            button(
              m === 'anatomy'
                ? '3D anatomy'
                : m === 'projection'
                ? 'Projection'
                : 'C-arm',
              () => setMode(m),
              mode === m,
            ),
          )}
        </View>
        <View style={[styles.selection, { borderColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typeScale.bodyStrong, { color: c.ink }]}>
              {active.id} · {active.name}
            </Text>
            <Text
              style={[typeScale.caption, { color: c.muted }]}
              testID="coronary-angle-readout"
            >
              {angleLabel(angles)}
            </Text>
          </View>
          {button(
            '−',
            () => setZoom(z => clamp(z - 0.1, 0.7, 1.25)),
            false,
            undefined,
            'Zoom coronary scene out',
          )}
          {button(
            '+',
            () => setZoom(z => clamp(z + 0.1, 0.7, 1.25)),
            false,
            undefined,
            'Zoom coronary scene in',
          )}
        </View>
        <View style={styles.tabs}>
          {(['Views', 'Vessels', 'Learn', 'Challenge'] as Panel[]).map(p => (
            <Touchable
              key={p}
              label={`Coronary ${p.toLowerCase()}`}
              state={{ selected: panel === p }}
              onPress={() => setPanel(p)}
              style={[
                styles.tab,
                { borderBottomColor: panel === p ? c.accent : 'transparent' },
              ]}
            >
              <Text
                style={[
                  typeScale.caption,
                  {
                    color: panel === p ? c.accent : c.muted,
                    fontWeight: '700',
                  },
                ]}
              >
                {p}
              </Text>
            </Touchable>
          ))}
        </View>
        <ScrollView
          nestedScrollEnabled
          style={{ flex: 1 }}
          contentContainerStyle={styles.panel}
          key={panel}
          keyboardShouldPersistTaps="handled"
        >
          {panel === 'Views' && (
            <>
              <Text style={[typeScale.caption, { color: c.muted }]}>
                Choose a learning goal, then adjust the detector below.
              </Text>
              <View style={styles.wrap}>
                {CORONARY_VIEWS.map(v =>
                  button(
                    v.title,
                    () => {
                      setAngles({ oblique: v.oblique, tilt: v.tilt });
                      setSystem(v.system);
                      setSelected(v.system === 'left' ? 'LM' : 'pRCA');
                    },
                    preset?.id === v.id,
                  ),
                )}
              </View>
              <View style={styles.wrap}>
                {button('AP · neutral', () =>
                  setAngles({ oblique: 0, tilt: 0 }),
                )}
                {button('Left lateral', () =>
                  setAngles({ oblique: 90, tilt: 0 }),
                )}
                {button(
                  shell ? 'Heart shell on' : 'Heart shell off',
                  () => setShell(s => !s),
                  shell,
                )}
                {button(
                  labels ? 'Labels on' : 'Labels off',
                  () => setLabels(s => !s),
                  labels,
                )}
              </View>
              <Text style={[typeScale.caption, { color: c.muted }]}>
                {preset?.teaching ??
                  'Custom angle. Compare the same selected vessel in the spatial view and its projection. Presets are teaching starting points, not patient-specific optimal views.'}
              </Text>
            </>
          )}
          {panel === 'Vessels' && (
            <>
              <View style={styles.wrap}>
                {button(
                  'Both arteries',
                  () => chooseSystem('both'),
                  system === 'both',
                )}
                {button(
                  'Left system',
                  () => chooseSystem('left'),
                  system === 'left',
                )}
                {button(
                  'Right system',
                  () => chooseSystem('right'),
                  system === 'right',
                )}
              </View>
              <View style={styles.wrap}>
                {button(
                  'Right dominant',
                  () => {
                    setDominance('right');
                    if (selected === 'dLCx') setSelected('LCx');
                  },
                  dominance === 'right',
                )}
                {button(
                  'Left dominant',
                  () => setDominance('left'),
                  dominance === 'left',
                )}
              </View>
              <Text style={[typeScale.caption, { color: c.muted }]}>
                Dominance here follows the artery supplying the PDA. Co-dominant
                and other anatomical variants are not modelled.
              </Text>
              {vessels.map(v => (
                <Touchable
                  key={v.id}
                  label={`Select ${v.name}`}
                  state={{ selected: active.id === v.id }}
                  onPress={() => setSelected(v.id)}
                  style={[
                    styles.vessel,
                    {
                      borderColor: active.id === v.id ? c.accent : c.border,
                      backgroundColor: c.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typeScale.bodyStrong,
                      { color: active.id === v.id ? c.accent : c.ink },
                    ]}
                  >
                    {v.id}
                  </Text>
                  <Text style={[typeScale.caption, { color: c.ink, flex: 1 }]}>
                    {v.name}
                  </Text>
                  <Text style={[typeScale.caption, { color: c.muted }]}>
                    {v.system === 'left' ? 'LCA' : 'RCA'}
                  </Text>
                </Touchable>
              ))}
            </>
          )}
          {panel === 'Learn' && (
            <>
              <Text style={[typeScale.title3, { color: c.ink }]}>
                {active.name}
              </Text>
              <Text style={[typeScale.body, { color: c.muted }]}>
                {active.note}
              </Text>
              <View
                style={[
                  styles.metric,
                  { backgroundColor: c.card, borderColor: c.border },
                ]}
              >
                <Text
                  style={[typeScale.title2, { color: c.accent }]}
                  testID="coronary-foreshortening"
                >
                  {Math.round(shortening)}%
                </Text>
                <Text style={[typeScale.caption, { color: c.muted, flex: 1 }]}>
                  Model foreshortening · loss of centreline length in this
                  parallel projection.
                </Text>
              </View>
              <Text style={[typeScale.caption, { color: c.muted }]}>
                {crossings} other visible branch{crossings === 1 ? '' : 'es'}{' '}
                cross this centreline on the projection. This counts model
                crossings, not the percentage of a real vessel obscured.
              </Text>
              <Text style={[typeScale.bodyStrong, { color: c.ink }]}>
                Follow the geometry
              </Text>
              <Text style={[typeScale.body, { color: c.muted }]}>
                The detector moves towards the patient’s left in LAO and towards
                the head in cranial angulation. The X-ray tube sits on the
                opposite side. Dragging the 3D anatomy only changes your
                inspection viewpoint; the detector sliders change the
                projection.
              </Text>
              <Text style={[typeScale.caption, { color: c.muted }]}>
                Original schematic in arbitrary units. Vessel sizes, branch
                count, heart surface and measurements are illustrative. No
                stenosis grading, acquired angiograms, dose calculation or
                clinical validation. Coronary anatomy and useful angles vary by
                patient.
              </Text>
              {CORONARY_REFERENCES.map(ref => (
                <Touchable
                  key={ref.url}
                  label={`Open reference: ${ref.title}`}
                  onPress={() => {
                    void Linking.openURL(ref.url).catch(() =>
                      setLinkError(true),
                    );
                  }}
                  style={styles.reference}
                >
                  <Text style={[typeScale.caption, { color: c.accent }]}>
                    {ref.title} ↗
                  </Text>
                </Touchable>
              ))}
              {linkError && (
                <Text style={[typeScale.caption, { color: c.muted }]}>
                  The reference could not open. Try again when connected.
                </Text>
              )}
            </>
          )}
          {panel === 'Challenge' && (
            <>
              <Text style={[typeScale.caption, { color: c.accent }]}>
                CHECK YOUR UNDERSTANDING · {question + 1}/{challenges.length}
              </Text>
              <Text style={[typeScale.bodyStrong, { color: c.ink }]}>
                {quiz.stem}
              </Text>
              {quiz.options.map((option, i) => (
                <Touchable
                  key={option}
                  label={`Answer: ${option}`}
                  disabled={answer !== null}
                  disabledOpacity={1}
                  state={{ selected: answer === i }}
                  onPress={() => setAnswer(i)}
                  style={[
                    styles.vessel,
                    {
                      backgroundColor: c.card,
                      borderColor: answer === i ? c.accent : c.border,
                    },
                  ]}
                >
                  <Text style={[typeScale.body, { color: c.ink, flex: 1 }]}>
                    {option}
                  </Text>
                </Touchable>
              ))}
              {answer !== null && (
                <View
                  accessibilityLiveRegion="polite"
                  style={{ gap: space.sm }}
                >
                  <Text
                    style={[
                      typeScale.bodyStrong,
                      {
                        color:
                          answer === quiz.answer
                            ? dark
                              ? '#86efac'
                              : '#166534'
                            : dark
                            ? '#fda4af'
                            : '#9f1239',
                      },
                    ]}
                  >
                    {answer === quiz.answer ? 'Correct' : 'Review the answer'} ·{' '}
                    {quiz.options[quiz.answer]}
                  </Text>
                  <Text style={[typeScale.body, { color: c.muted }]}>
                    {quiz.why}
                  </Text>
                  {button(
                    question === challenges.length - 1
                      ? 'Restart questions'
                      : 'Next question',
                    () => {
                      setQuestion(q => (q + 1) % challenges.length);
                      setAnswer(null);
                    },
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
        <View
          style={[
            styles.console,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <View style={styles.angleRow}>
            <Text style={[typeScale.caption, { color: c.muted, flex: 1 }]}>
              DETECTOR ROTATION
            </Text>
            <Text style={[typeScale.bodyStrong, { color: c.ink }]}>
              {angles.oblique === 0
                ? 'AP · 0°'
                : `${angles.oblique > 0 ? 'LAO' : 'RAO'} ${Math.abs(
                    angles.oblique,
                  )}°`}
            </Text>
          </View>
          <View style={styles.angleRow}>
            {button(
              '−',
              () =>
                setAngles(a => boundedAngles({ ...a, oblique: a.oblique - 1 })),
              false,
              'coronary-oblique-minus',
              'Decrease detector rotation',
            )}
            <View style={{ flex: 1 }}>
              <Slider
                label="Detector oblique angle"
                min={-90}
                max={90}
                step={1}
                value={angles.oblique}
                onChange={oblique => setAngles(a => ({ ...a, oblique }))}
                format={n =>
                  n === 0 ? 'AP' : `${n > 0 ? 'LAO' : 'RAO'} ${Math.abs(n)}°`
                }
                detents={[-90, -30, 0, 45, 90]}
              />
            </View>
            {button(
              '+',
              () =>
                setAngles(a => boundedAngles({ ...a, oblique: a.oblique + 1 })),
              false,
              'coronary-oblique-plus',
              'Increase detector rotation',
            )}
          </View>
          <View style={styles.angleRow}>
            <Text style={[typeScale.caption, { color: c.muted, flex: 1 }]}>
              DETECTOR TILT
            </Text>
            <Text style={[typeScale.bodyStrong, { color: c.ink }]}>
              {angles.tilt === 0
                ? 'Level · 0°'
                : `${angles.tilt > 0 ? 'Cranial' : 'Caudal'} ${Math.abs(
                    angles.tilt,
                  )}°`}
            </Text>
          </View>
          <View style={styles.angleRow}>
            {button(
              '−',
              () => setAngles(a => boundedAngles({ ...a, tilt: a.tilt - 1 })),
              false,
              'coronary-tilt-minus',
              'Decrease detector tilt',
            )}
            <View style={{ flex: 1 }}>
              <Slider
                label="Detector cranial caudal angle"
                min={-45}
                max={45}
                step={1}
                value={angles.tilt}
                onChange={tilt => setAngles(a => ({ ...a, tilt }))}
                format={n =>
                  n === 0
                    ? 'Level · 0°'
                    : `${n > 0 ? 'Cranial' : 'Caudal'} ${Math.abs(n)}°`
                }
                detents={[-30, 0, 30]}
              />
            </View>
            {button(
              '+',
              () => setAngles(a => boundedAngles({ ...a, tilt: a.tilt + 1 })),
              false,
              'coronary-tilt-plus',
              'Increase detector tilt',
            )}
          </View>
        </View>
      </View>
    </LabFrame>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  icon: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspace: {
    marginHorizontal: space.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.sm,
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: space.sm },
  tab: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  panel: { padding: space.md, gap: space.md, paddingBottom: space.xl },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  vessel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 48,
    padding: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  reference: { minHeight: 44, justifyContent: 'center' },
  console: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.xs,
    gap: space.xs,
    borderTopWidth: 1,
  },
  angleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
