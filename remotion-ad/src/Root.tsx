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
import { SILENT_REELS, VOICED_REELS } from './scripts/index';
import { silentLongform } from './scripts/silent';
import { scriptFrames } from './scripts/types';

const FPS = 30;

/**
 * The three 90-second launch ads, and the frame count to fall back on.
 *
 * The fallback is what the composition is worth before `voice-manifest` has
 * measured the real recordings — a render with no timings still has to have a
 * length. Both mixes of an ad read the same number, so they cannot end at
 * different frames.
 */
const LAUNCH_ADS = [
  { id: 'orbit-the-pattern', script: thePattern, fallbackFrames: 3965 },
  { id: 'orbit-2am', script: twoAM, fallbackFrames: 4302 },
  { id: 'orbit-draw-it-from-memory', script: drawItFromMemory, fallbackFrames: 4813 },
] as const;

export const Root: React.FC = () => {
  return (
    <>
      {/* --- STANDALONE THEMATIC LAUNCH ADS (Calm Audio-Paced & Responsive Focal Camera) ---

          These ship in two mixes, exactly as the reels do. They were the three
          that did not, and the gap was invisible from here: they were written
          before the silent cut existed, registered by hand one `<Composition>`
          each, and a hand-written list does not notice a rule it predates.
          Looping the pair is what stops it happening again.

          A muted long-form ad needs no `silentText`, which is the reel's
          answer to the same problem. A reel's headline is a verbatim span of
          the spoken line, so with no audio it reads as a fragment; these run
          `KineticWordCaption`, which already types out every word of the line
          in time with the recording. The words were always on screen. The
          silent mix leaves out the voice and lifts the music bed to
          `BED_ALONE`, and that is the whole difference.
      */}
      {LAUNCH_ADS.map(({ id, script, fallbackFrames }) => {
        const durationInFrames = DYNAMIC_SCRIPT_TIMINGS[id]?.totalFrames ?? fallbackFrames;
        return (
          <React.Fragment key={id}>
            <Composition
              id={id}
              component={ShotTimeline}
              durationInFrames={durationInFrames}
              fps={FPS}
              width={1080}
              height={1920}
              defaultProps={{ script }}
            />
            <Composition
              id={`${id}-silent`}
              component={ShotTimeline}
              durationInFrames={durationInFrames}
              fps={FPS}
              width={1080}
              height={1920}
              /*
                 A SCRIPT, not the same one with the sound turned off. It
                 borrows this ad's measurements through `voiceOf`, so it is the
                 identical edit frame for frame with nothing spoken over it.
              */
              defaultProps={{ script: silentLongform(script) }}
            />
          </React.Fragment>
        );
      })}

      {/* --- 60-SECOND INSTAGRAM REELS, IN TWO CUTS EACH ---

          Every reel is registered twice against the same script: once voiced,
          once with the music bed alone. They are not two videos — they are two
          mixes of one edit, which is why the second one is a prop rather than
          a second script. The silent cut is the one that gets watched, because
          a reel is watched muted; the voiced cut is the one that gets watched
          twice.

          Composition ids are kebab-case throughout. Remotion rejects an
          underscore in an id, and the failure arrives at render time in CI
          rather than at type-check.
      */}
      {VOICED_REELS.map((reel) => (
        <Composition
          key={reel.id}
          id={reel.id}
          component={ShotTimeline}
          /*
             A spoken reel is as long as its own recordings came to, which
             `measure-audio` pins to REEL_FRAMES by giving the spare time to
             the last shot. `scriptFrames` (the beat grid) is the fallback for
             a local typecheck, where nothing has been recorded yet.
          */
          durationInFrames={DYNAMIC_SCRIPT_TIMINGS[reel.id]?.totalFrames ?? scriptFrames(reel)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ script: reel }}
        />
      ))}

      {/* --- THE SILENT REELS ---

          One composition each, because each of these IS the silent cut. They
          used to be `REELS.filter(s => s.noVoice)`, which matched nothing: the
          muted cut was the same script rendered again with `withVoice: false`,
          so one edit was serving a listening viewer and a muted one. Those two
          are paced by different clocks — speech and music — and only the music
          was ever computed, which is why every spoken reel ran over its own
          voice. `scripts/silent.ts` has the long version.

          The beat grid is the right clock HERE, and only here: with nothing
          spoken there is no duration to obey and the music is the only thing
          keeping time.
      */}
      {SILENT_REELS.map((reel) => (
        <Composition
          key={reel.id}
          id={reel.id}
          component={ShotTimeline}
          durationInFrames={scriptFrames(reel)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ script: reel }}
        />
      ))}

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
