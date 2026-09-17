import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Text } from '@/components/Text';
import { useTheme, withAlpha } from '@/theme';
import type { FigureKind } from '@/lib/clinical/generalExamination';

/**
 * The general-examination figures, drawn rather than photographed.
 *
 * This is a deliberate choice, not a fallback. A clinical photograph of a
 * real patient's eye or hand carries a licence and a consent that travel with
 * it, and an app that ships one it cannot account for has a problem that no
 * amount of good intent fixes. A line figure of the Lovibond angle teaches the
 * same thing — arguably better, because it can label the angle — and belongs
 * to nobody.
 *
 * It is also the house pattern: FocusTree draws twelve species from nine
 * numbers each, and ColorWheel draws a hue wheel rather than importing a
 * package to do it. `react-native-svg` is already in the APK.
 *
 * Everything here takes its ink from the theme, so a figure is legible on the
 * black theme and on the light one without a second asset.
 */

export interface ClinicalSignFigureProps {
  kind: FigureKind;
  /** Drawn width; height follows the figure's own aspect. */
  width?: number;
}

const VIEWBOX = 320;

export function ClinicalSignFigure({ kind, width = 300 }: ClinicalSignFigureProps) {
  const { colors } = useTheme();

  if (kind === 'none') {
    return null;
  }

  const ink = colors.text;
  const faint = withAlpha(colors.text, 0.28);
  const accent = colors.accent;
  const height = FIGURE_HEIGHT[kind] ?? 180;

  return (
    <View
      style={[
        styles.frame,
        { backgroundColor: colors.cardElevated, borderColor: colors.border },
      ]}>
      <Svg width={width} height={(width / VIEWBOX) * height} viewBox={`0 0 ${VIEWBOX} ${height}`}>
        {renderFigure(kind, { ink, faint, accent, danger: colors.danger, muted: colors.textMuted })}
      </Svg>
      <Text style={[styles.caption, { color: colors.textMuted }]}>{FIGURE_CAPTION[kind]}</Text>
    </View>
  );
}

interface Ink {
  ink: string;
  faint: string;
  accent: string;
  danger: string;
  muted: string;
}

const FIGURE_HEIGHT: Record<FigureKind, number> = {
  'clubbing-profile': 210,
  schamroth: 170,
  'cyanosis-sites': 200,
  'pallor-sites': 200,
  'icterus-sites': 200,
  'pitting-grades': 160,
  'lymph-node-map': 230,
  'jvp-waveform': 180,
  none: 0,
};

const FIGURE_CAPTION: Record<FigureKind, string> = {
  'clubbing-profile':
    'Normal nail profile against a clubbed one. The Lovibond angle opens from about 160° to 180° or more, and the nail-bed depth comes to exceed the depth at the DIP joint.',
  schamroth:
    'Schamroth\'s window. Nail-to-nail apposition normally leaves a diamond gap; in clubbing it is obliterated.',
  'cyanosis-sites':
    'Where to look. The TONGUE is the site that separates central from peripheral — blue tongue means central, every time.',
  'pallor-sites':
    'The five sites, in examination order. Lower palpebral conjunctiva first; palmar creases last and only pale when severe.',
  'icterus-sites':
    'Upper bulbar sclera first, with the patient looking down and the upper lid lifted — the earliest site, and the one a casual glance misses.',
  'pitting-grades':
    'Pitting depth and rebound time. Press over a bony point for 10–15 seconds, not over calf muscle for two.',
  'lymph-node-map':
    'The cervical chain in palpation order, plus the two named nodes that redirect the whole examination.',
  'jvp-waveform':
    'a, c and v waves with the x and y descents. Measured vertically from the sternal angle; normal is up to 3 cm.',
};

