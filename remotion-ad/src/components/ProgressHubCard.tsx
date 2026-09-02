import React from 'react';

export const ProgressHubCard: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: '20px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1.5px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        color: '#ffffff'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
          📁 MY PROGRESS & NOTES HUB
        </span>
        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>✓ Auto-Synced</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, padding: '8px', borderRadius: '10px', background: '#1e293b', fontSize: '11px' }}>
          🎥 <b>Video Link Attached</b>
          <div style={{ color: '#94a3b8', fontSize: '10px' }}>Clinical Surgery Lecture (42m)</div>
        </div>
        <div style={{ flex: 1, padding: '8px', borderRadius: '10px', background: '#1e293b', fontSize: '11px' }}>
          📄 <b>PDF Document Attached</b>
          <div style={{ color: '#94a3b8', fontSize: '10px' }}>Ward Case Sheet (2.4 MB)</div>
        </div>
      </div>
    </div>
  );
};
