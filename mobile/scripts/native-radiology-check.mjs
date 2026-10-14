import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const built=await build({entryPoints:[resolve(root,'src/simulator/instruments/radiology/chestXrayCases.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const {chestXrayCases}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
assert.ok(chestXrayCases.length>20);
for(const c of chestXrayCases) {
  assert.ok(existsSync(resolve(root,'public',c.image.slice(1))),`Missing packaged reference: ${c.image}`);
  assert.ok(c.findings.length && c.license && c.source && c.differential && c.pitfall,`Incomplete teaching/credits: ${c.id}`);
}
const folder=resolve(root,'public/clinical-reference/radiology');
const meta=JSON.parse(readFileSync(resolve(folder,'brain-t1.json'),'utf8'));
const volume=gunzipSync(readFileSync(resolve(folder,'brain-t1.pack')));
assert.equal(volume.length,meta.dimensions.reduce((a,b)=>a*b,1));
assert.equal(createHash('sha256').update(volume).digest('hex'),meta.volumeSha256);
assert.equal(meta.orientation,'RAS');
assert.ok(meta.spacing.every(v=>v>0));
const mobile=resolve(root,'mobile');
const kotlin=readFileSync(resolve(mobile,'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/RadiologyModule.kt'),'utf8');
assert.ok(kotlin.includes('NativeOrbitRadiologySpec') && kotlin.includes('volumeSha256'));
const gradle=readFileSync(resolve(mobile,'android/app/build.gradle'),'utf8');
assert.ok(gradle.includes('syncClinicalReferenceAssets') && gradle.includes('android.sourceSets.main.assets.srcDir'));
console.log(`PASS: ${chestXrayCases.length} Vercel films and teaching/credits available for APK packaging; ${volume.length} MRI voxels match source SHA-256 and physical RAS spacing.`);
console.log('Native pixel rendering and touch behaviour require installed Android evidence.');
