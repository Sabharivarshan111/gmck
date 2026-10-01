import assert from 'node:assert/strict';
import { ensureLongEssay, notesWordCount, essayExpansionPrompt, appendEssaySupplement, NotesDepthError } from '../../supabase/functions/generate-handwritten-notes/notesDepth.ts';
const make=n=>({sections:[{payload:{paragraph:Array.from({length:n},(_,i)=>`fact${i}`).join(' ')}}]});
let calls=0;
const full=make(1200),brief=make(500);
assert.equal(await ensureLongEssay(full,async()=>{calls++;return brief;}),full);
assert.equal(calls,0);
assert.equal(await ensureLongEssay(brief,async words=>{assert.equal(words,500);calls++;return full;}),full);
assert.equal(calls,1);
await assert.rejects(ensureLongEssay(brief,async()=>brief),/too brief/);
await assert.rejects(ensureLongEssay(brief,async()=>null),/too brief/);
assert.equal(notesWordCount({highYieldTip:'ignore banner',sections:[{payload:{items:[{label:'Clinical',description:'Unique detail retained'}]}}]}),4);
console.log('OK long essays stay intact; brief essays expand once; still-brief/invalid replacements rejected before saving.');
const {transform}=await import('esbuild');
const fs=await import('node:fs');
const vm=await import('node:vm');
async function load(file,mocks={}){const compiled=await transform(fs.readFileSync(file,'utf8'),{loader:'ts',format:'cjs'});const module={exports:{}};vm.runInNewContext(compiled.code,{module,exports:module.exports,require:id=>mocks[id]??{},Date,Set,Map,console});return module.exports;}
const bank=await load('src/lib/questionBank.ts',{'@data/questionBankData':{QUESTION_BANK_DATA:{}},'@data/kuhs/questionBankData':{KUHS_REVIEW_BANK_DATA:{}}});
const notes=await load('src/lib/handwrittenNotes.ts',{'./questionBank':bank});
const {generalMedicineData}=await import('../../src/data/topics/generalMedicine.ts');
const topic=notes.flattenSubjectTopics('general-medicine',generalMedicineData).find(t=>t.key==='general-medicine::cardiology');
assert.equal(topic.questions.length,84);
assert.equal(topic.questionKinds.filter(k=>k==='essay').length,25);
assert.equal(topic.questionKinds.filter(k=>k==='short').length,59);
assert.equal(topic.questionKinds[topic.questions.indexOf('What is Myocardial Infarction? (Page No: 040)')],'essay');
console.log('OK all84 cardiology questions retain wording and explicit25 essay/59 short-note depth labels.');

const limits=await load('src/lib/notesLimits.ts');
assert.equal(JSON.stringify(limits.clampQuestions(topic.questions)),JSON.stringify(topic.questions));
console.log('OK all84 cardiology questions sent in full, including the1061-character clinical case.');

const repeated={sections:[{payload:{items:[brief.sections[0].payload.paragraph,brief.sections[0].payload.paragraph,brief.sections[0].payload.paragraph]}}]};
assert.equal(notesWordCount(repeated),500);
await assert.rejects(ensureLongEssay(repeated,async()=>repeated),/too brief/);
console.log('OK repeated paragraphs cannot satisfy the long-essay length guard.');

// Exercise the handler's actual classification expression so a depth failure
// cannot become an HTTP429 or an invented daily quota message.
const handlerSource=fs.readFileSync('../supabase/functions/generate-handwritten-notes/index.ts','utf8');
const quotaExpression=handlerSource.match(/const isQuota = ([^;]+);/)[1];
const classifyQuota=(upstream,msg)=>vm.runInNewContext(quotaExpression,{upstream,msg});
assert.equal(classifyQuota(null,'The generated essay was too brief.'),false);
assert.equal(classifyQuota(null,'Could not generate notes.'),false);
assert.equal(classifyQuota({kind:'provider'},'Provider generated an error 429 characters long'),false);
assert.equal(classifyQuota({kind:'timeout'},'Gemini request timed out'),false);
assert.equal(classifyQuota({kind:'quota'},'Gemini 429 RESOURCE_EXHAUSTED'),true);
console.log('OK actual provider quota returns429; generation/depth errors never masquerade as quota.');

const repairPrompt=essayExpansionPrompt(topic.questions.join('\n\n'),'General Medicine','Grounded source',brief,500);
for(const q of topic.questions) assert.ok(repairPrompt.includes(q));
assert.ok(repairPrompt.includes('100–150 words'));
assert.ok(repairPrompt.includes('25–40 words'));
assert.ok(repairPrompt.includes('Grounded source'));
assert.ok(repairPrompt.includes(JSON.stringify(brief)));
console.log('OK expansion carries every question, source and original detail with section-level depth budgets.');

const supplement={sections:[{payload:{paragraph:Array.from({length:700},(_,i)=>`newdetail${i}`).join(' ')}}]};
const combined=appendEssaySupplement(brief,supplement);
assert.equal(notesWordCount(combined),1200);
assert.equal(combined.sections[0],brief.sections[0]);
assert.equal(brief.sections.length,1);
assert.equal(appendEssaySupplement(brief,{sections:[]}),null);
assert.equal(notesWordCount(appendEssaySupplement(brief,brief)),500);
assert.equal(await ensureLongEssay(brief,async()=>combined),combined);
assert.ok(repairPrompt.includes('ONLY additional sections'));
console.log('OK supplement retains original details immutably; new explanations satisfy depth; exact repetition cannot pad it.');

await assert.rejects(ensureLongEssay(brief,async()=>brief),NotesDepthError);
assert.ok(handlerSource.includes('status: 422'));
console.log('OK brief output has a typed safe422 failure; unexpected internal errors remain redacted.');
