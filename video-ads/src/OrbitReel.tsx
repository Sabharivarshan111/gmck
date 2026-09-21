import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const SCENES = [
  {file: 'posters/01-welcome.png', caption: 'One app for your MBBS study workflow.'},
  {file: 'posters/02-triple-tap.png', caption: 'Triple-tap for structured, textbook-grounded full notes.'},
  {file: 'posters/03-flashcards.png', caption: 'Anki-style flashcards with spaced repetition.'},
  {file: 'posters/04-ask-ai.png', caption: 'Ask AI for explanations and follow-up questions.'},
  {file: 'posters/05-attendance.png', caption: 'Track theory and clinical attendance automatically.'},
  {file: 'posters/06-progress.png', caption: 'Streaks, XP, rewards and revision progress.'},
  {file: 'posters/07-case-proformas.png', caption: 'Case proformas, viva pearls and bedside guidance.'},
  {file: 'posters/08-download.png', caption: 'Search ORBIT MBBS QBank with AI on Google Play.'},
];

const FPS = 30;
const SCENE_FRAMES = 225; // 7.5 seconds x 8 = 60 seconds
const FADE = 12;

const Scene: React.FC<{
  file: string;
  index: number;
  caption: string;
  captions: boolean;
}> = ({file, index, caption, captions}) => {
  const frame = useCurrentFrame();
  const local = frame - index * SCENE_FRAMES;
  const scale = interpolate(local, [0, SCENE_FRAMES - 1], [1, 1.045], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = interpolate(local, [0, SCENE_FRAMES - 1], [
    index % 2 === 0 ? -7 : 7,
    index % 2 === 0 ? 7 : -7,
  ]);
  const fadeIn = interpolate(local, [0, FADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(local, [SCENE_FRAMES - FADE, SCENE_FRAMES], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{backgroundColor: '#07030d', opacity}}>
      <Img
        src={staticFile(file)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translateX(${drift}px) scale(${scale})`,
        }}
      />
      {captions ? (
        <div
          style={{
            position: 'absolute',
            left: 72,
            right: 72,
            bottom: 250,
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            fontSize: 50,
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.15,
            padding: '22px 28px',
            borderRadius: 28,
            background: 'rgba(5, 2, 12, 0.72)',
            boxShadow: '0 10px 50px rgba(0,0,0,0.35)',
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const OrbitReel: React.FC<{captions: boolean}> = ({captions}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#07030d'}}>
      {SCENES.map((scene, index) => (
        <Sequence
          key={scene.file}
          from={index * SCENE_FRAMES}
          durationInFrames={SCENE_FRAMES}
          premountFor={FPS}
        >
          <Scene {...scene} index={index} captions={captions} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
