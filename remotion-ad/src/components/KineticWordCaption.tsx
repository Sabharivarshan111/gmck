import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * The headline, in the one place Instagram and TikTok will not cover.
 *
 * `bottom: 308px` is not a taste decision. Reels puts the like / comment /
 * share rail and the caption block over roughly the bottom 260-290px of a
 * 1920-tall frame; anything at 80-120px — which is where captions instinctively
 * go — is simply not visible to most of the audience. The frosted capsule keeps
 * it legible when the shot behind it is bright.
 */
export const KineticWordCaption: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!text) return null;

  const words = text.split(' ');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 308,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 56px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 14px',
          padding: '20px 30px',
          borderRadius: 26,
          background: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(22px)',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.10), 0 18px 50px -20px ${accent}66`,
        }}
      >
        {words.map((word, i) => {
          // Words arrive one after another rather than the line fading in — the
          // eye tracks a moving word and ignores a fading block.
          const enter = spring({
            frame: (frame % 90) - i * 3,
            fps,
            config: { damping: 18, mass: 0.6, stiffness: 140 },
          });
          return (
            <span
              key={`${word}-${i}`}
              style={{
                fontFamily: 'Inter, "SF Pro Display", system-ui, sans-serif',
                fontSize: 52,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#F8FAFC',
                opacity: enter,
                transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px)`,
                display: 'inline-block',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
