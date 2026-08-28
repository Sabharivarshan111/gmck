import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme } from '@/theme';
import { hexToHsv, hsvToHex, onColor } from '@/theme/color';
import { typeScale } from '@/theme/typography';

/**
 * Pick any colour at all.
 *
 * Six pens cover what anybody annotating a diagram actually reaches for, and
 * they stay — a wheel is slower than a swatch every single time you already
 * know which pen you want. This is the way out of the six, not a replacement
 * for them.
 *
 * **It is drawn, not imported.** A hue wheel is twelve wedges, each a linear
 * gradient between two neighbouring hues, with white fading outwards from the
 * centre for saturation — thirteen SVG nodes, in a library the app already
 * ships. The colour-picker packages that do this bring a native module and a
 * megabyte with them, to draw a circle.
 *
 * Hue and saturation are the wheel; **value is a track underneath it**, because
 * there is no third axis on a disc and pretending otherwise is what makes
 * picker wheels feel imprecise. That split is what iOS and every serious
 * picker do.
 */

/*
 * Thirty-six wedges, not twelve.
 *
 * Each wedge is a linear gradient between two neighbouring hues, and a linear
 * ramp in RGB cuts a chord through the hue circle rather than following it —
 * the wider the wedge, the further it dips towards grey in the middle, which
 * shows up as a dark band down every sector. At ten degrees apiece the chord
 * and the arc are the same colour to the eye.
 */
const WEDGES = 36;

