import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface PhoneMockupProps {
  children: React.ReactNode;
  delay?: number;
  rotationY?: number;
  rotationX?: number;
  rotationZ?: number;
  scale?: number;
  glowColor?: string;
  width?: number;
  height?: number;
  panX?: number;
  panY?: number;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  delay = 0,
  rotationY = 0,
  rotationX = 0,
  rotationZ = 0,
  scale: targetScale = 1,
  glowColor = '#38bdf8',
  width = 390,
  height = 800,
  panX = 0,
  panY = 0
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.9 }
  });

  const floatY = Math.sin((frame + delay * 8) * 0.05) * 6;
  const floatRotate = Math.sin((frame + delay * 8) * 0.03) * 1.2;

  return (
    <div
      style={{
        perspective: '1400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
      }}
    >
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          borderRadius: '50px',
          padding: '12px',
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
          boxShadow: `
            0 30px 70px -15px rgba(0, 0, 0, 0.95),
            0 0 60px ${glowColor}40,
            inset 0 1.5px 2px rgba(255, 255, 255, 0.4),
            inset 0 -1.5px 2px rgba(0, 0, 0, 0.8)
          `,
          transform: `
            translate3d(${panX}px, ${(1 - entrance) * 60 + floatY + panY}px, 0px)
            scale(${entrance * targetScale})
            rotateX(${rotationX}deg)
            rotateY(${rotationY + floatRotate}deg)
            rotateZ(${rotationZ}deg)
          `,
          opacity: entrance,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.08s ease-out'
        }}
      >
        {/* Outer Titanium Metallic Rim & Diagonal Screen Glare */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50px',
            border: '2.5px solid rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
            zIndex: 25
          }}
        />

        {/* Screen Bezel Container */}
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#030712',
            borderRadius: '40px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Dynamic Island / Sensor Notch */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '28px',
              backgroundColor: '#000000',
              borderRadius: '24px',
              zIndex: 35,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8' }}>ORBIT</span>
            </div>
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#1e293b', boxShadow: 'inset 0 0 2px #38bdf8' }} />
          </div>

          {/* Screen Content Container */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
