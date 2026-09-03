import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const BotanicalTree: React.FC = () => {
  const frame = useCurrentFrame();

  const sway = Math.sin(frame * 0.08) * 4;
  const growthStage = Math.min(3, Math.floor(frame / 60) + 1);

  return (
    <div
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: '20px',
        background: 'rgba(6, 78, 59, 0.2)',
        border: '1.5px solid rgba(16, 185, 129, 0.4)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        color: '#ffffff'
      }}
    >
      {/* Botanical Tree Graphic */}
      <div
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #065f46 0%, #022c22 100%)',
          border: '2px solid #10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: growthStage === 1 ? '28px' : growthStage === 2 ? '36px' : '44px',
          boxShadow: '0 0 20px rgba(16,185,129,0.4)',
          transform: `rotate(${sway}deg)`
        }}
      >
        {growthStage === 1 ? '🌱' : growthStage === 2 ? '🌿' : '🌸'}
      </div>

      {/* Pomodoro Timer Stats */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', letterSpacing: '0.04em' }}>
            FOCUS TREE • JACARANDA
          </span>
          <span style={{ fontSize: '11px', color: '#6ee7b7' }}>STAGE {growthStage}/3</span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '2px' }}>
          24:45 <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Remaining</span>
        </div>
        <div
          style={{
            marginTop: '6px',
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: '#1e293b',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${(growthStage / 3) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #34d399)'
            }}
          />
        </div>
      </div>
    </div>
  );
};
