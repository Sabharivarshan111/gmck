import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface KineticTitleProps {
  title: string;
  subtitle?: string;
  highlightWords?: string[];
  align?: 'center' | 'left' | 'right';
  delay?: number;
  fontSize?: number;
  subFontSize?: number;
}

export const KineticTitle: React.FC<KineticTitleProps> = ({
  title,
  subtitle,
  highlightWords = [],
  align = 'center',
  delay = 0,
  fontSize = 64,
  subFontSize = 28
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 }
  });

  const subSpring = spring({
    frame: frame - delay - 8,
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.9 }
  });

  const words = title.split(' ');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end',
        textAlign: align,
        zIndex: 10
      }}
    >
      <h1
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          color: '#ffffff',
          margin: 0,
          textShadow: '0 4px 24px rgba(0,0,0,0.8), 0 0 40px rgba(56,189,248,0.2)',
          transform: `scale(${0.85 + titleSpring * 0.15}) translateY(${(1 - titleSpring) * 30}px)`,
          opacity: titleSpring
        }}
      >
        {words.map((w, i) => {
          const isHighlight = highlightWords.some(hw => w.toLowerCase().includes(hw.toLowerCase()));
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '0.25em',
                background: isHighlight
                  ? 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)'
                  : 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: isHighlight ? 'drop-shadow(0 0 20px rgba(56,189,248,0.5))' : 'none'
              }}
            >
              {w}
            </span>
          );
        })}
      </h1>

      {subtitle && (
        <p
          style={{
            fontSize: `${subFontSize}px`,
            fontWeight: 500,
            color: '#94a3b8',
            margin: '16px 0 0 0',
            maxWidth: '85%',
            lineHeight: 1.4,
            transform: `translateY(${(1 - subSpring) * 20}px)`,
            opacity: subSpring,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
