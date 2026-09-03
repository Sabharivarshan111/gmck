import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const ThemeSwitcher: React.FC = () => {
  const frame = useCurrentFrame();

  const themes = [
    { name: 'Midnight Dark', bg: '#090d16', text: '#ffffff', accent: '#38bdf8', icon: '🌙' },
    { name: 'Pure Light', bg: '#f8fafc', text: '#0f172a', accent: '#2563eb', icon: '☀️' },
    { name: 'LiquidGlass', bg: '#1e1b4b', text: '#f1f5f9', accent: '#818cf8', icon: '🔮' },
    { name: 'BlackPink Neon', bg: '#000000', text: '#ff5c8d', accent: '#ff5c8d', icon: '⚡' }
  ];

  const currentThemeIdx = Math.floor((frame / 45) % themes.length);
  const theme = themes[currentThemeIdx];

  return (
    <div
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: '20px',
        background: theme.bg,
        border: `2px solid ${theme.accent}60`,
        boxShadow: `0 10px 30px -5px ${theme.accent}30`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: theme.text,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{theme.icon}</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: theme.accent }}>
            {theme.name} Theme
          </span>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            background: `${theme.accent}25`,
            fontSize: '11px',
            fontWeight: 700,
            color: theme.accent
          }}
        >
          Active
        </div>
      </div>

      <div
        style={{
          padding: '10px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.06)',
          fontSize: '12px',
          fontWeight: 600
        }}
      >
        Fluid UI shader transitions with zero stutter
      </div>
    </div>
  );
};
