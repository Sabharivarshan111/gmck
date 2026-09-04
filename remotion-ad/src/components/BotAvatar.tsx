import React from 'react';
import { useCurrentFrame } from 'remotion';

interface BotAvatarProps {
  stage?: 1 | 2 | 3 | 4 | 5 | 6;
  state?: 'idle' | 'thinking' | 'talking' | 'celebrating';
  size?: number;
  /**
   * Override the stage colour.
   *
   * Inside the chat mock the colour IS the level, so nothing passes this. In
   * an ad the mascot is the one figure carrying a shot whose accent lights the
   * rim, the caption and the backlight — a bot that stays violet through an
   * amber shot reads as a sticker pasted on rather than as something standing
   * in the room. Optional, so the chat screen is untouched.
   */
  color?: string;
  /**
   * The little "LVL n AI BOT" strap. `null` removes it.
   *
   * It is right in the chat mock, where it explains the avatar's level. In an
   * ad it is four words of chrome under a face, at a size nobody reads, in the
   * one shot the viewer is deciding whether to keep watching.
   */
  badge?: string | null;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({
  stage = 4,
  state = 'talking',
  size = 140,
  color,
  badge
}) => {
  const frame = useCurrentFrame();

  const bounce = Math.sin(frame * 0.15) * 6;
  const eyeBlink = frame % 90 > 84 ? 0.1 : 1;
  const mouthMove = state === 'talking' ? 0.4 + Math.sin(frame * 0.4) * 0.6 : 0.2;
  const auraPulse = 0.8 + Math.sin(frame * 0.2) * 0.2;

  const stageColors = {
    1: '#94a3b8',
    2: '#38bdf8',
    3: '#818cf8',
    4: '#c084fc',
    5: '#f43f5e',
    6: '#fbbf24'
  };

  const currentColor = color ?? stageColors[stage];
  const strap = badge === undefined ? `LVL ${stage} AI BOT` : badge;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${bounce}px)`
      }}
    >
      {/* Outer Glowing Holographic Aura */}
      <div
        style={{
          position: 'absolute',
          inset: -12,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentColor}60 0%, transparent 70%)`,
          transform: `scale(${auraPulse})`,
          filter: 'blur(8px)',
          pointerEvents: 'none'
        }}
      />

      {/* Bot Head Glass Bubble */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '32px',
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          border: `2px solid ${currentColor}`,
          boxShadow: `0 0 25px ${currentColor}50, inset 0 0 15px rgba(255,255,255,0.15)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Antennas / Tech Crest for higher stages */}
        {stage >= 3 && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              width: '28px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: currentColor,
              boxShadow: `0 0 8px ${currentColor}`
            }}
          />
        )}

        {/* Eyes Screen */}
        <div
          style={{
            display: 'flex',
            gap: `${size * 0.16}px`,
            marginBottom: `${size * 0.08}px`,
            alignItems: 'center'
          }}
        >
          {/* Left Eye */}
          <div
            style={{
              width: `${size * 0.16}px`,
              height: `${size * 0.22 * eyeBlink}px`,
              borderRadius: '8px',
              backgroundColor: currentColor,
              boxShadow: `0 0 12px ${currentColor}`
            }}
          />
          {/* Right Eye */}
          <div
            style={{
              width: `${size * 0.16}px`,
              height: `${size * 0.22 * eyeBlink}px`,
              borderRadius: '8px',
              backgroundColor: currentColor,
              boxShadow: `0 0 12px ${currentColor}`
            }}
          />
        </div>

        {/* Mouth Wave */}
        <div
          style={{
            width: `${size * 0.35}px`,
            height: `${size * 0.08 * mouthMove}px`,
            borderRadius: '10px',
            backgroundColor: currentColor,
            boxShadow: `0 0 8px ${currentColor}`
          }}
        />

        {/* Stage Badge */}
        {strap ? (
          <div
            style={{
              position: 'absolute',
              bottom: `${Math.max(4, size * 0.03)}px`,
              fontSize: `${Math.max(9, size * 0.064)}px`,
              fontWeight: 800,
              color: currentColor,
              letterSpacing: '0.05em'
            }}
          >
            {strap}
          </div>
        ) : null}
      </div>
    </div>
  );
};
