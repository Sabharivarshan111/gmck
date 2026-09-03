import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from 'remotion';

import type { CameraMove } from '../scripts/types';
import { InteractiveTouchRipple, type TouchPreset } from './InteractiveTouchRipple';

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
  touchPreset?: TouchPreset;
  isTripleTap?: boolean;
}

export const LayeredCameraPhone: React.FC<LayeredCameraPhoneProps> = ({
  children,
  src,
  move = 'hero',
  t: externalT,
  focus,
  accent,
  themeColor = '#38bdf8',
  shotIndex = 0,
  durationInFrames = 120,
  touchPreset,
  isTripleTap = false
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeAccent = accent ?? themeColor;

  // Normalized time across the entire shot duration (0 to 1)
  const progress = Math.min(1, Math.max(0, frame / durationInFrames));

  // Determine dynamic focal point based on touch preset or explicit focus prop
  let focalOrigin = '50% 50%';
  if (focus !== undefined) {
    focalOrigin = `50% ${Math.round(focus * 100)}%`;
  } else if (touchPreset === 'bottomNavBrowse' || touchPreset === 'bottomNavNotes' || touchPreset === 'bottomNavTimer' || touchPreset === 'bottomNavProgress') {
    focalOrigin = '50% 88%';
  } else if (touchPreset === 'tripleTap' || touchPreset === 'questionCard') {
    focalOrigin = '50% 36%';
  } else if (touchPreset === 'timerStartButton') {
    focalOrigin = '50% 72%';
  } else if (touchPreset === 'mcqOption') {
    focalOrigin = '50% 52%';
  } else if (touchPreset === 'flashcardFlip') {
    focalOrigin = '50% 48%';
  }

  // Base camera angles for subtle continuous living motion (elevated vertically to leave >200px subtitle clearance)
  const baseTrajectories = [
    { rx0: 3.5, rx1: 0.8, ry0: -4.0, ry1: -1.0, rz0: -0.4, rz1: -0.1, y0: -190, y1: -205 },
    { rx0: -2.5, rx1: -0.5, ry0: 3.5, ry1: 0.8, rz0: 0.4, rz1: 0.1, y0: -192, y1: -208 },
    { rx0: 3.0, rx1: 0.6, ry0: -3.0, ry1: -0.8, rz0: -0.3, rz1: -0.1, y0: -190, y1: -204 },
    { rx0: 2.2, rx1: 0.4, ry0: 2.5, ry1: 0.5, rz0: 0.3, rz1: 0.1, y0: -194, y1: -210 },
    { rx0: -3.0, rx1: -0.6, ry0: -3.0, ry1: -0.6, rz0: -0.4, rz1: -0.1, y0: -191, y1: -206 }
  ];

  const traj = baseTrajectories[shotIndex % baseTrajectories.length];

  // Continuous uninterrupted camera trajectory calculations
  let dynamicScale = 1.20;
  let dynamicOrigin = focalOrigin;
  let translateY = interpolate(progress, [0, 1], [traj.y0, traj.y1]);
  let rotateX = interpolate(progress, [0, 1], [traj.rx0, traj.rx1]);
  let rotateY = interpolate(progress, [0, 1], [traj.ry0, traj.ry1]);
  let rotateZ = interpolate(progress, [0, 1], [traj.rz0, traj.rz1]);

  const touchTriggerFrame = Math.round(durationInFrames * 0.24);

  if (move === 'macro' || move === 'push' || touchPreset) {
    // Push in -> touch press & ripple -> pull back seamlessly
    // Smooth spline interpolation: 0% -> 30% (zoom in to 1.50) -> 100% (pull back to 1.24)
    if (progress <= 0.30) {
      dynamicScale = interpolate(
        progress,
        [0, 0.30],
        [1.18, 1.50],
        { easing: Easing.out(Easing.quad), extrapolateRight: 'clamp' }
      );
    } else {
      dynamicScale = interpolate(
        progress,
        [0.30, 1.0],
        [1.50, 1.24],
        { easing: Easing.inOut(Easing.quad), extrapolateRight: 'clamp' }
      );
    }
    dynamicOrigin = focalOrigin;
  } else if (move === 'pull') {
    // Start zoomed in -> smoothly pull back across the full shot
    dynamicScale = interpolate(
      progress,
      [0, 1.0],
      [1.46, 1.20],
      { easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp' }
    );
  } else {
    // Hero continuous subtle drift
    dynamicScale = interpolate(
      progress,
      [0, 1.0],
      [1.20, 1.28],
      { easing: Easing.out(Easing.quad), extrapolateRight: 'clamp' }
    );
  }

  // Specular sweep across the glass screen
  const glareX = interpolate(progress, [0, 0.85], [-120, 220], {
    extrapolateRight: 'clamp'
  });

  // Physical button depress & tactile haptic bounce feedback
  const buttonBounce = spring({
    frame: Math.max(0, frame - touchTriggerFrame),
    fps,
    config: { damping: 12, stiffness: 140 }
  });
  const innerScreenScale = interpolate(buttonBounce, [0, 0.35, 1], [1, 0.982, 1]);

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
          width: '640px',
          height: '1140px',
          borderRadius: '90px',
          background: `radial-gradient(circle at center, ${activeAccent}33 0%, transparent 68%)`,
          filter: 'blur(75px)',
          transform: `scale(${dynamicScale}) translateY(${translateY}px)`,
          transformOrigin: dynamicOrigin,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* 3D Cinematic Titanium Phone Container */}
      <div
        style={{
          position: 'relative',
          width: '488px',
          height: '1024px',
          borderRadius: '52px',
          padding: '12px',
          background: 'linear-gradient(135deg, #334155 0%, #0f172a 40%, #1e293b 70%, #0f172a 100%)',
          boxShadow: `
            0 35px 85px -15px rgba(0, 0, 0, 0.95),
            0 0 45px -5px ${activeAccent}33,
            inset 0 1.5px 2px rgba(255, 255, 255, 0.35),
            inset 0 -1.5px 2px rgba(0, 0, 0, 0.8)
          `,
          transform: `scale(${dynamicScale}) translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
          transformOrigin: dynamicOrigin,
          transformStyle: 'preserve-3d',
          zIndex: 10
        }}
      >
        {/* Inner Titanium Bezel Accent */}
        <div
          style={{
            position: 'absolute',
            inset: '2px',
            borderRadius: '50px',
            border: '1.5px solid rgba(255, 255, 255, 0.14)',
            pointerEvents: 'none',
            zIndex: 12
          }}
        />

        {/* Screen Display Viewport (Exact 19.5:9 Ratio, 100% Uncropped Full Navigation Bar) */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '38px',
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
              width: '116px',
              height: '26px',
              backgroundColor: '#000000',
              borderRadius: '20px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Camera Lens */}
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #1e293b, #020617)'
              }}
            />
            {/* Live Indicator */}
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: activeAccent,
                boxShadow: `0 0 8px ${activeAccent}`
              }}
            />
          </div>

          {/* Pristine Screen Content with Interactive Touch Feedback (100% Navigation Bar Visible) */}
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${innerScreenScale})`,
              transformOrigin: dynamicOrigin,
              transition: 'transform 0.08s ease'
            }}
          >
            {children ? (
              children
            ) : src ? (
              <img
                src={src}
                alt="Screen"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill',
                  display: 'block'
                }}
              />
            ) : null}
          </div>

          {/* Interactive Touch & Button Ripple Overlay */}
          {touchPreset ? (
            <InteractiveTouchRipple
              preset={touchPreset}
              accent={activeAccent}
              isTripleTap={isTripleTap}
              startFrame={touchTriggerFrame}
            />
          ) : null}

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
