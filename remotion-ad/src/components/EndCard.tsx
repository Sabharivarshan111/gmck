import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';

/**
 * The brand card. It opens every ad and it closes every ad.
 *
 * ## Opening
 *
 * The first shot is the mark and "Welcome to Orbit" — the app's owner's
 * instruction, and it replaces what used to be there: a line of copy trying to
 * hook the viewer before they knew whose ad this was. Twenty-six ads all
 * starting the same way is the point. Somebody who sees three of these in a
 * week should know by the first second whose they are, and the mark is what
 * they will recognise again in the store.
 *
 * ## Closing
 *
 * ## Why it exists
 *
 * Every ad closed on a spoken line — "Download Orbit on the Play Store" — over
 * whatever screenshot happened to be last. A viewer who has just decided they
 * want this has nothing to look at that tells them what to search for. The
 * logo is the thing they will recognise in the store listing, and a closing
 * frame without it is a closing frame that has to be remembered rather than
 * matched.
 *
 * ## The Google Play badge is NOT drawn here, and must not be
 *
 * Google's badge guidelines are explicit: do not modify the colour,
 * proportions or spacing of the badge, and use the official asset. A badge
 * redrawn in CSS is a modified badge, however carefully it is done — so this
 * renders the official artwork when it is present and a plain, clearly
 * non-badge line of text when it is not.
 *
 * `public/google-play-badge.png` is that slot. It is deliberately absent from
 * the repository: the sandbox cannot reach `play.google.com` to fetch it, and
 * inventing one would be worse than shipping without it. Drop the official PNG
 * from the Play badge generator at that path and every ad picks it up on the
 * next render, with no code change.
 *
 * `check:ad-truth` fails if anything ever tries to draw a badge instead.
 */

export const PLAY_BADGE_FILE = 'google-play-badge.png';

export type BrandCardVariant = 'open' | 'close';

export interface EndCardProps {
  accent: string;
  durationInFrames: number;
  /** `open` is the mark and a greeting; `close` adds the claims and the store. */
  variant?: BrandCardVariant;
  /** True when the official badge artwork is present in `public/`. */
  hasPlayBadge?: boolean;
  /** A dark ground, unless the ad it closes is a light one. */
  light?: boolean;
}

