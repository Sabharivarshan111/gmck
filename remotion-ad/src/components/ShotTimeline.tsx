import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import { AuroraMeshBackground } from './AuroraMeshBackground';
import { LayeredCameraPhone } from './LayeredCameraPhone';
import { PlateCard } from './PlateCard';
import { KineticWordCaption } from './KineticWordCaption';
import { screenAsset } from './ScreenRegistry';
import type { AdScript, Shot } from '../scripts/types';
import { DYNAMIC_SCRIPT_TIMINGS, type ShotTiming } from '../dynamicScriptTimings';

const DEFAULT_ACCENT = '#7C5CFF';

interface ShotViewProps {
  shot: Shot;
  timing?: ShotTiming;
  voiceSrc: string | null;
  shotIndex: number;
}

const ShotView: React.FC<ShotViewProps> = ({ shot, timing, voiceSrc, shotIndex }) => {
  const frame = useCurrentFrame();
  const durationInFrames = timing?.shotFrames ?? 120;
  const audioFrames = timing?.audioFrames ?? 90;
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

  if (shot.text.toLowerCase().includes('triple-tap') || (shot.screen === 'questions' && shot.text.toLowerCase().includes('tap'))) {
    touchPreset = 'tripleTap';
    isTripleTap = true;
  } else if (shot.screen === 'browse') {
    touchPreset = 'bottomNavBrowse';
  } else if (shot.screen === 'timer') {
    touchPreset = 'timerStartButton';
  } else if (shot.screen === 'ankiStudy' || shot.screen === 'chatdemo') {
    touchPreset = 'mcqOption';
  } else if (shot.screen === 'flashcards') {
    touchPreset = 'flashcardFlip';
  } else if (shot.screen === 'userNotes' || shot.screen === 'userNotesEdit') {
    touchPreset = 'bottomNavNotes';
  } else if (shot.screen === 'progress') {
    touchPreset = 'bottomNavProgress';
  } else if (shot.screen === 'glassHome') {
    touchPreset = 'themeSwatch';
  }

  return (
    <AbsoluteFill>
      <AuroraMeshBackground accent={accent} intensity={shot.camera === 'macro' ? 0.6 : 1} />
      <AbsoluteFill style={{ opacity: alpha }}>
        {asset?.kind === 'plate' && src ? (
          <PlateCard src={src} move={shot.camera} t={t} accent={accent} />
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
          />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: alpha }}>
        <KineticWordCaption
          text={timing?.vo || shot.vo || shot.text}
          accent={accent}
          audioFrames={audioFrames}
          durationInFrames={durationInFrames}
        />
      </AbsoluteFill>
      {voiceSrc ? <Audio src={voiceSrc} /> : null}
    </AbsoluteFill>
  );
};

export const ShotTimeline: React.FC<{ script: AdScript; withVoice?: boolean }> = ({
  script,
  withVoice = true,
}) => {
  const timingReport = DYNAMIC_SCRIPT_TIMINGS[script.id];
  const shotsWithTimings = script.shots.map((shot, i) => {
    const timing = timingReport?.shots.find((s) => s.n === shot.n);
    const startFrame = timing?.startFrame ?? i * 120;
    const durationInFrames = timing?.shotFrames ?? 120;
    return { shot, timing, startFrame, durationInFrames, index: i };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#030712' }}>
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
            voiceSrc={
              withVoice
                ? staticFile(`audio/${script.id}/shot_${String(shot.n).padStart(2, '0')}.mp3`)
                : null
            }
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
