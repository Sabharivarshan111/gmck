import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { BotAvatar } from './BotAvatar';

export const AppAiChatScreen: React.FC = () => {
  const frame = useCurrentFrame();

  const stage = (Math.min(6, Math.floor(frame / 35) + 1)) as 1 | 2 | 3 | 4 | 5 | 6;

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
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>← AI Medical Professor</div>
        <div style={{ padding: '4px 10px', borderRadius: '10px', background: '#c084fc20', color: '#c084fc', fontSize: '11px', fontWeight: 800 }}>
          STAGE {stage} / 6
        </div>
      </div>

      {/* AI Bot Avatar Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          borderRadius: '20px',
          background: 'rgba(192, 132, 252, 0.1)',
          border: '1.5px solid rgba(192, 132, 252, 0.3)'
        }}
      >
        <BotAvatar stage={stage} state="talking" size={100} />
        <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc', marginTop: '8px' }}>
          Level {stage} AI Study Companion
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Trained on University Exam Blueprints
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* User Bubble */}
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: '80%',
            padding: '10px 14px',
            borderRadius: '16px 16px 4px 16px',
            background: '#2563eb',
            fontSize: '12px',
            lineHeight: 1.4
          }}
        >
          "Explain the boundaries and clinical significance of Calot's Triangle for viva!"
        </div>

        {/* AI Bot Response Bubble */}
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '85%',
            padding: '12px 16px',
            borderRadius: '16px 16px 16px 4px',
            background: '#1e293b',
            border: '1px solid #475569',
            fontSize: '12px',
            lineHeight: 1.45,
            color: '#f1f5f9'
          }}
        >
          <div style={{ color: '#c084fc', fontWeight: 800, marginBottom: '4px' }}>
            🤖 AI Professor:
          </div>
          • Superior: Inferior border of Liver
          <br />• Medial: Common Hepatic Duct
          <br />• Lateral: Cystic Duct
          <br />• Content: Cystic Artery & Lund's Node!
        </div>
      </div>

      {/* Input Bar */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '14px',
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#64748b',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>Ask any clinical question or viva drill...</span>
        <span style={{ color: '#c084fc' }}>🎙️</span>
      </div>
    </div>
  );
};
