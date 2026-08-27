import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Check, Eraser, Pen, Undo2, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { onColor } from '@/theme/color';

/**
 * Drawing over a picture — a diagram annotated, a page marked up.
 *
 * **Built on `react-native-svg`, which this app already ships.** A stroke is a
 * `<Path>`; the picture behind it is an `<Image>`. Skia would be the other
 * answer and it is megabytes of native library for what is, here, a polyline
 * over a photograph. Nothing about a pen mark needs a GPU canvas.
 *
 * **Palm rejection is real, not a heuristic.** Android reports the tool that
 * produced a touch, and React Native's pointer events carry it through as
 * `pointerType` — `'pen'` for a stylus, `'touch'` for a finger. So once a pen
 * has been seen on this canvas, finger pointers stop drawing entirely: rest
 * your hand on the screen and nothing happens, which is the whole reason to
 * use a stylus on a phone. Guessing from pressure or contact size is what
 * other apps do, and it is why their palm rejection works on one handset and
 * not the next.
 *
 * A phone with no stylus is unaffected — no pen is ever seen, so fingers draw.
 */

export interface Stroke {
  /** SVG path data, built as the pointer moves. */
  d: string;
  color: string;
  width: number;
}

/** The pens. Bright, because they sit on top of somebody's photograph. */
export const INKS = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#FFFFFF', '#111827'];

const WIDTHS = [2, 4, 8];

