/**
 * Where a reel's caption sits, how tall it is allowed to get, and therefore
 * how much frame is left for everything else.
 *
 * ## Why this is a module and not three comments
 *
 * These numbers were already written down — in `ReelHeadline`, in
 * `MascotStage` and in `LayeredCameraPhone` — as prose, each quoting the
 * others: "the caption band starts at `bottom: 330`, so the guide's feet are
 * at 470", "0.86 and -70 put its lower edge at ~1409 against a headline block
 * whose top edge is ~1465". Careful, measured, and all three silently assumed
 * the caption was **one line tall**.
 *
 * The headline is now the whole spoken line rather than a fragment of it, and
 * at a fixed 58px that is two lines for 257 of the 294 captions and three for
 * eight more. A two-line block's top edge is ~1424 and a three-line block's is
 * ~1359, so the text grew up through the device (lower edge ~1409) and through
 * the mascot's feet (~1450). That is the reported overlap, and no amount of
 * care in three separate comments would have caught it, because each was
 * correct about a layout that had changed underneath it.
 *
 * So the band is a number three components import, and `FIT_SIZES` shrinks the
 * type until the words fit inside it. The caption can never grow into anything
 * else again, whatever is written in the script.
 */

/** Frame size. Vertical, 9:16. */
export const FRAME_W = 1080;
export const FRAME_H = 1920;

/**
 * Distance from the bottom of the frame to the bottom of the caption block.
 *
 * Instagram and TikTok draw their own caption, handle and action rail over
 * roughly the bottom 260-290px of a 1920 frame. Text below that is text nobody
 * reads.
 */
export const CAPTION_BOTTOM = 330;

/** Side margins, and the block's own horizontal padding. */
export const CAPTION_SIDE = 64;
export const CAPTION_PAD_X = 34;
export const CAPTION_PAD_Y = 18;

/** How wide the words themselves may run. */
export const CAPTION_TEXT_W = FRAME_W - CAPTION_SIDE * 2 - CAPTION_PAD_X * 2;

/**
 * The tallest the caption block may ever be.
 *
 * Everything else in the frame is placed against this, so it is a budget
 * rather than an observation: the type shrinks to honour it.
 */
export const CAPTION_MAX_H = 230;

/**
 * The y coordinate the caption block can never rise above.
 *
 * Nothing else may be drawn below this line. It is what `MascotStage` and
 * `LayeredCameraPhone` are placed against.
 */
export const CAPTION_TOP = FRAME_H - CAPTION_BOTTOM - CAPTION_MAX_H;

/** A little air between the caption band and whatever is above it. */
export const BAND_CLEARANCE = 20;

/** The lowest y anything else in the frame may reach. */
export const CONTENT_FLOOR = CAPTION_TOP - BAND_CLEARANCE;

/** Distance from the bottom of the frame to the content floor. */
export const CONTENT_FLOOR_BOTTOM = FRAME_H - CONTENT_FLOOR;

export const LINE_HEIGHT = 1.12;

/**
 * Type sizes to try, largest first.
 *
 * A reel headline wants to be as large as it can be — it is read at arm's
 * length while scrolling — so this steps down only as far as the words
 * require, and the great majority of lines still land at 58 or 52.
 */
export const FIT_SIZES = [58, 52, 46, 42, 38, 34] as const;

/**
 * How many lines these words take at this size, and how tall that block is.
 *
 * The width of a glyph is estimated rather than measured. Remotion renders in
 * a real browser so measuring is possible, but a layout that depends on a
 * measurement taken during render is a layout that can differ between the
 * preview and the render, and between one machine and another. An estimate
 * that is slightly pessimistic is always the same everywhere, and being
 * slightly pessimistic only ever means the type is one step smaller than it
 * had to be.
 *
 * 0.58em per character is measured against this stack at weight 900.
 */
export const wrapAt = (words: string[], size: number) => {
  const gap = size * 0.31;
  let lines = 1;
  let cursor = 0;
  for (const word of words) {
    const width = word.length * size * 0.58;
    const need = cursor === 0 ? width : cursor + gap + width;
    if (need > CAPTION_TEXT_W) {
      lines += 1;
      cursor = width;
    } else {
      cursor = need;
    }
  }
  return { lines, height: lines * size * LINE_HEIGHT + CAPTION_PAD_Y * 2 };
};

/**
 * The largest size at which these words fit the band.
 *
 * Falls through to the smallest size rather than throwing: a caption one step
 * too small is a caption somebody can still read, and a render that dies
 * because a line is long is worse than the line being long.
 */
export const fitCaption = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  for (const size of FIT_SIZES) {
    const { lines, height } = wrapAt(words, size);
    if (height <= CAPTION_MAX_H) return { size, lines, height, words };
  }
  const size = FIT_SIZES[FIT_SIZES.length - 1];
  return { size, ...wrapAt(words, size), words };
};
