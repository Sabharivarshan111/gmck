import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import { AuroraMeshBackground } from './AuroraMeshBackground';
import { LayeredCameraPhone } from './LayeredCameraPhone';
import { PlateCard } from './PlateCard';
import { KineticWordCaption } from './KineticWordCaption';
import { GlowBadge } from './GlowBadge';
import { screenAsset } from './ScreenRegistry';
import { SHOT_FRAMES, type AdScript, type Shot } from '../scripts/types';

const DEFAULT_ACCENT = '#7C5CFF';

/**
 * One 3-second shot.
 *
 * The transition between shots is a *continuation*, not a crossfade: the
 * outgoing shot's camera keeps travelling while the incoming one arrives over
 * 10 frames. That is what makes the ad feel like one continuous camera move
 * through the product rather than 30 slides.
 */
const ShotView: React.FC<{ shot: Shot; voiceSrc: string | null }> = ({ shot, voiceSrc }) => {
  const frame = useCurrentFrame();
  const t = Math.min(1, frame / SHOT_FRAMES);
  const accent = shot.accent ?? DEFAULT_ACCENT;

  // Arrive over 10 frames, leave over the last 8. Never a symmetric crossfade —
  // an incoming shot should be established before the outgoing one is gone.
  const enter = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const leave = interpolate(frame, [SHOT_FRAMES - 8, SHOT_FRAMES], [1, 0], {
    extrapolateLeft: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const alpha = Math.min(enter, leave);

  const asset = shot.screen ? screenAsset(shot.screen) : null;
  const src = asset ? staticFile(asset.file) : null;

  return (
    <AbsoluteFill>
      <AuroraMeshBackground accent={accent} intensity={shot.camera === 'macro' ? 0.6 : 1} />
      <AbsoluteFill style={{ opacity: alpha }}>
        {asset?.kind === 'plate' && src ? (
          <PlateCard src={src} move={shot.camera} t={t} accent={accent} />
        ) : (
          <LayeredCameraPhone src={src} move={shot.camera} t={t} accent={accent} focus={shot.focus} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: alpha }}>
        <KineticWordCaption text={shot.text} accent={accent} />
      </AbsoluteFill>
      {voiceSrc ? <Audio src={voiceSrc} /> : null}
    </AbsoluteFill>
  );
};

/**
 * The whole ad: 30 shots of exactly 90 frames.
 *
 * `withVoice` is off in the sandbox that has no access to the speech endpoint,
 * so the composition still renders (silent) for motion review. CI renders it
 * with voice; nothing about the visuals changes between the two.
 */
export const ShotTimeline: React.FC<{ script: AdScript; withVoice?: boolean }> = ({
  script,
  withVoice = true,
}) => (
  <AbsoluteFill style={{ backgroundColor: '#030712' }}>
    {script.shots.map((shot, i) => (
      <Sequence
        key={shot.n}
        from={i * SHOT_FRAMES}
        durationInFrames={SHOT_FRAMES}
        // Shots overlap by the arrival window so the camera never stops dead
        // between them.
        layout="none"
      >
        <ShotView
          shot={shot}
          voiceSrc={
            withVoice
              ? staticFile(`audio/${script.id}/shot_${String(shot.n).padStart(2, '0')}.mp3`)
              : null
          }
        />
      </Sequence>
    ))}
    <GlowBadge label="Orbit MBBS QBank" accent={DEFAULT_ACCENT} />
  </AbsoluteFill>
);
