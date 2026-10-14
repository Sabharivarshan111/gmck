import React from 'react';
import {View} from 'react-native';
import type {PocusProps} from '@/native/OrbitPOCUS';
/** UI/prop harness only. The Android Canvas is checked on the emulator. */
export function OrbitPOCUS(props:PocusProps){return <View style={[props.style,{backgroundColor:'#03070d'}]} dataSet={{testid:'pocus-prop-harness',gain:String(props.gain),depth:String(props.depth)}}/>;}
