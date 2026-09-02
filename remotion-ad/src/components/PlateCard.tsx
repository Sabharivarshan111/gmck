import React from 'react';
import { AbsoluteFill, Img, interpolate } from 'remotion';
import type { CameraMove } from '../scripts/types';

/**
 * A medical plate, filling the frame as a lit card.
 *
 * A plate is the subject of its shot, not something being viewed on a phone, so
 * it is not put inside the device. It is still driven by the same camera moves
 * so the cut into and out of it matches the shots around it.
 */
export const PlateCard: React.FC<{ src: string; move: CameraMove; t: number; accent: string }> = ({
  src, move, t, accent,
}) => {
  const ease = t * t * (3 - 2 * t);
  const zoom =
    move === 'macro' ? 1.3 + ease * 0.16
    : move === 'push' ? 1.0 + ease * 0.14
    : move === 'pull' ? 1.22 - ease * 0.2
    : move === 'orbit' ? 1.06
    : move === 'trackLeft' ? 1.14
    : 1.02 + ease * 0.06;
  const ry = move === 'orbit' ? -14 + ease * 28 : move === 'trackLeft' ? 8 - ease * 16 : -4 + ease * 6;
  const x = move === 'trackLeft' ? 90 - ease * 180 : 0;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1800 }}>
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          borderRadius: 600,
          background: `radial-gradient(50% 50% at 50% 50%, ${accent}44 0%, transparent 68%)`,
          filter: 'blur(100px)',
        }}
      />
      <div
        style={{
          transform: `translateX(${x}px) scale(${zoom}) rotateY(${ry}deg)`,
          borderRadius: 30,
          overflow: 'hidden',
          maxWidth: 880,
          boxShadow: `0 40px 90px -30px rgba(0,0,0,0.95), inset 0 0 0 1.5px rgba(255,255,255,0.12)`,
          background: '#fff',
        }}
      >
        <Img src={src} style={{ width: 880, display: 'block' }} />
      </div>
    </AbsoluteFill>
  );
};
