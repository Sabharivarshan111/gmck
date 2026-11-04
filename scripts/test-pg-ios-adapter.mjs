import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(path.join(root,'mobile/package.json'));
const ts=require('typescript');
const modules=new Map();
let mode='normal',reads=0;
function load(file) {
  file=path.resolve(file);
  if(file.endsWith('.zst')) {assert.ok(fs.existsSync(file),'Generated iOS asset exists: '+file);return file;}
  if(!file.endsWith('.ts'))file+='.ts';
  if(modules.has(file))return modules.get(file);
  const exports={};modules.set(file,exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,__DEV__:false,Uint8Array,ArrayBuffer,
    fetch:async uri=>{
      assert.ok(uri.startsWith('file://'),'Release reader only fetches app-bundled files');reads++;
      let data=fs.readFileSync(uri.slice(7));
      if(mode==='corrupt'){data=Buffer.from(data);data[0]^=1;}
      if(mode==='oversize')data=Buffer.alloc(10_000_001);
      return {ok:mode!=='missing',status:mode==='missing'?404:200,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};
    },
    require:specifier=>{
      if(specifier==='react-native')return {Image:{resolveAssetSource:asset=>({uri:mode==='remote'?'https://example.invalid/pack':'file://'+asset})}};
      if(specifier==='fzstd'||specifier.startsWith('@noble/'))return require(specifier);
      if(specifier.startsWith('@shared/'))return load(path.join(root,'src/lib',specifier.slice(8)));
      if(specifier.startsWith('.'))return load(path.resolve(path.dirname(file),specifier));
      throw Error('Unexpected adapter dependency: '+specifier);
    },
  },{filename:file});
  return exports;
}
const reader=load(path.join(root,'mobile/src/lib/pgNativeBank.ios.ts')).default;
const {PG_COMPACT}=load(path.join(root,'mobile/src/lib/pgCompact/manifest.ts'));
let total=0;
for(const pack of PG_COMPACT.packs) {
  const file=path.join(root,'public/pg',`${pack.id}-${pack.sha256.slice(0,12)}.zst`);
  const expected=zlib.zstdDecompressSync(fs.readFileSync(file)).toString('utf8');
  const actual=await reader.readPack(pack.id,pack.sha256);
  assert.equal(actual,expected,'iOS UTF-8/codec/hash parity: '+pack.subject);
  const data=JSON.parse(actual);assert.equal(data.subject,pack.subject);assert.equal(data.rows.length,pack.count);total+=data.rows.length;
}
assert.equal(total,185636);
const first=PG_COMPACT.packs[0],prior=reads;
await assert.rejects(reader.readPack('s99',first.sha256),/Invalid PG pack/);
await assert.rejects(reader.readPack(first.id,'0'.repeat(64)),/Invalid PG pack/);
assert.equal(reads,prior,'Invalid IDs/hashes fail before any file read');
for(const [failure,message] of [['corrupt',/checksum mismatch/],['oversize',/Oversized/],['missing',/could not be read/],['remote',/not bundled/]]) {
  mode=failure;await assert.rejects(reader.readPack(first.id,first.sha256),message);
}
mode='normal';
const {decodeUtf8}=load(path.join(root,'src/lib/apkgFormat.ts'));
assert.equal(decodeUtf8(Buffer.from('தமிழ் α µ 🧠')),'தமிழ் α µ 🧠');
console.log(`PASS iOS bundled adapter: ${PG_COMPACT.packs.length} real assets/${total} records; UTF-8 and codec parity; hash/ID, corruption, size, missing-file and network-source rejection. Simulator file I/O still requires device verification.`);
