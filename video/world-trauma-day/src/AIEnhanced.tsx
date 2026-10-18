import React from 'react';
import {AbsoluteFill,OffthreadVideo,Sequence,staticFile} from 'remotion';
import {GMCKCrash} from './GMCKCrash';
export const AIEnhanced:React.FC<{useAIFootage?:boolean}>=({useAIFootage=false})=><AbsoluteFill style={{background:'#0b1419',color:'white',fontFamily:'Arial'}}>
<Sequence from={0} durationInFrames={192}>{useAIFootage?<OffthreadVideo src={staticFile('generated/establish.mp4')} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<AbsoluteFill style={{background:'linear-gradient(160deg,#263a32,#102027)',justifyContent:'center',alignItems:'center',fontSize:40}}>WORLD TRAUMA DAY — ROAD R01</AbsoluteFill>}</Sequence>
<Sequence from={192} durationInFrames={528}><GMCKCrash/></Sequence>
<Sequence from={720} durationInFrames={192}>{useAIFootage?<OffthreadVideo src={staticFile('generated/rescue.mp4')} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<AbsoluteFill style={{background:'linear-gradient(160deg,#243c41,#102029)',justifyContent:'center',alignItems:'center',fontSize:39}}>TRIAGE • TREAT • TRANSPORT</AbsoluteFill>}</Sequence>
</AbsoluteFill>;
