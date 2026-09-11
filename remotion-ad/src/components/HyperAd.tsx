import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from 'remotion';
import type { AdScript, Shot } from '../scripts/types';
import { screenSrc } from './ScreenRegistry';
import { SweptType } from './SweptType';
import { TypedLine } from './TypedLine';
import { EndCard, PLAY_BADGE_FILE } from './EndCard';
import { HAS_PLAY_BADGE } from './playBadge';
import { DYNAMIC_SCRIPT_TIMINGS } from '../dynamicScriptTimings';
import { resolveShotFrames, scriptFrames } from '../scripts/types';

/**
 * The two flat, typographic ads.
 *
 * `ShotTimeline` flies a titanium phone through 3D space and puts a headline
 * in the platform-safe band. It is good at what it does and it is the wrong
 * shape for this: these two are built on the techniques in
 * `Tejashmakwana/astra-chatgpt-hyperframes`, where **the type is the film**
 * and the product appears behind it rather than in front.
 *
 * Running both through one renderer would collapse them into one ad with two
 * colour schemes, which is exactly what the owner asked these not to be. So
 * this is a second renderer, and `script.look` chooses.
 *
 * ## The two looks
 *
 * * **`prompt`** — a light ground. Somebody types a real MBBS question, the
 *   caret blinks, and the app answers underneath. It is the shape of asking
 *   something, which is what the triple tap and Ask AI actually are.
 * * **`keynote`** — a dark ground. One claim at a time in large swept type
 *   over a full-bleed screen, the light crossing the words as they resolve.
 *
 * ## What is shared with the device ads, and why
 *
 * Everything that is not the look: the script is an ordinary `AdScript`, so it
 * is bookended with the same opening and closing, timed from its own
 * recordings by `measure-audio`, budgeted by `preflight`, and given a silent
 * twin. A new ad format that quietly opted out of those would be a new ad
 * format that overran its voice, which is the bug this session started on.
 */

const FRAME_W = 1080;
const FRAME_H = 1920;

/** Ground colours. Neither is pure white or pure black: both clip on phones. */
const LIGHT_BG = '#F4F6FA';
const DARK_BG = '#05070D';

const shotAccent = (shot: Shot, fallback: string) => shot.accent ?? fallback;

/* ------------------------------------------------------------------ prompt */

