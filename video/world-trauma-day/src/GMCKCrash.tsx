import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
/* Persistent objects, single fixed road, deterministic frame positions.
   This is an editable 2D previsualization, not a photorealistic crash simulation. */
const soft=(v:number)=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x)};
const impact=5.37, rear=6.46, side=6.65;
function Bus({x,y}:{x:number,y:number}){return <g transform={`translate(${x-140},${y-43})`}>
 <rect x="5" y="8" width="270" height="70" rx="10" fill="#e9dfbc" stroke="#fff2d4" strokeWidth="2"/>
 <rect x="7" y="49" width="268" height="28" rx="4" fill="#164f9b"/>
 {Array.from({length:9},(_,i)=><rect key={i} x={24+i*23} y="18" width="16" height="22" rx="2" fill="#254351" stroke="#719cab" strokeWidth="2"/>)}
 <rect x="244" y="16" width="27" height="45" rx="4" fill="#284452" stroke="#9fc0ce" strokeWidth="2"/>
 {[40,203].map(a=><React.Fragment key={a}><rect x={a} y="1" width="30" height="10" rx="5" fill="#18242b"/><rect x={a} y="76" width="30" height="10" rx="5" fill="#18242b"/></React.Fragment>)}
 </g>}
function Ambulance({x,y,green=false}:{x:number,y:number,green?:boolean}){return <g transform={`translate(${x-95},${y-36})`}>
 <rect x="3" y="8" width="184" height="56" rx="8" fill="#edf0ee" stroke="#dae3e4" strokeWidth="2"/>
 <rect x="7" y="46" width="177" height="9" fill={green?'#257e63':'#2563af'}/>
 <rect x="11" y="18" width="30" height="38" rx="5" fill="#254653" stroke="#a4c6d1" strokeWidth="2"/>
 <rect x="160" y="20" width="16" height="27" fill="#adc0c8"/>
 {[34,142].map(a=><React.Fragment key={a}><rect x={a} y="0" width="24" height="10" rx="5" fill="#18242b"/><rect x={a} y="61" width="24" height="10" rx="5" fill="#18242b"/></React.Fragment>)}
 <rect x="74" y="0" width="21" height="9" fill="#ec4141"/><rect x="97" y="0" width="21" height="9" fill="#397bea"/>
 </g>}
function Car({x,y}:{x:number,y:number}){return <g transform={`translate(${x-60},${y-29})`}>
 <rect x="2" y="5" width="115" height="49" rx="15" fill="#cbd2d6" stroke="#f2f5f7" strokeWidth="2"/><rect x="35" y="10" width="54" height="39" rx="12" fill="#698899" stroke="#c3d1d7" strokeWidth="2"/>
 </g>}
function Motorcycle({x,y,hit}:{x:number,y:number,hit:boolean}){return <g transform={`translate(${x-37},${y-18}) rotate(${hit?29:0},37,18)`}>
 <circle cx="16" cy="13" r="8" fill="#171b1f" stroke="#8d9da4" strokeWidth="2"/><circle cx="61" cy="13" r="8" fill="#171b1f" stroke="#8d9da4" strokeWidth="2"/><path d="M16 13H61" stroke="#111" strokeWidth="7"/><circle cx="39" cy="16" r="11" fill="#e23c38" stroke="#8f2525" strokeWidth="2"/>
 </g>}