function renderFigure(kind: FigureKind, c: Ink) {
  switch (kind) {
    case 'clubbing-profile':
      return <ClubbingProfile {...c} />;
    case 'schamroth':
      return <Schamroth {...c} />;
    case 'cyanosis-sites':
      return <FaceSites {...c} mode="cyanosis" />;
    case 'pallor-sites':
      return <FaceSites {...c} mode="pallor" />;
    case 'icterus-sites':
      return <FaceSites {...c} mode="icterus" />;
    case 'pitting-grades':
      return <PittingGrades {...c} />;
    case 'lymph-node-map':
      return <LymphNodeMap {...c} />;
    case 'jvp-waveform':
      return <JvpWaveform {...c} />;
    default:
      return null;
  }
}

/* ───────────────────────────────────────────────── clubbing profile ───── */

function ClubbingProfile({ ink, faint, accent, muted }: Ink) {
  return (
    <G>
      <SvgText x={78} y={18} fill={muted} fontSize={11} textAnchor="middle">
        NORMAL
      </SvgText>
      <SvgText x={242} y={18} fill={accent} fontSize={11} textAnchor="middle">
        CLUBBED
      </SvgText>

      {/* Normal finger, seen from the side */}
      <G>
        <Path
          d="M14 120 L14 92 Q14 78 34 76 L96 70 Q124 68 132 84 Q140 100 126 112 L112 122 Q96 132 68 132 L30 132 Q14 132 14 120 Z"
          fill="none"
          stroke={ink}
          strokeWidth={2}
        />
        {/* nail plate — a shallow, nearly flat curve */}
        <Path d="M74 72 Q104 70 126 84" fill="none" stroke={accent} strokeWidth={3} />
        {/* nail fold */}
        <Line x1={74} y1={72} x2={62} y2={86} stroke={faint} strokeWidth={2} />
        {/* the angle itself */}
        <Path d="M84 74 Q76 78 72 84" fill="none" stroke={accent} strokeWidth={1.5} />
        <SvgText x={62} y={106} fill={accent} fontSize={12}>
          160°
        </SvgText>
        <SvgText x={40} y={158} fill={muted} fontSize={10}>
          Angle preserved
        </SvgText>
        <SvgText x={40} y={172} fill={muted} fontSize={10}>
          Nail bed depth
        </SvgText>
        <SvgText x={40} y={185} fill={muted} fontSize={10}>
          {'< DIP depth'}
        </SvgText>
      </G>

      {/* Clubbed finger */}
      <G>
        <Path
          d="M178 120 L178 92 Q178 78 198 76 L246 66 Q286 60 296 86 Q304 110 282 122 L266 130 Q244 138 210 136 L194 134 Q178 132 178 120 Z"
          fill="none"
          stroke={ink}
          strokeWidth={2}
        />
        {/* bulbous nail — curved in both planes */}
        <Path d="M232 68 Q272 62 292 92" fill="none" stroke={accent} strokeWidth={3} />
        <Line x1={232} y1={68} x2={216} y2={84} stroke={faint} strokeWidth={2} />
        <Path d="M240 70 Q226 74 220 84" fill="none" stroke={accent} strokeWidth={1.5} />
        <SvgText x={196} y={106} fill={accent} fontSize={12}>
          {'>180°'}
        </SvgText>
        <SvgText x={186} y={158} fill={muted} fontSize={10}>
          Angle obliterated
        </SvgText>
        <SvgText x={186} y={172} fill={muted} fontSize={10}>
          Nail bed depth
        </SvgText>
        <SvgText x={186} y={185} fill={muted} fontSize={10}>
          {'> DIP depth'}
        </SvgText>
      </G>
    </G>
  );
}

/* ───────────────────────────────────────────────────────── schamroth ───── */

