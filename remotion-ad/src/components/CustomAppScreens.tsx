import React from 'react';
import { staticFile } from 'remotion';

// Bottom Navigation Bar component to ensure 100% visual consistency
export const NativeBottomNav: React.FC<{ activeTab?: 'home' | 'notes' | 'timer' | 'ai' | 'progress'; accent?: string }> = ({
  activeTab = 'notes',
  accent = '#38bdf8'
}) => {
  const tabs = [
    { key: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { key: 'notes', label: 'Notes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'timer', label: 'Timer', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'ai', label: 'Ask AI', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { key: 'progress', label: 'My Progress', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '78px',
        backgroundColor: 'rgba(10, 15, 29, 0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: '14px',
        zIndex: 50
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <div
            key={tab.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: isActive ? '6px 14px' : '6px',
              borderRadius: isActive ? '20px' : '0',
              backgroundColor: isActive ? `${accent}22` : 'transparent',
              border: isActive ? `1px solid ${accent}44` : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isActive ? accent : '#64748b'}
              strokeWidth={isActive ? '2.5' : '1.8'}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={tab.icon} />
            </svg>
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? 800 : 500,
                color: isActive ? '#ffffff' : '#64748b',
                letterSpacing: '-0.01em'
              }}
            >
              {tab.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// 1. User Notes with Embedded Photos, Audio Recordings & PDF Attachments
export const UserNotesMediaScreen: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#070b14',
        color: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '42px 18px 12px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0a101f'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', color: '#94a3b8' }}>←</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>General Medicine Ward 4B</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Clinical Case: Mitral Regurgitation</div>
          </div>
        </div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid #34d399',
            color: '#34d399'
          }}
        >
          ● OFFLINE
        </div>
      </div>

      {/* Note Content Scroll Area */}
      <div style={{ padding: '16px', flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Note Text Paragraph */}
        <div style={{ fontSize: '13px', lineHeight: '1.45', color: '#cbd5e1' }}>
          <strong style={{ color: '#ffffff' }}>Patient Bed 14:</strong> 42M presenting with exertional breathlessness (NYHA III). Grade 4 pansystolic murmur at apex radiating to axilla.
        </div>

        {/* 1. Ward Photo Card */}
        <div
          style={{
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ position: 'relative', height: '135px', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img
              src={staticFile('app_screens/stomach_lymphatics_anatomy.jpg')}
              alt="Clinical Plate"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#38bdf8'
              }}
            >
              📷 Ward Photo: Echocardiogram Doppler Jet
            </div>
          </div>
        </div>

        {/* 2. PDF Attachment Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(239, 68, 68, 0.4)'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
          >
            📄
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Harrison_Cardiology_Ch22.pdf</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>2.8 MB • 18 Pages • Attached to Note</div>
          </div>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>VIEW</span>
        </div>

        {/* 3. Audio Recording Player Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(168, 85, 247, 0.4)'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#ffffff'
            }}
          >
            ▶
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>Prof_Sundaram_Murmur_Lecture.m4a</div>
            <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: '45%', height: '100%', backgroundColor: '#a855f7' }} />
            </div>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>01:42</span>
        </div>

        {/* Stylus Handwritten Annotation */}
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderLeft: '3px solid #38bdf8',
            fontSize: '11px',
            fontStyle: 'italic',
            color: '#7dd3fc',
            lineHeight: 1.35
          }}
        >
          ✍️ "Stylus Note: S1 soft, apical pansystolic murmur, radiation to axilla. Carvallo sign negative!"
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <NativeBottomNav activeTab="notes" accent="#ff8a3d" />
    </div>
  );
};

