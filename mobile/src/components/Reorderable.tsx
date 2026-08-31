import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { ChevronDown, ChevronUp, GripVertical, Minus, Plus, Trash2 } from 'lucide-react-native';
import { Touchable } from '@/components/Touchable';
import { ReorderLockContext } from '@/components/ReorderLock';
import { dragOwner } from '@/components/dragOwner';
import { useTheme, withAlpha } from '@/theme';
import { SPRING, springConfig, springTo, useReducedMotion } from '@/theme/motion';

export interface ReorderableProps<Id extends string> {
  /** Render order. Fixed for the life of the screen — see above. */
  rendered: Id[];
  /** Where each block currently sits. */
  order: Id[];
  onOrderChange: (next: Id[]) => void;
  /** Rows stop passing touches to their contents while this is true. */
  editing: boolean;
  /** Fired when a block is held long enough to mean "let me move this". */
  onRequestEdit: () => void;
  /**
   * How big each block is drawn, as a multiplier. Absent means fixed size.
   */
  scales?: Record<string, number>;
  /**
   * A block was dragged to a new size. `commit` is false while the finger is
   * still down — the value is wanted on screen every frame, but storing it
   * every frame is a write per pixel dragged.
   */
  onScale?: (id: Id, scale: number, commit: boolean) => void;
  scaleRange?: { min: number; max: number };
  /** Fires while a block is held, so the page can stop scrolling under it. */
  onDragChange?: (dragging: boolean) => void;
  /** Remove / hide a section from the home layout */
  onRemove?: (id: Id) => void;
  sections: Record<Id, React.ReactNode>;
  labels: Record<Id, string>;
}

