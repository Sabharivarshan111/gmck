import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const AppDiagramsScreen: React.FC = () => {
  const frame = useCurrentFrame();

  const diagrams = [
    { title: 'GALLBLADDER MASTER ANATOMY', subtitle: "Calot's Triangle & Cystohepatic Angle", subject: 'Anatomy', color: '#10b981', icon: '🫀' },
    { title: "STOMACH LYMPHATIC CLOG'S", subtitle: '4 Zones, Celiac Nodes & Virchow', subject: 'Anatomy', color: '#38bdf8', icon: '🩸' },
    { title: 'PAIN NEUROPHYSIOLOGY', subtitle: 'Spinothalamic Tract & Gate Control', subject: 'Physiology', color: '#c084fc', icon: '⚡' },
    { title: 'KNEE JOINT CRUCIATES', subtitle: 'Menisci, Collaterals & Locking', subject: 'Anatomy', color: '#f59e0b', icon: '🦴' }
  ];

  const activeIdx = Math.floor((frame / 45) % diagrams.length);
  const current = diagrams[activeIdx];

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
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>← Visual Matrix</div>
        <div style={{ padding: '4px 10px', borderRadius: '10px', background: `${current.color}20`, color: current.color, fontSize: '11px', fontWeight: 800 }}>
          200+ DIAGRAMS
        </div>
      </div>

      {/* Main Diagram Canvas Card */}
      <div
        style={{
          flex: 1,
          borderRadius: '24px',
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          border: `2px solid ${current.color}60`,
          boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 25px ${current.color}30`,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span style={{ fontSize: '28px' }}>{current.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 900, color: current.color, textTransform: 'uppercase' }}>
            {current.subject}
          </span>
        </div>

        {/* Diagram Graphic Mockup */}
        <div
          style={{
            width: '100%',
            height: '240px',
            borderRadius: '16px',
            background: 'radial-gradient(circle, #0f172a 0%, #020617 100%)',
            border: '1.5px dashed #475569',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ fontSize: '48px' }}>{current.icon}</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: current.color }}>
            {current.title}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Straight Leader Lines • Color-Coded Zones
          </div>

          {/* Clean Pointers */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '10px', color: '#38bdf8' }}>
            ← Calot's Triangle
          </div>
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '10px', color: '#10b981' }}>
            Cystic Artery →
          </div>
        </div>

        <div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
            {current.title}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {current.subtitle}
          </div>
        </div>

        <div style={{ padding: '8px 16px', borderRadius: '12px', background: `${current.color}20`, color: current.color, fontSize: '12px', fontWeight: 800 }}>
          ✓ 100% University Exam Standard
        </div>
      </div>
    </div>
  );
};