function Schamroth({ ink, accent, muted, danger }: Ink) {
  return (
    <G>
      <SvgText x={80} y={16} fill={muted} fontSize={11} textAnchor="middle">
        NORMAL
      </SvgText>
      <SvgText x={240} y={16} fill={accent} fontSize={11} textAnchor="middle">
        CLUBBED
      </SvgText>

      {/* Two fingertips meeting, normal — a diamond of daylight between them.
          The nail plates curve AWAY from each other at the base, and that gap
          is the window. */}
      <G>
        <Path d="M18 40 L58 40 Q72 40 72 60 L72 106 Q72 126 58 126 L18 126" fill="none" stroke={ink} strokeWidth={2} />
        <Path d="M142 40 L102 40 Q88 40 88 60 L88 106 Q88 126 102 126 L142 126" fill="none" stroke={ink} strokeWidth={2} />
        {/* the window between the two nail beds */}
        <Path d="M80 68 L94 83 L80 98 L66 83 Z" fill={withAlphaSafe(accent, 0.35)} stroke={accent} strokeWidth={1.5} />
        <SvgText x={80} y={148} fill={muted} fontSize={10} textAnchor="middle">
          Diamond window present
        </SvgText>
      </G>

      {/* Clubbed — the window is gone, the nail beds meet */}
      <G>
        <Path d="M182 40 L228 40 Q246 40 246 62 L246 104 Q246 126 228 126 L182 126" fill="none" stroke={ink} strokeWidth={2} />
        <Path d="M298 40 L252 40 Q234 40 234 62 L234 104 Q234 126 252 126 L298 126" fill="none" stroke={ink} strokeWidth={2} />
        <Line x1={240} y1={54} x2={240} y2={112} stroke={danger} strokeWidth={2.5} />
        <SvgText x={240} y={146} fill={accent} fontSize={10} textAnchor="middle">
          Window obliterated
        </SvgText>
      </G>
    </G>
  );
}

/* ──────────────────────────────────────────────────────── face sites ───── */

function FaceSites({ ink, faint, accent, muted, mode }: Ink & { mode: 'cyanosis' | 'pallor' | 'icterus' }) {
  const labels: Record<typeof mode, { at: [number, number]; text: string }[]> = {
    cyanosis: [
      { at: [196, 52], text: '1  Tongue — central vs peripheral' },
      { at: [196, 72], text: '2  Lips & buccal mucosa' },
      { at: [196, 92], text: '3  Conjunctiva' },
      { at: [196, 112], text: '4  Nose tip, ear lobes' },
      { at: [196, 132], text: '5  Fingers & toes' },
    ],
    pallor: [
      { at: [196, 52], text: '1  Lower palpebral conjunctiva' },
      { at: [196, 72], text: '2  Tongue — dorsum & undersurface' },
      { at: [196, 92], text: '3  Nail beds' },
      { at: [196, 112], text: '4  Palmar creases (severe only)' },
      { at: [196, 132], text: '5  Soft palate & skin' },
    ],
    icterus: [
      { at: [196, 52], text: '1  Upper bulbar sclera' },
      { at: [196, 72], text: '2  Undersurface of tongue' },
      { at: [196, 92], text: '3  Soft palate' },
      { at: [196, 112], text: '4  Skin' },
      { at: [196, 132], text: '5  Palms & soles (NOT in carotenaemia)' },
    ],
  };

  return (
    <G>
      {/* head in three-quarter outline */}
      <Path
        d="M96 34 Q140 34 148 78 Q152 106 142 130 Q132 158 104 166 Q74 168 58 148 Q42 126 44 96 Q46 52 96 34 Z"
        fill="none"
        stroke={ink}
        strokeWidth={2}
      />
      {/* eye */}
      <Ellipse cx={82} cy={88} rx={22} ry={11} fill="none" stroke={ink} strokeWidth={1.8} />
      <Circle cx={82} cy={88} r={6} fill={faint} />
      {/* lower lid drawn down — the pallor manoeuvre */}
      <Path d="M62 94 Q82 108 102 94" fill="none" stroke={accent} strokeWidth={2.2} />
      {/* mouth and tongue */}
      <Path d="M68 134 Q92 146 116 134" fill="none" stroke={ink} strokeWidth={1.8} />
      <Path d="M76 136 Q92 152 108 136 Q92 144 76 136 Z" fill={withAlphaSafe(accent, 0.4)} stroke={accent} strokeWidth={1.5} />
      {/* markers */}
      <Circle cx={92} cy={140} r={4} fill={accent} />
      <Circle cx={82} cy={96} r={4} fill={accent} />
      <SvgText x={46} y={188} fill={muted} fontSize={10}>
        Daylight, never yellow ward light
      </SvgText>

      {labels[mode].map(l => (
        <SvgText key={l.text} x={l.at[0]} y={l.at[1]} fill={muted} fontSize={10}>
          {l.text}
        </SvgText>
      ))}
    </G>
  );
}

