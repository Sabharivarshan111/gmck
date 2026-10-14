/** Inventory every canonical anatomy source; never equate source checksums with Android visual proof. */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const out=resolve(process.argv[2]||'artifacts/native-vault-parity/anatomy-coverage.json');
const result=await build({stdin:{contents:`export { SYSTEMS } from './src/simulator/data/atlasTypes'; export { correctPartSystem } from './src/simulator/data/atlasResolver'; export { ORGAN_ANATOMY_DATABASE } from './src/simulator/data/organAnatomyData'; export { PREFERRED_ANATOMY_OVERVIEW_TARGETS } from './src/simulator/data/preferredAnatomyReferences';`,resolveDir:root,loader:'ts'},bundle:true,external:['fflate'],platform:'node',format:'esm',write:false});
const model=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const atlas=JSON.parse(await readFile(resolve(root,'public/models/atlas.json'),'utf8'));
const nerves=JSON.parse(await readFile(resolve(root,'public/models/nerve_catalog.json'),'utf8'));
const parts=[...atlas.parts.map(model.correctPartSystem),...nerves];
const geometry=[];
for(const chunk of atlas.chunks) {
  const packed=await readFile(resolve(root,'public',chunk.gzip.slice(1)));
  if(packed.length!==chunk.gzipBytes) throw Error('Reference chunk size mismatch: '+chunk.gzip);
  geometry.push({source:chunk.gzip,size:packed.length,sha256:createHash('sha256').update(packed).digest('hex')});
}
const organIds=[...new Set([...Object.keys(model.ORGAN_ANATOMY_DATABASE),...Object.keys(model.PREFERRED_ANATOMY_OVERVIEW_TARGETS)])];
const manifest={
  status:'NOT_CERTIFIED',reference:'Vercel mobile 393x852 portrait',
  nativeRendererStatus:'Anatomy is still hosted in the existing Android compatibility WebView. No complete offline native geometry port has been certified.',
  referencePartCount:parts.length,
  systems:model.SYSTEMS.map(s=>({id:s.id,name:s.name,referenceCount:parts.filter(p=>p.system===s.id).length,structures:parts.filter(p=>p.system===s.id).map(p=>({id:p.id,name:p.name,source:p.source||'BodyParts3D'})),nativeScreenshot:null,vercelScreenshot:null,visualParityVerified:false})),
  organs:organIds.map(id=>({id,name:model.ORGAN_ANATOMY_DATABASE[id]?.name||id.replaceAll('_',' '),preferredReference:model.PREFERRED_ANATOMY_OVERVIEW_TARGETS[id]||id,hasTeachingDetails:!!model.ORGAN_ANATOMY_DATABASE[id],nativeScreenshot:null,vercelScreenshot:null,appearanceVerified:false,controlsVerified:false})),
  geometry,
  requiredVisualChecks:['Shape and position','Same mobile camera and scale','Arterial and venous branches','Peripheral and central nerves','Source colours, labels and named structures','Organ relations and teaching details','Rotation, pan, zoom and reset','Isolation, spread, layer peeling, dissection and restoration','Animations present in the canonical Vercel view'],
};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(manifest,null,2));
console.log(`Recorded ${parts.length} source structures, ${manifest.systems.length} systems and ${organIds.length} organ/teaching targets. Native visual parity remains NOT_CERTIFIED.`);
