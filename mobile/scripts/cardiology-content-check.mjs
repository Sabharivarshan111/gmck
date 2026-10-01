import fs from 'node:fs';
import assert from 'node:assert/strict';
import { deduplicateNotes } from '../src/lib/notesDedup.ts';
const directory=process.argv[2];
const normalize=s=>s.replace(/\s+/g,' ').trim().toLowerCase();
function strings(v){if(typeof v==='string')return[v];if(Array.isArray(v))return v.flatMap(strings);if(v&&typeof v==='object')return Object.values(v).flatMap(strings);return[];}
function inspect(name,input){const cleaned=deduplicateNotes(input),before=strings(input),after=strings(cleaned).map(normalize);const missing=before.filter(s=>!after.some(t=>t.includes(normalize(s))));assert.equal(missing.length,0,`${name}: lost content: ${JSON.stringify(missing)}`);assert.equal(JSON.stringify(cleaned),JSON.stringify(deduplicateNotes(cleaned)));const report={name,inputSections:input.sections.length,outputSections:cleaned.sections.length,inputWords:strings(input.sections).join(' ').split(/\s+/).length,outputWords:strings(cleaned.sections).join(' ').split(/\s+/).length,stringsChecked:before.length,lostDistinctStrings:missing.length};fs.writeFileSync(`${directory}/${name}-cleaned.json`,JSON.stringify(cleaned,null,2));return report;}
const reports=[inspect('saved-cardiology',JSON.parse(fs.readFileSync(`${directory}/original.json`)))];
for(const name of ['generated-cardiology','generated-af','generated-af-supplement','authored-af'])if(fs.existsSync(`${directory}/${name}.json`))reports.push(inspect(name,JSON.parse(fs.readFileSync(`${directory}/${name}.json`))));
fs.writeFileSync(`${directory}/content-audit.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