/* ─────────────────────────────────────────────────── pitting grades ───── */

function PittingGrades({ ink, accent, muted }: Ink) {
  const grades = [
    { x: 24, depth: 6, label: '1+', mm: '2 mm', rebound: 'immediate' },
    { x: 96, depth: 12, label: '2+', mm: '4 mm', rebound: '~15 s' },
    { x: 168, depth: 18, label: '3+', mm: '6 mm', rebound: '~30 s' },
    { x: 240, depth: 24, label: '4+', mm: '8 mm', rebound: '>30 s' },
  ];
  return (
    <G>
      {grades.map(g => (
        <G key={g.label}>
          {/* skin surface with a pit pressed into it */}
          <Path
            d={`M${g.x} 56 L${g.x + 18} 56 Q${g.x + 28} 56 ${g.x + 28} ${56 + g.depth} Q${g.x + 28} ${64 + g.depth} ${g.x + 38} ${64 + g.depth} Q${g.x + 48} ${64 + g.depth} ${g.x + 48} ${56 + g.depth} Q${g.x + 48} 56 ${g.x + 58} 56 L${g.x + 56} 56`}
            fill="none"
            stroke={ink}
            strokeWidth={2}
          />
          <Line x1={g.x + 38} y1={56} x2={g.x + 38} y2={64 + g.depth} stroke={accent} strokeWidth={1.4} strokeDasharray="3 3" />
          <SvgText x={g.x + 28} y={38} fill={accent} fontSize={14} textAnchor="middle" fontWeight="bold">
            {g.label}
          </SvgText>
          <SvgText x={g.x + 28} y={116} fill={muted} fontSize={10} textAnchor="middle">
            {g.mm}
          </SvgText>
          <SvgText x={g.x + 28} y={130} fill={muted} fontSize={9} textAnchor="middle">
            {g.rebound}
          </SvgText>
        </G>
      ))}
      <SvgText x={160} y={152} fill={muted} fontSize={10} textAnchor="middle">
        Press over a BONY point for 10–15 seconds
      </SvgText>
    </G>
  );
}

/* ──────────────────────────────────────────────────── lymph node map ───── */

