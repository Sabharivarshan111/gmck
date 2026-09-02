/**
 * A shot is 3.0 seconds — 90 frames at 30fps — and an ad is 30 of them.
 *
 * The three ads differ only in this data. The motion engine is shared, so a
 * fix to the camera or the caption safe-zone lands in all three at once, which
 * is the whole reason the timeline is not written out three times.
 */
export const FPS = 30;
export const SHOT_FRAMES = 90;
export const SHOT_COUNT = 30;
export const TOTAL_FRAMES = SHOT_FRAMES * SHOT_COUNT; // 2700 = 90.0s

/**
 * How the camera treats the device during a shot.
 *
 * Every one of these is applied to the *device container*, never to the screen
 * content inside it. Scaling the inner <Img> is what cropped the nav bar and
 * pushed text under the Dynamic Island last time.
 */
export type CameraMove =
  | 'hero'        // gentle floating wide, slight 3D perspective
  | 'push'        // smooth push-in
  | 'pull'        // pull-back reveal
  | 'trackLeft'   // lateral glide
  | 'trackRight'
  | 'glideDown'   // vertical travel down a long screen
  | 'orbit'       // orbital rotation around Y
  | 'macro'       // close on one region, background softens
  | 'settle';     // arrives and gently overshoots to rest

export interface Shot {
  /** 1-30, for readability against the script document. */
  n: number;
  /**
   * Key into the screen registry, or a plate filename. `null` renders the
   * device dark — used only for the cold-open beats.
   */
  screen: string | null;
  camera: CameraMove;
  /** Big kinetic headline. Kept to a few words; it is not the voiceover. */
  text: string;
  /** The spoken line. 7-11 words so it lands in 1.8-2.4s and leaves air. */
  vo: string;
  /**
   * Which vertical slice of a tall screenshot to favour, 0 = top, 1 = bottom.
   * The camera frames the device; this only chooses what the device is
   * currently scrolled to, which is a property of the screen, not the camera.
   */
  focus?: number;
  /** Accent that lights the background mesh and the rim for this shot. */
  accent?: string;
}

export interface AdScript {
  id: string;
  title: string;
  /** Edge-TTS voice; never a *MultilingualNeural one. */
  voice: string;
  rate: string;
  pitch: string;
  shots: Shot[];
}
