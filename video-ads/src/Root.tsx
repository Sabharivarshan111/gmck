import React from 'react';
import {Composition} from 'remotion';
import {OrbitReel} from './OrbitReel';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="OrbitReel"
        component={OrbitReel}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{captions: false}}
      />
      <Composition
        id="OrbitReelCaptions"
        component={OrbitReel}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{captions: true}}
      />
    </>
  );
};
