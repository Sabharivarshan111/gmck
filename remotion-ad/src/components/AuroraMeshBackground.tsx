import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

/**
 * The ground the whole ad sits on: deep obsidian with slow aurora mesh.
 *
 * It drifts on a long period (hundreds of frames) so it reads as atmosphere
 * rather than as an animation competing with the device. The accent is passed
 * per shot, so the room subtly changes colour with the feature being shown —
 * which is what makes cuts feel motivated instead of arbitrary.
 */
export const AuroraMeshBackground: React.FC<{
  accent: string;
  /** 0..1, how strongly the room is lit. Macro shots dim it to isolate. */
  intensity?: number;
}> = ({ accent, intensity = 1 }) => {
  const frame = useCurrentFrame();

  // Two blobs on different slow periods; their beat makes the light feel alive
  // without ever resolving into a loop the eye can catch.
  const driftA = Math.sin(frame / 190) * 12;
  const driftB = Math.cos(frame / 260) * 16;
  const breathe = interpolate(Math.sin(frame / 150), [-1, 1], [0.82, 1.06]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#030712' }}>
      <AbsoluteFill
        style={{
          opacity: 0.55 * intensity * breathe,
          background: `radial-gradient(60% 44% at ${50 + driftA}% ${26 + driftB * 0.4}%, ${accent}66 0%, transparent 68%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.4 * intensity * breathe,
          background: `radial-gradient(52% 40% at ${34 - driftB}% ${74 + driftA * 0.3}%, ${accent}40 0%, transparent 70%)`,
        }}
      />
      {/* A cool counter-light keeps the accent from flattening into one wash. */}
      <AbsoluteFill
        style={{
          opacity: 0.3 * intensity,
          background: `radial-gradient(46% 34% at ${72 + driftB * 0.5}% ${58 - driftA * 0.5}%, #1E3A8A55 0%, transparent 72%)`,
        }}
      />
      {/* Vignette: pulls the eye to the centre and stops the mesh reaching the
          safe zones where the caption and the platform UI live. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(72% 55% at 50% 45%, transparent 0%, rgba(3,7,18,0.55) 78%, rgba(3,7,18,0.9) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
