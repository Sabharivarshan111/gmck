import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import shots from '../../neet-plan-shots.json';
const DETAIL: Record<string,string> = {
 library: 'CHAPTER-WISE QUESTION BANK', goal: 'YOUR PERSONAL STUDY GOAL', time: 'A PACE YOU CAN KEEP', priorities: 'YOUR PRIORITIES, FIRST', review: 'PREVIEW YOUR WORKLOAD', today: 'ONE FOCUSED SESSION', 'today-progress': 'SAVED ON THIS DEVICE', daily: 'NEET-PG QUESTION OF THE DAY', chapters: 'FIRST YEAR TO FINAL YEAR', search: 'SEARCH QUESTIONS & CONCEPTS', question: 'QUESTIONS · OPTIONS · ANSWERS', explanation: 'ANSWER & EXPLANATION', saved: 'YOUR REVISION COLLECTION', illustration: 'INSPECT QUESTION ILLUSTRATIONS', acev: 'CONTEXTUAL AI · INTERNET REQUIRED', mono: 'BLACK & WHITE THEME', end: 'YOUR NEXT CHAPTER STARTS HERE',
};
function Shot({index}: {index:number}) {
 const frame=useCurrentFrame(); const shot=shots[index];
 const opacity=interpolate(frame,[0,9,82,90],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const rise=interpolate(frame,[0,25],[25,0],{easing:Easing.out(Easing.cubic),extrapolateRight:'clamp'});
 const zoom=interpolate(frame,[0,90],[.985,1.015],{extrapolateRight:'clamp'});
 const ending=shot.screen==='end';
 return <AbsoluteFill style={{opacity,fontFamily:'Roboto, Arial, sans-serif',color:'#fff'}}>
  <div style={{position:'absolute',top:146,left:90,right:90,display:'flex',justifyContent:'space-between',fontSize:25,fontWeight:700,letterSpacing:5,color:'#d8b4fe'}}><span>ORBIT</span><span style={{color:'#9592a5',letterSpacing:3}}>NEET-PG</span></div>
  <div style={{position:'absolute',top:235,left:90,right:100,fontSize:76,lineHeight:1.05,fontWeight:750,letterSpacing:-2.8,transform:`translateY(${rise}px)`}}>{shot.line}</div>
  {ending ? <div style={{position:'absolute',top:590,left:130,right:130,textAlign:'center'}}><div style={{fontSize:136,fontWeight:800,letterSpacing:-7}}>ORBIT</div><div style={{fontSize:35,color:'#bfb7d4',marginTop:20}}>MBBS. One chapter at a time.</div><div style={{margin:'75px auto 30px',width:270,height:270,background:'#fff',padding:20,borderRadius:28}}><Img src={staticFile('app_screens/neet-plan/get-orbit-qr.png')} style={{width:'100%',height:'100%'}}/></div><div style={{fontSize:38,fontWeight:650}}>orbitmbbs.site</div><div style={{marginTop:25,fontSize:28,color:'#bfb7d4'}}>Android · Web · iPhone web app</div></div> : <div style={{position:'absolute',top:495,left:309,width:462,height:1000,transform:`scale(${zoom})`,transformOrigin:'50% 50%',borderRadius:43,padding:7,background:'linear-gradient(130deg,#67616f,#15121c 18%,#0a080f 76%,#51495e)',boxShadow:'0 40px 90px #000b, 0 0 100px #9333ea20'}}><div style={{height:'100%',width:'100%',borderRadius:36,overflow:'hidden',background:'#000',border:'1px solid #8883'}}><Img src={staticFile(`app_screens/neet-plan/${shot.screen}.png`)} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div></div>}
  <div style={{position:'absolute',bottom:310,left:90,right:90,textAlign:'center',fontSize:24,lineHeight:1.4,letterSpacing:2,color:'#e9d5ff',padding:'18px 20px',borderRadius:18,background:'#110b1ccc',border:'1px solid #e9d5ff20'}}>{DETAIL[shot.screen]}</div>
 </AbsoluteFill>;
}
export function NeetPgPlanLaunch() {
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:'#05040a'}}>
  <AbsoluteFill style={{background:`radial-gradient(ellipse at ${30+Math.sin(frame/200)*12}% 44%,#54208a65 0%,transparent 58%),radial-gradient(ellipse at 90% 70%,#1d235d55 0%,transparent 60%)`}}/>
  <style>{`@font-face {font-family:Roboto;src:url(${staticFile('fonts/neet-plan-roboto.woff2')}) format('woff2');font-weight:100 900;}`}</style>
  <Audio src={staticFile('audio/neet-plan/original-score.m4a')} volume={.85}/>
  {shots.map((shot,index)=><Sequence key={index} from={index*90} durationInFrames={90}><Shot index={index}/></Sequence>)}
 </AbsoluteFill>;
}