// 2. Theme Customizer Screen (Four Themes & Wallpaper Refraction)
export const ThemeCustomizerScreen: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#030712',
        color: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '44px 20px 14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0b1120'
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>Theme & Wallpaper</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Personalize Your Study Ward</div>
        </div>
        <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800 }}>RESET</div>
      </div>

      {/* 4 Theme Cards Grid */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Select Ward Theme
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Theme 1: Liquid Glass (Selected) */}
          <div
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(15, 23, 42, 0.8))',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Liquid Glass</span>
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>✓</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Frosted Refraction</div>
          </div>

          {/* Theme 2: Cyberpunk OS */}
          <div
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Cyberpunk</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Neon Precision</div>
          </div>

          {/* Theme 3: Surgical Mint */}
          <div
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Surgical Mint</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Low Eye-Strain</div>
          </div>

          {/* Theme 4: 2 AM Amber */}
          <div
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>2 AM Amber</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Zero Blue Light</div>
          </div>
        </div>

        {/* Live Wallpaper & Refraction Preview Card */}
        <div style={{ marginTop: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Wallpaper Refraction
          </div>
          <div
            style={{
              borderRadius: '16px',
              padding: '16px',
              background: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.2), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
              Surfaces Bend The Light
            </div>
            {/* Slider 1: Blur */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                <span>Glass Blur</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>25px</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '68%', height: '100%', backgroundColor: '#38bdf8' }} />
              </div>
            </div>
            {/* Slider 2: Opacity */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                <span>Frosted Specular</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>80%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '100%', backgroundColor: '#38bdf8' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <NativeBottomNav activeTab="home" accent="#38bdf8" />
    </div>
  );
};

// 3. Outro Screen: Prominent Orbit MBBS Typography (NO icon) + Google Play Store Badge (with Play icon)
export const OutroScreen: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#030712',
        color: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '32px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Background Soft Aurora Glow */}
      <div
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)',
          filter: 'blur(50px)',
          zIndex: 1
        }}
      />

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Pure Typography: Orbit MBBS (NO ICON per user instruction) */}
        <h1
          style={{
            fontSize: '44px',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            margin: '0 0 10px 0',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 10px 30px rgba(56, 189, 248, 0.3)'
          }}
        >
          Orbit MBBS
        </h1>

        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            marginBottom: '36px'
          }}
        >
          TN MGR University Question Bank
        </div>

        {/* Official Google Play Store Badge with Play Icon */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '14px',
            backgroundColor: '#000000',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '16px',
            padding: '12px 24px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.25)'
          }}
        >
          {/* Google Play Colorful Triangle SVG Icon */}
          <svg width="28" height="30" viewBox="0 0 512 512" fill="none">
            <path
              d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z"
              fill="#00E676"
            />
            <path
              d="M47 0C44 0 41 1 38 3L294 259 47 506c3 2 6 3 9 3 4 0 8-1 12-3l317-182-60-60L47 0z"
              fill="#00B0FF"
            />
            <path
              d="M385.4 337.8L104.6 499l220.7-221.3 60.1 60.1z"
              fill="#FF1744"
            />
            <path
              d="M495.8 240.2L423.5 199l-38.1 38.8 38.1 38.8 72.3-41.2c9.6-5.5 15.4-15.6 15.4-26.6-.1-11-5.9-21.1-15.4-28.6z"
              fill="#FFEA00"
            />
          </svg>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#cbd5e1' }}>
              GET IT ON
            </div>
            <div style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Google Play
            </div>
          </div>
        </div>

        {/*
          Feature highlights under the badge.

          These are the last three claims in every ad, so they are the three
          most worth being right about, and two of them were not:

          * **"915+ Plates" was the question count wearing the drawings' name.**
            `question_diagrams` holds one row per question, and 922 of those
            rows carry a picture — but they point at only **250 distinct
            drawings**, because one plate answers many questions. Calling that
            915 plates overstated the artwork by nearly four times.
          * **"100% Offline" was a claim about the whole app.** The bundled
            question bank genuinely works with no network; the handwritten
            notes, the plates and Ask AI all need one the first time. So the
            claim is scoped to the part that is true rather than dropped.

          Measured 2026-09-05: 5,634 questions, 3,463 of them carrying a repeat
          marker, 250 plates across 922 questions.
        */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '36px', fontSize: '11px', color: '#94a3b8' }}>
          <span>✓ 5,600+ Questions</span>
          <span>•</span>
          <span>✓ 250 Exam Plates</span>
          <span>•</span>
          <span>✓ Offline Question Bank</span>
        </div>
      </div>
    </div>
  );
};
