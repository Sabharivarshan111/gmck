import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticTitle } from '../components/KineticTitle';
import { GlowBadge } from '../components/GlowBadge';
import { Particles } from '../components/Particles';

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulse effect on countdown
  const timerShake = Math.sin(frame * 0.4) * (frame > 60 ? 3 : 0);
  const pulseScale = 1 + Math.sin(frame * 0.2) * 0.05;

  const cardsEntrance = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 100 }
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 40%, #1e1b4b 0%, #030712 100%)',
        overflow: 'hidden',
        padding: '60px 40px'
      }}
    >
      <Particles />

      {/* Top Warning Badge */}
      <div style={{ marginBottom: '32px' }}>
        <GlowBadge
          icon="🚨"
          label="MBBS UNIVERSITY EXAMS ALERT"
          delay={5}
          color="#ef4444"
        />
      </div>

      {/* Main Punchy Kinetic Title */}
      <div style={{ maxWidth: '900px', transform: `translateX(${timerShake}px)` }}>
        <KineticTitle
          title="5,000+ PYQs. Bulky Textbooks. Exam in 30 Days?"
          subtitle="Are you still flipping through 1,500-page textbooks in panic the night before university exams?"
          highlightWords={['5,000+', 'Textbooks.', 'Panic']}
          fontSize={56}
          subFontSize={24}
          delay={12}
        />
      </div>

      {/* Panic Floating Elements (Textbook Stress vs Countdown) */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          marginTop: '48px',
          transform: `scale(${cardsEntrance}) translateY(${(1 - cardsEntrance) * 40}px)`,
          opacity: cardsEntrance,
          zIndex: 10
        }}
      >
        <div
          style={{
            padding: '20px 28px',
            borderRadius: '24px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <span style={{ fontSize: '36px' }}>📚</span>
          <div>
            <div style={{ color: '#fca5a5', fontWeight: 800, fontSize: '20px' }}>
              16 Heavy Textbooks
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              Impossible to finish in time
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '20px 28px',
            borderRadius: '24px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1.5px solid rgba(245, 158, 11, 0.3)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transform: `scale(${pulseScale})`
          }}
        >
          <span style={{ fontSize: '36px' }}>⏳</span>
          <div>
            <div style={{ color: '#fcd34d', fontWeight: 800, fontSize: '20px' }}>
              Countdown Ticking
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              Zero structured notes?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
