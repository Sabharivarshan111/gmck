import React from 'react';
import { useCurrentFrame } from 'remotion';

export const MusicPlayerCard: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: '100%',
        padding: '14px 18px',
        borderRadius: '18px',
        background: 'rgba(30, 27, 75, 0.4)',
        border: '1.5px solid rgba(129, 140, 248, 0.3)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#ffffff'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>🎧</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            Deep Focus Lo-Fi Beats
          </div>
          <div style={{ fontSize: '11px', color: '#818cf8' }}>
            Binaural 432Hz • Orbit Soundscape
          </div>
        </div>
      </div>

      {/* Audio Waveform Equalizer Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '22px' }}>
        {[0.6, 0.9, 0.4, 0.8, 1.0, 0.5, 0.7].map((baseH, idx) => {
          const barHeight = Math.max(4, Math.sin((frame + idx * 8) * 0.2) * 10 + baseH * 16);
          return (
            <div
              key={idx}
              style={{
                width: '3px',
                height: `${barHeight}px`,
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #38bdf8, #818cf8)'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
