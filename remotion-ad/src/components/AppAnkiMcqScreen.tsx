import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const AppAnkiMcqScreen: React.FC = () => {
  const frame = useCurrentFrame();

  const isFlipped = (frame % 90) > 45;
  const isMcqSelected = (frame % 90) > 20;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#090d16',
        padding: '50px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>← Anki & Rapid MCQs</div>
        <div style={{ padding: '4px 10px', borderRadius: '10px', background: '#38bdf820', color: '#38bdf8', fontSize: '11px', fontWeight: 800 }}>
          1-CLICK .APKG SYNC
        </div>
      </div>

      {/* Part 1: Rapid MCQ Double-Tap */}
      <div
        style={{
          padding: '16px',
          borderRadius: '18px',
          background: '#1e293b',
          border: '1.5px solid #475569',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800 }}>
          ⚡ RAPID MCQ • DOUBLE TAP
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.35 }}>
          "Which artery is susceptible to injury during ligation of the cystic duct in Calot's triangle?"
        </div>

        {/* MCQ Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { text: 'A. Left Hepatic Artery', correct: false },
            { text: 'B. Cystic Artery / Right Hepatic', correct: true },
            { text: 'C. Gastroduodenal Artery', correct: false }
          ].map((opt, i) => {
            const isCorrect = opt.correct && isMcqSelected;
            return (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: isCorrect ? '#10b98125' : '#0f172a',
                  border: `1px solid ${isCorrect ? '#10b981' : '#334155'}`,
                  color: isCorrect ? '#10b981' : '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: isCorrect ? 800 : 500,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>{opt.text}</span>
                {isCorrect && <span>✓ Correct (+10 XP)</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 2: 3D Anki Flashcard */}
      <div
        style={{
          padding: '16px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1.5px solid rgba(56,189,248,0.4)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
          📇 Anki Spaced Repetition (SRS)
        </div>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
          {!isFlipped ? 'Q: Troiser’s sign indicates metastases from which cancer?' : 'A: Gastric Adenocarcinoma (Virchow’s Node)'}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          {['<1m', '1d', '3d', '7d'].map((interval, idx) => (
            <span
              key={idx}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                background: idx === 2 ? '#10b98130' : '#334155',
                color: idx === 2 ? '#10b981' : '#94a3b8',
                fontSize: '10px',
                fontWeight: 800
              }}
            >
              {interval}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
