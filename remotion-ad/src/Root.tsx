import React from 'react';
import { Composition } from 'remotion';
import { OrbitAd_AppleKeynote } from './compositions/OrbitAd_AppleKeynote';
import { OrbitAd_CollegeHumor } from './compositions/OrbitAd_CollegeHumor';
import { OrbitAd_CyberpunkOS } from './compositions/OrbitAd_CyberpunkOS';
import { HyperframesAppleKeynote } from './compositions/HyperframesAppleKeynote';
import { HyperframesCollegeHumor } from './compositions/HyperframesCollegeHumor';
import { HyperframesCyberpunkOS } from './compositions/HyperframesCyberpunkOS';
import { SHOT_TIMINGS } from './shotTimings';
import { DYNAMIC_SCRIPT_TIMINGS } from './dynamicScriptTimings';

import { ShotTimeline } from './components/ShotTimeline';
import { thePattern } from './scripts/thePattern';
import { twoAM } from './scripts/twoAM';
import { drawItFromMemory } from './scripts/drawItFromMemory';

const FPS = 30;

export const Root: React.FC = () => {
  return (
    <>
      {/* --- STANDALONE THEMATIC LAUNCH ADS (Calm Audio-Paced & Responsive Focal Camera) --- */}
      <Composition
        id="orbit-the-pattern"
        component={ShotTimeline}
        durationInFrames={DYNAMIC_SCRIPT_TIMINGS['orbit-the-pattern']?.totalFrames ?? 3965}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ script: thePattern }}
      />
      <Composition
        id="orbit-2am"
        component={ShotTimeline}
        durationInFrames={DYNAMIC_SCRIPT_TIMINGS['orbit-2am']?.totalFrames ?? 4302}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ script: twoAM }}
      />
      <Composition
        id="orbit-draw-it-from-memory"
        component={ShotTimeline}
        durationInFrames={DYNAMIC_SCRIPT_TIMINGS['orbit-draw-it-from-memory']?.totalFrames ?? 4813}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ script: drawItFromMemory }}
      />

      {/* --- REMOTION 3 FULL COMPOSITIONS (Dynamic Audio-Paced) --- */}
      {/* 1. Apple Keynote Precision Masterpiece (Vertical 9:16) */}
      <Composition
        id="OrbitAd-AppleKeynote-9x16"
        component={OrbitAd_AppleKeynote}
        durationInFrames={SHOT_TIMINGS.apple_keynote.totalFrames}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* 1. Apple Keynote Precision Masterpiece (Landscape 16:9) */}
      <Composition
        id="OrbitAd-AppleKeynote-16x9"
        component={OrbitAd_AppleKeynote}
        durationInFrames={SHOT_TIMINGS.apple_keynote.totalFrames}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* 2. Relatable Med-School College Humor (Vertical 9:16) */}
      <Composition
        id="OrbitAd-CollegeHumor-9x16"
        component={OrbitAd_CollegeHumor}
        durationInFrames={SHOT_TIMINGS.college_humor.totalFrames}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* 2. Relatable Med-School College Humor (Landscape 16:9) */}
      <Composition
        id="OrbitAd-CollegeHumor-16x9"
        component={OrbitAd_CollegeHumor}
        durationInFrames={SHOT_TIMINGS.college_humor.totalFrames}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* 3. Cyberpunk Futuristic Medical OS (Vertical 9:16) */}
      <Composition
        id="OrbitAd-CyberpunkOS-9x16"
        component={OrbitAd_CyberpunkOS}
        durationInFrames={SHOT_TIMINGS.cyberpunk_os.totalFrames}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* 3. Cyberpunk Futuristic Medical OS (Landscape 16:9) */}
      <Composition
        id="OrbitAd-CyberpunkOS-16x9"
        component={OrbitAd_CyberpunkOS}
        durationInFrames={SHOT_TIMINGS.cyberpunk_os.totalFrames}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* --- HYPERFRAMES 3 FULL COMPOSITIONS --- */}
      {/* 4. Hyperframes: Apple Keynote Precision (Vertical 9:16) */}
      <Composition
        id="Hyperframes-AppleKeynote-9x16"
        component={HyperframesAppleKeynote}
        durationInFrames={SHOT_TIMINGS.apple_keynote.totalFrames}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* 5. Hyperframes: College Humor (Vertical 9:16) */}
      <Composition
        id="Hyperframes-CollegeHumor-9x16"
        component={HyperframesCollegeHumor}
        durationInFrames={SHOT_TIMINGS.college_humor.totalFrames}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* 6. Hyperframes: Cyberpunk OS (Vertical 9:16) */}
      <Composition
        id="Hyperframes-CyberpunkOS-9x16"
        component={HyperframesCyberpunkOS}
        durationInFrames={SHOT_TIMINGS.cyberpunk_os.totalFrames}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
