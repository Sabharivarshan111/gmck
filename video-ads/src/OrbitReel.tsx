import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const FPS = 30;
const WIDTH = 1080;
const TRANSITION = 17;

type Scene = {
  start: number;
  end: number;
  key: string;
  file?: string;
};

const scenes: Scene[] = [
  {start: 0, end: 8, key: 'welcome', file: 'posters/01-welcome.png'},
  {start: 8, end: 15, key: 'montage'},
  {start: 15, end: 20.6, key: 'triple', file: 'posters/02-triple-tap.png'},
  {start: 20.6, end: 26.4, key: 'ask', file: 'posters/04-ask-ai.png'},
  {start: 26.4, end: 33.5, key: 'flash', file: 'posters/03-flashcards.png'},
  {start: 33.5, end: 38.1, key: 'attendance', file: 'posters/05-attendance.png'},
  {start: 38.1, end: 44, key: 'case', file: 'posters/07-case-proformas.png'},
  {start: 44, end: 49.5, key: 'progress', file: 'posters/06-progress.png'},
  {start: 49.5, end: 60, key: 'download', file: 'posters/08-download.png'},
];

const montage = [
  'posters/02-triple-tap.png',
  'posters/04-ask-ai.png',
  'posters/03-flashcards.png',
  'posters/05-attendance.png',
  'posters/07-case-proformas.png',
  'posters/06-progress.png',
];

const beats = [
  [0.65, 2.25, 'MEET ORBIT', 420, 'pink'],
  [2.4, 4.7, 'BUILT BY AN MBBS STUDENT', 420, 'cream'],
  [4.9, 7.35, 'FOR MBBS STUDENTS', 420, 'pink'],
  [8.15, 9.15, 'NOTES', 425, 'cream'],
  [9.25, 10.25, 'QUESTION BANK', 425, 'pink'],
  [10.35, 11.35, 'FLASHCARDS', 425, 'cream'],
  [11.45, 12.45, 'ATTENDANCE', 425, 'pink'],
  [12.55, 13.55, 'ASK AI', 425, 'cream'],
  [13.65, 14.75, 'CASE PROFORMAS', 425, 'pink'],
  [15.15, 16.7, 'TRIPLE-TAP', 425, 'pink'],
  [16.85, 18.35, 'FULL NOTE', 425, 'cream'],
  [18.5, 20.2, 'TEXTBOOK-GROUNDED', 425, 'pink'],
  [20.8, 22.35, 'ASK AI', 425, 'pink'],
  [22.5, 24.05, 'FOLLOW-UPS', 425, 'cream'],
  [24.2, 26.05, 'VOICE INPUT', 425, 'pink'],
  [26.6, 28.2, 'ANKI-STYLE', 425, 'pink'],
  [28.35, 30.55, 'SPACED REPETITION', 425, 'cream'],
  [30.7, 33.15, 'HARD CARDS RETURN', 425, 'pink'],
  [33.65, 35.3, 'THEORY + CLINICAL', 425, 'pink'],
  [35.42, 36.83, 'ATTENDANCE', 425, 'cream'],
  [36.94, 38, 'NO MANUAL MATH', 425, 'pink'],
  [38.25, 39.95, 'CASE PROFORMAS', 425, 'pink'],
  [40.08, 41.65, 'VIVA PEARLS', 425, 'cream'],
  [41.8, 43.7, 'BEDSIDE GUIDANCE', 425, 'pink'],
  [44.1, 46.1, 'STREAKS • XP • REWARDS', 425, 'cream'],
  [46.25, 49.15, 'SEE YOUR PROGRESS', 425, 'pink'],
  [49.7, 51.65, 'DOWNLOAD ORBIT', 310, 'pink'],
  [51.8, 54.35, 'ON GOOGLE PLAY', 310, 'cream'],
  [54.5, 56.35, 'SCAN THE QR', 310, 'pink'],
  [56.5, 57.55, 'LEARN.', 310, 'cream'],
  [57.58, 58.62, 'RETAIN.', 310, 'pink'],
  [58.65, 59.8, 'MASTER.', 310, 'cream'],
] as const;

const sec = (value: number) => Math.round(value * FPS);

const getFile = (scene: Scene, frame: number) => {
  if (scene.key !== 'montage') return scene.file!;
  const start = sec(scene.start);
  const end = sec(scene.end);
  const local = Math.max(0, Math.min(end - start - 1, frame - start));
  const slot = (end - start) / montage.length;
  const index = Math.min(montage.length - 1, Math.floor(local / slot));
  return montage[index];
};

