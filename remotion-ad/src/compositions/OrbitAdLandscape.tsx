import React from 'react';
import { Sequence } from 'remotion';
import { Scene1Hook } from '../scenes/Scene1Hook';
import { Scene2Reveal } from '../scenes/Scene2Reveal';
import { Scene3TripleTap } from '../scenes/Scene3TripleTap';
import { Scene4Diagrams } from '../scenes/Scene4Diagrams';
import { Scene5Features } from '../scenes/Scene5Features';
import { Scene6OutroCTA } from '../scenes/Scene6OutroCTA';

export const OrbitAdLandscape: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#030712',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Scene 1: Hook (0s - 5s / Frames 0 - 150) */}
      <Sequence from={0} durationInFrames={150}>
        <Scene1Hook />
      </Sequence>

      {/* Scene 2: Orbit Reveal (5s - 10s / Frames 150 - 300) */}
      <Sequence from={150} durationInFrames={150}>
        <Scene2Reveal />
      </Sequence>

      {/* Scene 3: Triple Tap Note Engine (10s - 16s / Frames 300 - 480) */}
      <Sequence from={300} durationInFrames={180}>
        <Scene3TripleTap />
      </Sequence>

      {/* Scene 4: 200+ Medical Diagrams (16s - 22s / Frames 480 - 660) */}
      <Sequence from={480} durationInFrames={180}>
        <Scene4Diagrams />
      </Sequence>

      {/* Scene 5: Smart Study Ecosystem (22s - 26s / Frames 660 - 780) */}
      <Sequence from={660} durationInFrames={120}>
        <Scene5Features />
      </Sequence>

      {/* Scene 6: High-Converting CTA (26s - 30s / Frames 780 - 900) */}
      <Sequence from={780} durationInFrames={120}>
        <Scene6OutroCTA />
      </Sequence>
    </div>
  );
};
