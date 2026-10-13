import React from 'react';
import {StyleSheet,View} from 'react-native';
import Svg,{Circle,Path} from 'react-native-svg';
import {Touchable} from '@/components/Touchable';
import {Text} from '@/components/Text';
import {typeScale} from '@/theme/typography';
import {layoutAnnotations,type Annotation,type ImageRect} from './annotationGeometry';
export function ImageCallouts({items,rect,width,height,margin,onSelect}:{items:readonly Annotation[];rect:ImageRect;width:number;height:number;margin:number;onSelect:(item:Annotation)=>void}){
 const placed=layoutAnnotations(items,rect,width,height,margin);
 return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
  <Svg width={width} height={height} pointerEvents="none">{placed.map(p=><React.Fragment key={p.id}>
   <Path d={`M ${p.lineX} ${p.labelY} L ${p.side==='left'?p.lineX+8:p.lineX-8} ${p.labelY} L ${p.point.x} ${p.point.y}`} stroke={p.provenance==='personal'?'#78d1dd':'#ced4da'} strokeWidth={1.15} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
   <Circle cx={p.point.x} cy={p.point.y} r={3} fill={p.provenance==='personal'?'#78d1dd':'#edf1f5'} stroke="#05080b" strokeWidth={1}/>
  </React.Fragment>)}</Svg>
  {placed.map(p=><Touchable key={p.id} label={`Identify ${p.name}`} onPress={()=>onSelect(p)} style={{position:'absolute',left:p.labelX,top:p.labelY-22,width:margin-16,minHeight:44,justifyContent:'center'}}>
   <Text numberOfLines={3} style={[typeScale.caption,{color:p.provenance==='personal'?'#78d1dd':'#e1e6ed',textAlign:p.side==='left'?'right':'left'}]}>{p.name}</Text>
  </Touchable>)}
 </View>;
}
