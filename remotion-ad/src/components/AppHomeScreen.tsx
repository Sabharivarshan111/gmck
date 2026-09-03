import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const AppHomeScreen: React.FC = () => {
  const frame = useCurrentFrame();

  const subjects = [
    { name: 'General Medicine', questions: '680 PYQs', color: '#38bdf8', icon: '💊', badge: '10-STAR TOPIC' },
    { name: 'General Surgery', questions: '572 PYQs', color: '#f43f5e', icon: '🔪', badge: 'HIGH YIELD' },
    { name: 'Obstetrics & Gyn', questions: '420 PYQs', color: '#ec4899', icon: '👶', badge: 'ESSAYS' },
    { name: 'Paediatrics', questions: '310 PYQs', color: '#eab308', icon: '🍼', badge: 'CLINICAL' }
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#090d16',
        padding: '52px 18px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 900, letterSpacing: '0.06em' }}>
            ORBIT MBBS OS
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>Final Year MBBS</div>
        </div>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 0 16px rgba(16,185,129,0.5)'
          }}
        >
          🩺
        </div>
      </div>

      {/* University Exam Countdown Card */}
      <div
        style={{
          padding: '16px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1.5px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800 }}>⏳ UNIVERSITY EXAM COUNTDOWN</div>
          <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '2px' }}>28 Days Left</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>1,840 / 5,000 Questions Mastered</div>
        </div>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '4px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 900,
            color: '#38bdf8'
          }}
        >
          37%
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '16px',
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#64748b',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span>🔍</span>
        <span>Search 5,000+ university exam PYQs...</span>
      </div>

      {/* 4 Subject Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
        {subjects.map((sub, i) => (
          <div
            key={i}
            style={{
              padding: '16px 14px',
              borderRadius: '20px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: `1.5px solid ${sub.color}40`,
              boxShadow: `0 8px 20px rgba(0,0,0,0.4), inset 0 0 15px ${sub.color}10`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '26px' }}>{sub.icon}</span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: sub.color, background: `${sub.color}20`, padding: '2px 6px', borderRadius: '6px' }}>
                {sub.badge}
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              {sub.name}
            </div>
            <div style={{ fontSize: '11px', color: sub.color, fontWeight: 700 }}>
              {sub.questions}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          marginTop: 'auto',
          padding: '12px 16px',
          borderRadius: '24px',
          background: '#0f172a',
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: 700
        }}
      >
        <span style={{ color: '#38bdf8' }}>🏠 Home</span>
        <span style={{ color: '#94a3b8' }}>📖 Notes</span>
        <span style={{ color: '#94a3b8' }}>🌳 Focus</span>
        <span style={{ color: '#94a3b8' }}>🤖 AI Bot</span>
      </div>
    </div>
  );
};
