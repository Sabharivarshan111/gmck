import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

/**
 * A headline that resolves out of soft focus while a band of light travels
 * through the letters.
 *
 * ## Where this came from
 *
 * The technique is from `Tejashmakwana/astra-chatgpt-hyperframes`, which the
 * app's owner asked to build two ads against. What that project does, in a
 * canvas, is four things at once on its title card:
 *
 * * the type is filled with a horizontal gradient whose bright stop **moves**
 *   frame by frame (`blueAt = clamp(0.56 + f * 0.031)`), so light crosses the
 *   word rather than sitting on it;
 * * it enters **blurred and sharpens** (`blur(max(0, 7 - f * 1.5))`), so the
 *   words resolve instead of appearing;
 * * it settles with an **exponential decay**, not a spring
 *   (`1 + 0.10 * exp(-f / 3)`) — a slightly different, calmer arrival;
 * * it is revealed behind a **moving gradient mask** rather than a hard wipe.
 *
 * ## What is taken and what is not
 *
 * That repository's own code is MIT and this is a fresh implementation of its
 * ideas in React. Its **assets are not ours to use** and none are here: the
 * 180 background plates and the soundtrack are a third party's motion design,
 * supplied for that adaptation, and its `THIRD_PARTY.md` says plainly that
 * publication "does not claim ownership of the reference artwork or grant
 * permission to redistribute its soundtrack elsewhere". The Switzer font is
 * licensed per-download from Fontshare and deliberately not committed there
 * either. So: the technique, our screens, our words, our type stack.
 */
export interface SweptTypeProps {
  text: string;
  /** Frames from this component's start before the word begins to arrive. */
  delay?: number;
  size: number;
  /** The colour the light is; the type is near-black either side of it. */
  accent: string;
  weight?: number;
  align?: 'left' | 'center';
  /** Draw on a light ground rather than a dark one. */
  light?: boolean;
  maxWidth?: number;
}

/** How long the light takes to cross the word. */
const SWEEP_FRAMES = 34;
/** Blur at the moment of arrival, in px, decaying linearly to zero. */
const ENTRY_BLUR = 9;
const BLUR_FRAMES = 7;

export const SweptType: React.FC<SweptTypeProps> = ({
  text,
  delay = 0,
  size,
  accent,
  weight = 800,
  align = 'center',
  light = false,
  maxWidth,
}) => {
  const f = Math.max(0, useCurrentFrame() - delay);

  // Exponential settle rather than a spring. The reference overshoots by 10%
  // and decays with a time constant of three frames; a spring rings, and this
  // arrives once and stops, which is what a title card wants.
  const scale = 1 + 0.1 * Math.exp(-f / 3);

  const blur = Math.max(0, ENTRY_BLUR - (f * ENTRY_BLUR) / BLUR_FRAMES);
  const opacity = interpolate(f, [0, 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // The bright stop travels from before the first letter to past the last, so
  // the light enters and leaves rather than fading up in place.
  const at = interpolate(f, [0, SWEEP_FRAMES], [-0.15, 1.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  const ink = light ? '#0B1220' : '#F3F6FC';
  const shade = light ? '#39506B' : '#8FA6C4';
  const stops = [
    `${ink} 0%`,
    `${shade} ${Math.max(0, (at - 0.3) * 100).toFixed(1)}%`,
    `${accent} ${Math.min(100, at * 100).toFixed(1)}%`,
    `${shade} ${Math.min(100, (at + 0.3) * 100).toFixed(1)}%`,
    `${ink} 100%`,
  ].join(', ');

  return (
    <div
      style={{
        display: 'block',
        width: '100%',
        textAlign: align,
        opacity,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none',
        transform: `scale(${scale.toFixed(4)})`,
        transformOrigin: align === 'center' ? '50% 50%' : '0% 50%',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          maxWidth: maxWidth ? `${maxWidth}px` : '100%',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          fontSize: `${size}px`,
          fontWeight: weight,
          letterSpacing: '-0.03em',
          lineHeight: 1.06,
          // The gradient is painted through the glyphs, which is the whole
          // effect. `background-clip: text` is the browser's version of the
          // reference's canvas gradient fill.
          backgroundImage: `linear-gradient(90deg, ${stops})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          // A faint shadow under the glyphs so a pale stop still reads on a
          // busy ground. Drawn on the element, not the gradient, or it would
          // be clipped away with everything else.
          filter: light
            ? 'drop-shadow(0 2px 10px rgba(15,23,42,0.18))'
            : 'drop-shadow(0 4px 22px rgba(0,0,0,0.65))',
        }}
      >
        {text}
      </span>
    </div>
  );
};