const PromptShot: React.FC<{ shot: Shot; duration: number; index: number }> = ({
  shot,
  duration,
  index,
}) => {
  const frame = useCurrentFrame();

  if (shot.endCard) {
    return (
      <EndCard
        accent={shotAccent(shot, '#7C5CFF')}
        durationInFrames={duration}
        hasPlayBadge={HAS_PLAY_BADGE}
        light={true}
      />
    );
  }
  const accent = shotAccent(shot, '#2F6BFF');

  // The screen drifts a little so a still frame is never quite still. Small:
  // this look is about the words, and a moving background competes with them.
  const drift = interpolate(frame, [0, duration], [0, -26], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const fade = interpolate(frame, [0, 8, duration - 8, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: LIGHT_BG, opacity: fade }}>
      {shot.screen ? (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: '0px',
          }}
        >
          {/*
             The screen sits BELOW the words and is cropped by the frame rather
             than shrunk to fit it. A phone drawn whole, small, in the middle
             of a light page is a screenshot; a phone running off the bottom
             edge is a device somebody is holding.
          */}
          <div
            style={{
              width: '800px',
              height: '1330px',
              borderRadius: '54px',
              overflow: 'hidden',
              transform: `translateY(${drift}px)`,
              boxShadow: '0 40px 90px rgba(15, 23, 42, 0.28)',
              border: '10px solid #0B1220',
              background: '#0B1220',
            }}
          >
            <Img
              src={screenSrc(shot.screen)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          </div>
        </AbsoluteFill>
      ) : null}

      {/* A wash so the type always has a ground, whatever the screen shows. */}
      <AbsoluteFill
        style={{
          /*
             A wash so the type always has a ground, whatever the screen
             shows — and no further. It used to hold full opacity to 34% and
             fade out at 62%, which bleached the top third of the device to
             near-white and left a dead band between the headline and anything
             worth looking at. It now clears the type and stops.
          */
          background: `linear-gradient(180deg, ${LIGHT_BG} 0%, ${LIGHT_BG} 20%, rgba(244,246,250,0.72) 28%, rgba(244,246,250,0) 38%)`,
        }}
      />

      {/*
         With no screen the shot is a title card, and the type belongs in the
         middle of the frame rather than at the top of a void. The bookend
         "Welcome to Orbit" is exactly this shot, and top-aligning it left
         nine tenths of the frame empty.
      */}
      <AbsoluteFill
        style={{
          padding: shot.screen ? '150px 84px 0' : '0 84px',
          alignItems: 'flex-start',
          justifyContent: shot.screen ? 'flex-start' : 'center',
        }}
      >
        {shot.kicker ? (
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '30px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '26px',
              opacity: interpolate(frame, [2, 12], [0, 1], { extrapolateRight: 'clamp' }),
            }}
          >
            {shot.kicker}
          </div>
        ) : null}

        {/*
           Shot one of a prompt ad is somebody typing; the rest are the answer.
           The typed treatment is reserved for the shots that are a question,
           because a whole ad of typing is a whole ad of waiting.
        */}
        {shot.typed ? (
          <TypedLine
            text={shot.text ?? ''}
            size={62}
            colour="#0B1220"
            caret={accent}
            mono
            delay={4}
            maxWidth={912}
            maxLines={2}
          />
        ) : (
          <SweptType
            text={shot.text ?? ''}
            size={shot.screen ? 74 : 104}
            accent={accent}
            align="left"
            light
            delay={2}
            maxWidth={912}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------------- keynote */

const KeynoteShot: React.FC<{ shot: Shot; duration: number; index: number }> = ({
  shot,
  duration,
  index,
}) => {
  const frame = useCurrentFrame();

  if (shot.endCard) {
    return (
      <EndCard
        accent={shotAccent(shot, '#7C5CFF')}
        durationInFrames={duration}
        hasPlayBadge={HAS_PLAY_BADGE}
        light={false}
      />
    );
  }
  const accent = shotAccent(shot, '#7C5CFF');

  const fade = interpolate(frame, [0, 7, duration - 7, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // A slow push on the screen behind the words. Alternated so consecutive
  // shots do not all drift the same way, which reads as one long move.
  const push = interpolate(frame, [0, duration], index % 2 === 0 ? [1.06, 1.14] : [1.14, 1.06], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_BG, opacity: fade }}>
      {shot.screen ? (
        <AbsoluteFill>
          <Img
            src={screenSrc(shot.screen)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              transform: `scale(${push})`,
              // Full-bleed and dimmed, so it is the room the words are in
              // rather than the thing being pointed at.
              filter: 'saturate(1.05) brightness(0.34) contrast(0.92)',
            }}
          />
          {/* Colour and vignette, so the frame belongs to this shot's accent. */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(120% 80% at 50% 18%, ${accent}22 0%, rgba(5,7,13,0.55) 52%, ${DARK_BG} 88%)`,
            }}
          />
          {/*
             A band of dark across the middle, where the words are.
             The vignette above is weakest exactly where the headline sits, and
             an anatomical plate is a light image covered in its own labels —
             "Medial Cord", "Ulnar Artery" — which read as competing text
             behind the one sentence the viewer is meant to read. This is the
             scrim the wallpaper feature in the app uses for the same reason: a
             picture has no contrast guarantee.
          */}
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(180deg, rgba(5,7,13,0) 24%, rgba(5,7,13,0.86) 42%, rgba(5,7,13,0.86) 62%, rgba(5,7,13,0) 80%)',
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(90% 60% at 50% 40%, ${accent}2E 0%, ${DARK_BG} 70%)`,
          }}
        />
      )}

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 84px',
          flexDirection: 'column',
          gap: '38px',
        }}
      >
        {shot.kicker ? (
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '28px',
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: accent,
              opacity: interpolate(frame, [3, 14], [0, 1], { extrapolateRight: 'clamp' }),
            }}
          >
            {shot.kicker}
          </div>
        ) : null}

        <SweptType
          text={shot.text ?? ''}
          size={shot.screen ? 88 : 112}
          accent={accent}
          align="center"
          delay={2}
          maxWidth={912}
        />

        <div
          style={{
            width: `${interpolate(frame, [6, 26], [0, 190], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            })}px`,
            height: '6px',
            borderRadius: '3px',
            background: accent,
            boxShadow: `0 0 30px ${accent}`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------- ad */

export const HyperAd: React.FC<{ script: AdScript }> = ({ script }) => {
  const timing = DYNAMIC_SCRIPT_TIMINGS[script.voiceOf ?? script.id];
  const spoken = !script.noVoice;
  const grid = resolveShotFrames(script);

  let cursor = 0;
  const shots = script.shots.map((shot, i) => {
    const measured = timing?.shots.find((s) => s.n === shot.n);
    if (spoken && measured) {
      return { shot, index: i, from: measured.startFrame, duration: measured.shotFrames };
    }
    const from = cursor;
    const duration = grid[i] > 0 ? grid[i] : 120;
    cursor += duration;
    return { shot, index: i, from, duration };
  });

  const total = spoken ? (timing?.totalFrames ?? scriptFrames(script)) : scriptFrames(script);
  const Shot = script.look === 'prompt' ? PromptShot : KeynoteShot;

  return (
    <AbsoluteFill
      style={{ backgroundColor: script.look === 'prompt' ? LIGHT_BG : DARK_BG }}
    >
      {script.music ? (
        <Audio
          src={staticFile(script.music)}
          volume={(f) =>
            interpolate(f, [0, 18, Math.max(19, total - 40), total], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }) * (spoken ? 0.17 : 0.52)
          }
        />
      ) : null}

      {shots.map(({ shot, index, from, duration }) => (
        <Sequence key={shot.n} from={from} durationInFrames={duration} layout="none">
          <Shot shot={shot} duration={duration} index={index} />
        </Sequence>
      ))}

      {/*
        The voice is mounted outside its shot with no duration, exactly as the
        reels do it, so a clip is never trimmed mid-word. It cannot overrun
        into the next shot either, because `measure-audio` gave every shot at
        least its own audio plus air.
      */}
      {spoken
        ? shots.map(({ shot, from }) => (
            <Sequence key={`vo-${shot.n}`} from={from} layout="none">
              <Audio src={staticFile(`audio/${script.id}/shot_${String(shot.n).padStart(2, '0')}.mp3`)} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};

export const HYPER_FRAME = { width: FRAME_W, height: FRAME_H };
