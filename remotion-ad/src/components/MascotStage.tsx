import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BotAvatar } from './BotAvatar';

interface MascotStageProps {
  mode: 'hero' | 'guide';
  accent: string;
  durationInFrames: number;
  /** Which side of the frame it stands on. Alternated so it is not wallpaper. */
  side?: 'left' | 'right';
}

/**
 * The mascot, staged as a presenter rather than as a decal.
 *
 * `BotAvatar` has existed since the first cut of this repo and had never been
 * in an ad — it only ever appeared inside the fake chat screen, at 140px,
 * behind a phone bezel. This is the component that gives it the room, and the
 * two modes here are the whole staging idea:
 *
 * * **`hero`** — it has the frame to itself and the device is not drawn at
 *   all. This is the open and the close, and it is what makes the ad feel
 *   presented by somebody. A face is the fastest thing a human parses; putting
 *   one in frame one is the strongest opening this app owns that is not a
 *   number.
 *
 * * **`guide`** — the app screen is the subject and the mascot stands in the
 *   near corner, in front of the device, talking. It enters from off-frame
 *   with a lean towards the phone, which is the hand-off: the eye follows the
 *   lean onto the screen, and then the screen is the thing being watched. It
 *   holds for the shot rather than bouncing in and out, because a figure that
 *   re-enters every three seconds is a distraction competing with the product.
 *
 * Two rules it obeys, both of them house rules that already cost a re-cut:
 *
 * * **Nothing scales from zero.** The entrance springs from 0.86, never 0 — a
 *   `scale(0)` entrance reads as materialising out of nowhere.
 * * **It never draws a box, a bracket or an arrow at the screen.** Attention
 *   moves by lean, by light and by the backlight already behind the device.
 *   The pointing rectangle is failure mode #5 in the skill.
 *
 * It sits above the device and below the caption. The caption band starts at
 * `bottom: 330`, so the guide's feet are at 470 — it never covers the words
 * the muted viewer is reading.
 */
export const MascotStage: React.FC<MascotStageProps> = ({
  mode,
  accent,
  durationInFrames,
  side = 'left',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.9 },
  });

  const leave = interpolate(frame, [durationInFrames - 9, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  // The lean: strongest as it arrives, relaxing as the shot settles. This is
  // the hand-off — the body language points at the screen, so nothing has to
  // be drawn pointing at it.
  const lean = interpolate(entrance, [0, 0.55, 1], [0, side === 'left' ? 9 : -9, side === 'left' ? 4 : -4]);

  if (mode === 'hero') {
    const size = 400;
    const rise = interpolate(entrance, [0, 1], [46, 0]);
    const halo = 0.9 + Math.sin(frame * 0.07) * 0.06;

    return (
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '560px',
          opacity: leave,
          pointerEvents: 'none',
          zIndex: 40,
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `translateY(${rise}px) scale(${interpolate(entrance, [0, 1], [0.86, 1])})`,
          }}
        >
          {/* Room light rather than a rectangle: a wide soft pool behind the
              figure, so it reads as standing somewhere instead of floating. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${size * 3.1}px`,
              height: `${size * 3.1}px`,
              marginLeft: `${-size * 1.55}px`,
              marginTop: `${-size * 1.55}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accent}2E 0%, ${accent}0F 38%, transparent 68%)`,
              filter: 'blur(48px)',
              transform: `scale(${halo})`,
            }}
          />
          <BotAvatar stage={4} state="talking" size={size} color={accent} badge={null} />
        </div>
      </AbsoluteFill>
    );
  }

  const size = 196;
  const slide = interpolate(entrance, [0, 1], [side === 'left' ? -190 : 190, 0]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 40, opacity: leave }}>
      <div
        style={{
          position: 'absolute',
          bottom: '470px',
          [side]: '54px',
          transform: `translateX(${slide}px) rotate(${lean}deg) scale(${interpolate(
            entrance,
            [0, 1],
            [0.86, 1],
          )})`,
          transformOrigin: side === 'left' ? '20% 80%' : '80% 80%',
          filter: 'drop-shadow(0 26px 40px rgba(0,0,0,0.75))',
        }}
      >
        <BotAvatar stage={4} state="talking" size={size} color={accent} badge={null} />
      </div>
    </AbsoluteFill>
  );
};
