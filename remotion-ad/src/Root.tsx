import React from 'react';
import { Composition, getInputProps } from 'remotion';
import { ShotTimeline } from './components/ShotTimeline';
import { thePattern } from './scripts/thePattern';
import { twoAM } from './scripts/twoAM';
import { drawItFromMemory } from './scripts/drawItFromMemory';
import { FPS, TOTAL_FRAMES, type AdScript } from './scripts/types';

/**
 * Three compositions, one per ad. Each is a complete, standalone 90-second
 * spot — never chapters of one longer film, and never stitched together.
 *
 * `--props='{"withVoice":false}'` renders silent, which is what the sandbox
 * without speech-endpoint access uses to review motion.
 */
const scripts: AdScript[] = [thePattern, twoAM, drawItFromMemory];

export const RemotionRoot: React.FC = () => {
  const input = getInputProps() as { withVoice?: boolean };
  const withVoice = input?.withVoice !== false;

  return (
    <>
      {scripts.map((script) => (
        <Composition
          key={script.id}
          id={script.id}
          component={ShotTimeline as never}
          durationInFrames={TOTAL_FRAMES}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{ script, withVoice } as never}
        />
      ))}
    </>
  );
};
