/** Browser preview of the exact bundled MRI pixels; does not verify Android Canvas. */
import React,{useEffect,useRef,useState} from 'react';
import {View,type ViewProps} from 'react-native';
type Meta={dimensions:number[];spacing:number[]};
export interface MriProps extends ViewProps{plane:string;slice:number;contrast:number;zoom:number}
let volume:Promise<{meta:Meta;bytes:Uint8Array}>|undefined;
function readVolume(){if(!volume)volume=Promise.all([
 fetch('/clinical-reference/radiology/brain-t1.json').then(r=>{if(!r.ok)throw Error('MRI metadata');return r.json() as Promise<Meta>;}),
 fetch('/clinical-reference/radiology/brain-t1.pack').then(async r=>{if(!r.ok||!r.body)throw Error('MRI pixels');return new Uint8Array(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());}),
]).then(([meta,bytes])=>{if(bytes.length!==meta.dimensions.reduce((a,b)=>a*b,1))throw Error('Incomplete MRI');return {meta,bytes};});return volume;}
export function OrbitMRI({plane,slice,contrast,zoom,style,...viewProps}:MriProps){
 const canvas=useRef<HTMLCanvasElement>(null),[data,setData]=useState<{meta:Meta;bytes:Uint8Array}|null>(null),[size,setSize]=useState({width:1,height:1}),[error,setError]=useState('');
 useEffect(()=>{let live=true;void readVolume().then(d=>{if(live)setData(d);}).catch(e=>{if(live)setError(String(e));});return()=>{live=false;};},[]);
 const axes=plane==='coronal'?[0,2,1]:plane==='sagittal'?[1,2,0]:[0,1,2];
 const ratio=data?data.meta.dimensions[axes[0]]*data.meta.spacing[axes[0]]/(data.meta.dimensions[axes[1]]*data.meta.spacing[axes[1]]):1;
 const width=Math.min(size.width,size.height*ratio)*zoom,height=width/ratio;
 useEffect(()=>{
  const c=canvas.current;if(!c||!data)return;
  const [u,v,s]=plane==='coronal'?[0,2,1]:plane==='sagittal'?[1,2,0]:[0,1,2],d=data.meta.dimensions;
  const w=d[u],h=d[v],position=Math.max(0,Math.min(d[s]-1,slice)),strides=[1,d[0],d[0]*d[1]];
  c.width=w;c.height=h;const ctx=c.getContext('2d');if(!ctx)return;const image=ctx.createImageData(w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const index=position*strides[s]+(w-1-x)*strides[u]+(h-1-y)*strides[v];
   const grey=Math.max(0,Math.min(255,Math.floor((data.bytes[index]-128)*contrast+128))),at=(x+w*y)*4;
   image.data[at]=image.data[at+1]=image.data[at+2]=grey;image.data[at+3]=255;
  }ctx.putImageData(image,0,0);
 },[data,plane,slice,contrast]);
 return <View {...viewProps} onLayout={e=>setSize({width:e.nativeEvent.layout.width,height:e.nativeEvent.layout.height})} style={[style,{overflow:'hidden',backgroundColor:'#050a12'}]}>
  {error?<div role="alert">{error}</div>:<canvas data-testid="preview-mri-canvas" ref={canvas} style={{position:'absolute',left:(size.width-width)/2,top:(size.height-height)/2,width,height}}/>}
 </View>;
}
