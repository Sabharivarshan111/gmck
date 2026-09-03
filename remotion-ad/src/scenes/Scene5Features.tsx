import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticTitle } from '../components/KineticTitle';
import { GlowBadge } from '../components/GlowBadge';
import { Particles } from '../components/Particles';

export const Scene5Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    {
      icon: '🤖',
      title: 'Ask AI Medical Professor',
      desc: '24/7 instant answers to viva questions, differential diagnoses & complex clinical mechanisms grounded in standard textbooks.',
      color: '#38bdf8'
    },
    {
      icon: '🌳',
      title: 'Botanical Focus Trees',
      desc: 'Plant and grow rare painterly tree species during your study sessions. Stay focused without phone distractions.',
      color: '#10b981'
    },
    {
      icon: '⚡',
      title: '100% Offline & Anki Sync',
      desc: 'Study anytime during hospital postings and commute without internet. Export full flashcard decks directly into Anki.',
      color: '#f59e0b'
    }
  ];

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
        background: 'radial-gradient(circle at 50% 40%, #064e3b 0%, #0f172a 50%, #030712 100%)',
        overflow: 'hidden',
        padding: '50px 40px'
      }}
    >
      <Particles />

      <GlowBadge
        icon="🚀"
        label="SMART STUDY ECOSYSTEM"
        delay={5}
        color="#10b981"
      />

      <div style={{ marginTop: '20px', maxWidth: '850px' }}>
        <KineticTitle
          title="Everything You Need to Ace MBBS"
          subtitle="Built by doctors for medical students. From first year foundation to final year clinical mastery."
          highlightWords={['Everything', 'Need', 'Ace', 'MBBS']}
          fontSize={52}
          subFontSize={22}
          delay={10}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginTop: '44px',
          width: '100%',
          maxWidth: '1050px',
          zIndex: 10
        }}
      >
        {features.map((feat, i) => {
          const cardSpring = spring({
            frame: frame - 20 - i * 8,
            fps,
            config: { damping: 12, stiffness: 110 }
          });
          const float = Math.sin((frame + i * 15) * 0.05) * 5;

          return (
            <div
              key={i}
              style={{
                padding: '30px 24px',
                borderRadius: '24px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: `1.5px solid ${feat.color}40`,
                boxShadow: `0 12px 30px -8px rgba(0,0,0,0.8), 0 0 25px ${feat.color}20`,
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transform: `translateY(${float}px) scale(${cardSpring})`,
                opacity: cardSpring
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: `${feat.color}20`,
                  border: `1px solid ${feat.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px'
                }}
              >
                {feat.icon}
              </div>

              <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                {feat.title}
              </div>

              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                {feat.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
