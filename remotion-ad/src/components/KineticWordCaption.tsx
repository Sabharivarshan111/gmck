import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { activeWordAt, lineFor } from './wordSync';

interface KineticWordCaptionProps {
  text: string;
  themeColor?: string;
  accent?: string;
  audioFrames?: number;
  durationInFrames?: number;
  /**
   * Which recording this caption is reading along with.
   *
   * Both are needed to find the shot's word boundaries, and both are optional
   * so the component still renders in isolation. Without them it falls back to
   * spreading the line evenly across the clip, which is the behaviour this
   * component had before and which never lined up with the voice — see
   * `wordSync.ts`.
   */
  scriptId?: string;
  shotN?: number;
}

export const KineticWordCaption: React.FC<KineticWordCaptionProps> = ({
  text,
  themeColor = '#38bdf8',
  accent,
  audioFrames = 90,
  durationInFrames = 105,
  scriptId,
  shotN
}) => {
  const activeColor = accent ?? themeColor;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.trim().split(/\s+/).filter(Boolean);
  const totalWords = Math.max(1, words.length);

  /*
   * The active word comes from the recording, not from arithmetic.
   *
   * This used to be `interpolate(frame, [2, audioFrames - 4], [0, n - 1])` —
   * an even slice of the clip per word. That is only right if every word takes
   * the same time to say, so the highlight drifted a word or two off the voice
   * by the middle of every line, in all three long-form ads, for their whole
   * ninety seconds. `activeWordAt` reads the synthesiser's own WordBoundary
   * events and keeps the even spread only as a fallback for a shot that has no
   * recorded timing.
   */
  const line = scriptId ? lineFor(scriptId, shotN ?? -1) : undefined;
  const spoken = activeWordAt(line, frame, fps, totalWords, Math.max(8, audioFrames - 4));
  const activeIndex = Math.min(totalWords - 1, spoken);

  // Overall container spring entrance
  const containerSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.7 }
  });

  // Fade out smoothly only during the last 6 frames of the shot
  const containerOpacity = interpolate(
    frame,
    [0, 6, durationInFrames - 6, durationInFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    }
  );
  const containerY = interpolate(containerSpring, [0, 1], [15, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '120px', // Comfortably placed below smartphone with >200px clearance
        left: '40px',
        right: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px 14px',
        zIndex: 50,
        opacity: containerOpacity,
        transform: `translateY(${containerY}px)`,
        pointerEvents: 'none'
      }}
    >
      {/* Sleek Frosted Glass Subtitle Capsule */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px 14px',
          padding: '14px 28px',
          borderRadius: '30px',
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(25px)',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)'
        }}
      >
        {words.map((word, idx) => {
          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;

          // Each word's entrance starts when that word is said. It used to
          // start at `idx * (audioFrames / totalWords)` — the same even-slice
          // assumption as the highlight, so the two were consistently wrong
          // together, which is why neither looked like a bug on its own.
          const startsAt = line?.words[idx]
            ? (line.words[idx].startMs / 1000) * fps
            : idx * (audioFrames / totalWords);
          const wordSpring = spring({
            frame: Math.max(0, frame - startsAt),
            fps,
            config: { damping: 14, stiffness: 100 }
          });

          const scale = isActive ? 1.06 : 1.0;
          const color = isActive ? '#ffffff' : isPassed ? '#cbd5e1' : 'rgba(255, 255, 255, 0.45)';
          const textShadow = isActive ? `0 0 20px ${themeColor}, 0 0 35px ${themeColor}aa` : 'none';

          return (
            <span
              key={idx}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                fontSize: '28px',
                fontWeight: isActive ? 900 : 700,
                color,
                textShadow,
                transform: `scale(${scale * Math.max(0.9, wordSpring)})`,
                display: 'inline-block',
                transition: 'color 0.12s ease, text-shadow 0.12s ease, transform 0.12s ease',
                letterSpacing: '-0.02em'
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
