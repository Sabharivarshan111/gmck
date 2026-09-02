import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface AuroraProps {
  theme?: 'apple' | 'college' | 'cyberpunk';
  accent?: string;
  intensity?: number;
}

export const AuroraMeshBackground: React.FC<AuroraProps> = ({
  theme = 'apple',
  accent,
  intensity = 1
}) => {
  const frame = useCurrentFrame();

  const orb1X = interpolate(frame % 300, [0, 150, 300], [20, 80, 20]);
  const orb1Y = interpolate(frame % 360, [0, 180, 360], [10, 60, 10]);
  const orb2X = interpolate(frame % 400, [0, 200, 400], [80, 20, 80]);
  const orb2Y = interpolate(frame % 280, [0, 140, 280], [70, 20, 70]);
  const orb3Scale = interpolate(frame % 200, [0, 100, 200], [1, 1.3, 1]);

  let c1 = '#0284c7', c2 = '#6366f1', c3 = '#0f172a', bg = '#020617';
  if (accent) {
    c1 = accent; c2 = `${accent}bb`; c3 = '#0f172a'; bg = '#030712';
  } else if (theme === 'college') {
    c1 = '#dc2626'; c2 = '#7c3aed'; c3 = '#1e1b4b'; bg = '#0a0101';
  } else if (theme === 'cyberpunk') {
    c1 = '#06b6d4'; c2 = '#d946ef'; c3 = '#4f46e5'; bg = '#000000';
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: bg,
        overflow: 'hidden',
        zIndex: 0
      }}
    >
      {/* Dynamic Aurora Mesh Orbs */}
      <div
        style={{
          position: 'absolute',
          top: `${orb1Y}%`,
          left: `${orb1X}%`,
          width: '500px',
          height: '500px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c1} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0.35,
          filter: 'blur(70px)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: `${orb2Y}%`,
          left: `${orb2X}%`,
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c2} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0.3,
          filter: 'blur(80px)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '700px',
          height: '700px',
          transform: `translate(-50%, -50%) scale(${orb3Scale})`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c3} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0.25,
          filter: 'blur(90px)'
        }}
      />
      {/* Subtle Fine Grid Texture */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.6
        }}
      />
    </div>
  );
};
