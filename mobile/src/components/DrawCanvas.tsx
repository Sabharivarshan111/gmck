import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';
import {
  AlignJustify,
  Check,
  Eraser,
  Grid3x3,
  Hand,
  Highlighter,
  PenLine,
  Square,
  Undo2,
  X,
} from 'lucide-react-native';
import { ColorWheel, WheelSwatch } from '@/components/ColorWheel';
import { Sheet } from '@/components/Sheet';
import { Slider } from '@/components/Slider';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { isDark, onColor } from '@/theme/color';
import type { NoteInk, NoteInkStroke } from '@/lib/noteImages';

/**
 * Drawing over a picture, or on a page of its own.
 *
 * **Built on `react-native-svg`, which this app already ships.** A stroke is a
 * `<Path>`; the picture behind it is an `<Image>`. Skia would be the other
 * answer and it is megabytes of native library for what is, here, a polyline
 * over a photograph. Nothing about a pen mark needs a GPU canvas.
 *
 * **Palm rejection is real, not a heuristic.** Android reports the tool that
 * produced a touch, and React Native's pointer events carry it through as
 * `pointerType` — `'pen'` for a stylus, `'touch'` for a finger. So once a pen
 * has been seen on this canvas, finger pointers stop drawing: rest your hand
 * on the screen and nothing happens, which is the whole reason to use a stylus
 * on a phone. Guessing from pressure or contact size is what other apps do,
 * and it is why their palm rejection works on one handset and not the next.
 *
 * A phone with no stylus is unaffected — no pen is ever seen, so fingers draw.
 */

export type Stroke = NoteInkStroke;

/** The pens. Bright, because they sit on top of somebody's photograph. */
export const INKS = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#FFFFFF', '#111827'];

const WIDTHS = [2, 4, 8];

/**
 * A highlighter is the same stroke, wider and see-through.
 *
 * Not a second kind of object: one multiplier and one alpha is the whole of
 * it, and every part of the app that replays ink gets highlighting for free.
 * The alpha is what makes it a highlighter rather than a fat pen — the writing
 * underneath has to stay readable through it, which is the entire point of
 * marking something rather than covering it.
 */
const HIGHLIGHT_SCALE = 7;
const HIGHLIGHT_ALPHA = 0.45;

/** How a blank page is ruled. Nothing for a picture — it has its own ground. */
const PAPERS = ['plain', 'lined', 'grid'] as const;
type Paper = (typeof PAPERS)[number];
/** Ruling every 34 units of the board's width, which is a line you can write on. */
const RULE = 34;

type Tool = 'pen' | 'highlighter' | 'eraser';