function LymphNodeMap({ ink, accent, muted, danger }: Ink) {
  const nodes: { cx: number; cy: number; n: string }[] = [
    { cx: 96, cy: 62, n: '1' }, // submental
    { cx: 120, cy: 56, n: '2' }, // submandibular
    { cx: 146, cy: 46, n: '3' }, // preauricular
    { cx: 162, cy: 54, n: '4' }, // postauricular
    { cx: 170, cy: 70, n: '5' }, // occipital
    { cx: 132, cy: 86, n: '6' }, // superficial cervical
    { cx: 128, cy: 110, n: '7' }, // deep cervical
    { cx: 158, cy: 108, n: '8' }, // posterior triangle
    { cx: 112, cy: 136, n: '9' }, // supraclavicular
  ];
  return (
    <G>
      {/* head and neck silhouette */}
      <Path d="M100 20 Q142 18 152 56 Q158 84 146 100 L146 116 Q180 128 196 150 L196 176 L44 176 L44 150 Q60 128 96 116 L96 100 Q84 84 90 56 Q94 22 100 20 Z" fill="none" stroke={ink} strokeWidth={2} />
      {/* sternocleidomastoid, the landmark the chain runs along */}
      <Path d="M112 104 L128 150" fill="none" stroke={muted} strokeWidth={1.4} strokeDasharray="4 3" />

      {nodes.map(n => (
        <G key={n.n}>
          <Circle cx={n.cx} cy={n.cy} r={6.5} fill="none" stroke={accent} strokeWidth={1.8} />
          <SvgText x={n.cx} y={n.cy + 3.5} fill={accent} fontSize={8} textAnchor="middle">
            {n.n}
          </SvgText>
        </G>
      ))}

      {/* Virchow — flag it in danger ink, because it redirects the examination */}
      <Circle cx={112} cy={136} r={10} fill="none" stroke={danger} strokeWidth={2} />

      <SvgText x={206} y={40} fill={muted} fontSize={9}>1 Submental</SvgText>
      <SvgText x={206} y={54} fill={muted} fontSize={9}>2 Submandibular</SvgText>
      <SvgText x={206} y={68} fill={muted} fontSize={9}>3 Preauricular</SvgText>
      <SvgText x={206} y={82} fill={muted} fontSize={9}>4 Postauricular</SvgText>
      <SvgText x={206} y={96} fill={muted} fontSize={9}>5 Occipital</SvgText>
      <SvgText x={206} y={110} fill={muted} fontSize={9}>6 Superficial cervical</SvgText>
      <SvgText x={206} y={124} fill={muted} fontSize={9}>7 Deep cervical</SvgText>
      <SvgText x={206} y={138} fill={muted} fontSize={9}>8 Posterior triangle</SvgText>
      <SvgText x={206} y={152} fill={danger} fontSize={9}>9 Supraclavicular</SvgText>
      <SvgText x={206} y={166} fill={danger} fontSize={8}>   (left = Virchow)</SvgText>
      <SvgText x={44} y={196} fill={muted} fontSize={10}>
        Examine the neck from BEHIND, neck slightly flexed
      </SvgText>
      <SvgText x={44} y={210} fill={muted} fontSize={10}>
        Follow the route — a fixed order is what stops omissions
      </SvgText>
    </G>
  );
}

/* ───────────────────────────────────────────────────── JVP waveform ───── */

function JvpWaveform({ ink, accent, muted, faint }: Ink) {
  /**
   * One cardiac cycle of the venous pulse: a (atrial contraction) — x descent
   * — c (tricuspid bulge) — v (atrial filling) — y descent. Drawn three times,
   * because a single cycle does not read as a repeating waveform.
   */
  const cycle = (x0: number) =>
    `M${x0} 110 L${x0 + 8} 60 L${x0 + 18} 92 L${x0 + 26} 74 L${x0 + 38} 104 L${x0 + 52} 66 L${x0 + 68} 110`;

  return (
    <G>
      <Line x1={24} y1={120} x2={300} y2={120} stroke={faint} strokeWidth={1} />
      {[32, 100, 168].map(x0 => (
        <Path key={x0} d={cycle(x0)} fill="none" stroke={accent} strokeWidth={2.4} />
      ))}

      <SvgText x={40} y={52} fill={ink} fontSize={11}>a</SvgText>
      <SvgText x={58} y={70} fill={ink} fontSize={11}>c</SvgText>
      <SvgText x={68} y={118} fill={ink} fontSize={11}>x</SvgText>
      <SvgText x={84} y={58} fill={ink} fontSize={11}>v</SvgText>
      <SvgText x={98} y={124} fill={ink} fontSize={11}>y</SvgText>

      <SvgText x={24} y={146} fill={muted} fontSize={9}>a — atrial contraction   c — tricuspid bulge   v — atrial filling</SvgText>
      <SvgText x={24} y={160} fill={muted} fontSize={9}>x descent — atrial relaxation   y descent — tricuspid opens</SvgText>
      <SvgText x={24} y={174} fill={muted} fontSize={9}>Cannon a = complete heart block · Sharp y = constriction</SvgText>
    </G>
  );
}

/** Local alpha helper — `withAlpha` from the theme takes a hex, which is all we pass. */
function withAlphaSafe(hex: string, alpha: number) {
  try {
    return withAlpha(hex, alpha);
  } catch {
    return hex;
  }
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  caption: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