export function DrawCanvas({
  uri,
  onCancel,
  onDone,
}: {
  /** The picture being drawn on. */
  uri: string;
  onCancel: () => void;
  /** The finished strokes, for the caller to keep beside the picture. */
  onDone: (strokes: Stroke[], size: { width: number; height: number }) => void;
}) {
  const { colors } = useTheme();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [ink, setInk] = useState(INKS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [erasing, setErasing] = useState(false);
  /** The space the board may occupy, measured. */
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  /** The picture's own shape, which the board has to match — see `board`. */
  const [aspect, setAspect] = useState(0);

  useEffect(() => {
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (alive && h > 0) {
          setAspect(w / h);
        }
      },
      // A picture that will not measure still has to be drawable, so fall back
      // to the space available rather than leaving the board at nothing.
      () => {
        if (alive) {
          setAspect(-1);
        }
      },
    );
    return () => {
      alive = false;
    };
  }, [uri]);

  /**
   * The drawing surface is the picture's box, not the screen's.
   *
   * The marks are saved as geometry against this box and replayed over the
   * picture elsewhere by an SVG `viewBox`, which fits them the same way
   * `resizeMode="contain"` fits the photograph. Those two only land on top of
   * each other while the box and the picture have the *same shape* — draw on a
   * tall screen against a wide photo and every mark comes back stretched and
   * offset from the thing it was pointing at.
   */
  const board = useMemo(() => {
    if (frame.width <= 0 || frame.height <= 0) {
      return { width: 0, height: 0 };
    }
    if (aspect <= 0) {
      return frame;
    }
    return frame.width / frame.height > aspect
      ? { width: frame.height * aspect, height: frame.height }
      : { width: frame.width, height: frame.width / aspect };
  }, [aspect, frame]);

  /**
   * The stroke being drawn.
   *
   * It is held in a ref *and* in state: the ref is the truth, the state is
   * what draws it. Committing used to read the stroke inside `setLive`'s
   * updater and call `setStrokes` from in there — a state update raised during
   * another component's render pass, which React is entitled to discard, and
   * did: the first stroke of a session landed and the second silently did not.
   */
  const liveRef = useRef<Stroke | null>(null);
  const [live, setLive] = useState<Stroke | null>(null);
  const drawing = useRef(false);

  /**
   * Whether a stylus has ever touched this canvas.
   *
   * Once it has, fingers are palm. Sticky rather than per-stroke because a
   * palm usually lands *before* the nib does, and a rule that only applies
   * while the pen is already down would let that first heel-of-the-hand mark
   * straight through.
   */
  const penSeen = useRef(false);

  /**
   * Whether pointer events reach this canvas at all.
   *
   * They are enabled in MainApplication and should always be there — but a
   * canvas that silently does nothing is the worst possible failure for a
   * drawing tool, so the touch handlers below stand in if they never arrive.
   * Once one pointer event lands, touch stops claiming the responder and the
   * two can never both draw.
   */
  const sawPointer = useRef(false);

  const accepts = useCallback((pointerType: string) => {
    if (pointerType === 'pen') {
      penSeen.current = true;
      return true;
    }
    if (pointerType === 'mouse') {
      return true;
    }
    return !penSeen.current;
  }, []);

  const begin = useCallback(
    (x: number, y: number) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      drawing.current = true;
      liveRef.current = { d: `M ${x.toFixed(1)} ${y.toFixed(1)}`, color: ink, width };
      setLive(liveRef.current);
    },
    [ink, width],
  );

  const extend = useCallback((x: number, y: number) => {
    const current = liveRef.current;
    if (!drawing.current || !current || !Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }
    liveRef.current = { ...current, d: `${current.d} L ${x.toFixed(1)} ${y.toFixed(1)}` };
    setLive(liveRef.current);
  }, []);

  const finish = useCallback(() => {
    drawing.current = false;
    const current = liveRef.current;
    liveRef.current = null;
    setLive(null);
    // A tap with no movement is not a mark. Without this, every stray touch on
    // the picture would leave an invisible zero-length stroke behind for the
    // eraser and the undo button to work through.
    if (current && current.d.includes('L')) {
      setStrokes(all => [...all, current]);
    }
  }, []);

  /**
   * Rubbing out removes whole strokes, not pixels.
   *
   * A pixel eraser needs a bitmap and a second render target; a stroke eraser
   * needs a hit test, and on an annotation — a circle round a structure, an
   * arrow, a word — removing the mark you touched is what was wanted anyway.
   */
  const rubOut = useCallback((x: number, y: number) => {
    setStrokes(all => {
      for (let i = all.length - 1; i >= 0; i--) {
        if (nearStroke(all[i], x, y)) {
          return all.filter((_, index) => index !== i);
        }
      }
      return all;
    });
  }, []);

  const pointer = useMemo(
    () => ({
      onPointerDown: (event: { nativeEvent: { pointerType: string; locationX?: number; locationY?: number; offsetX?: number; offsetY?: number } }) => {
        sawPointer.current = true;
        const { pointerType } = event.nativeEvent;
        if (!accepts(pointerType)) {
          return;
        }
        const x = event.nativeEvent.offsetX ?? event.nativeEvent.locationX ?? 0;
        const y = event.nativeEvent.offsetY ?? event.nativeEvent.locationY ?? 0;
        if (erasing) {
          rubOut(x, y);
          return;
        }
        begin(x, y);
      },
      onPointerMove: (event: { nativeEvent: { pointerType: string; locationX?: number; locationY?: number; offsetX?: number; offsetY?: number } }) => {
        if (!accepts(event.nativeEvent.pointerType)) {
          return;
        }
        const x = event.nativeEvent.offsetX ?? event.nativeEvent.locationX ?? 0;
        const y = event.nativeEvent.offsetY ?? event.nativeEvent.locationY ?? 0;
        if (erasing) {
          rubOut(x, y);
          return;
        }
        extend(x, y);
      },
      onPointerUp: finish,
      onPointerCancel: finish,
    }),
    [accepts, begin, erasing, extend, finish, rubOut],
  );

  /** See `sawPointer`: this only ever runs where pointer events are absent. */
  const touchFallback = useMemo(
    () => ({
      onStartShouldSetResponder: () => !sawPointer.current,
      onMoveShouldSetResponder: () => !sawPointer.current,
      onResponderGrant: (event: { nativeEvent: { locationX: number; locationY: number } }) => {
        const { locationX, locationY } = event.nativeEvent;
        if (erasing) {
          rubOut(locationX, locationY);
          return;
        }
        begin(locationX, locationY);
      },
      onResponderMove: (event: { nativeEvent: { locationX: number; locationY: number } }) => {
        const { locationX, locationY } = event.nativeEvent;
        if (erasing) {
          rubOut(locationX, locationY);
          return;
        }
        extend(locationX, locationY);
      },
      onResponderRelease: finish,
      onResponderTerminate: finish,
    }),
    [begin, erasing, extend, finish, rubOut],
  );

  const undo = () => setStrokes(all => all.slice(0, -1));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Touchable onPress={onCancel} label="Discard this drawing" scaleTo={0.85} hitSlop={12}>
          <X size={22} color={colors.text} />
        </Touchable>
        <Text style={[styles.title, { color: colors.text }]}>Draw on the picture</Text>
        <Touchable
          onPress={() => onDone(strokes, board)}
          label="Keep this drawing"
          scaleTo={0.95}
          style={[styles.save, { backgroundColor: colors.primary }]}>
          <Check size={16} color={colors.primaryText} />
          <Text style={{ color: colors.primaryText, fontWeight: '700' }}>Keep</Text>
        </Touchable>
      </View>

      <View
        style={styles.stage}
        onLayout={(event: LayoutChangeEvent) => setFrame(event.nativeEvent.layout)}>
        <View
          testID="draw-stage"
          accessibilityLabel="Drawing area"
          style={[styles.board, board]}
          {...touchFallback}
          {...pointer}>
        <Image source={{ uri }} style={styles.picture} resizeMode="contain" />
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          pointerEvents="none">
          {strokes.map((stroke, index) => (
            <Path
              key={index}
              d={stroke.d}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {live ? (
            <Path
              d={live.d}
              stroke={live.color}
              strokeWidth={live.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
        </Svg>
        </View>
      </View>

      <View style={styles.tools}>
        {INKS.map(colour => (
          <Touchable
            key={colour}
            onPress={() => {
              setInk(colour);
              setErasing(false);
            }}
            label={`${NAMES[colour] ?? 'Ink'} pen`}
            state={{ selected: !erasing && ink === colour }}
            scaleTo={0.88}
            style={[
              styles.swatch,
              { backgroundColor: colour },
              !erasing && ink === colour && { borderColor: colors.text, borderWidth: 2.5 },
            ]}>
            {!erasing && ink === colour ? <Pen size={13} color={onColor(colour)} /> : null}
          </Touchable>
        ))}
      </View>

      <View style={styles.tools}>
        {WIDTHS.map(size_ => (
          <Touchable
            key={size_}
            onPress={() => {
              setWidth(size_);
              setErasing(false);
            }}
            label={`${size_ === 2 ? 'Thin' : size_ === 4 ? 'Medium' : 'Thick'} pen`}
            state={{ selected: !erasing && width === size_ }}
            scaleTo={0.88}
            style={[
              styles.toolButton,
              {
                backgroundColor: !erasing && width === size_ ? colors.accent : colors.cardElevated,
                borderColor: colors.border,
              },
            ]}>
            <View
              style={{
                width: size_ * 2.2,
                height: size_ * 2.2,
                borderRadius: size_ * 1.1,
                backgroundColor: !erasing && width === size_ ? onColor(colors.accent) : colors.text,
              }}
            />
          </Touchable>
        ))}

        <Touchable
          onPress={() => setErasing(current => !current)}
          label="Rub out a mark"
          hint="Tap a line to remove it"
          state={{ selected: erasing }}
          scaleTo={0.88}
          style={[
            styles.toolButton,
            {
              backgroundColor: erasing ? colors.accent : colors.cardElevated,
              borderColor: colors.border,
            },
          ]}>
          <Eraser size={17} color={erasing ? onColor(colors.accent) : colors.text} />
        </Touchable>

        <Touchable
          onPress={undo}
          disabled={strokes.length === 0}
          label="Undo the last mark"
          scaleTo={0.88}
          style={[
            styles.toolButton,
            {
              backgroundColor: colors.cardElevated,
              borderColor: colors.border,
              opacity: strokes.length === 0 ? 0.4 : 1,
            },
          ]}>
          <Undo2 size={17} color={colors.text} />
        </Touchable>

        <View style={styles.grow} />
        <Text style={[styles.hint, { color: withAlpha(colors.text, 0.45) }]}>
          {penSeen.current ? 'Stylus · palm ignored' : 'Finger or stylus'}
        </Text>
      </View>
    </View>
  );
}

const NAMES: Record<string, string> = {
  '#EF4444': 'Red',
  '#F59E0B': 'Amber',
  '#22C55E': 'Green',
  '#3B82F6': 'Blue',
  '#FFFFFF': 'White',
  '#111827': 'Black',
};

/**
 * Is this point on that stroke?
 *
 * Walks the path's own points rather than measuring a curve: the strokes are
 * polylines, so the points *are* the geometry, and a 20-point tolerance is a
 * fingertip.
 */
export function nearStroke(stroke: Stroke, x: number, y: number, tolerance = 20): boolean {
  const points = stroke.d.match(/-?\d+(?:\.\d+)?\s-?\d+(?:\.\d+)?/g) ?? [];
  for (const point of points) {
    const [px, py] = point.split(/\s+/).map(Number);
    if (Math.abs(px - x) <= tolerance && Math.abs(py - y) <= tolerance) {
      return true;
    }
  }
  return false;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  title: {
    ...typeScale.title3,
    flex: 1,
  },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stage: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  picture: {
    width: '100%',
    height: '100%',
  },
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: {
    flex: 1,
  },
  hint: {
    ...typeScale.caption,
  },
});
