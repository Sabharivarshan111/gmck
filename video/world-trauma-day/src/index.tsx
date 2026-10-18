import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {GMCKCrash} from './GMCKCrash';
import {AIEnhanced} from './AIEnhanced';
const Root:React.FC=()=><>
  <Composition id="GMCKCrash" component={GMCKCrash} width={1280} height={720} fps={24} durationInFrames={528}/>
  <Composition id="AIEnhanced" component={AIEnhanced} width={1280} height={720} fps={24} durationInFrames={912} defaultProps={{useAIFootage:false}}/>
</>;
registerRoot(Root);
