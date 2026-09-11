import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

/**
 * A line that types itself, with a block caret that sits at its end.
 *
 * The second technique from the reference project: characters are revealed at
 * a fixed rate (`Math.floor((f - 72) * 0.67)` there — two characters every
 * three frames) and a solid rectangle is drawn at the measured width of the
 * text so far. That caret is what makes it read as somebody typing rather than
 * as a wipe.
 *
 * Two departures, both deliberate:
 *
 * * **The caret blinks only once the line is finished.** While the characters
 *   are still arriving it is solid — a caret that blinks mid-word reads as a
 *   dropped frame. It starts blinking when the typing stops, which is the
 *   moment the viewer is meant to start reading.
 * * **Width comes from the layout, not from `measureText`.** The reference
 *   measures on a canvas; here the caret is simply the next inline element, so
 *   it is exactly where the text ends at any font, at any size, with no
 *   measurement to disagree with the render.
 *
 * A line that has not started yet renders nothing rather than an empty caret,
 * so several of these can be stacked with different delays and the later ones
 * stay invisible until their turn.
 */
export interface TypedLineProps {
  text: string;
  /** Frames before the first character appears. */
  delay?: number;
  /** Characters per frame. 0.67 is the reference's rate. */
  rate?: number;
  size: number;
  colour: string;
  caret: string;
  mono?: boolean;
  weight?: number;
  /**
   * The width the line has to live in, in px.
   *
   * A typed line is not wrapped by flex — the caret has to sit immediately
   * after the last character, which makes the text and the caret one inline
   * run rather than two boxes. Without a width to fit, a long prompt simply
   * runs off the frame: the first line of the prompt ad is 39 characters,
   * which at 62px monospace is 1,451px inside a 912px column.
   *
   * So the size given is a CEILING, and the line is set smaller when it has
   * to be. Monospace makes that honest arithmetic rather than a guess: every
   * glyph is the same width.
   */
  maxWidth?: number;
  /** Lines the text may wrap onto before the size has to come down. */
  maxLines?: number;
}

const BLINK_FRAMES = 16;

export const TypedLine: React.FC<TypedLineProps> = ({
  text,
  delay = 0,
  rate = 0.67,
  size: sizeCeiling,
  colour,
  caret,
  mono = false,
  weight = 400,
  maxWidth,
  maxLines = 2,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  if (f < 0) return null;

  // Shrink to fit before anything is drawn. 0.60em per glyph for monospace,
  // 0.52 for the proportional stack, both measured against these families.
  const perChar = mono ? 0.6 : 0.52;
  let size = sizeCeiling;
  if (maxWidth) {
    const room = maxWidth * maxLines;
    const needed = text.length * sizeCeiling * perChar;
    if (needed > room) size = Math.max(22, Math.floor((room / (text.length * perChar)) * 0.97));
  }

  const shown = Math.min(text.length, Math.floor(f * rate));
  const done = shown >= text.length;

  // Solid while typing; blinking once the line is there to be read.
  const caretOn = done ? Math.floor((f * rate - text.length) / BLINK_FRAMES) % 2 === 0 : true;

  const blur = Math.max(0, interpolate(f, [0, 5], [3, 0], { extrapolateRight: 'clamp' }));

  return (
    <div
      style={{
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none',
      }}
    >
      <span
        style={{
          fontFamily: mono
            ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
            : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: `${size}px`,
          fontWeight: weight,
          letterSpacing: mono ? '-0.01em' : '-0.02em',
          color: colour,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          lineHeight: 1.22,
        }}
      >
        {text.slice(0, shown)}
      </span>
      <span
        style={{
          display: 'inline-block',
          width: `${Math.round(size * 0.11)}px`,
          height: `${Math.round(size * 0.9)}px`,
          borderRadius: '2px',
          background: caret,
          opacity: caretOn ? 1 : 0,
          transform: 'translateY(6%)',
          marginLeft: `${Math.round(size * 0.14)}px`,
        }}
      />
    </div>
  );
};
