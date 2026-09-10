import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  View,
  Image,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ImageStyle,
  type NativeTouchEvent,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { typeScale } from '@/theme/typography';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';

/**
 * A picture, full screen, that pinches to zoom.
 *
 * ## Why this exists rather than the ScrollView trick
 *
 * `DiagramCard` already had a lightbox, and it zoomed by putting the image in
 * a `<ScrollView maximumZoomScale={3} minimumZoomScale={1} centerContent>`.
 * **Those three props are iOS-only.** On Android — the only platform this app
 * ships to — they are silently ignored, so the code read as a zoomable
 * lightbox, reviewed as one, and was a static picture on every phone that has
 * ever run it. That is the exact failure shape this repo keeps meeting: a thing
 * that is absent rather than broken, with nothing anywhere saying so.
 *
 * ## Why the gesture is hand-written
 *
 * `react-native-gesture-handler` is not a dependency and pinch is the only
 * thing that would justify it. React Native's own responder system carries
 * every touch in `nativeEvent.touches`, so two fingers is a distance and a
 * midpoint — about forty lines, against a library whose whole point is
 * arbitration this screen does not need. Nothing is competing for the gesture:
 * the viewer is a `<Modal>`, which is its own window.
 *
 * ## The three rules the maths has to keep
 *
 * 1. **Bounds come from the drawn image, not the screen.** `resizeMode="contain"`
 *    letterboxes, so at scale 1 the picture is usually narrower or shorter than
 *    the window. Clamping against the window instead lets a zoomed picture be
 *    dragged completely off the side, and the reader is left holding a black
 *    screen with no way back but the close button. `onLoad` reports the
 *    intrinsic size; the contain fit is computed from it.
 * 2. **A gesture reads from where it started, not from the last frame.** The
 *    responder is granted once and the accumulated scale and offset are frozen
 *    at that moment. Reading the live value each frame compounds it and the
 *    picture rockets away from the fingers.
 * 3. **Panning below scale 1 is refused.** There is nowhere to go, and a
 *    picture that slides around at rest reads as broken rather than as free.
 */

export interface ZoomableImageProps {
  visible: boolean;
  onClose: () => void;
  /**
   * The picture. Optional: a note page that is pure handwriting has no
   * photograph under it, and is still worth opening full screen — the ink is
   * drawn by `overlay` against `aspect` instead.
   */
  uri?: string | null;
  /**
   * The shape to fit the overlay into when there is no picture to measure.
   * Ignored when `uri` is set, because `onLoad` is then the better answer.
   */
  aspect?: { width: number; height: number } | null;
  /** Shown in the header. Truncated to one line. */
  title?: string;
  /**
   * Drawn over the picture, in the picture's own box, scaling and panning with
   * it. This is how handwriting stays on the thing it was written on — the ink
   * is geometry in the image's coordinate space, so it has to share the
   * transform rather than sit beside it.
   */
  overlay?: React.ReactNode;
  /** Spoken by TalkBack in place of "Diagram". */
  imageLabel?: string;
}

const MAX_SCALE = 5;
const MIN_SCALE = 1;
/** What a double tap goes to. Enough to read a label on a plate, not so far it is lost. */
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 280;

