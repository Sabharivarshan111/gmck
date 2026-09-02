import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const AnkiDeckHub: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flip card back and forth
  const isFlipped = (frame % 120) > 60;
  const flipAngle = isFlipped ? 180 : 0;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        color: '#ffffff'
      }}
    >
      {/* Top Deck Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'rgba(56,189,248,0.1)',
          border: '1px solid rgba(56,189,248,0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📇</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
            Anki .apkg Deck Sync
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>1,240 Cards</span>
      </div>

      {/* 3D Flipping Flashcard */}
      <div
        style={{
          perspective: '800px',
          height: '140px',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1.5px solid #475569',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${flipAngle}deg)`
          }}
        >
          {!isFlipped ? (
            <div>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, marginBottom: '6px' }}>
                CARD QUESTION
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                "What is the gold standard investigation for Pheochromocytoma?"
              </div>
              <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '10px' }}>
                👆 Tap to Reveal Answer
              </div>
            </div>
          ) : (
            <div style={{ transform: 'rotateY(180deg)' }}>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, marginBottom: '6px' }}>
                GOLD STANDARD ANSWER
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                24-Hour Urinary Fractionated Metanephrines & Plasma Free Metanephrines
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                {['Again (<1m)', 'Hard (1d)', 'Good (3d)', 'Easy (7d)'].map((btn, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '6px',
                      background: idx === 2 ? '#10b98130' : '#334155',
                      color: idx === 2 ? '#10b981' : '#94a3b8',
                      fontSize: '9px',
                      fontWeight: 700
                    }}
                  >
                    {btn}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
