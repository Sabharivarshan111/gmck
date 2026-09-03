import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface GlowBadgeProps {
  icon?: string;
  label: string;
  delay?: number;
  color?: string;
  accent?: string;
}

export const GlowBadge: React.FC<GlowBadgeProps> = ({
  icon = '✨',
  label,
  delay = 0,
  color = '#38bdf8',
  accent
}) => {
  const activeColor = accent ?? color;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 140 }
  });

  const pulse = Math.sin((frame + delay * 5) * 0.08) * 0.05 + 1;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 24px',
        borderRadius: '9999px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        border: `1.5px solid ${color}40`,
        boxShadow: `0 0 24px ${color}30, inset 0 0 12px ${color}20`,
        transform: `scale(${scale * pulse})`,
        opacity: scale,
        zIndex: 10
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <span
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </span>
    </div>
  );
};
