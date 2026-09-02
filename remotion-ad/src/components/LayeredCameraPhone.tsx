import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

import type { CameraMove } from '../scripts/types';

interface LayeredCameraPhoneProps {
  children?: React.ReactNode;
  src?: string | null;
  move?: CameraMove | string;
  t?: number;
  focus?: number;
  accent?: string;
  themeColor?: string;
  shotIndex?: number;
  durationInFrames?: number;
}

export const LayeredCameraPhone: React.FC<LayeredCameraPhoneProps> = ({
  children,
  src,
  move = 'hero',
  t,
  focus,
  accent,
  themeColor = '#38bdf8',
  shotIndex = 0,
  durationInFrames = 105
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeAccent = accent ?? themeColor;

  // Subtle natural camera breathing & shot entry spring
  const entrySpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 70, mass: 0.9 }
  });

  // Intentional cinematic 3D camera angles per shot type
  // Smooth continuous push-ins, subtle tilts, and elegant settles
  const cameraTrajectories = [
    { startScale: 1.08, endScale: 1.15, rx: 3, ry: -4, rz: -0.4, y: -10 },
    { startScale: 1.11, endScale: 1.17, rx: -2, ry: 3, rz: 0.4, y: -14 },
    { startScale: 1.09, endScale: 1.16, rx: 3, ry: -3, rz: -0.3, y: -12 },
    { startScale: 1.12, endScale: 1.18, rx: 2, ry: 2, rz: 0.3, y: -16 },
    { startScale: 1.10, endScale: 1.19, rx: -3, ry: -3, rz: -0.4, y: -15 },
    { startScale: 1.12, endScale: 1.16, rx: 0, ry: 0, rz: 0, y: -12 }
  ];

  const traj = cameraTrajectories[shotIndex % cameraTrajectories.length];

  // Camera smooth continuous push-in and 3D perspective rotation
  const cameraScale = interpolate(entrySpring, [0, 1], [traj.startScale, traj.endScale]);
  const rotateX = interpolate(entrySpring, [0, 1], [traj.rx * 1.5, traj.rx * 0.3]);
  const rotateY = interpolate(entrySpring, [0, 1], [traj.ry * 1.5, traj.ry * 0.3]);
  const rotateZ = interpolate(entrySpring, [0, 1], [traj.rz * 1.5, traj.rz * 0.3]);
  const translateY = interpolate(entrySpring, [0, 1], [traj.y + 12, traj.y]);

  // Specular sweep across the glass screen
  const glareX = interpolate(frame, [0, durationInFrames * 0.75], [-120, 220], {
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1400px',
        position: 'relative'
      }}
    >
      {/* Cinematic Ambient Backlight Glow behind Phone */}
      <div
        style={{
          position: 'absolute',
          width: '540px',
          height: '980px',
          borderRadius: '80px',
          background: `radial-gradient(circle at center, ${themeColor}28 0%, transparent 65%)`,
          filter: 'blur(60px)',
          transform: `scale(${cameraScale}) translateY(${translateY}px)`,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* 3D Cinematic Titanium Phone Container */}
      <div
        style={{
          position: 'relative',
          width: '430px',
          height: '870px',
          borderRadius: '54px',
          padding: '12px',
          background: 'linear-gradient(135deg, #334155 0%, #0f172a 40%, #1e293b 70%, #0f172a 100%)',
          boxShadow: `
            0 30px 70px -15px rgba(0, 0, 0, 0.95),
            0 0 35px -5px ${themeColor}33,
            inset 0 1.5px 2px rgba(255, 255, 255, 0.35),
            inset 0 -1.5px 2px rgba(0, 0, 0, 0.8)
          `,
          transform: `scale(${cameraScale}) translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
          transformStyle: 'preserve-3d',
          zIndex: 10
        }}
      >
        {/* Inner Titanium Bezel Accent */}
        <div
          style={{
            position: 'absolute',
            inset: '3px',
            borderRadius: '51px',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            pointerEvents: 'none',
            zIndex: 12
          }}
        />

        {/* Screen Display Viewport (Pristine, 100% Crisp Frame) */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '42px',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#030712'
          }}
        >
          {/* Top Dynamic Island Pill */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '105px',
              height: '26px',
              backgroundColor: '#000000',
              borderRadius: '20px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Camera Lens */}
            <div
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #1e293b, #020617)'
              }}
            />
            {/* Live Indicator */}
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: themeColor,
                boxShadow: `0 0 8px ${themeColor}`
              }}
            />
          </div>

          {/* Pristine Screen Content */}
          <div style={{ width: '100%', height: '100%' }}>
            {children ? (
              children
            ) : src ? (
              <img
                src={src}
                alt="Screen"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: focus !== undefined ? `center ${focus * 100}%` : 'top center',
                  display: 'block'
                }}
              />
            ) : null}
          </div>

          {/* Glass Specular Glare Reflection */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${glareX}%`,
              width: '45%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
              transform: 'skewX(-25deg)',
              pointerEvents: 'none',
              zIndex: 90
            }}
          />
        </div>
      </div>
    </div>
  );
};
