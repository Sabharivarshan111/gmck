import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticTitle } from '../components/KineticTitle';
import { GlowBadge } from '../components/GlowBadge';
import { Particles } from '../components/Particles';

export const Scene6OutroCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.8 }
  });

  const ctaSpring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 100 }
  });

  const buttonPulse = 1 + Math.sin(frame * 0.15) * 0.04;

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
        background: 'radial-gradient(circle at 50% 40%, #312e81 0%, #0f172a 60%, #030712 100%)',
        overflow: 'hidden',
        padding: '50px 40px',
        textAlign: 'center'
      }}
    >
      <Particles />

      {/* Glowing Animated App Icon */}
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '52px',
          boxShadow: '0 0 50px rgba(56,189,248,0.6), 0 20px 40px rgba(0,0,0,0.8)',
          border: '3px solid rgba(255,255,255,0.4)',
          transform: `scale(${logoSpring}) translateY(${(1 - logoSpring) * 30}px)`,
          opacity: logoSpring,
          marginBottom: '28px',
          zIndex: 10
        }}
      >
        🪐
      </div>

      <div style={{ maxWidth: '850px', zIndex: 10 }}>
        <KineticTitle
          title="Ace Your University Exams with Orbit MBBS"
          subtitle="Join thousands of medical students mastering university exams effortlessly."
          highlightWords={['Ace', 'University', 'Orbit', 'MBBS']}
          fontSize={54}
          subFontSize={22}
          delay={12}
        />
      </div>

      {/* Main Download CTA Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginTop: '40px',
          transform: `scale(${ctaSpring * buttonPulse}) translateY(${(1 - ctaSpring) * 30}px)`,
          opacity: ctaSpring,
          zIndex: 10
        }}
      >
        <div
          style={{
            padding: '16px 36px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '20px',
            letterSpacing: '0.02em',
            boxShadow: '0 0 35px rgba(56,189,248,0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <span>📲</span>
          <span>Download Free on Google Play & App Store</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          marginTop: '32px',
          color: '#94a3b8',
          fontSize: '14px',
          fontWeight: 600,
          opacity: ctaSpring,
          zIndex: 10
        }}
      >
        <span>★ 4.9/5 Rating</span>
        <span>•</span>
        <span>100% Free to Get Started</span>
        <span>•</span>
        <span>All 4 MBBS Years</span>
      </div>
    </div>
  );
};
