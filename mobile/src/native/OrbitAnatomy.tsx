import React from 'react';
import {Platform,UIManager,requireNativeComponent,View} from 'react-native';
import type {ViewProps,NativeSyntheticEvent} from 'react-native';
import {Text} from '@/components/Text';
export interface OrbitAnatomyProps extends ViewProps {
 model:string;visibleIds:string;contextIds:string;annotationIds:string;region:string;layer:string;hiddenIds:string;spread:number;cameraAction:number;
 onModelSelection:(event:NativeSyntheticEvent<{id:string;name:string}>)=>void;
 onModelLabels:(event:NativeSyntheticEvent<{points:Array<{id:string;x:number;y:number}>}>)=>void;
 onModelStatus:(event:NativeSyntheticEvent<{status:string;message?:string;parts?:number}>)=>void;
}
const available=Platform.OS==='android'&&UIManager.hasViewManagerConfig('OrbitAnatomy');
const NativeAnatomy=available?requireNativeComponent<OrbitAnatomyProps>('OrbitAnatomy'):null;
export function OrbitAnatomy(props:OrbitAnatomyProps){
 if(!NativeAnatomy)return <View style={props.style}><Text>Offline 3D renderer is unavailable in this binary. Install the new Android build.</Text></View>;
 return <NativeAnatomy {...props}/>;
}
