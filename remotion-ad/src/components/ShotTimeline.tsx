import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import { AuroraMeshBackground } from './AuroraMeshBackground';
import { LayeredCameraPhone } from './LayeredCameraPhone';
import { PlateCard } from './PlateCard';
import { KineticWordCaption } from './KineticWordCaption';
import { ReelHeadline } from './ReelHeadline';
import { screenAsset } from './ScreenRegistry';
import { UserNotesMediaScreen, ThemeCustomizerScreen, OutroScreen } from './CustomAppScreens';
import type { AdScript, Shot } from '../scripts/types';
import { scriptFrames } from '../scripts/types';
import { DYNAMIC_SCRIPT_TIMINGS, type ShotTiming } from '../dynamicScriptTimings';

const DEFAULT_ACCENT = '#7C5CFF';

/**
 * How much of the frame a reel gives the device, and how far up.
 *
 * See `ReelHeadline` for the arithmetic. These are the two numbers that keep
 * the phone clear of a headline sitting above Instagram's own UI, and they are
 * only ever passed for `format: 'reel'` — the long-form ads pass nothing and
 * frame exactly as they always have.
 */
const REEL_DEVICE_SCALE = 0.86;
const REEL_DEVICE_LIFT = -70;

/**
 * Music bed level, under a voice and on its own.
 *
 * The voiced cut ducks the bed to a sixth so it is felt rather than listened
 * to; the silent cut has nothing else to carry the film, so the bed comes up
 * to a level that reads as the soundtrack. These are two different mixes of
 * one composition, which is the point of shipping both.
 */
const BED_UNDER_VOICE = 0.16;
const BED_ALONE = 0.42;

interface ShotViewProps {
  shot: Shot;
  timing?: ShotTiming;
  voiceSrc: string | null;
  /** True for the silent cut: drop the aurora and sit the shot on black. */
  onBlack?: boolean;
  shotIndex: number;
  durationOverride?: number;
  reel?: boolean;
}

const ShotView: React.FC<ShotViewProps> = ({
  shot,
  timing,
  voiceSrc,
  shotIndex,
  durationOverride,
  reel = false,
  onBlack = false,
}) => {
  const frame = useCurrentFrame();
  const durationInFrames = durationOverride ?? timing?.shotFrames ?? 120;
  const audioFrames = timing?.audioFrames ?? Math.round(durationInFrames * 0.8);
  const t = Math.min(1, frame / durationInFrames);
  const accent = shot.accent ?? DEFAULT_ACCENT;

  // Smooth seamless shot arrival & exit easing
  const enter = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const leave = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const alpha = Math.min(enter, leave);

  const asset = shot.screen ? screenAsset(shot.screen) : null;
  const src = asset ? staticFile(asset.file) : null;

  // Derive interactive touch target based on script shot
  let touchPreset: any = undefined;
  let isTripleTap = false;

  if (shot.text.toLowerCase().includes('triple-tap') || (shot.screen?.startsWith('questions') && shot.text.toLowerCase().includes('tap'))) {
    touchPreset = 'tripleTap';
    isTripleTap = true;
  } else if (shot.screen === 'browse') {
    touchPreset = 'bottomNavBrowse';
  } else if (shot.screen === 'timer') {
    touchPreset = 'bottomNavTimer';
  } else if (shot.screen === 'askai') {
    touchPreset = 'bottomNavAI';
  } else if (shot.screen === 'progress') {
    touchPreset = 'bottomNavProgress';
  } else if (shot.screen === 'userNotes' || shot.screen === 'userNotesEdit' || shot.screen === 'userNotesMedia') {
    touchPreset = 'bottomNavNotes';
  } else if (shot.screen === 'ankiStudy' || shot.screen === 'chatdemo') {
    touchPreset = 'mcqOption';
  } else if (shot.screen === 'flashcards') {
    touchPreset = 'flashcardFlip';
  } else if (shot.screen === 'themeCustomizer' || shot.screen === 'wallpaperCustomizer' || shot.screen === 'glassHome') {
    touchPreset = 'themeSwatch';
  }

  let customScreenContent: React.ReactNode = null;
  if (shot.screen === 'outroCard') {
    customScreenContent = <OutroScreen />;
  }

  return (
    <AbsoluteFill>
      {/* The silent cut runs on true black.
        *
        * A reel is watched muted and thumb-first, so the subtitle cut has to
        * survive with no voice carrying it. The aurora is a lovely bed under a
        * narrated ad and it is the wrong choice here: it lifts the ground off
        * black, and every phone gallery, every Reels feed and every dark OLED
        * frames the video against black already. Matching it makes the phone in
        * the shot and the caption look like they are floating in the feed
        * rather than sitting on a coloured card someone designed.
        *
        * The accent does not disappear — it stays in the caption, the rim and
        * the touch ripple, where it marks meaning instead of filling space. */}
      {onBlack ? null : (
        <AuroraMeshBackground accent={accent} intensity={shot.camera === 'macro' ? 0.6 : 1} />
      )}
      <AbsoluteFill style={{ opacity: alpha }}>
        {asset?.kind === 'plate' && src ? (
          <PlateCard
            src={src}
            move={shot.camera}
            t={t}
            accent={accent}
            lift={reel ? REEL_DEVICE_LIFT : 0}
          />
        ) : (
          <LayeredCameraPhone
            src={src}
            move={shot.camera}
            t={t}
            accent={accent}
            focus={shot.focus}
            touchPreset={touchPreset}
            isTripleTap={isTripleTap}
            shotIndex={shotIndex}
            durationInFrames={durationInFrames}
            scaleMul={reel ? REEL_DEVICE_SCALE : 1}
            liftExtra={reel ? REEL_DEVICE_LIFT : 0}
          >
            {customScreenContent}
          </LayeredCameraPhone>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: alpha }}>
        {reel ? (
          <ReelHeadline
            text={shot.text || shot.vo}
            accent={accent}
            durationInFrames={durationInFrames}
          />
        ) : (
          <KineticWordCaption
            text={timing?.vo || shot.vo || shot.text}
            accent={accent}
            audioFrames={audioFrames}
            durationInFrames={durationInFrames}
          />
        )}
      </AbsoluteFill>
      {voiceSrc ? <Audio src={voiceSrc} /> : null}
    </AbsoluteFill>
  );
};