export function DrawCanvas({
  uri,
  initial,
  onCancel,
  onDone,
}: {
  /**
   * The picture being drawn on, or nothing for a blank page.
   *
   * A page is not a second feature: it is the same canvas with no photograph
   * under it, which is what "write it by hand" needs. Drawing was only ever
   * reachable from an attached picture, so someone who wanted to write a
   * diagram out with a stylus had to photograph something first.
   */
  uri?: string | null;
  /**
   * What is already drawn here, so opening the pen again continues the work
   * instead of starting a blank canvas over it.
   *
   * Without this, the second visit showed nothing and `onDone` replaced the
   * first drawing with whatever was made on the empty canvas — the marks were
   * still on the thumbnail right up until they were silently overwritten.
   */
  initial?: NoteInk | null;
  onCancel: () => void;
  /** The finished strokes, for the caller to keep beside the picture. */
  onDone: (strokes: Stroke[], size: { width: number; height: number }, paper: string) => void;
}) {
  const { colors } = useTheme();
  /*
   * The screen is edge to edge, so the header has to step around the status
   * bar itself.
   *
   * It did not, and the title and the Keep button were drawn *underneath* the
   * clock and the battery — the one control that finishes the drawing, sitting
   * behind the system's own pixels. Every other full-screen page in this app
   * already pads by `insets.top`; this one was written as a bare `<Modal>` and
   * missed it.
   */
  const insets = useSafeAreaInsets();

  /*
   * A photograph brings its own ground, so the board behind it is black and
   * the first pen is red — a mark that reads on anything. A blank page has to
   * *be* the paper, so it takes the theme's card colour and the first pen is
   * whichever of black or white can be seen on it. Defaulting to red ink on a
   * page would be a page nobody would choose to write on.
   */
  const paperColor = uri ? '#000000' : colors.card;
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // One of INKS, not a bare hex, or the chosen pen matches no swatch and the
  // row opens with nothing selected.
  const [ink, setInk] = useState(uri ? INKS[0] : isDark(colors.card) ? '#FFFFFF' : '#111827');
  const [width, setWidth] = useState(WIDTHS[1]);
  const [tool, setTool] = useState<Tool>('pen');
  /**
   * A colour the reader mixed, kept beside the six pens rather than instead of
   * them. Six covers what anyone reaches for when annotating a diagram, and a
   * wheel is slower than a swatch every time you already know the pen you want.
   */
  const [custom, setCustom] = useState<string | null>(null);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [eraserOpen, setEraserOpen] = useState(false);
  /**
   * How the rubber works.
   *
   * **Stroke** takes the whole mark you touch — right for an annotation, where
   * the mark *is* the thing: a circle round a structure, an arrow, a word.
   * **Area** takes only what is under the rubber, which is what a rubber does
   * and the only way to take the middle out of a long line.
   *
   * Stroke is the default because it is one tap to undo a mark, and because
   * that is the behaviour this canvas has always had.
   */
  const [eraseMode, setEraseMode] = useState<'stroke' | 'area'>('stroke');
  const [eraseSize, setEraseSize] = useState(16);
  const [eraseHighlightOnly, setEraseHighlightOnly] = useState(false);
  const [paper, setPaper] = useState<Paper>((initial?.paper as Paper) ?? 'plain');
  /** The space the board may occupy, measured. */
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  /** The picture's own shape, which the board has to match — see `board`. */
  const [aspect, setAspect] = useState(0);

  useEffect(() => {
    let alive = true;
    if (initial) {
      // Existing marks decide the shape, so the board they were recorded
      // against and the board being drawn on now are the same one.
      setAspect(initial.width / initial.height);
      return;
    }
    if (!uri) {
      // A page has no shape of its own, so it takes the shape of the space.
      setAspect(-1);
      return;
    }
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
  }, [initial, uri]);

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
   * …unless the reader asks for fingers back.
   *
   * Automatic is right by default — nobody should have to find a setting to
   * stop their palm drawing. But a stylus put down mid-note leaves the canvas
   * refusing every touch, with no way back short of leaving the page, so the
   * rule is stated on screen and can be turned off where it is stated.
   */
  const [fingerDrawing, setFingerDrawing] = useState(true);
  const [penEver, setPenEver] = useState(false);

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

  const accepts = useCallback(
    (pointerType: string) => {
      if (pointerType === 'pen') {
        penSeen.current = true;
        setPenEver(true);
        return true;
      }
      if (pointerType === 'mouse') {
        return true;
      }
      return !penSeen.current || fingerDrawing;
    },
    [fingerDrawing],
  );

  const begin = useCallback(
    (x: number, y: number) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      drawing.current = true;
      liveRef.current = {
        d: `M ${x.toFixed(1)} ${y.toFixed(1)}`,
        color: ink,
        width: tool === 'highlighter' ? width * HIGHLIGHT_SCALE : width,
        ...(tool === 'highlighter' ? { opacity: HIGHLIGHT_ALPHA } : null),
      };
      setLive(liveRef.current);
    },
    [ink, tool, width],
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
  const rubOut = useCallback(
    (x: number, y: number) => {
      setStrokes(all => {
        const mine = (stroke: Stroke) => !eraseHighlightOnly || !!stroke.opacity;
        if (eraseMode === 'stroke') {
          for (let i = all.length - 1; i >= 0; i--) {
            if (mine(all[i]) && nearStroke(all[i], x, y)) {
              return all.filter((_, index) => index !== i);
            }
          }
          return all;
        }
        let changed = false;
        const next: Stroke[] = [];
        for (const stroke of all) {
          if (!mine(stroke)) {
            next.push(stroke);
            continue;
          }
          const pieces = eraseArea(stroke, x, y, eraseSize / 2);
          if (pieces.length !== 1 || pieces[0].d !== stroke.d) {
            changed = true;
          }
          next.push(...pieces);
        }
        return changed ? next : all;
      });
    },
    [eraseHighlightOnly, eraseMode, eraseSize],
  );

  const at = useCallback(
    (x: number, y: number, down: boolean) => {
      if (tool === 'eraser') {
        rubOut(x, y);
        return;
      }
      if (down) {
        begin(x, y);
      } else {
        extend(x, y);
      }
    },
    [begin, extend, rubOut, tool],
  );

  const pointer = useMemo(
    () => ({
      onPointerDown: (event: {
        nativeEvent: {
          pointerType: string;
          locationX?: number;
          locationY?: number;
          offsetX?: number;
          offsetY?: number;
        };
      }) => {
        sawPointer.current = true;
        if (!accepts(event.nativeEvent.pointerType)) {
          return;
        }
        at(
          event.nativeEvent.offsetX ?? event.nativeEvent.locationX ?? 0,
          event.nativeEvent.offsetY ?? event.nativeEvent.locationY ?? 0,
          true,
        );
      },
      onPointerMove: (event: {
        nativeEvent: {
          pointerType: string;
          locationX?: number;
          locationY?: number;
          offsetX?: number;
          offsetY?: number;
        };
      }) => {
        if (!accepts(event.nativeEvent.pointerType)) {
          return;
        }
        at(
          event.nativeEvent.offsetX ?? event.nativeEvent.locationX ?? 0,
          event.nativeEvent.offsetY ?? event.nativeEvent.locationY ?? 0,
          false,
        );
      },
      onPointerUp: finish,
      onPointerCancel: finish,
    }),
    [accepts, at, finish],
  );

  /** See `sawPointer`: this only ever runs where pointer events are absent. */
  const touchFallback = useMemo(
    () => ({
      onStartShouldSetResponder: () => !sawPointer.current,
      onMoveShouldSetResponder: () => !sawPointer.current,
      onResponderGrant: (event: { nativeEvent: { locationX: number; locationY: number } }) =>
        at(event.nativeEvent.locationX, event.nativeEvent.locationY, true),
      onResponderMove: (event: { nativeEvent: { locationX: number; locationY: number } }) =>
        at(event.nativeEvent.locationX, event.nativeEvent.locationY, false),
      onResponderRelease: finish,
      onResponderTerminate: finish,
    }),
    [at, finish],
  );

  /**
   * Lay the existing marks onto this board.
   *
   * They were recorded against a board of their own size; the aspect is the
   * same by construction above, so one factor maps every coordinate — and the
   * pen widths with them, or a thick line reopened on a bigger screen comes
   * back hairline.
   */
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !initial || board.width <= 0) {
      return;
    }
    seeded.current = true;
    const factor = board.width / (initial.width || 1);
    setStrokes(
      initial.strokes.map(stroke => ({
        ...stroke,
        d: scalePath(stroke.d, factor),
        width: stroke.width * factor,
      })),
    );
  }, [board.width, initial]);

  const undo = () => setStrokes(all => all.slice(0, -1));

  /*
   * Highlighter marks are drawn first, whatever order they were made in.
   *
   * A highlighter goes *under* writing — that is what makes it legible
   * through the colour. Drawing them in stroke order means marking a word you
   * already wrote puts a wash over the word.
   */
  const ordered = useMemo(
    () => [...strokes].sort((a, b) => (a.opacity ? 0 : 1) - (b.opacity ? 0 : 1)),
    [strokes],
  );

  const tools: { key: Tool; label: string; icon: React.ReactNode }[] = [
    { key: 'pen', label: 'Pen', icon: <PenLine size={17} color={toolInk(tool === 'pen')} /> },
    {
      key: 'highlighter',
      label: 'Highlighter',
      icon: <Highlighter size={17} color={toolInk(tool === 'highlighter')} />,
    },
    {
      key: 'eraser',
      label: 'Rub out a mark',
      icon: <Eraser size={17} color={toolInk(tool === 'eraser')} />,
    },
  ];

  function toolInk(selected: boolean) {
    return selected ? onColor(colors.accent) : colors.text;
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 10,
        },
      ]}>
      <View style={styles.header}>
        <Touchable onPress={onCancel} label="Discard this drawing" scaleTo={0.85} hitSlop={12}>
          <X size={22} color={colors.text} />
        </Touchable>
        <Text style={[styles.title, { color: colors.text }]}>
          {uri ? 'Draw on the picture' : 'Write or draw'}
        </Text>
        {!uri ? (
          <Touchable
            onPress={() => setPaper(current => PAPERS[(PAPERS.indexOf(current) + 1) % PAPERS.length])}
            label={`Paper: ${paper}`}
            hint="Plain, lined or squared"
            scaleTo={0.88}
            hitSlop={8}
            style={[styles.paperButton, { borderColor: colors.border }]}>
            {paper === 'grid' ? (
              <Grid3x3 size={15} color={colors.text} />
            ) : paper === 'lined' ? (
              <AlignJustify size={15} color={colors.text} />
            ) : (
              <Square size={15} color={colors.text} />
            )}
            <Text style={[styles.paperLabel, { color: colors.text }]}>{PAPER_NAME[paper]}</Text>
          </Touchable>
        ) : null}
        <Touchable
          onPress={() => onDone(strokes, board, paper)}
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
          style={[styles.board, board, { backgroundColor: paperColor }]}
          {...touchFallback}
          {...pointer}>
          {uri ? <Image source={{ uri }} style={styles.picture} resizeMode="contain" /> : null}
          <Svg
            style={StyleSheet.absoluteFill}
            width="100%"
            height="100%"
            pointerEvents="none">
            {!uri ? <Ruling paper={paper} board={board} colors={colors} /> : null}
            {ordered.map((stroke, index) => (
              <Path
                key={index}
                d={stroke.d}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeOpacity={stroke.opacity ?? 1}
                strokeLinecap={stroke.opacity ? 'butt' : 'round'}
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {live ? (
              <Path
                d={live.d}
                stroke={live.color}
                strokeWidth={live.width}
                strokeOpacity={live.opacity ?? 1}
                strokeLinecap={live.opacity ? 'butt' : 'round'}
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
              if (tool === 'eraser') {
                setTool('pen');
              }
            }}
            label={`${NAMES[colour] ?? 'Ink'} pen`}
            state={{ selected: tool !== 'eraser' && ink === colour }}
            scaleTo={0.88}
            style={[
              styles.swatch,
              { backgroundColor: colour },
              tool !== 'eraser' && ink === colour && { borderColor: colors.text, borderWidth: 2.5 },
            ]}>
            {tool !== 'eraser' && ink === colour ? (
              <PenLine size={13} color={onColor(colour)} />
            ) : null}
          </Touchable>
        ))}

        {/* The way out of the six. It shows the wheel until a colour has been
            mixed, then shows that colour with the wheel around it. */}
        {custom ? (
          <Touchable
            onPress={() => setWheelOpen(true)}
            label="Your colour"
            hint="Tap to mix another"
            state={{ selected: tool !== 'eraser' && ink === custom }}
            scaleTo={0.88}
            style={[
              styles.swatch,
              { backgroundColor: custom },
              tool !== 'eraser' && ink === custom && { borderColor: colors.text, borderWidth: 2.5 },
            ]}>
            <PenLine size={12} color={onColor(custom)} />
          </Touchable>
        ) : (
          <WheelSwatch onPress={() => setWheelOpen(true)} size={30} />
        )}

        <View style={styles.grow} />

        {/*
          The palm rule, said where it applies — and turned off there too.

          It is a sentence rather than a switch until a stylus has actually
          been used, because before then there is nothing to explain.
        */}
        <Touchable
          onPress={() => setFingerDrawing(on => !on)}
          disabled={!penEver}
          label={
            penEver
              ? fingerDrawing
                ? 'Ignore my palm while I use the stylus'
                : 'Let me draw with a finger again'
              : 'Finger or stylus, both draw'
          }
          state={{ selected: penEver && !fingerDrawing }}
          scaleTo={0.92}
          style={[
            styles.finger,
            {
              backgroundColor: penEver && !fingerDrawing ? colors.accent : 'transparent',
              borderColor: colors.border,
            },
          ]}>
          <Hand
            size={13}
            color={
              penEver && !fingerDrawing ? onColor(colors.accent) : withAlpha(colors.text, 0.55)
            }
          />
          <Text
            style={[
              styles.hint,
              {
                color:
                  penEver && !fingerDrawing ? onColor(colors.accent) : withAlpha(colors.text, 0.55),
              },
            ]}>
            {penEver ? (fingerDrawing ? 'Finger on' : 'Palm ignored') : 'Finger or stylus'}
          </Text>
        </Touchable>
      </View>

      <View style={styles.tools}>
        {tools.map(one => (
          <Touchable
            key={one.key}
            onPress={() => {
              // Tapping the rubber again opens how it rubs, which is where
              // every drawing app puts it and where it was looked for.
              if (one.key === 'eraser' && tool === 'eraser') {
                setEraserOpen(true);
                return;
              }
              setTool(one.key);
            }}
            label={one.label}
            hint={one.key === 'eraser' ? 'Tap again for whole marks or a rubber' : undefined}
            state={{ selected: tool === one.key }}
            scaleTo={0.88}
            style={[
              styles.toolButton,
              {
                backgroundColor: tool === one.key ? colors.accent : colors.cardElevated,
                borderColor: colors.border,
              },
            ]}>
            {one.icon}
          </Touchable>
        ))}

        <View style={styles.divider} />

        {WIDTHS.map(size_ => (
          <Touchable
            key={size_}
            onPress={() => {
              setWidth(size_);
              if (tool === 'eraser') {
                setTool('pen');
              }
            }}
            label={`${size_ === 2 ? 'Thin' : size_ === 4 ? 'Medium' : 'Thick'} pen`}
            state={{ selected: tool !== 'eraser' && width === size_ }}
            scaleTo={0.88}
            style={[
              styles.toolButton,
              {
                backgroundColor:
                  tool !== 'eraser' && width === size_ ? colors.accent : colors.cardElevated,
                borderColor: colors.border,
              },
            ]}>
            <View
              style={{
                width: size_ * 2.2,
                height: size_ * 2.2,
                borderRadius: size_ * 1.1,
                backgroundColor:
                  tool !== 'eraser' && width === size_ ? onColor(colors.accent) : colors.text,
              }}
            />
          </Touchable>
        ))}

        <View style={styles.divider} />

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
      </View>

      <Sheet visible={wheelOpen} onClose={() => setWheelOpen(false)} title="Any colour">
        <ColorWheel
          value={custom ?? ink}
          onChange={next => {
            setCustom(next);
            setInk(next);
            if (tool === 'eraser') {
              setTool('pen');
            }
          }}
        />
        <Text style={[styles.sheetNote, { color: colors.textMuted }]}>
          Drag on the wheel for the colour, and the bar under it for how light or dark.
        </Text>
      </Sheet>

      <Sheet visible={eraserOpen} onClose={() => setEraserOpen(false)} title="Rubber">
        <View style={styles.sheetBody}>
          <Choice
            label="Whole marks"
            detail="Touch a mark and all of it goes. Best for an arrow or a circle."
            chosen={eraseMode === 'stroke'}
            onPress={() => setEraseMode('stroke')}
          />
          <Choice
            label="Rub it out"
            detail="Takes only what is under the rubber, so you can take the middle out of a line."
            chosen={eraseMode === 'area'}
            onPress={() => setEraseMode('area')}
          />

          {eraseMode === 'area' ? (
            <View style={styles.sizeRow}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Rubber size</Text>
              <View
                style={{
                  width: eraseSize,
                  height: eraseSize,
                  borderRadius: eraseSize / 2,
                  backgroundColor: withAlpha(colors.text, 0.35),
                }}
              />
            </View>
          ) : null}
          {eraseMode === 'area' ? (
            <Slider
              value={eraseSize}
              min={8}
              max={64}
              step={4}
              onChange={setEraseSize}
              label="Rubber size"
              format={size => `${size}`}
            />
          ) : null}

          <Choice
            label="Highlighter only"
            detail="Leaves the writing alone and takes just the marker."
            chosen={eraseHighlightOnly}
            onPress={() => setEraseHighlightOnly(on => !on)}
          />

          <Touchable
            onPress={() => {
              setStrokes([]);
              setEraserOpen(false);
            }}
            disabled={strokes.length === 0}
            label="Erase everything on this page"
            style={[
              styles.clear,
              { borderColor: colors.danger, opacity: strokes.length === 0 ? 0.4 : 1 },
            ]}>
            <Text style={{ color: colors.danger, fontWeight: '700' }}>Erase everything</Text>
          </Touchable>
        </View>
      </Sheet>
    </View>
  );
}