function distance(a: NativeTouchEvent, b: NativeTouchEvent): number {
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

function midpoint(a: NativeTouchEvent, b: NativeTouchEvent) {
  return { x: (a.pageX + b.pageX) / 2, y: (a.pageY + b.pageY) / 2 };
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

export function ZoomableImage({
  visible,
  onClose,
  uri,
  aspect,
  title,
  overlay,
  imageLabel,
}: ZoomableImageProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  /** The window the picture is drawn into, measured rather than assumed. */
  const [box, setBox] = useState({ width: 0, height: 0 });
  /**
   * The picture's own pixels, from onLoad. Zero until it has loaded.
   *
   * Seeded from `aspect` when there is no picture, so a handwritten page still
   * has a shape to letterbox its ink into rather than being stretched to the
   * window's proportions — which is the same rule `InkedImage.ownShape` keeps.
   */
  const [natural, setNatural] = useState(
    aspect ?? { width: 0, height: 0 },
  );

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const xAnim = useRef(new Animated.Value(0)).current;
  const yAnim = useRef(new Animated.Value(0)).current;

  /*
   * The live values, mirrored in refs.
   *
   * `Animated.Value` has no synchronous getter that is safe to rely on, and
   * the gesture maths needs the current numbers on every move. These are the
   * source of truth; the Animated values exist to be rendered.
   */
  const scale = useRef(1);
  const offset = useRef({ x: 0, y: 0 });
  /** Frozen at the moment the responder is granted — see rule 2. */
  const start = useRef({ scale: 1, x: 0, y: 0, distance: 0, focusX: 0, focusY: 0 });
  const lastTap = useRef(0);

  /** The picture's drawn size at scale 1, letterboxed into the box. */
  const fitted = (() => {
    if (!box.width || !box.height || !natural.width || !natural.height) {
      return { width: box.width, height: box.height };
    }
    const ratio = Math.min(box.width / natural.width, box.height / natural.height);
    return { width: natural.width * ratio, height: natural.height * ratio };
  })();

  /** How far the picture may be dragged before its edge would leave the box. */
  const boundsFor = useCallback(
    (atScale: number) => ({
      x: Math.max(0, (fitted.width * atScale - box.width) / 2),
      y: Math.max(0, (fitted.height * atScale - box.height) / 2),
    }),
    [fitted.width, fitted.height, box.width, box.height],
  );

  const apply = useCallback(
    (nextScale: number, nextX: number, nextY: number) => {
      scale.current = nextScale;
      offset.current = { x: nextX, y: nextY };
      scaleAnim.setValue(nextScale);
      xAnim.setValue(nextX);
      yAnim.setValue(nextY);
    },
    [scaleAnim, xAnim, yAnim],
  );

  const settle = useCallback(
    (nextScale: number, nextX: number, nextY: number) => {
      scale.current = nextScale;
      offset.current = { x: nextX, y: nextY };
      if (reduced) {
        scaleAnim.setValue(nextScale);
        xAnim.setValue(nextX);
        yAnim.setValue(nextY);
        return;
      }
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: nextScale,
          duration: DURATION.base,
          easing: EASE.out,
          useNativeDriver: true,
        }),
        Animated.timing(xAnim, {
          toValue: nextX,
          duration: DURATION.base,
          easing: EASE.out,
          useNativeDriver: true,
        }),
        Animated.timing(yAnim, {
          toValue: nextY,
          duration: DURATION.base,
          easing: EASE.out,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [reduced, scaleAnim, xAnim, yAnim],
  );

  /** Back to rest. Called when the viewer opens, so the last picture's zoom is not inherited. */
  const reset = useCallback(() => {
    apply(1, 0, 0);
  }, [apply]);

  useEffect(() => {
    if (visible) {
      reset();
      setNatural(aspect ?? { width: 0, height: 0 });
    }
    // `aspect` is read at open time only; a shape that changed mid-view would
    // re-letterbox the ink underneath a reader who is mid-pinch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, uri, reset]);

  const handleDoubleTap = useCallback(
    (event: GestureResponderEvent) => {
      const now = Date.now();
      if (now - lastTap.current > DOUBLE_TAP_MS) {
        lastTap.current = now;
        return false;
      }
      lastTap.current = 0;
      if (scale.current > 1.01) {
        settle(1, 0, 0);
        return true;
      }
      /*
       * Zoom towards the tap rather than the centre. Zooming to the middle
       * whatever was touched is the thing that makes a viewer feel like it is
       * fighting you: you point at the label you want and it shows you the
       * middle of the plate instead.
       */
      const { locationX, locationY } = event.nativeEvent;
      const from = { x: locationX - box.width / 2, y: locationY - box.height / 2 };
      const next = DOUBLE_TAP_SCALE;
      const bounds = boundsFor(next);
      settle(
        next,
        clamp(-from.x * (next - 1), -bounds.x, bounds.x),
        clamp(-from.y * (next - 1), -bounds.y, bounds.y),
      );
      return true;
    },
    [box.width, box.height, boundsFor, settle],
  );

  /*
   * The handler is read through a ref because PanResponder.create runs ONCE.
   * A responder rebuilt when `box` or `natural` changed would be replaced
   * mid-gesture, and the replacement has never seen the grant that recorded
   * where the fingers started — the same trap the home-block resize documents.
   */
  const handleDoubleTapRef = useRef(handleDoubleTap);
  handleDoubleTapRef.current = handleDoubleTap;

  const responder = useRef(
    PanResponder.create({
      // Claimed on touch-down so a second finger is seen from its first frame.
      // Waiting for movement means the pinch's starting distance is measured
      // after the fingers have already begun to spread, and the first jump is
      // the size of whatever was missed.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: event => {
        const touches = event.nativeEvent.touches;
        start.current = {
          scale: scale.current,
          x: offset.current.x,
          y: offset.current.y,
          distance: touches.length >= 2 ? distance(touches[0], touches[1]) : 0,
          focusX: 0,
          focusY: 0,
        };
        if (touches.length >= 2) {
          const mid = midpoint(touches[0], touches[1]);
          start.current.focusX = mid.x;
          start.current.focusY = mid.y;
        }
      },
      onPanResponderMove: (event, gesture) => {
        const touches = event.nativeEvent.touches;
        if (touches.length >= 2) {
          const spread = distance(touches[0], touches[1]);
          if (!start.current.distance) {
            // A second finger arrived mid-gesture. Re-anchor rather than
            // dividing by zero and sending the picture to infinity.
            start.current = {
              ...start.current,
              scale: scale.current,
              x: offset.current.x,
              y: offset.current.y,
              distance: spread,
            };
            return;
          }
          const next = clamp(
            (start.current.scale * spread) / start.current.distance,
            MIN_SCALE * 0.8,
            MAX_SCALE,
          );
          const bounds = boundsFor(next);
          apply(
            next,
            clamp(start.current.x + gesture.dx, -bounds.x, bounds.x),
            clamp(start.current.y + gesture.dy, -bounds.y, bounds.y),
          );
          return;
        }
        // One finger. Panning only means anything once there is more picture
        // than window — see rule 3.
        if (scale.current <= 1.01) {
          return;
        }
        const bounds = boundsFor(scale.current);
        apply(
          scale.current,
          clamp(start.current.x + gesture.dx, -bounds.x, bounds.x),
          clamp(start.current.y + gesture.dy, -bounds.y, bounds.y),
        );
      },
      onPanResponderRelease: (event, gesture) => {
        // A press that never travelled is a tap, and two of those is a zoom.
        if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6 && !gesture.numberActiveTouches) {
          if (handleDoubleTapRef.current(event)) {
            return;
          }
        }
        // Pinching below 1 is allowed during the gesture so it feels elastic,
        // and springs back on release rather than sticking.
        const next = clamp(scale.current, MIN_SCALE, MAX_SCALE);
        const bounds = boundsFor(next);
        settle(
          next,
          clamp(offset.current.x, -bounds.x, bounds.x),
          clamp(offset.current.y, -bounds.y, bounds.y),
        );
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? 'Image'}
          </Text>
          <Touchable
            onPress={onClose}
            label="Close the picture"
            hitSlop={12}
            style={styles.close}>
            <X size={24} color="#ffffff" />
          </Touchable>
        </View>

        <View
          style={styles.stage}
          onLayout={(event: LayoutChangeEvent) => {
            const { width, height } = event.nativeEvent.layout;
            setBox({ width, height });
          }}
          {...responder.panHandlers}>
          <Animated.View
            style={[
              styles.fill,
              {
                transform: [
                  { translateX: xAnim },
                  { translateY: yAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}>
            {uri ? (
              <Animated.Image
                source={{ uri }}
                accessibilityLabel={imageLabel ?? title ?? 'Picture'}
                style={styles.fill}
                resizeMode="contain"
                onLoad={event => {
                  const source = event.nativeEvent.source;
                  if (source?.width && source?.height) {
                    setNatural({ width: source.width, height: source.height });
                  }
                }}
              />
            ) : null}
            {overlay && fitted.width > 0 ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  styles.centre,
                ]}>
                <View style={{ width: fitted.width, height: fitted.height }}>
                  {overlay}
                </View>
              </View>
            ) : null}
          </Animated.View>
        </View>

        <Text style={[styles.hint, { paddingBottom: insets.bottom + 12 }]}>
          Pinch to zoom, drag to move, double-tap to zoom in and out
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Literal colours, like ErrorBoundary: a picture viewer is a black room, and
  // the theme's card colour behind a photograph is a distraction rather than a
  // continuity.
  backdrop: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { ...typeScale.bodyStrong, color: '#ffffff', flex: 1 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stage: { flex: 1, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  hint: {
    ...typeScale.caption,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    paddingTop: 8,
  },
});

/**
 * A picture that opens full screen when it is tapped.
 *
 * The whole point of a diagram in this app is that its labels matter, and on a
 * phone they are drawn at a size nobody can read — so every picture the reader
 * is meant to *study* should be one tap from being big. This is the wrapper
 * that makes that true without each screen growing its own modal and its own
 * piece of zoom maths.
 *
 * It keeps its own `visible` state deliberately: hoisting it would mean every
 * list of cards re-rendering when one picture was opened.
 */
export function TappableImage({
  uri,
  style,
  resizeMode = 'contain',
  title,
  label,
  onError,
}: {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover';
  title?: string;
  /** Spoken by TalkBack. Says what it is AND that tapping enlarges it. */
  label?: string;
  /**
   * A picture that will not load has to say so. A grey rectangle looks
   * identical to "this app does not show diagrams", and from inside the app
   * there is no way to tell which it is.
   */
  onError?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Touchable
        onPress={() => setOpen(true)}
        label={label ?? 'Picture. Opens full screen'}
        hint="Pinch to zoom once it is open"
        // A picture is a big surface, so the press shrink is barely there —
        // the house rule is that bigger surfaces need less.
        scaleTo={0.99}>
        <Image source={{ uri }} style={style} resizeMode={resizeMode} onError={onError} />
      </Touchable>
      <ZoomableImage
        visible={open}
        onClose={() => setOpen(false)}
        uri={uri}
        title={title}
        imageLabel={label}
      />
    </>
  );
}
