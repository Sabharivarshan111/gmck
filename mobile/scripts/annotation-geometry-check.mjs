import assert from 'node:assert/strict';
import {fittedImage,imagePoint,sourcePoint,layoutAnnotations,referenceDistance,boundedImagePan} from '../src/simulator/annotationGeometry.ts';
for(const width of [360,390,430,800])for(const zoom of [1,1.7,3]){
 const rect=fittedImage(width,520,1.2,86,zoom,20,-13);
 for(const point of [{x:.2,y:.3},{x:.5,y:.5},{x:.8,y:.7}]){
  const projected=imagePoint(rect,point.x,point.y);
  const restored=sourcePoint(rect,projected.x,projected.y);
  assert.ok(Math.abs(restored.x-point.x)<1e-10);
  assert.ok(Math.abs(restored.y-point.y)<1e-10);
 }
}
const items=Array.from({length:5},(_,i)=>({id:String(i),name:'Landmark',x:.3,y:.4+i*.001,note:'',provenance:'personal'}));
const rect=fittedImage(390,520,1,86,1);
const laid=layoutAnnotations(items,rect,390,520,86);
assert.equal(laid.length,5);
for(let i=1;i<laid.length;i++)assert.ok(laid[i].labelY-laid[i-1].labelY>=44);
assert.equal(layoutAnnotations(items,fittedImage(390,520,1,86,3,1000),390,520,86).length,0);
console.log('Annotation transforms: 36 round trips, collision spacing and off-screen suppression passed.');

assert.ok(Math.abs(referenceDistance({x:.2,y:.3},{x:.5,y:.7},[100,100])-50)<1e-10);
assert.ok(Math.abs(referenceDistance({x:.2,y:.3},{x:.5,y:.7},[1000,1000])-500)<1e-10);

const fitted=fittedImage(390,520,1,86,1),fixed=boundedImagePan(fitted,390,520,86,1000,-1000);
assert(fixed.x===0&&fixed.y===0);
const magnified=fittedImage(390,520,1,86,3),bounded=boundedImagePan(magnified,390,520,86,1000,-1000);
const moved=fittedImage(390,520,1,86,3,bounded.x,bounded.y);
assert(moved.x<=86&&moved.x+moved.width>=304&&moved.y<=0&&moved.y+moved.height>=520);
console.log('Fitted and magnified images remain inside pan bounds.');
