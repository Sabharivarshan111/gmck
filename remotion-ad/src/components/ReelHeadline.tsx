import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { lineFor, spanWordFrames } from './wordSync';

interface ReelHeadlineProps {
  text: string;
  accent: string;
  durationInFrames: number;
  /** The script this shot belongs to; absent on a silent cut. */
  scriptId?: string;
  shotN?: number;
  /** The full line being spoken, of which `text` is a verbatim span. */
  spokenLine?: string;
}

/**
 * The one piece of text a reel shot puts on screen.
 *
 * The long-form ads caption the *spoken* line word by word, which works when
 * the viewer has chosen to watch a 90-second film. A reel is watched muted,
 * scrolled past in under two seconds, and re-cut without voice entirely — so
 * the text has to be the argument rather than a transcript of it. Every reel
 * shot therefore carries one short headline and nothing else, and it says the
 * same thing the voice says. Visual, spoken and text hooks aligned is the
 * single largest lever on whether the first three seconds hold.
 *
 * Two placement rules, both measured rather than chosen:
 *
 * * **`bottom: 330`.** Instagram and TikTok draw their own caption, handle and
 *   action rail over roughly the bottom 260–290px of a 1920 frame. Text below
 *   that is text nobody reads. The long-form ads sit at 120 because they were
 *   tuned to clear the phone rather than the platform; a reel has to clear
 *   both, which is why `ShotTimeline` also lifts and slightly shrinks the
 *   device for this format.
 * * **The words arrive inside ten frames.** A third of a second, so the
 *   headline is fully legible well before the ~1.7s at which a Reels viewer
 *   has already decided. A stagger that looks elegant at 90 seconds is a
 *   headline that finishes assembling after the scroll.
 *
 * ## What it means for this to be in sync
 *
 * The headline used to be unrelated to the words being spoken under it. Shot
 * one of "Already Asked" read "2,025 already asked" while the voice said "Your
 * university repeats its questions" — a viewer with the sound on read one
 * sentence and heard a different one, which is what the app's owner reported
 * as nothing syncing. The scripts now write the headline as a **verbatim span
 * of the spoken line** and `preflight` fails a render where that is not true.
 *
 * Given that, this can light each word at the moment it is said. The words
 * still all arrive within ten frames — the muted cut is the one that gets
 * watched, and holding a word back until it is spoken would damage it to
 * improve the other — so the sync is carried by colour, not by entrance. On a
 * silent cut there is no recording to read and the highlight simply never
 * runs.
 */
export const ReelHeadline: React.FC<ReelHeadlineProps> = ({
  text,
  accent,
  durationInFrames,
  scriptId,
  shotN,
  spokenLine,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.trim().split(/\s+/).filter(Boolean);

  // When each headline word is actually said. Null on a silent cut, and null
  // if the headline is not a span of the line — in both cases every word is
  // drawn lit, which is what the headline looked like before any of this.
  const spokenAt =
    scriptId && spokenLine
      ? spanWordFrames(lineFor(scriptId, shotN ?? -1), text, fps)
      : null;

  if (words.length === 0) return null;

  const opacity = interpolate(
    frame,
    [0, 5, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // The accent rule wipes in under the words and holds. It is the only thing
  // on screen that is pure accent, so it also carries the shot's colour.
  const ruleWidth = interpolate(frame, [2, 16], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '330px',
        left: '64px',
        right: '64px',
        zIndex: 60,
        opacity,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '0 18px',
          padding: '18px 34px',
          borderRadius: '28px',
          background: 'rgba(3, 7, 18, 0.82)',
          backdropFilter: 'blur(22px)',
          border: '1.5px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 18px 46px rgba(0, 0, 0, 0.7)',
        }}
      >
        {words.map((word, i) => {
          const entrance = spring({
            frame: Math.max(0, frame - i * 2),
            fps,
            config: { damping: 15, stiffness: 170, mass: 0.6 },
          });
          // Unlit until this word is spoken, then it stays lit. With no
          // recording every word counts as spoken, so the headline reads
          // exactly as it did before word timings existed.
          const said = spokenAt ? frame >= spokenAt[i] : true;
          return (
            <span
              key={`${word}-${i}`}
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                fontSize: '58px',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.12,
                color: said ? '#ffffff' : 'rgba(255, 255, 255, 0.42)',
                textShadow: said
                  ? `0 4px 24px rgba(0,0,0,0.8), 0 0 34px ${accent}88`
                  : '0 4px 24px rgba(0,0,0,0.8)',
                display: 'inline-block',
                opacity: entrance,
                transform: `translateY(${interpolate(entrance, [0, 1], [22, 0])}px)`,
                transition: 'color 0.1s linear, text-shadow 0.1s linear',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      <div
        style={{
          width: `${ruleWidth * 0.4}%`,
          height: '6px',
          borderRadius: '3px',
          background: accent,
          boxShadow: `0 0 26px ${accent}`,
        }}
      />
    </div>
  );
};
