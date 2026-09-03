import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticTitle } from '../components/KineticTitle';
import { GlowBadge } from '../components/GlowBadge';
import { Particles } from '../components/Particles';

export const Scene4Diagrams: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const carouselEntrance = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 100 }
  });

  const cards = [
    {
      title: 'GALLBLADDER MASTER ANATOMY',
      subtitle: 'Calot\'s Triangle, Relations & Embryology',
      subject: 'Anatomy',
      color: '#10b981',
      icon: '🫀'
    },
    {
      title: 'STOMACH LYMPHATIC DRAINAGE',
      subtitle: '4 Clog\'s Areas, Celiac Nodes & Virchow\'s Node',
      subject: 'Anatomy',
      color: '#38bdf8',
      icon: '🩸'
    },
    {
      title: 'PAIN NEUROPHYSIOLOGY PATHWAY',
      subtitle: 'A-delta vs C Fibers & Gate Control Theory',
      subject: 'Physiology',
      color: '#c084fc',
      icon: '⚡'
    },
    {
      title: 'KNEE JOINT STABILITY & CRUCIATES',
      subtitle: 'Menisci, Collaterals & Locking/Unlocking',
      subject: 'Anatomy',
      color: '#f59e0b',
      icon: '🦴'
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
        background: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #090d16 60%, #030712 100%)',
        overflow: 'hidden',
        padding: '50px 40px'
      }}
    >
      <Particles />

      <GlowBadge
        icon="🎨"
        label="EXCLUSIVELY HAND-CRAFTED DIAGRAMS"
        delay={5}
        color="#c084fc"
      />

      <div style={{ marginTop: '20px', maxWidth: '850px' }}>
        <KineticTitle
          title="200+ Hand-Drawn Medical Diagrams"
          subtitle="Stop losing marks on crude sketches. Get textbook-standard, high-yield diagrams with straight pointer lines and color-coded zones."
          highlightWords={['200+', 'Hand-Drawn', 'Medical', 'Diagrams']}
          fontSize={52}
          subFontSize={22}
          delay={10}
        />
      </div>

      {/* Floating Diagram Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginTop: '44px',
          width: '100%',
          maxWidth: '1100px',
          transform: `scale(${carouselEntrance}) translateY(${(1 - carouselEntrance) * 40}px)`,
          opacity: carouselEntrance,
          zIndex: 10
        }}
      >
        {cards.map((card, i) => {
          const cardSpring = spring({
            frame: frame - 20 - i * 6,
            fps,
            config: { damping: 12, stiffness: 120 }
          });
          const float = Math.sin((frame + i * 15) * 0.05) * 6;

          return (
            <div
              key={i}
              style={{
                padding: '24px 20px',
                borderRadius: '24px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: `1.5px solid ${card.color}40`,
                boxShadow: `0 12px 30px -8px rgba(0,0,0,0.8), 0 0 20px ${card.color}20`,
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transform: `translateY(${float}px) scale(${cardSpring})`,
                opacity: cardSpring
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '32px' }}>{card.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: card.color, textTransform: 'uppercase' }}>
                  {card.subject}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                {card.title}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                {card.subtitle}
              </div>
              <div
                style={{
                  marginTop: 'auto',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  background: `${card.color}15`,
                  color: card.color,
                  fontSize: '11px',
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              >
                ✓ Exam Approved
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
