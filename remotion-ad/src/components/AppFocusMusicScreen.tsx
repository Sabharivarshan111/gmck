import React from 'react';
import { interpolate, useCurrentFrame, staticFile, Img } from 'remotion';

export const AppFocusMusicScreen: React.FC = () => {
  const frame = useCurrentFrame();

  const sway = Math.sin(frame * 0.08) * 3;
  const treeSpecies = ['sprout.png', 'sapling.png', 'jacaranda.png', 'cherry.png'];
  const activeTreeIdx = Math.min(3, Math.floor(frame / 40));
  const currentTree = treeSpecies[activeTreeIdx];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#090d16',
        padding: '50px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>← Focus & Study Hub</div>
        <div style={{ padding: '4px 10px', borderRadius: '10px', background: '#10b98120', color: '#10b981', fontSize: '11px', fontWeight: 800 }}>
          POMODORO ACTIVE
        </div>
      </div>

      {/* Real Botanical Tree Card */}
      <div
        style={{
          padding: '16px',
          borderRadius: '20px',
          background: 'radial-gradient(circle at 50% 30%, #064e3b 0%, #022c22 60%, #030712 100%)',
          border: '1.5px solid rgba(16,185,129,0.4)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '8px'
        }}
      >
        <div
          style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #10b981',
            boxShadow: '0 0 25px rgba(16,185,129,0.5)',
            transform: `rotate(${sway}deg)`
          }}
        >
          <Img
            src={staticFile(`trees/${currentTree}`)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc' }}>
          Flowering Jacaranda • Stage {activeTreeIdx + 1}/4
        </div>
        <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>
          24:45 <span style={{ fontSize: '12px', color: '#94a3b8' }}>Focus Timer</span>
        </div>
      </div>

      {/* LiquidGlass Ambient Music Player Card */}
      <div
        style={{
          padding: '14px',
          borderRadius: '18px',
          background: 'rgba(30, 27, 75, 0.5)',
          border: '1.5px solid rgba(129, 140, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎧</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800 }}>Binaural 432Hz Study Waves</div>
            <div style={{ fontSize: '10px', color: '#818cf8' }}>Deep Clinical Focus Soundscape</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
          {[0.5, 0.9, 0.4, 0.8, 1.0, 0.6, 0.7].map((h, i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: `${Math.max(3, Math.sin((frame + i * 8) * 0.25) * 8 + h * 12)}px`,
                borderRadius: '2px',
                background: '#38bdf8'
              }}
            />
          ))}
        </div>
      </div>

      {/* Attached Media Hub */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: '16px',
          background: '#1e293b',
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px'
        }}
      >
        <span>🎥 Lecture Video + 📄 Ward Case Sheet PDF</span>
        <span style={{ color: '#10b981', fontWeight: 800 }}>Attached</span>
      </div>
    </div>
  );
};
