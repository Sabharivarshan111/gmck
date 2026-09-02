import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

/** The small category pill at the top. Present the whole ad, never animated
 *  per shot — a chrome element that re-animates on every cut is noise. */
export const GlowBadge: React.FC<{ label: string; accent: string }> = ({ label, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 20, mass: 0.8, stiffness: 90 } });

  return (
    <div
      style={{
        position: 'absolute',
        top: 132,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: enter,
        transform: `translateY(${(1 - enter) * -18}px)`,
      }}
    >
      <div
        style={{
          padding: '12px 26px',
          borderRadius: 999,
          background: 'rgba(3,7,18,0.6)',
          backdropFilter: 'blur(18px)',
          boxShadow: `inset 0 0 0 1px ${accent}55, 0 0 34px -12px ${accent}`,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#E2E8F0',
        }}
      >
        {label}
      </div>
    </div>
  );
};
