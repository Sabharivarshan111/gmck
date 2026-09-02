import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CameraMove } from '../scripts/types';

/**
 * A titanium phone in 3D space, and the one rule that matters.
 *
 * **The camera moves the device. It never touches the screen content.**
 * Every transform below is applied to the device container. The `<Img>` inside
 * renders at its natural aspect inside the bezel and is only ever *translated
 * vertically to a scroll position* — which is a property of the screen (where
 * the user has scrolled to), not a camera move. Scaling or cropping the inner
 * image is what previously cut off the navigation bar, softened the text, and
 * pushed headings under the Dynamic Island.
 */

const SCREEN_W = 393;
const SCREEN_H = 852;
const BEZEL = 13;

/**
 * The device is authored at handset pixel dimensions so the screenshot inside
 * renders 1:1 and stays crisp, then the whole container is scaled up to fill
 * the vertical frame. Scaling the container is safe; scaling the `<Img>` is the
 * thing that softened text and cropped the nav bar last time.
 *
 * 1.42 puts the device at ~65% of a 1920-tall frame, which leaves room for the
 * badge above and the caption capsule below without crowding either.
 */
const BASE_SCALE = 1.42;

/**
 * The device sits above centre so the caption capsule at `bottom: 308` lands on
 * the background, not across the app's own bottom navigation. Covering the nav
 * bar with our caption hides the very thing the shot is showing.
 */
const DEVICE_Y = -100;

interface CameraState {
  zoom: number;
  rx: number;
  ry: number;
  x: number;
  y: number;
  blur: number;
}

/**
 * Where the camera is, `t` seconds into a 3-second shot (t runs 0 → 1).
 *
 * Each move keeps moving for the whole shot — a camera that arrives and stops
 * dead reads as a slideshow. Springs are used where a move should settle
 * (arrivals), eased interpolation where it should glide (travels).
 */
const cameraFor = (move: CameraMove, t: number, settleSpring: number): CameraState => {
  const ease = t * t * (3 - 2 * t); // smoothstep

  switch (move) {
    /*
     * These are multipliers on BASE_SCALE, so 1.0 is already a device filling
     * ~71% of the frame. They are deliberately small: at this size a 0.12
     * change over three seconds is a clearly felt push, and anything larger
     * runs the device off the frame and into the caption.
     */
    case 'hero':
      return { zoom: 0.97 + ease * 0.03, rx: 4 - ease * 1.5, ry: -6 + ease * 2.5, x: 0, y: Math.sin(t * Math.PI) * -10, blur: 0 };
    case 'push':
      return { zoom: 0.99 + ease * 0.1, rx: 3 - ease * 2, ry: -4 + ease * 3, x: 0, y: -ease * 16, blur: 0 };
    case 'pull':
      return { zoom: 1.12 - ease * 0.15, rx: 1 + ease * 3, ry: 3 - ease * 7, x: 0, y: ease * 14, blur: 0 };
    case 'trackLeft':
      return { zoom: 1.02, rx: 2, ry: 10 - ease * 20, x: 80 - ease * 160, y: 0, blur: 0 };
    case 'trackRight':
      return { zoom: 1.02, rx: 2, ry: -10 + ease * 20, x: -80 + ease * 160, y: 0, blur: 0 };
    case 'glideDown':
      return { zoom: 1.04, rx: 5 - ease * 2, ry: -3, x: 0, y: 30 - ease * 60, blur: 0 };
    case 'orbit':
      return { zoom: 1.0, rx: 3, ry: -16 + ease * 32, x: 0, y: -6, blur: 0 };
    case 'macro':
      return { zoom: 1.16 + ease * 0.06, rx: 2, ry: -3 + ease * 4, x: 0, y: -ease * 20, blur: 0 };
    case 'settle':
    default:
      return { zoom: 0.94 + settleSpring * 0.07, rx: 6 - settleSpring * 5, ry: -10 + settleSpring * 9, x: 0, y: 28 - settleSpring * 28, blur: 0 };
  }
};

export const LayeredCameraPhone: React.FC<{
  src: string | null;
  move: CameraMove;
  /** Progress through the shot, 0 → 1. */
  t: number;
  accent: string;
  /** 0 = screen scrolled to top, 1 = bottom. A screen property, not a camera one. */
  focus?: number;
}> = ({ src, move, t, accent, focus = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const settleSpring = spring({ frame: frame % 90, fps, config: { damping: 16, mass: 0.9, stiffness: 90 } });
  const cam = cameraFor(move, t, settleSpring);

  // A slow float that never stops, so the device always feels held rather than
  // pasted onto the frame.
  const floatY = Math.sin(frame / 46) * 5;
  const floatR = Math.cos(frame / 58) * 0.7;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1800 }}>
      {/* Backlight: sits behind the device so the silhouette separates from the
          background. This is how attention is directed — never a drawn box. */}
      <div
        style={{
          position: 'absolute',
          width: SCREEN_W * 1.5,
          height: SCREEN_H * 1.1,
          borderRadius: 400,
          background: `radial-gradient(50% 50% at 50% 50%, ${accent}55 0%, transparent 70%)`,
          filter: 'blur(90px)',
          transform: `translateY(${floatY + DEVICE_Y}px) scale(${cam.zoom * BASE_SCALE})`,
        }}
      />

      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: [
            `translate3d(${cam.x}px, ${cam.y + floatY + DEVICE_Y}px, 0)`,
            `scale(${cam.zoom * BASE_SCALE})`,
            `rotateX(${cam.rx}deg)`,
            `rotateY(${cam.ry + floatR}deg)`,
          ].join(' '),
        }}
      >
        {/* Titanium frame: two chamfers, so the edge catches light like metal
            rather than reading as a flat rounded rectangle. */}
        <div
          style={{
            width: SCREEN_W + BEZEL * 2,
            height: SCREEN_H + BEZEL * 2,
            borderRadius: 58,
            padding: BEZEL,
            background: 'linear-gradient(145deg, #6b7280 0%, #1f2937 22%, #0b0f16 52%, #374151 82%, #9ca3af 100%)',
            boxShadow: `0 25px 60px -15px rgba(0,0,0,0.9), 0 0 90px -30px ${accent}88`,
          }}
        >
          <div
            style={{
              width: SCREEN_W,
              height: SCREEN_H,
              borderRadius: 46,
              overflow: 'hidden',
              position: 'relative',
              background: '#000',
              boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.10)',
            }}
          >
            {src ? (
              <Img
                src={src}
                style={{
                  // Natural width, natural aspect. The ONLY vertical offset is
                  // the screen's own scroll position.
                  width: SCREEN_W,
                  display: 'block',
                  transform: `translateY(${-focus * 100}%)`,
                  ...(focus > 0 ? { position: 'absolute', top: `${focus * 100}%` } : {}),
                }}
              />
            ) : null}

            {/* Specular sweep across the glass. Capped in dp, never a fraction
                of the surface — as a fraction it becomes a grey fog on a tall
                device. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(${112 + cam.ry}deg, rgba(255,255,255,0.14) 0%, transparent 18%, transparent 82%, rgba(255,255,255,0.06) 100%)`,
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Dynamic Island, drawn on the frame — never overlapping content
              because the screenshot inside is never scaled up under it. */}
          <div
            style={{
              position: 'absolute',
              top: BEZEL + 11,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 108,
              height: 30,
              borderRadius: 20,
              background: '#05070c',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
