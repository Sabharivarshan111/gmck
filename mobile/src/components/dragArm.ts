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
 * **And by travelling sideways**, which is the half that was missing. The page
 * scrolls vertically and only vertically, so horizontal movement cannot be a
 * scroll — there is nothing for it to be but a drag. Without that rule, moving
 * a subject card to the slot beside it required a press-then-drag with no sign
 * anywhere that the press was needed, so dragging one the way anybody would
 * did nothing at all and the feature read as missing. It was reported as
 * exactly that: "I could move each subject card individually, now it's gone."
 *
 * The press still matters, because a *vertical* rearrange is genuinely
 * ambiguous with a scroll and nothing but intent separates them.
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

/**
 * Sideways travel that can only be a drag.
 *
 * Larger than `ARM_SLOP` and biased: the finger has to be going clearly more
 * across than down, so a diagonal scroll flick — which is most of them, since
 * thumbs arc — is still left to the ScrollView.
 */
const SIDEWAYS = 14;

let armedId: string | null = null;
/** Who the counting press belongs to, so a sideways arm knows what it armed. */
let pending: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let origin = { x: 0, y: 0 };

export const dragArm = {
  /** A finger landed on `id`. Start counting. */
  begin(id: string, x: number, y: number) {
    dragArm.cancel();
    origin = { x, y };
    pending = id;
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
    if (!timer) {
      return;
    }
    const dx = Math.abs(x - origin.x);
    const dy = Math.abs(y - origin.y);
    // Sideways beats the timer: nothing but a drag moves across a page that
    // only scrolls up and down, so there is nothing to wait to find out.
    if (dx > SIDEWAYS && dx > dy * 1.6) {
      const id = pending;
      dragArm.cancel();
      armedId = id;
      return;
    }
    if (dx + dy > ARM_SLOP) {
      dragArm.cancel();
    }
  },

  cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    armedId = null;
    pending = null;
  },

  isArmed(id: string): boolean {
    return armedId === id;
  },
};
