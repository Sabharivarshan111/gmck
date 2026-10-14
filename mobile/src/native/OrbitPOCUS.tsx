import {requireNativeComponent,type ViewProps} from 'react-native';
export interface PocusProps extends ViewProps{mode:string;gain:number;depth:number;heartRate:number;fluid:number;ischemia:number;air:number;mMode:boolean;colorDoppler:boolean;frozen:boolean}
export const OrbitPOCUS=requireNativeComponent<PocusProps>('OrbitPOCUS');
