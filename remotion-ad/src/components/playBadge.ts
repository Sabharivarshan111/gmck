/**
 * Whether the official Google Play badge artwork is available to draw.
 *
 * Generated at render time by `scripts/preflight.mjs`, which is the only thing
 * that can see the filesystem — a Remotion composition runs in a browser and
 * cannot ask whether a file exists without fetching it, and a fetch that 404s
 * mid-render is a hole in a finished frame.
 *
 * The badge is deliberately NOT committed. Google's guidelines forbid altering
 * its colour, proportions or spacing, so it has to be the official artwork
 * from the Play badge generator rather than anything redrawn here — and this
 * sandbox cannot reach `play.google.com` to fetch it. Until somebody drops the
 * real PNG in, `EndCard` prints plain type that cannot be mistaken for a badge.
 *
 * Put the file at `remotion-ad/public/google-play-badge.png` and it is picked
 * up on the next render with no code change.
 */
export const HAS_PLAY_BADGE = false;
