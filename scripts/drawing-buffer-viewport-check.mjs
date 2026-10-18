import assert from 'node:assert/strict';
import { syncDrawingBufferViewport } from '../src/simulator/view/drawingBufferViewport.ts';

// Recorded native failure: requested canvas463x553, viewport464x554,
// actual buffer231x276. Its model was clipped at the top/right while CSS
// arrows still used the full canvas. Also cover recovery and fractional DPR.
for (const [width,height,ratio] of [[231,276,1.25],[463,553,1.25],[463,540,1.25],[371,443,1]]) {
  let viewport;
  const renderer={getContext:()=>({drawingBufferWidth:width,drawingBufferHeight:height}),getPixelRatio:()=>ratio,setViewport:(...args)=>{viewport=args;}};
  assert(syncDrawingBufferViewport(renderer));
  assert.deepEqual(viewport.map((v,i)=>i<2?v:Math.round(v*ratio)),[0,0,width,height]);
  // A projected centre must remain at the surface centre after downscaling.
  assert.equal(viewport[2]*ratio/2,width/2);
}
let called=false;
assert.equal(syncDrawingBufferViewport({getContext:()=>({drawingBufferWidth:0,drawingBufferHeight:0}),getPixelRatio:()=>1.25,setViewport:()=>{called=true;}}),false);
assert.equal(called,false);
console.log('Actual Android backing-buffer viewport, recovery and zero-size guards passed.');
