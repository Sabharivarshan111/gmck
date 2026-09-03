import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const AppTripleTapScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3 Tap Ripple pulses at frames 15, 27, 39
  const tap1 = spring({ frame: frame - 15, fps, config: { damping: 10, stiffness: 220 } });
  const tap2 = spring({ frame: frame - 27, fps, config: { damping: 10, stiffness: 220 } });
  const tap3 = spring({ frame: frame - 39, fps, config: { damping: 10, stiffness: 220 } });

  // Note expansion transition starts at frame 50
  const noteReveal = spring({
    frame: frame - 48,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 }
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#090d16',
        padding: '50px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>← General Surgery</div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '10px',
            background: '#38bdf820',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 800,
            border: '1px solid #38bdf840'
          }}
        >
          AI GROUNDED
        </div>
      </div>

      {/* State 1: The Raw Exam Question Card */}
      <div
        style={{
          position: 'relative',
          padding: '18px',
          borderRadius: '20px',
          background: '#1e293b',
          border: '1.5px solid #475569',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          transform: `scale(${1 - noteReveal * 0.08})`,
          opacity: 1 - noteReveal
        }}
      >
        <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, marginBottom: '6px' }}>
          ★ 10-STAR REPEATED ESSAY (2024, 2022)
        </div>
        <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.4, color: '#f8fafc' }}>
          "Stomach – External morphology, relations, blood supply, lymphatic drainage, histology & applied anatomy."
        </div>
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Page No: 882 • Final Year Syllabus</span>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 800 }}>👆 Triple Tap</span>
        </div>

        {/* 3 Haptic Tap Ripples */}
        {frame >= 15 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #38bdf8', transform: `scale(${tap1 * 2.2})`, opacity: 1 - tap1 }} />
            {frame >= 27 && <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #818cf8', transform: `scale(${tap2 * 2.2})`, opacity: 1 - tap2, position: 'absolute', top: 0, left: 0 }} />}
            {frame >= 39 && <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #c084fc', transform: `scale(${tap3 * 2.2})`, opacity: 1 - tap3, position: 'absolute', top: 0, left: 0 }} />}
          </div>
        )}
      </div>

      {/* State 2: Instant Generated Clinical Handwritten Notes */}
      <div
        style={{
          position: 'absolute',
          top: '90px',
          left: '16px',
          right: '16px',
          bottom: '20px',
          borderRadius: '20px',
          background: '#0f172a',
          border: '1.5px solid #38bdf860',
          boxShadow: '0 0 35px rgba(56,189,248,0.3)',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transform: `translateY(${(1 - noteReveal) * 80}px) scale(${0.9 + noteReveal * 0.1})`,
          opacity: noteReveal
        }}
      >
        {/* Note Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ padding: '6px 14px', borderRadius: '10px', background: '#38bdf8', color: '#000', fontSize: '11px', fontWeight: 900 }}>
            8-PAGE ESSAY
          </div>
          <div style={{ padding: '6px 14px', borderRadius: '10px', background: '#1e293b', color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>
            3-PAGE SHORT NOTE
          </div>
        </div>

        {/* Structured Sections */}
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
          📌 1. Gross Anatomy & Magenstrasse
        </div>
        <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45, background: '#1e293b', padding: '10px', borderRadius: '12px' }}>
          • J-shaped organ in left hypochondrium, epigastric & umbilical regions.
          <br />• 2 Orifices (Cardiac T11, Pyloric L1), 2 Curvatures & Incisura Angularis.
        </div>

        <div style={{ fontSize: '13px', fontWeight: 800, color: '#818cf8' }}>
          🩸 2. Clog's Lymphatic Drainage
        </div>
        <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45, background: '#1e293b', padding: '10px', borderRadius: '12px' }}>
          • Zone 1: Left Gastric Nodes • Zone 2: Pancreaticosplenic
          <br />• Clinical: Virchow's node (Troisier's sign) & Krukenberg tumor.
        </div>

        <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, marginTop: 'auto', textAlign: 'center', background: 'rgba(16,185,129,0.1)', padding: '6px', borderRadius: '8px' }}>
          ✓ Verified University Exam Grounding
        </div>
      </div>
    </div>
  );
};
