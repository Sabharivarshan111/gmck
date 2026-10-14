import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';
export interface Spec extends TurboModule {
 play(file:string,speed:number,volume:number,userStarted:boolean):Promise<boolean>;
 update(speed:number,volume:number):void;
 isPlaying():Promise<boolean>;
 stop():void;
}
export default TurboModuleRegistry.get<Spec>('OrbitSimAudio');
