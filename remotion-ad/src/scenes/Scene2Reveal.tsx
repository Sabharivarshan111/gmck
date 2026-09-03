import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneMockup } from '../components/PhoneMockup';
import { KineticTitle } from '../components/KineticTitle';
import { GlowBadge } from '../components/GlowBadge';
import { Particles } from '../components/Particles';

export const Scene2Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneRotation = interpolate(frame, [0, 120], [-12, 4], {
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: 'radial-gradient(circle at 60% 50%, #064e3b 0%, #022c22 40%, #030712 100%)',
        overflow: 'hidden',
        padding: '40px 60px'
      }}
    >
      <Particles />

      {/* Left Text Presentation */}
      <div style={{ maxWidth: '540px', zIndex: 10 }}>
        <GlowBadge
          icon="⚡"
          label="THE ULTIMATE MBBS WEAPON"
          delay={5}
          color="#10b981"
        />

        <div style={{ marginTop: '24px' }}>
          <KineticTitle
            title="Meet Orbit MBBS: Study Less. Score Rank 1."
            subtitle="All 4 MBBS Years • 16 Standard Textbooks Grounded • 5,000+ Previous Year University Questions Solved."
            highlightWords={['Orbit', 'MBBS:', 'Rank', '1.']}
            align="left"
            fontSize={52}
            subFontSize={22}
            delay={10}
          />
        </div>

        {/* Feature Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '32px' }}>
          {[
            { icon: '✍️', text: 'AI Handwritten Notes (3-Page & 8-Page Depth)' },
            { icon: '🎨', text: '200+ Hand-Drawn University Diagrams' },
            { icon: '🌳', text: 'Spaced Repetition & Study Focus Tree' }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#e2e8f0',
                fontSize: '18px',
                fontWeight: 600
              }}
            >
              <span style={{ fontSize: '22px' }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right 3D Phone Screen Displaying Orbit Home */}
      <PhoneMockup delay={10} rotationY={phoneRotation} scale={0.92} glowColor="#10b981">
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#090d16',
            padding: '48px 18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            color: '#ffffff'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, letterSpacing: '0.05em' }}>
                ORBIT MBBS
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>Final Year MBBS</div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              🩺
            </div>
          </div>

          {/* Search Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '14px',
              background: '#1e293b',
              color: '#64748b',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔍 Search 5,000+ university PYQs...
          </div>

          {/* Subject Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
            {[
              { name: 'General Medicine', code: '680 PYQs', color: '#38bdf8', icon: '💊' },
              { name: 'General Surgery', code: '572 PYQs', color: '#f43f5e', icon: '🔪' },
              { name: 'Obstetrics & Gyn', code: '420 PYQs', color: '#ec4899', icon: '👶' },
              { name: 'Paediatrics', code: '310 PYQs', color: '#eab308', icon: '🍼' }
            ].map((sub, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 12px',
                  borderRadius: '18px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: `1px solid ${sub.color}30`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{sub.icon}</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{sub.name}</div>
                <div style={{ fontSize: '11px', color: sub.color, fontWeight: 600 }}>{sub.code}</div>
              </div>
            ))}
          </div>

          {/* Bottom Nav */}
          <div
            style={{
              marginTop: 'auto',
              padding: '12px',
              borderRadius: '20px',
              background: '#0f172a',
              display: 'flex',
              justifyContent: 'space-around',
              border: '1px solid #334155'
            }}
          >
            <span>🏠 Home</span>
            <span style={{ color: '#10b981' }}>📖 Notes</span>
            <span>🌳 Focus</span>
            <span>🤖 AI</span>
          </div>
        </div>
      </PhoneMockup>
    </div>
  );
};
