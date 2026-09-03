import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneMockup } from '../components/PhoneMockup';
import { KineticTitle } from '../components/KineticTitle';
import { GlowBadge } from '../components/GlowBadge';
import { Particles } from '../components/Particles';

export const Scene3TripleTap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3 Tap Ripple pulses at frames 30, 45, 60
  const tap1 = spring({ frame: frame - 30, fps, config: { damping: 10, stiffness: 200 } });
  const tap2 = spring({ frame: frame - 42, fps, config: { damping: 10, stiffness: 200 } });
  const tap3 = spring({ frame: frame - 54, fps, config: { damping: 10, stiffness: 200 } });

  // Note reveal transition starts at frame 70
  const noteReveal = spring({
    frame: frame - 68,
    fps,
    config: { damping: 14, stiffness: 100 }
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: 'radial-gradient(circle at 40% 50%, #1e1b4b 0%, #0f172a 50%, #030712 100%)',
        overflow: 'hidden',
        padding: '40px 60px'
      }}
    >
      <Particles />

      {/* Left 3D Phone Screen Simulating Triple Tap & Note Transformation */}
      <PhoneMockup delay={5} rotationY={6} scale={0.92} glowColor="#38bdf8">
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#090d16',
            padding: '44px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            color: '#ffffff'
          }}
        >
          {/* Top Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>← General Surgery</div>
            <div style={{ padding: '4px 10px', borderRadius: '10px', background: '#38bdf820', color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>
              AI Grounded
            </div>
          </div>

          {/* State 1: Before Triple Tap (The Question Card) */}
          <div
            style={{
              position: 'relative',
              padding: '16px',
              borderRadius: '16px',
              background: '#1e293b',
              border: '1.5px solid #475569',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transform: `scale(${1 - noteReveal * 0.1})`,
              opacity: 1 - noteReveal
            }}
          >
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '6px' }}>
              ★ 10-STAR REPEATED ESSAY (2024, 2022)
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.4, color: '#f8fafc' }}>
              "Stomach – External morphology, relations, blood supply, lymphatic drainage, histology & applied anatomy."
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Page No: 882 • Manipal Manual</span>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>👆 Triple Tap</span>
            </div>

            {/* Tap Ripple Rings */}
            {frame >= 30 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #38bdf8', transform: `scale(${tap1 * 2})`, opacity: 1 - tap1 }} />
                {frame >= 42 && <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #818cf8', transform: `scale(${tap2 * 2})`, opacity: 1 - tap2, position: 'absolute', top: 0, left: 0 }} />}
                {frame >= 54 && <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #c084fc', transform: `scale(${tap3 * 2})`, opacity: 1 - tap3, position: 'absolute', top: 0, left: 0 }} />}
              </div>
            )}
          </div>

          {/* State 2: After Triple Tap (The Generated Notes Sheet) */}
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '16px',
              right: '16px',
              bottom: '16px',
              borderRadius: '16px',
              background: '#0f172a',
              border: '1.5px solid #38bdf850',
              boxShadow: '0 0 30px rgba(56,189,248,0.2)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transform: `translateY(${(1 - noteReveal) * 80}px)`,
              opacity: noteReveal
            }}
          >
            {/* Note Tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ padding: '6px 12px', borderRadius: '8px', background: '#38bdf8', color: '#000', fontSize: '11px', fontWeight: 800 }}>
                8-PAGE ESSAY
              </div>
              <div style={{ padding: '6px 12px', borderRadius: '8px', background: '#1e293b', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                3-PAGE SHORT NOTE
              </div>
            </div>

            {/* Note Content Preview */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
              📌 1. Gross Anatomy & Magenstrasse
            </div>
            <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4, background: '#1e293b', padding: '8px', borderRadius: '8px' }}>
              • J-shaped organ located in left hypochondrium, epigastric & umbilical regions.
              <br />• Presents 2 Orifices (Cardiac T11, Pyloric L1), 2 Curvatures & Incisura Angularis.
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8' }}>
              🩸 2. Clog's Lymphatic Drainage
            </div>
            <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4, background: '#1e293b', padding: '8px', borderRadius: '8px' }}>
              • Zone 1: Left Gastric Nodes • Zone 2: Pancreaticosplenic
              <br />• Clinical: Virchow's node (Troisier's sign) & Krukenberg tumor.
            </div>

            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: 'auto', textAlign: 'center' }}>
              ✓ Complete Exam Grounding from Manipal Manual
            </div>
          </div>
        </div>
      </PhoneMockup>

      {/* Right Text Presentation */}
      <div style={{ maxWidth: '520px', zIndex: 10 }}>
        <GlowBadge
          icon="✨"
          label="PATENTED TRIPLE-TAP GESTURE"
          delay={5}
          color="#38bdf8"
        />

        <div style={{ marginTop: '24px' }}>
          <KineticTitle
            title="Triple-Tap Any PYQ for Instant Exam Notes"
            subtitle="Get university examiner-standard 3-Page Short Notes and 8-Page Essays formatted into clean, high-yield bullet points in seconds."
            highlightWords={['Triple-Tap', 'Instant', 'Exam', 'Notes']}
            align="left"
            fontSize={48}
            subFontSize={22}
            delay={10}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
          <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf840' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8' }}>3-Page</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Short Note Depth</div>
          </div>
          <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(129,140,248,0.1)', border: '1px solid #818cf840' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#818cf8' }}>8-Page</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>University Essay Depth</div>
          </div>
        </div>
      </div>
    </div>
  );
};
