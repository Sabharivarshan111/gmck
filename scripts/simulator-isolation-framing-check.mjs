import fs from 'node:fs';
import assert from 'node:assert/strict';
import { stripTypeScriptTypes } from 'node:module';
import * as THREE from 'three';
const { isolationCameraDistance } = await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(fs.readFileSync('src/simulator/view/isolationFraming.ts','utf8'))).toString('base64'));
for (const [width,height] of [[360,592],[390,636],[430,724],[844,360],[1200,800]]) {
  const mobile=width<1024;
  for (const size of [{x:.14,y:.16,z:.10},{x:.04,y:.22,z:.04},{x:.35,y:.13,z:.09},{x:.12,y:.30,z:.20}]) {
    const distance=isolationCameraDistance(size,45,width/height,mobile,height);
    const camera=new THREE.PerspectiveCamera(45,width/height,.001,10);
    camera.position.set(0,0,distance); camera.lookAt(0,0,0); camera.updateMatrixWorld();
    for(const x of [-1,1]) for(const y of [-1,1]) for(const z of [-1,1]) {
      const projected=new THREE.Vector3(x*size.x/2,y*size.y/2,z*size.z/2).project(camera);
      assert.ok(Math.abs(projected.x) <= (mobile?.82:.9)+1e-6,'horizontal cropping');
      assert.ok(Math.abs(projected.y) <= (mobile?Math.max(.16,Math.min(.60,(height-312)/height)):.84)+1e-6,'vertical cropping');
    }
  }
}
console.log('Isolation bounds fit portrait, landscape and desktop with control clearance.');
