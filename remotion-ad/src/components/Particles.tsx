import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

const PARTICLES: Particle[] = Array.from({ length: 35 }).map((_, i) => ({
  x: (i * 37) % 100,
  y: (i * 61) % 100,
  size: 2 + (i % 5) * 2,
  speed: 0.3 + (i % 4) * 0.25,
  opacity: 0.2 + (i % 5) * 0.15,
  color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#818cf8' : '#c084fc'
}));

export const Particles: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      {PARTICLES.map((p, idx) => {
        const currentY = (p.y - (frame * p.speed * 0.15)) % 100;
        const normalizedY = currentY < 0 ? currentY + 100 : currentY;
        const floatX = p.x + Math.sin((frame + idx * 20) * 0.03) * 3;
        const pulse = 0.7 + Math.sin((frame + idx * 10) * 0.05) * 0.3;

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${floatX}%`,
              top: `${normalizedY}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity: p.opacity * pulse,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              filter: 'blur(0.5px)'
            }}
          />
        );
      })}
    </div>
  );
};
