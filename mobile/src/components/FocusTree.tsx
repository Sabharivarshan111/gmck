import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';
import { useTheme } from '@/theme';
import { hexToHsv, hsvToHex, mix } from '@/theme/color';
import { useReducedMotion } from '@/theme/motion';
import { speciesFor, type Species } from '@/lib/trees';

/**
 * The tree that grows while you concentrate.
 *
 * **Drawn, not animated frame by frame.** Every part's size is a pure function
 * of `growth` (0 to 1), and `growth` changes once a second because that is how
 * often the countdown ticks — a tree that takes twenty-five minutes to grow
 * moves imperceptibly between ticks, so there is nothing for a frame loop to
 * add. The only thing running at frame rate is one sway, and that is a
 * transform on a plain `View`, on the native thread.
 *
 * This is the difference between a feature that costs nothing on a cheap phone
 * and one that costs a redraw of forty vector nodes every frame for
 * twenty-five minutes.
 *
 * **It takes its colours from the theme.** A fixed Forest-green tree on the
 * Black Pink theme reads as something pasted in from another app, which is the
 * same reason `subjectCards.ts` fans the card gradients off the accent. Each
 * species carries a hue *offset*, so a species stays recognisable — the pine
 * is always the cool one, the cherry always the warm one — while the whole
 * planting belongs to whatever theme is on.
 */

/** How far through the session each part of the tree has appeared. */
const PHASE = {
  trunkFrom: 0,
  trunkTo: 0.32,
  /*
   * The crown starts at a sixth, not a third.
   *
   * With it at a third, the first eight minutes of a twenty-five minute
   * session were a bare stick — nothing to look at during exactly the stretch
   * where somebody is deciding whether this is worth watching.
   */
  crownFrom: 0.16,
  crownTo: 0.9,
  decorFrom: 0.74,
  decorTo: 1,
};

/** 0 before `from`, 1 after `to`, eased in between. */
function phase(growth: number, from: number, to: number): number {
  if (growth <= from) {
    return 0;
  }
  if (growth >= to) {
    return 1;
  }
  const t = (growth - from) / (to - from);
  // Ease out: a part that arrives fast and settles reads as growing, one that
  // arrives linearly reads as a slider being dragged.
  return 1 - Math.pow(1 - t, 2.2);
}

/** Deterministic jitter, so a species looks hand-drawn but never flickers. */
function wobble(seed: number): number {
  return (Math.sin(seed * 12.9898) * 43758.5453) % 1;
}

