// Browser QA adapter renders the actual references. This file never enters an APK.
import meta from '../../../public/clinical-reference/radiology/brain-t1.json';
let volume: Uint8Array | null = null;
function encode(source: CanvasImageSource, width: number, height: number, contrast: number, brightness: number) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx) throw Error('Canvas unavailable');
  ctx.filter=`contrast(${contrast}) brightness(${brightness})`;ctx.drawImage(source,0,0,width,height);
  return JSON.stringify({width,height,uri:canvas.toDataURL('image/png')});
}
export default {
  async renderXray(path: string, contrast: number, brightness: number) {
    const image=new Image();image.src='/'+path;
    await image.decode();return encode(image,image.naturalWidth,image.naturalHeight,contrast,brightness);
  },
  async renderMri(plane: string, slice: number, contrast: number, brightness: number) {
    if(!volume) {
      const response=await fetch('/clinical-reference/radiology/brain-t1.pack');
      if(!response.ok||!response.body) throw Error('MRI unavailable');
      volume=new Uint8Array(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
      if(volume.length!==meta.dimensions.reduce((a,b)=>a*b,1)) throw Error('MRI volume incomplete');
    }
    const [u,v,s]=({axial:[0,1,2],coronal:[0,2,1],sagittal:[1,2,0]} as Record<string,number[]>)[plane];
    const w=meta.dimensions[u],h=meta.dimensions[v],p=[0,0,0];p[s]=slice;
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d');if(!ctx) throw Error('Canvas unavailable');
    const pixels=ctx.createImageData(w,h);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
      p[u]=w-1-x;p[v]=h-1-y;const gray=volume[p[0]+meta.dimensions[0]*(p[1]+meta.dimensions[1]*p[2])],i=(x+y*w)*4;
      pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=gray;pixels.data[i+3]=255;
    }
    ctx.putImageData(pixels,0,0);return encode(canvas,w,h,contrast,brightness);
  },
};
