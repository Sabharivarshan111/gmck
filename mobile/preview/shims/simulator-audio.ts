/** Preview-only module shape. Does not claim to test Android media playback. */
let player:HTMLAudioElement|null=null,blocked=false;
export default {
 async play(file:string,speed:number,volume:number,userStarted:boolean){if(userStarted)blocked=false;if(blocked)return false;player?.pause();player=new Audio('/clinical-reference/auscultation/'+file);player.loop=true;player.playbackRate=speed;player.volume=volume;await player.play();return true;},
 update(speed:number,volume:number){if(player){player.playbackRate=speed;player.volume=volume;}},
 async isPlaying(){return !!player&&!player.paused;},
 stop(){player?.pause();player=null;},
};
