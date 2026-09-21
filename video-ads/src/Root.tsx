import React from 'react';
import {Composition} from 'remotion';
import {OrbitReel} from './OrbitReel';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="OrbitLaunchNoVoice"
        component={OrbitReel}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{voiceover: false}}
      />
      <Composition
        id="OrbitLaunchVoice"
        component={OrbitReel}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{voiceover: true}}
      />
    </>
  );
};