/** One choice in the rubber sheet: what it does, and what it is for. */
function Choice({
  label,
  detail,
  chosen,
  onPress,
}: {
  label: string;
  detail: string;
  chosen: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      role="radio"
      label={label}
      hint={detail}
      state={{ checked: chosen }}
      scaleTo={0.985}
      style={[
        styles.choice,
        { borderColor: chosen ? colors.accent : colors.border, backgroundColor: colors.card },
      ]}>
      <View style={styles.grow}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{label}</Text>
        <Text style={[styles.sheetNote, { color: colors.textMuted }]}>{detail}</Text>
      </View>
      <View
        style={[
          styles.tick,
          {
            backgroundColor: chosen ? colors.accent : 'transparent',
            borderColor: chosen ? colors.accent : colors.border,
          },
        ]}>
        {chosen ? <Check size={14} color={onColor(colors.accent)} /> : null}
      </View>
    </Touchable>
  );
}

const PAPER_NAME: Record<Paper, string> = {
  plain: 'Plain',
  lined: 'Lined',
  grid: 'Squared',
};

/**
 * The ruling on a blank page.
 *
 * Drawn into the same SVG as the marks so it scales with them, and faint
 * enough to be paper rather than content — ruling that competes with the
 * writing is worse than no ruling.
 */