export const GMCKCrash:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 const bx=-200+140*Math.min(t,impact),ax=1646-160*Math.min(t,impact),ay=448-126*soft((t-2.1)/1.35);
 const cx=-552+140*Math.min(t,rear),mx=-300+125*Math.min(t,side),my=t<6.05?217:217+38*soft((t-6.05)/0.6);
 const titles=t<2?['ONE ROAD','One bus. One car. One motorcycle.']:t<4.1?['WRONG-LANE ENTRY','A01 continues west, moving across the centreline.']:t<impact?['HEAD-ON APPROACH','Both original fronts face one another.']:t<rear?['FIRST IMPACT','Bus front physically contacts ambulance front.']:t<side?['SECOND IMPACT','Silver car reaches bus rear.']:t<10?['THIRD IMPACT','Motorcycle contacts bus left side.']:t<13?['CALL 112','All four original vehicles remain at this crash site.']:t<16?['RESCUE ARRIVES','A02 is distinct, green-striped and undamaged.']:t<19?['MASS CASUALTY TRIAGE','RED: immediate    YELLOW: delayed    GREEN: minor']:['WORLD TRAUMA DAY','ONE MOMENT. MANY LIVES.'];
 return <AbsoluteFill style={{backgroundColor:'#20382c'}}><svg width="1280" height="720" viewBox="0 0 1280 720">
 <defs><pattern id="grass" width="34" height="30" patternUnits="userSpaceOnUse"><circle cx="7" cy="10" r="2" fill="#426444" opacity=".6"/></pattern></defs>
 <rect width="1280" height="720" fill="url(#grass)"/><rect y="155" width="1280" height="410" fill="#485156"/>
 <path d="M0 170H1280M0 552H1280" stroke="#ded8ca" strokeWidth="5"/>
 {Array.from({length:13},(_,i)=><rect key={i} x={i*100+10} y="358" width="55" height="7" rx="2" fill="#eee2be"/>)}
 {Array.from({length:7},(_,i)=><g key={i} transform={`translate(${65+i*194},72)`}>{Array.from({length:8},(_,j)=>{const a=j*Math.PI/4;return <path key={j} d={`M0 0L${44*Math.cos(a)} ${31*Math.sin(a)}`} stroke="#49693d" strokeWidth="9" strokeLinecap="round"/>})}<circle r="7" fill="#766942"/></g>)}
 <rect x="860" y="602" width="135" height="75" rx="5" fill="#bca880"/><path d="M840 602L928 574L1018 602Z" fill="#235343"/><path d="M1044 585V685" stroke="#bca246" strokeWidth="8"/>
 <text x="60" y="195" fontSize="18" fill="#edf1e9" opacity=".65">EASTBOUND →</text><text x="1030" y="541" fontSize="18" fill="#edf1e9" opacity=".65">← WESTBOUND</text>
 <Car x={cx} y={316}/><Motorcycle x={mx} y={my} hit={t>=side}/><Bus x={bx} y={316}/><Ambulance x={ax} y={ay}/>
 {t>=impact&&<g><path d={`M${bx+121} 287l27 14 -11 16 17 19 -30 5`} stroke="#e1e3e4" strokeWidth="4" fill="#5f6f78"/><path d={`M${ax-98} 289l-17 24 14 24`} stroke="#c2cbd0" strokeWidth="4" fill="#53616a"/></g>}
 {t>=rear&&<path d={`M${bx-141} 296l-20 16 14 18`} stroke="#7c8890" strokeWidth="6" fill="none"/>}
 {t>=13&&<Ambulance x={Math.max(1157,1530-200*(t-13))} y={458} green/>}
 {t>=16&&[['RED','#df4c48',870],['YELLOW','#e2ae32',1000],['GREEN','#4fb987',1135]].map(([n,c,x])=><g key={String(n)}><rect x={Number(x)-62} y="575" width="112" height="40" rx="8" fill="#102028" stroke={String(c)} strokeWidth="4"/><text x={Number(x)-50} y="600" fontSize="16" fill={String(c)} fontWeight="bold">{n}</text></g>)}
 {t>=19&&<rect width="1280" height="720" fill="#030a0e" opacity={0.78*soft((t-19)/2.5)}/>}
 <rect x="36" y="29" width="515" height="85" rx="11" fill="#071016" opacity=".95"/><rect x="36" y="29" width="9" height="85" fill="#e5b453"/>
 <text x="60" y="70" fontSize="29" fontWeight="800" fill="white" fontFamily="Arial">{titles[0]}</text>
 <rect x="36" y="639" width="1208" height="55" rx="12" fill="#071016" opacity=".95"/><text x="59" y="675" fontSize="23" fontWeight="bold" fill="#f2f6f6" fontFamily="Arial">{titles[1]}</text>
 <text x="1113" y="50" fontSize="16" fontWeight="bold" fill="#f2f6f6">GMCK / WTD</text>
 <rect x="630" y="58" width="320" height="9" rx="4" fill="#2d424a"/><rect x="630" y="58" width={320*t/22} height="9" rx="4" fill="#e8ba67"/>
 </svg></AbsoluteFill>
}
