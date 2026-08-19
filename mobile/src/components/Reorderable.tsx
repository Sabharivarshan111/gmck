import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react-native';
import { Touchable } from '@/components/Touchable';
import { ReorderLockContext } from '@/components/ReorderLock';
import { dragOwner } from '@/components/dragOwner';
import { useTheme, withAlpha } from '@/theme';
import { SPRING, springConfig, springTo, useReducedMotion } from '@/theme/motion';

/**
 * Vertical drag-to-reorder for a handful of variable-height blocks.
 *
 * Reordering is **transform-only**. The children are always rendered in the
 * order given by `rendered`, which never changes while the screen is alive;
 * where each one appears is `translateY`. That is the single decision the rest
 * of this file follows from, and it buys two things:
 *
 *   • Committing a drop changes nothing on screen. Re-rendering the tree in
 *     the new order would repaint every block on the same frame the offsets
 *     are zeroed, and any disagreement between those two is a flash.
 *   • Every block that moves out of the way moves on the native driver. None
 *     of this touches layout, so the six SVGs in the subject grid are never
 *     asked to redraw because something above them was reordered.
 *
 * Heights are measured rather than assumed, because the blocks are a hero
 * card, a row of four buttons and a two-column grid — no two are the same
 * height, and the grid's changes with the year. Each row's measured height
 * includes its child's margins, so a section carries its own trailing space
 * with it and the gaps do not shuffle when the order does.
 *
 * **Editing is entered by holding a block**, and nothing about it is on
 * screen until then: a Home screen that greets you with instructions for
 * rearranging it has its priorities backwards.
 *
 * Getting the hold right takes two pieces, because React Native has no
 * gesture arbitration between a parent and a child. The timer is started from
 * `onTouchStart`, which a view receives even when a descendant owns the
 * responder, and cancelled by movement or release. When it fires, the row
 * takes the responder from the button under the finger with a capture-phase
 * claim, so the same finger carries straight on into the drag. The press that
 * button had already begun is neutralised by ReorderLockContext — see that
 * file; without it, holding the Pathology card to rearrange would open
 * Pathology on release.
 *
 * The header button enters the same mode. A hold cannot be discovered by a
 * screen reader, and TalkBack's own long-press is spoken for.
 *
 * The arrows are not a fallback for the drag; they are the other half of it.
 * The list is about two screens tall, so dragging from the bottom to the top
 * is not one gesture, and a drag is unusable with TalkBack besides. Both
 * routes commit through the same function.
 */

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
    const map = {} as Record<Id, ReturnType<typeof PanResponder.create>>;
    if (!resizable) {
      return map;
    }
    for (const id of rendered) {
      let start = 1;
      let latest = 1;
      map[id] = PanResponder.create({
        onStartShouldSetPanResponderCapture: () => editing,
        onMoveShouldSetPanResponderCapture: () => editing,
        onPanResponderGrant: () => {
          start = scalesRef.current?.[id] ?? 1;
          latest = start;
          dragOwner.current = id;
        },
        onPanResponderMove: (_event, gesture) => {
          // Divided by the block's own height, which is what keeps the grip
          // under the finger: the drawn height is natural × scale, so a
          // change of dy/natural grows the block by exactly the distance
          // dragged. A fixed divisor would make the hero crawl and the
          // WhatsApp strip bolt.
          const natural = naturals.get(id) || heights.get(id) || 200;
          const min = scaleRangeRef.current?.min ?? 0.75;
          const max = scaleRangeRef.current?.max ?? 1.3;
          latest = Math.min(max, Math.max(min, start + gesture.dy / natural));
          onScaleRef.current?.(id, latest, false);
        },
        onPanResponderRelease: () => {
          dragOwner.current = null;
          // `latest`, not the `scales` prop: this responder is built once per
          // order, so a value read from that prop is whatever it was when the
          // gesture started — committing it would undo the whole drag.
          onScaleRef.current?.(id, latest, true);
        },
        onPanResponderTerminate: () => {
          dragOwner.current = null;
          onScaleRef.current?.(id, latest, true);
        },
        onPanResponderTerminationRequest: () => false,
      });
    }
    return map;
    // Deliberately not rebuilt when a scale changes: a resize writes a new
    // scale on every frame, and swapping a PanResponder mid-gesture hands the
    // move events to an instance that never saw the grant. That is why the
    // live values are read through refs above.
  }, [editing, heights, naturals, rendered, resizable]);

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
                style={
                  zoom === 1
                    ? undefined
                    : {
                        height: (heights.get(id) ?? 0) > 0
                          ? (naturals.get(id) ?? 0) * zoom
                          : undefined,
                        overflow: 'hidden',
                      }
                }>
                <View
                  onLayout={event => {
                    // The height *before* scaling. Measured on the inner view
                    // so it is the content's own size, not the zoomed box's.
                    const next = event.nativeEvent.layout.height;
                    if (naturals.get(id) !== next) {
                      naturals.set(id, next);
                      settle(order);
                    }
                  }}
                  style={
                    zoom === 1
                      ? undefined
                      : {
                          width: `${100 / zoom}%`,
                          transform: [{ scale: zoom }],
                          transformOrigin: 'top left',
                        }
                  }>
                  <ReorderLockContext.Provider value={editing}>
                    {sections[id]}
                  </ReorderLockContext.Provider>
                </View>
              </View>
            </Animated.View>

            {editing && onScale ? (
              <View
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={`Resize ${labels[id]}`}
                accessibilityValue={{
                  min: 75,
                  max: 130,
                  now: Math.round((scales?.[id] ?? 1) * 100),
                  text: `${Math.round((scales?.[id] ?? 1) * 100)} percent`,
                }}
                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                onAccessibilityAction={event => {
                  // A drag is not something a screen reader can perform, so
                  // the same value is reachable in steps.
                  const step = event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05;
                  onScale(id, (scales?.[id] ?? 1) + step, true);
                }}
                style={styles.resizeZone}
                {...resizers[id]?.panHandlers}>
                <View style={[styles.resizeGrip, { backgroundColor: colors.accent }]} />
              </View>
            ) : null}

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
  controls: {
    position: 'absolute',
    // Sits in the gap above the block rather than on top of it. Overlaying
    // the corner covered the "Ask AI" icon and half the WhatsApp row — a
    // control for rearranging blocks should not hide what is in them.
    top: -22,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  grip: {
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  resizeZone: {
    position: 'absolute',
    // Inside the row, not straddling its edge.
    //
    // It sat at -14 first, which put half the target in the gap *below* the
    // block — and that gap belongs to the next block, whose own drag
    // responder claimed the touch. Dragging the hero's grip reordered the
    // quick actions instead of resizing anything, which looked like the
    // resize doing nothing rather than the wrong view winning.
    //
    // The last 24dp of a block is its padding, so covering it costs nothing.
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeGrip: {
    width: 44,
    height: 4,
    borderRadius: 2,
    opacity: 0.9,
  },
  arrow: {
    // 28dp of pixels, 44dp of target: Touchable's default hit slop is what
    // makes up the difference.
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