export function ColorWheel({
  value,
  onChange,
  size = 240,
}: {
  value: string;
  onChange: (hex: string) => void;
  size?: number;
}) {
  const { colors } = useTheme();
  const hsv = useMemo(() => hexToHsv(value), [value]);
  const radius = size / 2;

  /*
   * Live values through refs, and a responder built once.
   *
   * A drag writes a new colour on every frame; a responder rebuilt from the
   * current colour would be replaced mid-gesture by one that never saw the
   * grant. That is the same bug the home-block resize and the media scrubber
   * both had, and this is the same fix.
   */
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pick = useCallback(
    (x: number, y: number) => {
      const dx = x - radius;
      const dy = y - radius;
      const distance = Math.hypot(dx, dy);
      // Past the rim the finger still means "this hue, fully saturated", which
      // is what a rubber band would do and what everyone expects.
      const saturation = Math.min(1, distance / radius);
      // atan2 gives -180..180 from the positive x axis; hue is clockwise from
      // the same place, so this is a wrap rather than a rotation.
      const hue = (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360;
      onChangeRef.current(hsvToHex({ h: hue, s: saturation, v: hsvRef.current.v }));
    },
    [radius],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: event =>
          pick(event.nativeEvent.locationX, event.nativeEvent.locationY),
        onPanResponderMove: event =>
          pick(event.nativeEvent.locationX, event.nativeEvent.locationY),
      }),
    [pick],
  );

  const wedges = useMemo(() => {
    const out: {
      d: string;
      from: string;
      to: string;
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }[] = [];
    const step = 360 / WEDGES;
    for (let i = 0; i < WEDGES; i++) {
      const start = i * step;
      const end = start + step;
      // A hair of overlap, or antialiasing leaves a seam between every wedge.
      const a = point(radius, start - 0.6);
      const b = point(radius, end + 0.6);
      out.push({
        id: `w${i}`,
        d: `M ${radius} ${radius} L ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y} Z`,
        from: hsvToHex({ h: start, s: 1, v: 1 }),
        to: hsvToHex({ h: end % 360, s: 1, v: 1 }),
        /*
         * The ramp runs from one rim corner to the other — *along the arc*.
         *
         * A gradient declared in bounding-box units runs left to right whatever
         * angle the wedge sits at, so a wedge at the top of the wheel ramped
         * sideways across itself. The result was a spoke down the middle of
         * every sector: more wedges made it worse, not better.
         */
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
      });
    }
    return out;

    function point(r: number, degrees: number) {
      const radians = (degrees * Math.PI) / 180;
      return { x: radius + r * Math.cos(radians), y: radius + r * Math.sin(radians) };
    }
  }, [radius]);

  const marker = useMemo(() => {
    const radians = (hsv.h * Math.PI) / 180;
    return {
      x: radius + hsv.s * radius * Math.cos(radians),
      y: radius + hsv.s * radius * Math.sin(radians),
    };
  }, [hsv.h, hsv.s, radius]);

  return (
    <View style={styles.column}>
      <View
        style={{ width: size, height: size, alignSelf: 'center' }}
        accessibilityLabel="Colour wheel"
        {...responder.panHandlers}>
        <Svg width={size} height={size}>
          <Defs>
            {wedges.map(wedge => (
              <LinearGradient
                key={wedge.id}
                id={wedge.id}
                x1={wedge.x1}
                y1={wedge.y1}
                x2={wedge.x2}
                y2={wedge.y2}
                gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={wedge.from} />
                <Stop offset="1" stopColor={wedge.to} />
              </LinearGradient>
            ))}
            {/* Saturation: white at the centre, gone at the rim. */}
            <RadialGradient id="sat" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {wedges.map(wedge => (
            <Path key={wedge.id} d={wedge.d} fill={`url(#${wedge.id})`} />
          ))}
          <Circle cx={radius} cy={radius} r={radius} fill="url(#sat)" />
          {/* Value, as a wash of black over the whole disc. */}
          <Circle cx={radius} cy={radius} r={radius} fill="#000000" opacity={1 - hsv.v} />
          {/* The marker is a ring, not a dot: a dot hides the colour it is
              pointing at, which is the one thing being looked at. */}
          <Circle
            cx={marker.x}
            cy={marker.y}
            r={11}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={3}
          />
          <Circle
            cx={marker.x}
            cy={marker.y}
            r={11}
            fill="none"
            stroke="#00000055"
            strokeWidth={1}
          />
        </Svg>
      </View>

      <ValueTrack
        hsv={hsv}
        onChange={next => onChange(hsvToHex({ ...hsv, v: next }))}
        width={size}
      />

      <View style={styles.row}>
        <View style={[styles.preview, { backgroundColor: value, borderColor: colors.border }]}>
          <Text style={[styles.hex, { color: onColor(value) }]}>{value.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * How light or dark, as a track under the wheel.
 *
 * Its own component so the wheel's responder is not rebuilt when the value
 * changes, and so the gradient it shows is the *current* hue — a black-to-white
 * ramp would say nothing about what you are actually about to pick.
 */
function ValueTrack({
  hsv,
  onChange,
  width,
}: {
  hsv: { h: number; s: number; v: number };
  onChange: (value: number) => void;
  width: number;
}) {
  const { colors } = useTheme();
  const [track, setTrack] = useState(width);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const trackRef = useRef(track);
  trackRef.current = track;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: event =>
          onChangeRef.current(clamp01(event.nativeEvent.locationX / trackRef.current)),
        onPanResponderMove: event =>
          onChangeRef.current(clamp01(event.nativeEvent.locationX / trackRef.current)),
      }),
    [],
  );

  const full = hsvToHex({ h: hsv.h, s: hsv.s, v: 1 });

  return (
    <View
      accessibilityLabel="Lightness"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(hsv.v * 100) }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsv.v * 100)}
      onLayout={event => setTrack(event.nativeEvent.layout.width)}
      style={styles.track}
      {...responder.panHandlers}>
      <Svg width="100%" height={26}>
        <Defs>
          <LinearGradient id="val" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#000000" />
            <Stop offset="1" stopColor={full} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="26" rx="13" fill="url(#val)" />
      </Svg>
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          { left: Math.max(0, Math.min(track - 22, hsv.v * track - 11)), borderColor: colors.text },
        ]}
      />
    </View>
  );
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * The swatch that opens the wheel.
 *
 * It shows the wheel rather than the colour currently chosen, because it is
 * the way *to* the wheel; the chosen custom colour gets a swatch of its own
 * beside the fixed pens.
 */
export function WheelSwatch({ onPress, size = 34 }: { onPress: () => void; size?: number }) {
  const wedges = useMemo(() => {
    const out: { d: string; fill: string; id: string }[] = [];
    const r = size / 2;
    const step = 360 / 8;
    for (let i = 0; i < 8; i++) {
      const start = i * step;
      const end = start + step + 0.6;
      const a = { x: r + r * Math.cos((start * Math.PI) / 180), y: r + r * Math.sin((start * Math.PI) / 180) };
      const b = { x: r + r * Math.cos((end * Math.PI) / 180), y: r + r * Math.sin((end * Math.PI) / 180) };
      out.push({
        id: `s${i}`,
        d: `M ${r} ${r} L ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y} Z`,
        fill: hsvToHex({ h: start + step / 2, s: 0.9, v: 1 }),
      });
    }
    return out;
  }, [size]);

  return (
    <Touchable onPress={onPress} label="Any colour" hint="Opens a colour wheel" scaleTo={0.88}>
      <Svg width={size} height={size}>
        {wedges.map(wedge => (
          <Path key={wedge.id} d={wedge.d} fill={wedge.fill} />
        ))}
      </Svg>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  track: {
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
  },
  preview: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hex: {
    ...typeScale.caption,
    fontWeight: '700',
  },
});
