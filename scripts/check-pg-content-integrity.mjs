/** Validate the actual bundled replacement rather than the retired dataset. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from '../mobile/node_modules/esbuild/lib/main.js';
const output=await build({entryPoints:['src/lib/neetPgOffline.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {validateOfflineBank}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const file='mobile/src/lib/neetPgBank.json';
const bank=JSON.parse(fs.readFileSync(file,'utf8'));
const imageFiles=Array.from({length:4},(_,i)=>`mobile/src/lib/neetPgImages${i}.json`);
bank.images=Object.assign({},...imageFiles.map(file=>JSON.parse(fs.readFileSync(file,'utf8'))));
validateOfflineBank(bank);
assert.ok(bank.records.length>1800,'Replacement unexpectedly lost year coverage');
assert.equal(new Set(bank.chapters.map(c=>c.year)).size,4);
assert.equal(new Set(bank.records.map(r=>r.id.split('-')[1])).size,10);
assert.ok(fs.statSync(file).size+imageFiles.reduce((n,p)=>n+fs.statSync(p).size,0)<25_000_000,'Offline bank exceeds import/storage budget');
for(const row of bank.records){
 assert.match(row.id,/^neet-20(?:1[7-9]|2[0-6])-\d{4}$/);
 assert.equal(row.options.length,4);
 assert.ok(row.explanation.trim());
}
assert.ok(!/PrepLadder|Collegedunia|DigiNerve|www\.prepp\.in|Collegehai|medmcqa/i.test(JSON.stringify(bank)),'Study payload contains publisher furniture');
const screen=fs.readFileSync('mobile/src/components/PgEntranceBankModal.tsx','utf8');
assert.ok(screen.includes('loadBundledNeetBank'));
assert.ok(!/LegacyPgEntranceBankModal|pgLocalBank|pgEntranceBank/.test(screen));
assert.ok(fs.readFileSync('mobile/android/app/build.gradle','utf8').includes('<dir>pg'),'Retired native assets must stay out of APK/AAB');
console.log(JSON.stringify({questions:bank.records.length,chapters:bank.chapters.length,images:Object.keys(bank.images).length,bytes:fs.statSync(file).size,networkRequired:false}));
