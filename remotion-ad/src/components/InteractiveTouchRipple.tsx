import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export type TouchPreset =
  | 'bottomNavHome'
  | 'bottomNavBrowse'
  | 'bottomNavNotes'
  | 'bottomNavTimer'
  | 'bottomNavAI'
  | 'bottomNavProgress'
  | 'questionCard'
  | 'tripleTap'
  | 'diagramCard'
  | 'aiSendButton'
  | 'timerStartButton'
  | 'mcqOption'
  | 'flashcardFlip'
  | 'themeSwatch'
  | { x: number; y: number };

interface InteractiveTouchRippleProps {
  preset: TouchPreset;
  startFrame?: number;
  accent?: string;
  isTripleTap?: boolean;
}

const PRESET_COORDS: Record<string, { x: number; y: number }> = {
  bottomNavHome: { x: 10, y: 94 },
  bottomNavBrowse: { x: 30, y: 94 },
  bottomNavNotes: { x: 30, y: 94 },
  bottomNavTimer: { x: 50, y: 94 },
  bottomNavAI: { x: 70, y: 94 },
  bottomNavProgress: { x: 90, y: 94 },
  questionCard: { x: 50, y: 38 },
  tripleTap: { x: 50, y: 42 },
  diagramCard: { x: 50, y: 40 },
  aiSendButton: { x: 88, y: 92 },
  timerStartButton: { x: 50, y: 78 },
  mcqOption: { x: 50, y: 55 },
  flashcardFlip: { x: 50, y: 50 },
  themeSwatch: { x: 85, y: 15 }
};

export const InteractiveTouchRipple: React.FC<InteractiveTouchRippleProps> = ({
  preset,
  startFrame = 18,
  accent = '#38bdf8',
  isTripleTap = false
}) => {
  const frame = useCurrentFrame();

  const coords = typeof preset === 'string' ? PRESET_COORDS[preset] ?? { x: 50, y: 50 } : preset;

  if (isTripleTap) {
    const tapOffsets = [0, 8, 16];
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 80
        }}
      >
        {tapOffsets.map((offset, idx) => {
          const tFrame = frame - (startFrame + offset);
          if (tFrame < 0 || tFrame > 25) return null;

          const ringScale = interpolate(tFrame, [0, 20], [0.2, 2.2], {
            extrapolateRight: 'clamp'
          });
          const ringOpacity = interpolate(tFrame, [0, 4, 20], [0, 0.9, 0], {
            extrapolateRight: 'clamp'
          });

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                top: `${coords.y}%`,
                left: `${coords.x}%`,
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: `2px solid ${accent}`,
                background: `radial-gradient(circle, ${accent}66 0%, transparent 70%)`,
                transform: `translate(-50%, -50%) scale(${ringScale})`,
                opacity: ringOpacity,
                boxShadow: `0 0 20px ${accent}`
              }}
            />
          );
        })}
      </div>
    );
  }

  // Single tap ripple
  const tFrame = frame - startFrame;
  if (tFrame < 0 || tFrame > 30) return null;

  const ringScale = interpolate(tFrame, [0, 24], [0.3, 2.4], {
    extrapolateRight: 'clamp'
  });
  const ringOpacity = interpolate(tFrame, [0, 5, 24], [0, 0.85, 0], {
    extrapolateRight: 'clamp'
  });
  const centerDotScale = interpolate(tFrame, [0, 6, 16], [0, 1.1, 0], {
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 80
      }}
    >
      {/* Outer Expanding Glass Ring */}
      <div
        style={{
          position: 'absolute',
          top: `${coords.y}%`,
          left: `${coords.x}%`,
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          border: `2px solid ${accent}`,
          background: `radial-gradient(circle, ${accent}55 0%, transparent 65%)`,
          transform: `translate(-50%, -50%) scale(${ringScale})`,
          opacity: ringOpacity,
          boxShadow: `0 0 25px ${accent}88`
        }}
      />

      {/* Inner Haptic Touch Point */}
      <div
        style={{
          position: 'absolute',
          top: `${coords.y}%`,
          left: `${coords.x}%`,
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: `0 0 15px #ffffff, 0 0 30px ${accent}`,
          transform: `translate(-50%, -50%) scale(${centerDotScale})`,
          opacity: centerDotScale > 0 ? 0.9 : 0
        }}
      />
    </div>
  );
};
