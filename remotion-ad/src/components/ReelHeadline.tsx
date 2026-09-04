import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';

interface ReelHeadlineProps {
  text: string;
  accent: string;
  durationInFrames: number;
}

/**
 * The one piece of text a reel shot puts on screen.
 *
 * The long-form ads caption the *spoken* line word by word, which works when
 * the viewer has chosen to watch a 90-second film. A reel is watched muted,
 * scrolled past in under two seconds, and re-cut without voice entirely — so
 * the text has to be the argument rather than a transcript of it. Every reel
 * shot therefore carries one short headline and nothing else, and it says the
 * same thing the voice says. Visual, spoken and text hooks aligned is the
 * single largest lever on whether the first three seconds hold.
 *
 * Two placement rules, both measured rather than chosen:
 *
 * * **`bottom: 330`.** Instagram and TikTok draw their own caption, handle and
 *   action rail over roughly the bottom 260–290px of a 1920 frame. Text below
 *   that is text nobody reads. The long-form ads sit at 120 because they were
 *   tuned to clear the phone rather than the platform; a reel has to clear
 *   both, which is why `ShotTimeline` also lifts and slightly shrinks the
 *   device for this format.
 * * **The words arrive inside ten frames.** A third of a second, so the
 *   headline is fully legible well before the ~1.7s at which a Reels viewer
 *   has already decided. A stagger that looks elegant at 90 seconds is a
 *   headline that finishes assembling after the scroll.
 */
export const ReelHeadline: React.FC<ReelHeadlineProps> = ({ text, accent, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return null;

  const opacity = interpolate(
    frame,
    [0, 5, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // The accent rule wipes in under the words and holds. It is the only thing
  // on screen that is pure accent, so it also carries the shot's colour.
  const ruleWidth = interpolate(frame, [2, 16], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '330px',
        left: '64px',
        right: '64px',
        zIndex: 60,
        opacity,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '0 18px',
          padding: '18px 34px',
          borderRadius: '28px',
          background: 'rgba(3, 7, 18, 0.82)',
          backdropFilter: 'blur(22px)',
          border: '1.5px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 18px 46px rgba(0, 0, 0, 0.7)',
        }}
      >
        {words.map((word, i) => {
          const entrance = spring({
            frame: Math.max(0, frame - i * 2),
            fps,
            config: { damping: 15, stiffness: 170, mass: 0.6 },
          });
          return (
            <span
              key={`${word}-${i}`}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                fontSize: '58px',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.12,
                color: '#ffffff',
                textShadow: `0 4px 24px rgba(0,0,0,0.8), 0 0 34px ${accent}55`,
                display: 'inline-block',
                opacity: entrance,
                transform: `translateY(${interpolate(entrance, [0, 1], [22, 0])}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      <div
        style={{
          width: `${ruleWidth * 0.4}%`,
          height: '6px',
          borderRadius: '3px',
          background: accent,
          boxShadow: `0 0 26px ${accent}`,
        }}
      />
    </div>
  );
};