export const EndCard: React.FC<EndCardProps> = ({
  accent,
  durationInFrames,
  variant = 'close',
  hasPlayBadge = false,
  light = false,
}) => {
  const opening = variant === 'open';
  const frame = useCurrentFrame();

  // The mark settles once and stops. Nothing scales from zero — an entrance
  // from 0 reads as materialising out of nowhere, which is the house rule the
  // app's own motion follows.
  const rise = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const scale = interpolate(rise, [0, 1], [0.9, 1]);

  const wordmark = interpolate(frame, [8, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cta = interpolate(frame, [18, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ink = light ? '#0B1220' : '#F3F6FC';
  const ground = light ? '#F4F6FA' : '#05070D';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ground,
        opacity: out,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        /*
           One gap for the whole stack.

           The three lines used to sit in TWO boxes — the first two in a nested
           group with `gap: 14px`, the store line outside it under the parent's
           `gap: 40px`. So the space between line one and line two was a third
           of the space between line two and line three, which reads as the
           last line having drifted away from the other two. A single column
           with a single gap cannot do that.
        */
        gap: '22px',
        paddingBottom: '150px',
      }}
    >
      {/* The accent glow behind the mark, so the card belongs to the ad it ends. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 42%, ${accent}33 0%, ${ground} 72%)`,
          opacity: rise,
          // Behind everything. Without this the glow paints OVER the type —
          // an absolutely positioned sibling outranks static ones — and every
          // end card's words come out grey.
          zIndex: 0,
        }}
      />

      <Img
        src={staticFile('orbit-logo.png')}
        style={{
          width: '560px',
          height: 'auto',
          opacity: rise,
          zIndex: 1,
          transform: `scale(${scale.toFixed(4)})`,
          filter: `drop-shadow(0 18px 48px ${accent}55)`,
          /*
             No blend mode, because the artwork carries a real alpha channel.

             It shipped as white and cyan on a solid black square, which landed
             on a dark ground as a visible pasted rectangle. `mix-blend-mode:
             screen` hid most of it and not all — the square's ground is a few
             per cent above pure black, so a faint box survived, and a blend
             mode would have failed completely on a light ground anyway.

             `scripts/cut-logo-alpha.py` mattes it properly instead: alpha from
             the luminance, the black floor subtracted, colour unpremultiplied
             so the mark keeps its own, then cropped to its own bounds. The
             glow's falloff becomes partial alpha rather than a hard edge, so
             it sits on any background with nothing around it.
          */
        }}
      />

      {/*
         Three lines, in the order the app's owner asked for them: who it is
         for, what it costs, and where to get it.

         "Made for the medical community" first, because that is the claim a
         medical student actually checks — an app written for everybody is an
         app written for nobody, and this one's question bank came out of their
         own university papers. "Completely free" second, because it is the
         objection everybody arrives with. The store line last, because it is
         the only one that asks for anything.
      */}
      <div
        style={{
          // The fade in, times this line's own weight in the hierarchy.
          opacity: wordmark * (opening ? 1 : 0.86),
          zIndex: 1,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          /*
             Sizes carry the hierarchy, and "Completely free" is the top of it.

             It was the SMALLEST line on the card at 38px and 72% opacity — the
             strongest claim the app has, set as a footnote between two louder
             ones. This line supports it rather than competing with it, and on
             the opening card it is the only line there, so it is the hero
             instead.
          */
          fontSize: opening ? '58px' : '40px',
          fontWeight: opening ? 800 : 600,
          letterSpacing: '-0.01em',
          color: ink,
          textAlign: 'center',
        }}
      >
        {opening ? 'Welcome to Orbit' : 'Made for the medical community'}
      </div>

      {/*
         The rest of the card is the CLOSING one. An opening card is the mark
         and the greeting and nothing else: a viewer one second into a reel is
         not being asked for anything yet, and stacking the price and the store
         on the first frame is how an ad announces that it is an ad.
      */}
      {opening ? null : (
      <>
      {/*
         "Completely free" was set in the accent — a saturated violet under a
         white line and above a white one, which made the middle line read as
         a link rather than as part of the sentence. The three lines are one
         thought, so they are one colour, and the hierarchy is carried by
         weight and size instead. The accent stays where it is doing work: the
         glow behind the mark.
      */}
      <div
        style={{
          opacity: wordmark,
          zIndex: 1,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          /*
             The biggest words on the card, because "free" is the objection
             every viewer arrives with and the one thing that answers it.
             Drawn in the mark's own cyan rather than the shot accent: it is
             the colour already on screen in the logo above it, so it reads as
             part of the brand rather than as a link, which is what the violet
             did.
          */
          fontSize: '62px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#2BD9F2',
          textShadow: '0 0 38px rgba(43,217,242,0.45)',
          textAlign: 'center',
        }}
      >
        Completely free
      </div>

      <div style={{ opacity: cta, zIndex: 1, display: 'flex', justifyContent: 'center' }}>
        {hasPlayBadge ? (
          /*
             The official artwork, drawn at its own proportions. Height is set
             and width follows, so the badge is never stretched — changing its
             proportions is the first thing the guidelines forbid.
          */
          <Img
            src={staticFile(PLAY_BADGE_FILE)}
            style={{ height: '132px', width: 'auto' }}
          />
        ) : (
          /*
             No badge artwork, so: the official Google Play LOGO beside our own
             words.

             The logo is Google's current four-colour triangle, downloaded
             unmodified from `developer.android.com/static/images/logos/
             google-play.svg` — same geometry, same brand colours, drawn at its
             own 1:1 ratio and never recoloured or stretched. It is vector, so
             it is sharp at any size, which the only reachable BADGE artwork
             (129x45, and a design Google retired years ago) would not have
             been.

             This is a lockup rather than the badge, and the distinction is
             worth keeping straight: Google asks that the badge be used for a
             download call to action, and the badge is what supersedes this the
             moment `public/google-play-badge.png` exists. What is not done
             here, at all, is drawing either one.
          */
          <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
            <Img
              src={staticFile('google-play-logo.svg')}
              style={{ width: '76px', height: '76px' }}
            />
            <div
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '52px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: ink,
                textAlign: 'left',
              }}
            >
              Download on Play Store
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </AbsoluteFill>
  );
};
