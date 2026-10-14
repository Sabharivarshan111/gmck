/** Minimal Canvas recording for the shared ECG source. Coordinates stay in
 * the source's calibrated space; physical screen millimetres are not claimed. */
export type VectorMark =
 | {kind:'path';d:string;color:string;width:number;dash:number[]}
 | {kind:'rect';x:number;y:number;width:number;height:number;color:string}
 | {kind:'text';x:number;y:number;text:string;color:string;font:string};
export class VectorContext {
 marks:VectorMark[]=[];
 fillStyle='#000';strokeStyle='#000';lineWidth=1;font='10px monospace';
 private path='';private dash:number[]=[];
 beginPath(){this.path='';}
 moveTo(x:number,y:number){this.path+=`M${x.toFixed(3)} ${y.toFixed(3)} `;}
 lineTo(x:number,y:number){this.path+=`L${x.toFixed(3)} ${y.toFixed(3)} `;}
 stroke(){this.marks.push({kind:'path',d:this.path,color:this.strokeStyle,width:this.lineWidth,dash:this.dash.slice()});}
 setLineDash(dash:number[]){this.dash=dash;}
 fillRect(x:number,y:number,width:number,height:number){this.marks.push({kind:'rect',x,y,width,height,color:this.fillStyle});}
 fillText(text:string,x:number,y:number){this.marks.push({kind:'text',x,y,text,color:this.fillStyle,font:this.font});}
}