const Poster: React.FC<{
  file: string;
  local: number;
  duration: number;
  index: number;
  opacity?: number;
  offsetX?: number;
  extraScale?: number;
}> = ({file, local, duration, index, opacity = 1, offsetX = 0, extraScale = 0}) => {
  const progress = interpolate(local, [0, Math.max(1, duration - 1)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const direction = index % 2 === 0 ? -1 : 1;
  const drift = direction * interpolate(progress, [0, 1], [10, -10]);
  const scale = 1.01 + 0.027 * progress + extraScale;

  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden'}}>
      <Img
        src={staticFile(file)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translateX(${drift + offsetX}px) translateY(${6 - progress * 12}px) scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};

const KineticBeat: React.FC<{frame: number}> = ({frame}) => {
  const beat = beats.find(([start, end]) => frame >= sec(start) && frame <= sec(end));
  if (!beat) return null;
  const [start, end, text, bottom, tone] = beat;
  const enterFrame = Math.max(0, frame - sec(start));
  const pop = spring({
    fps: FPS,
    frame: enterFrame,
    config: {damping: 11, stiffness: 190, mass: 0.72},
  });
  const exit = interpolate(frame, [sec(end) - 8, sec(end)], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const alpha = Math.min(1, pop * 1.5) * exit;
  const scale = interpolate(pop, [0, 1], [0.72, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(pop, [0, 1], [34, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        bottom,
        height: 178,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: alpha,
        transform: `translateY(${y}px) scale(${scale})`,
        borderRadius: 38,
        border: '3px solid rgba(255,76,229,.9)',
        background: 'rgba(7,5,16,.86)',
        color: tone === 'cream' ? '#fff4d8' : '#ff7beb',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontWeight: 900,
        fontSize: text.length > 21 ? 50 : 66,
        letterSpacing: text.length > 21 ? 0 : 0.5,
        textAlign: 'center',
        boxShadow: '0 18px 46px rgba(0,0,0,.35)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 26,
          top: 34,
          bottom: 34,
          width: 12,
          borderRadius: 8,
          background: '#ff45e0',
        }}
      />
      {text}
      <span
        style={{
          position: 'absolute',
          width: 230,
          height: 8,
          bottom: 22,
          borderRadius: 5,
          background: '#ff3edc',
        }}
      />
    </div>
  );
};

export const OrbitReel: React.FC<{voiceover: boolean}> = ({voiceover}) => {
  const frame = useCurrentFrame();
  const sceneIndex = Math.min(
    scenes.length - 1,
    Math.max(0, scenes.findIndex((s) => frame < sec(s.end))),
  );
  const scene = scenes[sceneIndex];
  const start = sec(scene.start);
  const end = sec(scene.end);
  const local = frame - start;
  const duration = end - start;
  const transitionStart = end - TRANSITION;
  const inTransition = sceneIndex < scenes.length - 1 && frame >= transitionStart;
  const t = inTransition
    ? interpolate(frame, [transitionStart, end], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      })
    : 0;
  const next = scenes[Math.min(scenes.length - 1, sceneIndex + 1)];
  const currentFile = getFile(scene, frame);
  const nextFile = getFile(next, sec(next.start));

  const fadeIn = interpolate(frame, [0, 9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [1789, 1799], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#07030d', overflow: 'hidden'}}>
      <Poster
        file={currentFile}
        local={local}
        duration={duration}
        index={sceneIndex}
        opacity={inTransition ? 1 - t : 1}
        offsetX={inTransition ? -62 * t : 0}
        extraScale={inTransition ? 0.012 * t : 0}
      />
      {inTransition ? (
        <>
          <Poster
            file={nextFile}
            local={0}
            duration={Math.max(1, sec(next.end - next.start))}
            index={sceneIndex + 1}
            opacity={t}
            offsetX={62 * (1 - t)}
            extraScale={-0.008 * (1 - t)}
          />
          <div
            style={{
              position: 'absolute',
              top: -160,
              bottom: -160,
              left: interpolate(t, [0, 1], [-240, WIDTH + 120]),
              width: 110,
              transform: 'rotate(-6deg)',
              background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,175,247,.48), rgba(255,255,255,0))',
              opacity: 1 - Math.abs(t - 0.5) * 2,
            }}
          />
        </>
      ) : null}

      {frame >= 66 ? (
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 110,
            padding: '12px 24px',
            borderRadius: 30,
            border: '2px solid rgba(255,82,226,.55)',
            background: 'rgba(6,4,14,.58)',
            color: 'rgba(255,255,255,.94)',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 24,
            letterSpacing: 0.4,
          }}
        >
          ORBIT&nbsp;&nbsp;•&nbsp;&nbsp;MBBS QBANK WITH AI
        </div>
      ) : null}

      <KineticBeat frame={frame} />

      <AbsoluteFill style={{background: '#000', opacity: 1 - fadeIn * fadeOut, pointerEvents: 'none'}} />

      <Audio src={staticFile('audio/music.wav')} volume={voiceover ? 0.16 : 0.58} />
      {voiceover ? <Audio src={staticFile('audio/voiceover.mp3')} volume={1} /> : null}
    </AbsoluteFill>
  );
};