export function FocusTree({
  species: speciesKey,
  growth,
  size = 150,
  wilted = false,
  sway = true,
}: {
  species: string;
  /** 0 at planting, 1 at the end of the session. */
  growth: number;
  size?: number;
  /**
   * Left to stand, but grey and stopped.
   *
   * A withered tree is still planted. An empty plot says nothing happened; a
   * grey one says exactly what happened, which is the whole point of the rule.
   */
  wilted?: boolean;
  sway?: boolean;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const species = useMemo(() => speciesFor(speciesKey), [speciesKey]);

  /*
   * One sway, on the whole tree, on the native thread.
   *
   * It is a rotation of the wrapping View rather than of an SVG group: RN's
   * native driver takes View transforms everywhere, and driving SVG geometry
   * would put this on the JS thread for the length of a focus session.
   */
  const breeze = useRef(new Animated.Value(0)).current;
  const alive = sway && !wilted && !reduceMotion && growth > 0.05;
  useEffect(() => {
    if (!alive) {
      breeze.stopAnimation();
      breeze.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breeze, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breeze, {
          toValue: -1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [alive, breeze]);

  const palette = useMemo(() => paletteFor(species, colors, wilted), [colors, species, wilted]);
  const parts = useMemo(() => geometry(species, growth, size), [growth, size, species]);

  return (
    <Animated.View
      accessibilityLabel={
        wilted
          ? `A withered ${species.name.toLowerCase()}`
          : `${species.name}, ${Math.round(growth * 100)} per cent grown`
      }
      style={{
        width: size,
        height: size,
        transform: [
          // Rotate about the base, not the centre: a tree pivoting round its
          // middle slides its own roots about and reads as a swinging sign.
          { translateY: size / 2 },
          {
            rotate: breeze.interpolate({
              inputRange: [-1, 1],
              outputRange: ['-1.4deg', '1.4deg'],
            }),
          },
          { translateY: -size / 2 },
        ],
      }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* The ground the tree stands on — a soft ellipse, not a line: a hard
            edge under a drawn tree reads as a shelf. */}
        {growth > 0.02 ? (
          <Ellipse
            cx={size / 2}
            cy={size * 0.94}
            rx={size * 0.3 * Math.min(1, growth * 2)}
            ry={size * 0.035}
            fill={palette.ground}
          />
        ) : null}

        <G>
          {parts.trunk ? <Path d={parts.trunk} fill={palette.trunk} /> : null}
          {parts.branches.map((d, index) => (
            <Path
              key={`b${index}`}
              d={d}
              stroke={palette.trunk}
              strokeWidth={Math.max(1.2, size * 0.014)}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          {parts.crown.map((part, index) =>
            part.kind === 'circle' ? (
              <Circle
                key={`c${index}`}
                cx={part.cx}
                cy={part.cy}
                r={part.r}
                fill={index % 2 === 0 ? palette.leaf : palette.leafLit}
              />
            ) : part.kind === 'poly' ? (
              <Polygon
                key={`c${index}`}
                points={part.points}
                fill={index % 2 === 0 ? palette.leaf : palette.leafLit}
              />
            ) : (
              <Path
                key={`c${index}`}
                d={part.d}
                stroke={index % 2 === 0 ? palette.leaf : palette.leafLit}
                strokeWidth={part.width}
                strokeLinecap="round"
                fill="none"
              />
            ),
          )}
          {parts.decor.map((dot, index) => (
            <Circle
              key={`d${index}`}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={palette.decor}
            />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

/**
 * A species' colours, derived from the theme rather than fixed.
 *
 * Wilting is not a different drawing — it is the same tree with the colour
 * taken out of it, which is what withering looks like and costs one branch
 * here instead of a second set of shapes everywhere.
 */
/**
 * How far a species' own hue is dragged towards the theme's accent.
 *
 * Not zero, and not one. At zero the trees are a fixed green-and-red set that
 * sits on the Black Pink theme like clip art from another app. At one every
 * species is the same colour as every other, which is where this started: a
 * fuchsia accent grew a fuchsia pine, a fuchsia maple and a fuchsia cherry, and
 * naming them was a lie.
 *
 * A third keeps a maple red and a pine green while every tree still leans the
 * way the theme leans, so a planting reads as one set on any palette.
 */
const THEME_PULL = 0.34;

/**
 * …and never further than this, whatever the fraction works out to.
 *
 * A fraction alone is not enough, because how far a third of the way *is*
 * depends on how far apart the two hues were. Green is almost opposite
 * fuchsia, so a third of that gap is fifty degrees — which took the oak to
 * yellow and the pine to cyan on the Black Pink theme. Eighteen degrees is a
 * lean: enough that a planting reads as one set on any palette, not enough for
 * a pine to stop being green.
 */
const MAX_SHIFT = 18;

/** Rotate `from` towards `to` the short way round the wheel, and not too far. */
function towards(from: number, to: number, amount: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  const shift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, delta * amount));
  return (from + shift + 360) % 360;
}

/**
 * A species' colours: its own, leaned towards the theme, and saturated enough
 * to be a tree rather than a smudge.
 *
 * Wilting is not a different drawing — it is the same tree with the colour
 * taken out of it, which is what withering looks like and costs one branch
 * here instead of a second set of shapes everywhere.
 */
function paletteFor(
  species: Species,
  colors: { accent: string; text: string; background: string; textMuted: string },
  wilted: boolean,
) {
  const accent = hexToHsv(colors.accent);
  const hue = towards(species.hue, accent.h, THEME_PULL);
  /*
   * Fixed saturation and value, not the accent's.
   *
   * Deriving them from the theme is how the trees came out washed out on a
   * muted palette — a tree is the brightest thing on this screen by design,
   * and 0.82/0.86 is the range that stays vivid on both a black background and
   * a white one.
   */
  const leaf = hsvToHex({ h: hue, s: 0.82, v: 0.86 });
  // The lit side: the same hue, lighter and a little less saturated, so the
  // crown reads as a mass with a light on it rather than a flat sticker.
  const lit = hsvToHex({ h: (hue + 10) % 360, s: 0.6, v: 1 });
  const decor = hsvToHex({
    h: towards(species.decorHue, accent.h, THEME_PULL * 0.6),
    s: 0.86,
    v: 1,
  });
  const trunk = mix(colors.background, colors.text, 0.42);

  if (wilted) {
    const grey = (hex: string) => mix(hex, colors.textMuted, 0.82);
    return {
      leaf: grey(leaf),
      leafLit: grey(lit),
      decor: grey(decor),
      trunk: mix(trunk, colors.textMuted, 0.5),
      ground: mix(colors.background, colors.textMuted, 0.2),
    };
  }
  return {
    leaf,
    leafLit: lit,
    decor,
    trunk,
    ground: mix(colors.background, colors.text, 0.14),
  };
}

type CrownPart =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'poly'; points: string }
  | { kind: 'stroke'; d: string; width: number };

/**
 * Where every piece of this species sits at this much growth.
 *
 * Pure geometry, no state: the same species and the same growth always draw
 * the same tree, which is what lets the forest replay a session months later
 * from one key and one number.
 */
function geometry(species: Species, growth: number, size: number) {
  const g = Math.max(0, Math.min(1, growth));
  const trunkGrown = phase(g, PHASE.trunkFrom, PHASE.trunkTo);
  const crownGrown = phase(g, PHASE.crownFrom, PHASE.crownTo);
  const decorGrown = phase(g, PHASE.decorFrom, PHASE.decorTo);

  const baseY = size * 0.94;
  const cx = size / 2;
  // Nothing starts from nothing: a seedling appears at a fifth of its height
  // rather than materialising out of the soil.
  const height = size * species.trunk * (0.2 + 0.8 * trunkGrown);
  const topY = baseY - height;
  const lean = (species.lean * Math.PI) / 180;
  const topX = cx + Math.sin(lean) * height;
  const halfWidth = (size * species.girth * (0.35 + 0.65 * trunkGrown)) / 2;

  const trunk =
    trunkGrown > 0
      ? `M ${cx - halfWidth} ${baseY} ` +
        `C ${cx - halfWidth * 0.7} ${baseY - height * 0.55}, ` +
        `${topX - halfWidth * 0.4} ${topY + height * 0.25}, ${topX - halfWidth * 0.32} ${topY} ` +
        `L ${topX + halfWidth * 0.32} ${topY} ` +
        `C ${topX + halfWidth * 0.4} ${topY + height * 0.25}, ` +
        `${cx + halfWidth * 0.7} ${baseY - height * 0.55}, ${cx + halfWidth} ${baseY} Z`
      : null;

  const branches: string[] = [];
  const crown: CrownPart[] = [];
  const decor: { cx: number; cy: number; r: number }[] = [];
  const spread = size * species.spread;

  if (crownGrown > 0) {
    if (species.crown === 'blob') {
      // A rounded mass built from overlapping circles, biggest in the middle.
      for (let i = 0; i < species.parts; i++) {
        const angle = Math.PI + (Math.PI * (i + 0.5)) / species.parts;
        const ring = i === 0 ? 0 : 1;
        const distance = ring === 0 ? 0 : spread * 0.3;
        const px = topX + Math.cos(angle) * distance + wobble(i) * size * 0.02;
        const py = topY - spread * 0.22 + Math.sin(angle) * distance * 0.6;
        const r = (ring === 0 ? spread * 0.34 : spread * 0.26) * crownGrown;
        crown.push({ kind: 'circle', cx: px, cy: py, r });
        if (ring === 1 && trunkGrown > 0.8) {
          branches.push(`M ${topX} ${topY + height * 0.1} Q ${(topX + px) / 2} ${(topY + py) / 2} ${px} ${py}`);
        }
      }
    } else if (species.crown === 'cone') {
      // Stacked triangles, each narrower and shorter than the one below.
      for (let i = 0; i < species.parts; i++) {
        const t = i / species.parts;
        const w = spread * (1 - t * 0.72) * 0.5 * crownGrown;
        const yBottom = topY + spread * 0.16 - i * spread * 0.24 * crownGrown;
        const yTop = yBottom - spread * 0.42 * crownGrown;
        crown.push({
          kind: 'poly',
          points: `${topX - w},${yBottom} ${topX + w},${yBottom} ${topX},${yTop}`,
        });
      }
    } else if (species.crown === 'fan') {
      // Fronds from one point, bending under their own weight.
      for (let i = 0; i < species.parts; i++) {
        const angle = Math.PI + (Math.PI * (i + 0.5)) / species.parts;
        const length = spread * 0.52 * crownGrown;
        const ex = topX + Math.cos(angle) * length;
        const ey = topY + Math.sin(angle) * length * 0.85 + length * 0.22;
        crown.push({
          kind: 'stroke',
          d: `M ${topX} ${topY} Q ${(topX + ex) / 2} ${topY - length * 0.42} ${ex} ${ey}`,
          width: Math.max(2, size * 0.035) * crownGrown,
        });
      }
    } else if (species.crown === 'weep') {
      // A wide, low dome — three overlapping masses rather than one circle,
      // because a perfect disc with strands under it is a jellyfish.
      for (let i = -1; i <= 1; i++) {
        crown.push({
          kind: 'circle',
          cx: topX + i * spread * 0.2,
          cy: topY - spread * 0.12 + Math.abs(i) * spread * 0.05,
          r: (i === 0 ? spread * 0.28 : spread * 0.22) * crownGrown,
        });
      }
      // Strands hang from the dome's rim, not from its middle, and no two are
      // the same length: an even fringe reads as a lampshade.
      for (let i = 0; i < species.parts; i++) {
        const t = i / (species.parts - 1) - 0.5;
        const offset = t * spread * 0.72;
        // Longest at the edges, like a real willow's outermost withies.
        const fall = spread * (0.24 + Math.abs(t) * 0.34 + wobble(i) * 0.14) * crownGrown;
        const from = topY - spread * 0.1 + Math.abs(t) * spread * 0.14;
        crown.push({
          kind: 'stroke',
          d: `M ${topX + offset} ${from} Q ${topX + offset * 1.16} ${from + fall * 0.6} ${topX + offset * 1.08} ${from + fall}`,
          width: Math.max(1.6, size * 0.022) * crownGrown,
        });
      }
    } else if (species.crown === 'column') {
      // Segments up a narrow stem, with leaves off each joint.
      for (let i = 0; i < species.parts; i++) {
        const y = baseY - (height / species.parts) * (i + 0.6);
        const side = i % 2 === 0 ? 1 : -1;
        const length = spread * 0.42 * crownGrown;
        crown.push({
          kind: 'stroke',
          d: `M ${cx} ${y} Q ${cx + side * length * 0.6} ${y - length * 0.35} ${cx + side * length} ${y - length * 0.15}`,
          width: Math.max(1.8, size * 0.026) * crownGrown,
        });
      }
    } else if (species.crown === 'vase') {
      // Limbs rising outwards, each carrying its own mass of leaf. Reads as a
      // broad upright tree rather than a palm, which is what separates the
      // ginkgo from the fronds above.
      for (let i = 0; i < species.parts; i++) {
        const t = i / (species.parts - 1) - 0.5;
        const reach = t * spread * 0.62 * crownGrown;
        const rise = spread * (0.34 + (0.5 - Math.abs(t)) * 0.3) * crownGrown;
        const ex = topX + reach;
        const ey = topY - rise;
        branches.push(`M ${topX} ${topY + height * 0.08} Q ${topX + reach * 0.35} ${topY - rise * 0.55} ${ex} ${ey}`);
        crown.push({
          kind: 'circle',
          cx: ex,
          cy: ey - spread * 0.06,
          r: spread * 0.17 * crownGrown,
        });
      }
    } else {
      // Pads: a thick stem with arms that turn upwards.
      crown.push({
        kind: 'poly',
        points: padPoints(cx, baseY, height, size * 0.09 * crownGrown),
      });
      for (let i = 0; i < species.parts - 1; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const y = baseY - height * (0.45 + i * 0.22);
        const reach = spread * 0.34 * crownGrown;
        crown.push({
          kind: 'stroke',
          d: `M ${cx} ${y} L ${cx + side * reach} ${y} L ${cx + side * reach} ${y - height * 0.26}`,
          width: Math.max(3, size * 0.05) * crownGrown,
        });
      }
    }
  }

  if (decorGrown > 0 && species.decor !== 'none') {
    /*
     * Out at the edge of the crown, not buried in the middle of it.
     *
     * Blossom and fruit sit on the outside of a real tree, and a dot in the
     * centre of a flat mass of colour is a dot nobody sees — the first version
     * put seven of them inside the crown and they read as dirt.
     */
    const count = species.decor === 'star' ? 5 : 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 0.92 + (Math.PI * 1.16 * (i + 0.5)) / count;
      const distance = spread * (0.3 + wobble(i + 7) * 0.14);
      decor.push({
        cx: topX + Math.cos(angle) * distance,
        cy: topY - spread * 0.2 + Math.sin(angle) * distance * 0.72,
        r: (species.decor === 'fruit' ? size * 0.036 : size * 0.028) * decorGrown,
      });
    }
  }

  return { trunk, branches, crown, decor };
}

/** The saguaro's body — a rounded column rather than a tapered trunk. */
function padPoints(cx: number, baseY: number, height: number, halfWidth: number): string {
  const top = baseY - height;
  return `${cx - halfWidth},${baseY} ${cx - halfWidth},${top + halfWidth} ${cx},${top} ${cx + halfWidth},${top + halfWidth} ${cx + halfWidth},${baseY}`;
}

/** A small still tree, for the forest strip and the species picker. */
export function TreeChip({
  species,
  size = 44,
  wilted = false,
}: {
  species: string;
  size?: number;
  wilted?: boolean;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <FocusTree species={species} growth={1} size={size} wilted={wilted} sway={false} />
    </View>
  );
}