export function Ruling({
  paper,
  board,
  colors,
}: {
  paper: string;
  board: { width: number; height: number };
  colors: { text: string };
}) {
  const lines = useMemo(() => {
    if (paper === 'plain' || board.width <= 0) {
      return [];
    }
    const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let y = RULE; y < board.height; y += RULE) {
      out.push({ x1: 0, y1: y, x2: board.width, y2: y });
    }
    if (paper === 'grid') {
      for (let x = RULE; x < board.width; x += RULE) {
        out.push({ x1: x, y1: 0, x2: x, y2: board.height });
      }
    }
    return out;
  }, [board.height, board.width, paper]);

  return (
    <>
      {lines.map((line, index) => (
        <Line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={withAlpha(colors.text, 0.12)}
          strokeWidth={1}
        />
      ))}
    </>
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

/** Every number in a path, multiplied — the strokes are polylines, so this is
 *  the whole of scaling one. */
export function scalePath(d: string, factor: number): string {
  return d.replace(/-?\d+(?:\.\d+)?/g, value => (Number(value) * factor).toFixed(1));
}

/** The `M x y L x y …` of a path, as points. */
function pathPoints(d: string): { x: number; y: number }[] {
  return (d.match(/-?\d+(?:\.\d+)?\s-?\d+(?:\.\d+)?/g) ?? []).map(pair => {
    const [x, y] = pair.split(/\s+/).map(Number);
    return { x, y };
  });
}

function toPath(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

/**
 * Drop the points that sit on a straight run.
 *
 * The area eraser walks a stroke in small steps so the rubber cannot be jumped
 * over, and those steps all lie exactly on the original segments. Keeping them
 * would grow the stroke every time it was erased near; this puts it back to
 * roughly the corners it was drawn with.
 */
function simplify(points: { x: number; y: number }[], tolerance = 0.6) {
  if (points.length < 3) {
    return points;
  }
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const previous = out[out.length - 1];
    const next = points[i + 1];
    if (distanceToSegment(points[i].x, points[i].y, previous.x, previous.y, next.x, next.y) > tolerance) {
      out.push(points[i]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * Rub out the part of a stroke under the eraser, and keep the rest.
 *
 * This is what a rubber does, and it is what a stroke eraser cannot: take the
 * middle out of a long line and leave the two ends. It works because a stroke
 * is geometry — the piece under the rubber is dropped and each surviving run
 * becomes a stroke of its own.
 *
 * The walk is in steps of half the rubber, not from point to point: a line
 * drawn quickly is two points a long way apart, and testing only those would
 * step straight over the rubber and rub out nothing.
 */
export function eraseArea(stroke: Stroke, x: number, y: number, radius: number): Stroke[] {
  const points = pathPoints(stroke.d);
  if (points.length === 0) {
    return [stroke];
  }
  const reach = radius + stroke.width / 2;
  if (!nearStroke(stroke, x, y, radius)) {
    return [stroke];
  }
  const step = Math.max(1, reach / 2);
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  const take = (point: { x: number; y: number }) => {
    if (Math.hypot(point.x - x, point.y - y) <= reach) {
      if (run.length > 1) {
        runs.push(run);
      }
      run = [];
    } else {
      run.push(point);
    }
  };
  take(points[0]);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    // Capped so one enormous segment cannot turn a rub into a freeze.
    const steps = Math.min(400, Math.max(1, Math.ceil(length / step)));
    for (let k = 1; k <= steps; k++) {
      take({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps });
    }
  }
  if (run.length > 1) {
    runs.push(run);
  }
  return runs.map(piece => ({ ...stroke, d: toPath(simplify(piece)) }));
}

/** How far a point is from the segment ab, which is what "on the line" means. */
function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Is this point on that stroke?
 *
 * Measured against the **segments**, not the recorded points. A stroke drawn
 * quickly is a handful of points a long way apart — a straight line across the
 * page can be two — so testing the points alone meant tapping the middle of a
 * line erased nothing at all, which reads as an eraser that does not work.
 *
 * The tolerance grows with the pen, because a thick mark's edge is further
 * from its centre line than a thin one's, and half of it is the stroke's own
 * half-width.
 */
export function nearStroke(stroke: Stroke, x: number, y: number, tolerance = 18): boolean {
  const points = (stroke.d.match(/-?\d+(?:\.\d+)?\s-?\d+(?:\.\d+)?/g) ?? []).map(point => {
    const [px, py] = point.split(/\s+/).map(Number);
    return { x: px, y: py };
  });
  if (points.length === 0) {
    return false;
  }
  const reach = tolerance + stroke.width / 2;
  if (points.length === 1) {
    return Math.hypot(points[0].x - x, points[0].y - y) <= reach;
  }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (distanceToSegment(x, y, a.x, a.y, b.x, b.y) <= reach) {
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
    gap: 10,
    paddingHorizontal: 16,
  },
  title: {
    ...typeScale.title3,
    flex: 1,
  },
  paperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  paperLabel: {
    ...typeScale.caption,
    fontWeight: '600',
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
  },
  picture: {
    width: '100%',
    height: '100%',
  },
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
  /* Breathing space between the three groups, so the row reads as pen, size
     and undo rather than seven identical squares. */
  divider: {
    width: 6,
  },
  finger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  grow: {
    flex: 1,
  },
  hint: {
    ...typeScale.caption,
  },
  sheetBody: {
    gap: 12,
  },
  /* The size, shown at the size it is — a number alone says nothing about how
     much of a line it will take. */
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: 4,
  },
  sheetNote: {
    ...typeScale.caption,
    marginTop: 2,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clear: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