export function Reorderable<Id extends string>({
  rendered,
  order,
  onOrderChange,
  editing,
  onRequestEdit,
  scales,
  onScale,
  scaleRange,
  onDragChange,
  onRemove,
  sections,
  labels,
}: ReorderableProps<Id>) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  /**
   * How long a block has to be held. 500ms is Android's own long-press, which
   * is the number a thumb has already been trained on; shorter starts firing
   * during ordinary taps on a slow phone.
   */
  const HOLD_MS = 500;
  /** Movement that means "this is a scroll", not a hold. */
  const HOLD_SLOP = 12;

  const heights = useRef(new Map<Id, number>()).current;
  /** Each block's height *before* its zoom is applied. */
  const naturals = useRef(new Map<Id, number>()).current;

  /**
   * The live scales, for the resize responders to read.
   *
   * They are built once per order — rebuilding them when a scale changes
   * would replace the responder mid-drag, and a fresh one has never seen the
   * grant that recorded where the finger started.
   */
  const scalesRef = useRef(scales);
  scalesRef.current = scales;
  const onScaleRef = useRef(onScale);
  onScaleRef.current = onScale;
  const scaleRangeRef = useRef(scaleRange);
  scaleRangeRef.current = scaleRange;
  const onDragChangeRef = useRef(onDragChange);
  onDragChangeRef.current = onDragChange;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStart = useRef({ x: 0, y: 0 });

  const cancelHold = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  useEffect(() => cancelHold, [cancelHold]);
  const shifts = useRef(new Map<Id, Animated.Value>()).current;
  const lifts = useRef(new Map<Id, Animated.Value>()).current;
  const [held, setHeld] = useState<Id | null>(null);

  /** Lazily created, so adding a section needs no registration step. */
  const valueFor = useCallback((store: Map<Id, Animated.Value>, id: Id): Animated.Value => {
    const existing = store.get(id);
    if (existing) {
      return existing;
    }
    const created = new Animated.Value(0);
    store.set(id, created);
    return created;
  }, []);

  /** Top of each block, for a given order. */
  const topsFor = useCallback(
    (list: Id[]) => {
      const tops = {} as Record<Id, number>;
      let acc = 0;
      for (const id of list) {
        tops[id] = acc;
        acc += heights.get(id) ?? 0;
      }
      return tops;
    },
    [heights],
  );

  /**
   * Put every block where `list` says it belongs, measured against where it
   * was actually rendered. `except` is the one under the finger, which is
   * following the touch and must not be sprung anywhere.
   */
  const settle = useCallback(
    (list: Id[], except?: Id) => {
      const renderTops = topsFor(rendered);
      const tops = topsFor(list);
      for (const id of rendered) {
        if (id === except) {
          continue;
        }
        springTo(valueFor(shifts, id), tops[id] - renderTops[id], {
          spring: SPRING.default,
          reduceMotion,
        }).start();
      }
    },
    [rendered, reduceMotion, shifts, topsFor, valueFor],
  );

  const move = useCallback(
    (id: Id, delta: number) => {
      const from = order.indexOf(id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= order.length) {
        return;
      }
      const next = [...order];
      next.splice(from, 1);
      next.splice(to, 0, id);
      onOrderChange(next);
      settle(next);
    },
    [onOrderChange, order, settle],
  );

  /** One notch of size, for the +/- buttons and the a11y actions. */
  const step = useCallback(
    (id: Id, delta: number) => {
      const min = scaleRangeRef.current?.min ?? 0.75;
      const max = scaleRangeRef.current?.max ?? 1.3;
      const next = (scalesRef.current?.[id] ?? 1) + delta;
      onScaleRef.current?.(id, Math.min(max, Math.max(min, next)), true);
    },
    [onScaleRef, scaleRangeRef, scalesRef],
  );

  /**
   * The resize grips.
   *
   * Height rather than a corner drag: a block always spans the full width, so
   * width is not a thing anyone can choose, and offering a diagonal handle
   * would imply it is. Dragging down makes the block bigger.
   *
   * The scale moves with the finger — `commit` false — and is written to
   * storage once, on release. Storing on every frame is a write per pixel
   * dragged.
   */
  const resizable = onScale !== undefined;
  const resizers = useMemo(() => {
    const map = {} as Record<
      Id,
      {
        vertical: ReturnType<typeof PanResponder.create>;
        horizontal: ReturnType<typeof PanResponder.create>;
        corner: ReturnType<typeof PanResponder.create>;
      }
    >;
    if (!resizable) {
      return map;
    }
    for (const id of rendered) {
      let start = 1;
      let latest = 1;

      const createHandler = (axis: 'y' | 'x' | 'both') =>
        PanResponder.create({
          onStartShouldSetPanResponderCapture: () => editing,
          onMoveShouldSetPanResponderCapture: () => editing,
          onPanResponderGrant: () => {
            start = scalesRef.current?.[id] ?? 1;
            latest = start;
            dragOwner.current = id;
            onDragChangeRef.current?.(true);
          },
          onPanResponderMove: (_event, gesture) => {
            const natural = naturals.get(id) || heights.get(id) || 200;
            const min = scaleRangeRef.current?.min ?? 0.5;
            const max = scaleRangeRef.current?.max ?? 1.0;
            let delta = 0;
            if (axis === 'y') {
              delta = gesture.dy / (natural * 1.2);
            } else if (axis === 'x') {
              delta = gesture.dx / 220;
            } else {
              delta = (gesture.dx + gesture.dy) / (natural + 220);
            }
            latest = Math.min(max, Math.max(min, Math.round((start + delta) * 100) / 100));
            onScaleRef.current?.(id, latest, false);
          },
          onPanResponderRelease: () => {
            dragOwner.current = null;
            onDragChangeRef.current?.(false);
            onScaleRef.current?.(id, latest, true);
          },
          onPanResponderTerminate: () => {
            dragOwner.current = null;
            onDragChangeRef.current?.(false);
            onScaleRef.current?.(id, latest, true);
          },
          onPanResponderTerminationRequest: () => false,
        });

      map[id] = {
        vertical: createHandler('y'),
        horizontal: createHandler('x'),
        corner: createHandler('both'),
      };
    }
    return map;
  }, [editing, heights, naturals, onDragChangeRef, rendered, resizable]);

  const responders = useMemo(() => {
    const map = {} as Record<Id, ReturnType<typeof PanResponder.create>>;
    for (const id of rendered) {
      // Captured per row, and rebuilt whenever the order changes so the drag
      // starts from the arrangement actually on screen.
      let tentative = order;
      let startShift = 0;

      map[id] = PanResponder.create({
        onStartShouldSetPanResponder: () => editing,
        onMoveShouldSetPanResponder: () => editing,
        // Capture, so the finger that was holding a button inside this block
        // is taken over the moment it moves. Without this the drag could only
        // start on a part of the block that is not a control, which on the
        // subject grid is almost nothing.
        //
        // Unless a tile inside the block already has the finger: the subject
        // cards are individually sortable, and capture runs parent-first, so
        // without this check the block would win every time and a card could
        // never be picked up.
        onMoveShouldSetPanResponderCapture: () => editing && dragOwner.current === null,
        onPanResponderGrant: () => {
          tentative = order;
          const renderTops = topsFor(rendered);
          startShift = topsFor(order)[id] - renderTops[id];
          valueFor(shifts, id).stopAnimation();
          valueFor(shifts, id).setValue(startShift);
          setHeld(id);
          onDragChange?.(true);
          if (!reduceMotion) {
            Animated.spring(valueFor(lifts, id), {
              toValue: 1,
              ...springConfig(SPRING.snappy),
            }).start();
          }
        },
        onPanResponderMove: (_event, gesture) => {
          valueFor(shifts, id).setValue(startShift + gesture.dy);

          /**
           * Swap with a neighbour once the dragged block's leading edge has
           * passed that neighbour's midpoint — not once its own centre has
           * reached a slot.
           *
           * The difference matters entirely because these blocks are wildly
           * different heights. Judging by the dragged block's centre means the
           * subject grid, which is most of a screen tall, has to travel nearly
           * 400dp before its middle clears a 76dp banner — the block visibly
           * covers the thing it is meant to be moving past, and nothing
           * happens. Leading edge against the neighbour's midpoint makes the
           * distance depend on the neighbour, which is what the eye is
           * actually judging.
           */
          const renderTops = topsFor(rendered);
          const span = heights.get(id) ?? 0;
          const top = renderTops[id] + startShift + gesture.dy;
          const bottom = top + span;
          let next = tentative;
          let index = next.indexOf(id);

          for (;;) {
            const tops = topsFor(next);
            if (index > 0) {
              const above = next[index - 1];
              if (top < tops[above] + (heights.get(above) ?? 0) / 2) {
                next = [...next];
                next[index - 1] = id;
                next[index] = above;
                index -= 1;
                continue;
              }
            }
            if (index < next.length - 1) {
              const below = next[index + 1];
              if (bottom > tops[below] + (heights.get(below) ?? 0) / 2) {
                next = [...next];
                next[index + 1] = id;
                next[index] = below;
                index += 1;
                continue;
              }
            }
            break;
          }

          if (next !== tentative) {
            tentative = next;
            settle(tentative, id);
          }
        },
        onPanResponderRelease: () => {
          setHeld(null);
          onDragChange?.(false);
          if (!reduceMotion) {
            Animated.spring(valueFor(lifts, id), {
              toValue: 0,
              ...springConfig(SPRING.dismiss),
            }).start();
          } else {
            valueFor(lifts, id).setValue(0);
          }
          const renderTops = topsFor(rendered);
          springTo(valueFor(shifts, id), topsFor(tentative)[id] - renderTops[id], {
            spring: SPRING.momentum,
            reduceMotion,
          }).start();
          if (tentative !== order) {
            onOrderChange(tentative);
          }
        },
        onPanResponderTerminationRequest: () => false,
      });
    }
    return map;
  }, [
    editing,
    heights,
    lifts,
    onDragChange,
    onOrderChange,
    order,
    reduceMotion,
    rendered,
    settle,
    shifts,
    topsFor,
    valueFor,
  ]);

  return (
    <>
      {rendered.map(id => {
        const shift = valueFor(shifts, id);
        const lift = valueFor(lifts, id);
        const index = order.indexOf(id);
        const zoom = scales?.[id] ?? 1;
        return (
          <Animated.View
            key={id}
            onLayout={(event: LayoutChangeEvent) => {
              const next = event.nativeEvent.layout.height;
              if (heights.get(id) !== next) {
                heights.set(id, next);
                // A block changed size — the year picker swapped the subject
                // grid, the text size moved. Everything below it has to move
                // with it or the stack tears open.
                settle(order);
              }
            }}
            // Touch handlers rather than a responder: these fire on the row
            // even while a button inside it owns the gesture, which is the
            // only way to time a hold that starts on a control.
            onTouchStart={event => {
              if (editing) {
                return;
              }
              const touch = event.nativeEvent.touches[0] ?? event.nativeEvent;
              holdStart.current = { x: touch.pageX, y: touch.pageY };
              cancelHold();
              holdTimer.current = setTimeout(() => {
                holdTimer.current = null;
                onRequestEdit();
              }, HOLD_MS);
            }}
            onTouchMove={event => {
              const touch = event.nativeEvent.touches[0] ?? event.nativeEvent;
              const moved =
                Math.abs(touch.pageX - holdStart.current.x) +
                Math.abs(touch.pageY - holdStart.current.y);
              if (moved > HOLD_SLOP) {
                cancelHold();
              }
            }}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            style={[
              styles.row,
              {
                transform: [{ translateY: shift }],
                zIndex: held === id ? 2 : 1,
              },
            ]}>
            <Animated.View
              style={{
                transform: [
                  { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) },
                ],
              }}
              // Touches still reach the contents in edit mode — they have to,
              // or the individually sortable subject cards inside could never
              // be grabbed. What stops a drag from also *pressing* something
              // is ReorderLockContext below, not the pointer events.
              pointerEvents="auto"
              {...responders[id].panHandlers}>
              {/* The lock covers the block's own controls and nothing else.
                  Wrapping the row would disable the reorder arrows too — they
                  are Touchables like everything else, and they are the one
                  thing that has to keep working in this mode. */}
              {/*
                Zoom, not a font-size pass.

                A block is drawn at `scale` by giving it 1/scale of the width
                and then scaling it back up from its top-left corner. The
                content lays itself out at that wider size and the transform
                brings it back, so everything inside grows together and no
                section has to know it is being resized.

                The wrapper's own height is the natural height times the
                scale, because a transform changes nothing about layout — skip
                that and the blocks below would sit exactly where they were
                while this one visibly grew over them.
              */}
              <View
                style={[
                  styles.cardContainer,
                  {
                    width: zoom >= 0.99 ? '100%' : `${Math.round(zoom * 100)}%`,
                    alignSelf: 'center',
                  },
                ]}>
                <View
                  onLayout={event => {
                    const next = event.nativeEvent.layout.height;
                    if (naturals.get(id) !== next) {
                      naturals.set(id, next);
                      settle(order);
                    }
                  }}>
                  <ReorderLockContext.Provider value={editing}>
                    {sections[id]}
                  </ReorderLockContext.Provider>
                </View>

                {editing && onScale ? (
                  <>
                    {/* Bottom Handle: Vertical Size Resize */}
                    <View
                      accessible
                      accessibilityRole="adjustable"
                      accessibilityLabel={`Resize height for ${labels[id]}`}
                      accessibilityValue={{
                        min: 60,
                        max: 100,
                        now: Math.round((scales?.[id] ?? 1) * 100),
                        text: `${Math.round((scales?.[id] ?? 1) * 100)} percent`,
                      }}
                      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                      onAccessibilityAction={event => {
                        step(id, event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05);
                      }}
                      style={styles.verticalResizeZone}
                      {...resizers[id]?.vertical.panHandlers}>
                      <View style={[styles.horizontalGrip, { backgroundColor: '#F43F5E' }]} />
                    </View>

                    {/* Right-Side Handle: Horizontal Width Resize */}
                    <View
                      accessible
                      accessibilityRole="adjustable"
                      accessibilityLabel={`Resize width for ${labels[id]}`}
                      style={styles.horizontalResizeZone}
                      {...resizers[id]?.horizontal.panHandlers}>
                      <View style={[styles.verticalGrip, { backgroundColor: '#F43F5E' }]} />
                    </View>

                    {/* Bottom-Right Corner Handle: 2D Dual-Axis Resize */}
                    <View
                      accessible
                      accessibilityRole="adjustable"
                      accessibilityLabel={`2D resize for ${labels[id]}`}
                      style={styles.cornerResizeZone}
                      {...resizers[id]?.corner.panHandlers}>
                      <View style={styles.cornerGrip} />
                    </View>
                  </>
                ) : null}
              </View>
            </Animated.View>

            {editing ? (
              <View
                style={[
                  styles.controls,
                  {
                    backgroundColor: colors.cardElevated,
                    borderColor: held === id ? colors.accent : colors.border,
                  },
                ]}>
                <View style={styles.grip}>
                  <GripVertical size={16} color={colors.textMuted} />
                </View>

                <Touchable
                  onPress={() => move(id, -1)}
                  label={`Move ${labels[id]} up`}
                  disabled={index === 0}
                  scaleTo={0.9}
                  style={styles.arrow}>
                  <ChevronUp
                    size={16}
                    color={index === 0 ? withAlpha(colors.text, 0.25) : colors.text}
                  />
                </Touchable>
                <Touchable
                  onPress={() => move(id, 1)}
                  label={`Move ${labels[id]} down`}
                  disabled={index === order.length - 1}
                  scaleTo={0.9}
                  style={styles.arrow}>
                  <ChevronDown
                    size={16}
                    color={
                      index === order.length - 1 ? withAlpha(colors.text, 0.25) : colors.text
                    }
                  />
                </Touchable>

                {/* Size, in steps, next to the arrows.
                    The grip below the block is the good way to do this — it
                    is continuous and the block follows your finger. But it is
                    one 24dp strip competing with a scrolling page, and a
                    control that is merely hard to hit is indistinguishable
                    from one that does not work. These always land. */}
                {onScale ? (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Touchable
                      onPress={() => step(id, -0.05)}
                      label={`Make ${labels[id]} smaller`}
                      disabled={(scales?.[id] ?? 1) <= (scaleRange?.min ?? 0.65) + 0.001}
                      scaleTo={0.9}
                      style={styles.arrow}>
                      <Minus
                        size={16}
                        color={
                          (scales?.[id] ?? 1) <= (scaleRange?.min ?? 0.65) + 0.001
                            ? withAlpha(colors.text, 0.25)
                            : colors.text
                        }
                      />
                    </Touchable>
                    <Touchable
                      onPress={() => step(id, 0.05)}
                      label={`Make ${labels[id]} bigger`}
                      disabled={(scales?.[id] ?? 1) >= (scaleRange?.max ?? 1.45) - 0.001}
                      scaleTo={0.9}
                      style={styles.arrow}>
                      <Plus
                        size={16}
                        color={
                          (scales?.[id] ?? 1) >= (scaleRange?.max ?? 1.45) - 0.001
                            ? withAlpha(colors.text, 0.25)
                            : colors.text
                        }
                      />
                    </Touchable>
                  </>
                ) : null}

                {onRemove ? (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Touchable
                      onPress={() => onRemove(id)}
                      label={`Remove ${labels[id]}`}
                      scaleTo={0.9}
                      hitSlop={6}
                      style={styles.arrow}>
                      <Trash2 size={14} color={colors.danger} />
                    </Touchable>
                  </>
                ) : null}
              </View>
            ) : null}
          </Animated.View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    // No margin here: each section keeps its own, so the gap travels with the
    // block that owns it rather than being redistributed on every reorder.
    position: 'relative',
  },
  cardContainer: {
    position: 'relative',
    borderRadius: 20,
  },
  controls: {
    position: 'absolute',
    top: -24,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 3,
    paddingVertical: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 12,
  },
  grip: {
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  verticalResizeZone: {
    position: 'absolute',
    bottom: -11,
    left: '50%',
    marginLeft: -32,
    width: 64,
    height: 24,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalGrip: {
    width: 44,
    height: 5.5,
    borderRadius: 3,
    shadowColor: '#F43F5E',
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  horizontalResizeZone: {
    position: 'absolute',
    top: '50%',
    marginTop: -32,
    right: -11,
    width: 24,
    height: 64,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalGrip: {
    width: 5.5,
    height: 44,
    borderRadius: 3,
    shadowColor: '#F43F5E',
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 0 },
    elevation: 4,
  },
  cornerResizeZone: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 28,
    height: 28,
    zIndex: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerGrip: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F43F5E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#F43F5E',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 5,
  },
  arrow: {
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