const voiceFile = (script: AdScript, shot: Shot) =>
  staticFile(`audio/${script.id}/shot_${String(shot.n).padStart(2, '0')}.mp3`);

export const ShotTimeline: React.FC<{ script: AdScript; withVoice?: boolean }> = ({
  script,
  withVoice = true,
}) => {
  const reel = script.format === 'reel';
  const timingReport = DYNAMIC_SCRIPT_TIMINGS[script.id];

  // Two ways a shot knows how long it is, and they must not be mixed.
  //
  // A long-form ad is paced by its own recording: `dynamicScriptTimings.ts`
  // measured every mp3 and stretched each shot to fit, which is why those ads
  // are as long as they are rather than a round number.
  //
  // A reel is the other way round. The platform fixes the length at 60.0s, so
  // the shots declare their frames and the voice is written to fit them. When
  // `shot.frames` is set it wins; when it is not, nothing about the existing
  // ads changes.
  let cursor = 0;
  const shotsWithTimings = script.shots.map((shot, i) => {
    const timing = timingReport?.shots.find((s) => s.n === shot.n);
    if (shot.frames) {
      const startFrame = cursor;
      cursor += shot.frames;
      return { shot, timing, startFrame, durationInFrames: shot.frames, index: i };
    }
    const startFrame = timing?.startFrame ?? i * 120;
    const durationInFrames = timing?.shotFrames ?? 120;
    return { shot, timing, startFrame, durationInFrames, index: i };
  });

  const total = reel ? scriptFrames(script) : (timingReport?.totalFrames ?? cursor);

  return (
    <AbsoluteFill style={{ backgroundColor: reel && !withVoice ? '#000000' : '#030712' }}>
      {/*
        The bed sits under everything and runs the whole composition. It is the
        first child so no shot's background can be drawn beneath it, and it is
        the only audio in the silent cut — which is why that cut is a mix
        decision rather than a missing track.
      */}
      {script.music ? (
        <Audio
          src={staticFile(script.music)}
          volume={(f) =>
            interpolate(
              f,
              [0, 18, Math.max(19, total - 40), total],
              [0, 1, 1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            ) * (withVoice ? BED_UNDER_VOICE : BED_ALONE)
          }
        />
      ) : null}

      {shotsWithTimings.map(({ shot, timing, startFrame, durationInFrames, index }) => (
        <Sequence
          key={shot.n}
          from={startFrame}
          durationInFrames={durationInFrames}
          layout="none"
        >
          <ShotView
            shot={shot}
            timing={timing}
            shotIndex={index}
            durationOverride={durationInFrames}
            reel={reel}
            voiceSrc={withVoice && !reel ? voiceFile(script, shot) : null}
            onBlack={reel && !withVoice}
          />
        </Sequence>
      ))}

      {/*
        A reel's voice is mounted outside the shot it belongs to, with no
        duration of its own.

        The shot is 3.5 seconds because the edit says so, and edge-tts decides
        how long the line actually came out — those two never agree to the
        frame. Inside the shot's Sequence a clip that runs 200ms long is cut
        off mid-word; out here it simply laps a few frames into the next shot,
        which is what a fast cut sounds like anyway. `preflight` still fails if
        a clip overruns by enough to talk over the next line.
      */}
      {reel && withVoice
        ? shotsWithTimings.map(({ shot, startFrame }) => (
            <Sequence key={`vo-${shot.n}`} from={startFrame} layout="none">
              <Audio src={voiceFile(script, shot)} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};
