/**
 * A drag has to be asked for, or the page cannot scroll.
 *
 * Edit mode used to claim the gesture the instant a finger landed on a block
 * or a subject card — `onStartShouldSetPanResponderCapture: () => editing` in
 * both `Reorderable` and `SortableGrid`. That is every touch on almost the
 * whole screen, so the `ScrollView` underneath never saw one: rearranging Home
 * meant being stuck at whatever was on screen when you started, with the study
 * stats below the subject grid unreachable.
 *
 * The fix cannot be "claim only vertical drags", because reordering *is*
 * vertical and so is scrolling. What separates them is intent in the first
 * fraction of a second: a scroll starts moving immediately, and picking
 * something up starts with the finger resting on it. So a drag is armed by a
 * short press that has not travelled, and a flick is left alone.
 *
 * One finger, one module-level state, for the same reason `dragOwner` is:
 * a hook per row would be a fresh state for every block and the two would
 * disagree about which one is holding the touch.
 */

/**
 * Long enough that a scroll flick is never mistaken for a pick-up, short
 * enough that a deliberate press does not feel like it is being ignored.
 * Android's own long-press is 500ms, which is the right number for *entering*
 * edit mode from a normal screen and much too long once you are already in it.
 */
const ARM_MS = 200;

/** Movement that means the finger is going somewhere, not settling. */
const ARM_SLOP = 10;

let armedId: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let origin = { x: 0, y: 0 };

export const dragArm = {
  /** A finger landed on `id`. Start counting. */
  begin(id: string, x: number, y: number) {
    dragArm.cancel();
    origin = { x, y };
    timer = setTimeout(() => {
      timer = null;
      armedId = id;
    }, ARM_MS);
  },

  /**
   * The finger moved. Before the press has counted out this means a scroll,
   * and the drag is abandoned; after it, the drag is already armed and this
   * does nothing.
   */
  moved(x: number, y: number) {
    if (timer && Math.abs(x - origin.x) + Math.abs(y - origin.y) > ARM_SLOP) {
      dragArm.cancel();
    }
  },

  cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    armedId = null;
  },

  isArmed(id: string): boolean {
    return armedId === id;
  },
};
