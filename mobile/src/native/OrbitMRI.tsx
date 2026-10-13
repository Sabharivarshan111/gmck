import React from 'react';import {requireNativeComponent,type ViewProps} from 'react-native';
export interface MriProps extends ViewProps{plane:string;slice:number;contrast:number;zoom:number}
export const OrbitMRI=requireNativeComponent<MriProps>('OrbitMRI');
