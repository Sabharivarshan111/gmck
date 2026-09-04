import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { beatEnergy, beatPosition, type BeatClock } from './beatGrid';

interface BeatCaptionProps {
  /** The function this shot is about. Short — it is the argument, not a sentence. */
  text: string;
  /** Where in the app it lives. Two or three words, set small and quiet. */
  kicker?: string;
  accent: string;
  durationInFrames: number;
  clock: BeatClock;
  /** Whole beats this shot runs for, used to draw the counter. */
  beats: number;
}

/**
 * The caption for an ad that has no voice.
 *
 * The two silent reels put the product in the subtitle line, so this is not a
 * transcript and not a decoration — **it is the thing being read**, and every
 * decision here follows from that:
 *
 * * **It says a function, not a feeling.** "Triple-tap for a written answer" is
 *   a thing the app does; "Study smarter" is not. A muted viewer gets one line
 *   per shot and nothing else, so the line has to be worth the shot.
 * * **It is fully legible inside eight frames.** A stagger that finishes
 *   assembling at 0.8s has spent the window in which the scroll is decided.
 * * **It sits at `bottom: 330`.** Instagram and TikTok draw their own caption,
 *   handle and action rail over roughly the bottom 260–290px of a 1920 frame.
 *   Below that is text nobody reads. Same band as `ReelHeadline`, on purpose:
 *   a viewer who sees both ads should find the words in the same place.
 * * **It moves on the beat, not on a timer of its own.** `beatEnergy` is the
 *   music's own envelope, so the type breathes with the bed rather than near
 *   it — and it keeps doing that when the owner swaps the track, because the
 *   only thing it reads is the tempo.
 *
 * The counter under the words is the shot's beats, filling one at a time. It
 * is small and it is honest: it tells the eye how long this idea has left,
 * which is what stops a montage feeling arbitrary.
 */
export const BeatCaption: React.FC<BeatCaptionProps> = ({
  text,
  kicker,
  accent,
  durationInFrames,
  clock,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return null;

  const opacity = interpolate(
    frame,
    [0, 4, durationInFrames - 7, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const energy = beatEnergy(frame, clock);
  const elapsedBeats = Math.floor(beatPosition(frame, clock) - beatPosition(0, clock)) + 1;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '330px',
        left: '56px',
        right: '56px',
        zIndex: 60,
        opacity,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        // The whole block breathes on the beat. 1.6% — enough to feel, small
        // enough that nobody can point at what moved.
        transform: `scale(${1 + energy * 0.016})`,
      }}
    >
      {kicker ? (
        <div
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '26px',
            fontWeight: 800,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: accent,
            opacity: interpolate(frame, [0, 6], [0, 0.92], { extrapolateRight: 'clamp' }),
            textShadow: `0 0 26px ${accent}77`,
          }}
        >
          {kicker}
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '0 18px',
        }}
      >
        {words.map((word, i) => {
          const entrance = spring({
            frame: Math.max(0, frame - i * 1.5),
            fps,
            config: { damping: 17, stiffness: 210, mass: 0.5 },
          });
          return (
            <span
              key={`${word}-${i}`}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                fontSize: '62px',
                fontWeight: 900,
                letterSpacing: '-0.028em',
                lineHeight: 1.1,
                color: '#ffffff',
                // No plate behind the words. The ground is true black and the
                // frosted capsule exists to lift text off a picture; over
                // black it is a grey rectangle drawn for nothing.
                textShadow: `0 6px 30px rgba(0,0,0,0.95), 0 0 ${
                  24 + energy * 26
                }px ${accent}66`,
                display: 'inline-block',
                opacity: entrance,
                transform: `translateY(${interpolate(entrance, [0, 1], [26, 0])}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Beat counter. One tick per beat this shot holds for. */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {Array.from({ length: Math.max(1, Math.min(16, beats)) }).map((_, i) => {
          const lit = i < elapsedBeats;
          const hot = i === elapsedBeats - 1;
          return (
            <div
              key={i}
              style={{
                width: hot ? `${34 + energy * 16}px` : '34px',
                height: '5px',
                borderRadius: '3px',
                background: lit ? accent : 'rgba(255,255,255,0.16)',
                boxShadow: hot ? `0 0 ${14 + energy * 22}px ${accent}` : 'none',
                opacity: lit ? 1 : 0.7,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

interface BeatRoomProps {
  accent: string;
  clock: BeatClock;
  durationInFrames: number;
}

/**
 * The room the silent ads are shot in.
 *
 * A black background is the brief and it is right — every phone gallery and
 * every Reels feed already frames the video against black, so matching it puts
 * the device in the feed rather than on a coloured card. But a truly flat black
 * frame for sixty seconds reads as a video that failed to load, so the room
 * gets lit on the beat instead of being filled with a gradient: a wide, very
 * low accent pool that swells on the downbeat and falls back to nothing.
 *
 * That is the same instruction as "no overlay rectangles" from the other side.
 * Light, not shapes.
 */
export const BeatRoom: React.FC<BeatRoomProps> = ({ accent, clock, durationInFrames }) => {
  const frame = useCurrentFrame();
  const energy = beatEnergy(frame, clock);

  // A slow sweep of the pool across the shot, so two consecutive shots at the
  // same tempo do not light identically.
  const drift = interpolate(frame, [0, durationInFrames], [-6, 6], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 78% 46% at ${50 + drift}% 42%, ${accent}${
            energy > 0.5 ? '2A' : '1E'
          } 0%, transparent 64%)`,
          filter: 'blur(24px)',
          opacity: 0.55 + energy * 0.45,
          pointerEvents: 'none',
        }}
      />
      {/* Floor bounce: the light the device is standing in. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '520px',
          background: `linear-gradient(to top, ${accent}1A 0%, transparent 100%)`,
          opacity: 0.5 + energy * 0.5,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};
