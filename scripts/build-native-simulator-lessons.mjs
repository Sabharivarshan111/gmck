import fs from 'node:fs';
import vm from 'node:vm';
import ts from '../mobile/node_modules/typescript/lib/typescript.js';
const out='mobile/src/simulator';
fs.mkdirSync(out,{recursive:true});
const datasets=[
 ['src/simulator/instruments/EcgLearningPath.tsx',{waves:'ECG_WAVES',steps:'ECG_STEPS'}],
 ['src/simulator/instruments/EcgBeatExplorer.tsx',{beatPhases:'ECG_PHASES',normalBeatPath:'ECG_BEAT_PATH'}],
 ['src/simulator/instruments/EcgIcuTutorialModal.tsx',{intervals:'ECG_INTERVALS',patterns:'ECG_PATTERNS',leads:'ECG_LEADS',chest:'ECG_CHEST'}],
 ['src/simulator/controls/InterventionPanel.tsx',{interventions:'SIMULATOR_ACTIONS'}],
 ['src/simulator/instruments/Ecg12LeadCanvas.tsx',{SEGMENTS:'ECG_SEGMENTS'}],
 ['src/simulator/instruments/pocus/PocusReference.tsx',{references:'POCUS_REFERENCES'}],
 ['src/simulator/instruments/auscultationSites.ts',{AUSCULTATION_SITES:'AUSCULTATION_SITES',SOUND_LIBRARY:'SOUND_LIBRARY',MURMUR_GUIDE:'MURMUR_GUIDE'}],
 ['src/simulator/instruments/auscultationRouting.ts',{HEART_SOUND_DESCRIPTIONS:'HEART_SOUND_DESCRIPTIONS',LUNG_SOUND_DESCRIPTIONS:'LUNG_SOUND_DESCRIPTIONS'}],
];
let catalog='// Generated from the shared teaching source; do not edit.\n';
for(const [file,names] of datasets){
 const code=fs.readFileSync(file,'utf8'),root=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const found=new Set();
 function visit(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&names[node.name.text]&&node.initializer){
  const js=ts.transpileModule('const value='+node.initializer.getText(root),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const context=vm.createContext({});vm.runInContext(js+';globalThis.result=value',context,{timeout:1000});
  catalog+='export const '+names[node.name.text]+' = '+JSON.stringify(context.result)+';\n';found.add(node.name.text);
 }ts.forEachChild(node,visit);}visit(root);
 for(const name of Object.keys(names))if(!found.has(name))throw Error('Missing source lesson '+file+' '+name);
}
const audioPath='public/clinical-reference/auscultation/manifest.json';
const audioClips=fs.existsSync(audioPath)?JSON.parse(fs.readFileSync(audioPath,'utf8')).clips.map(({group,preset,mode,rate,file})=>({group,preset,mode,rate,file})):[];
catalog+='export const AUDIO_CLIPS:Array<{group:string;preset:string;mode:string;rate:number;file:string}> = '+JSON.stringify(audioClips)+';\n';
fs.writeFileSync(out+'/lessonCatalog.ts',catalog);
const soundSource=ts.createSourceFile('sound.ts',fs.readFileSync('src/simulator/instruments/StethoscopeSynthesizer.ts','utf8'),ts.ScriptTarget.Latest,true);
const soundTypes=soundSource.statements.filter(n=>ts.isTypeAliasDeclaration(n)&&['AuscultationSite','HeartSoundPreset','LungSoundPreset'].includes(n.name.text)).map(n=>n.getText(soundSource)).join('\n');
const routeSource=ts.createSourceFile('route.ts',fs.readFileSync('src/simulator/instruments/auscultationRouting.ts','utf8'),ts.ScriptTarget.Latest,true);
const route=routeSource.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='resolveAuscultation');
if(!route)throw Error('Missing source auscultation routing');
fs.writeFileSync(out+'/nativeAuscultationRouting.ts', '// Generated shared routing without browser audio imports.\nimport type {PatientPathologyState,PatientVitals} from \'@simulator/types\';\n'+soundTypes+'\n'+route.getText(routeSource)+'\n');
const file='src/simulator/instruments/EcgHeartModel.tsx',code=fs.readFileSync(file,'utf8');
const root=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
function visit(node){
 if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(root)==='filter'){edits.push([node.getStart(root),node.end,'']);return;}
 if(ts.isJsxAttribute(node)){
  const name=node.name.getText(root);
  if(['className','role','style','filter','fontFamily'].includes(name)||name.startsWith('aria-')||name.startsWith('data-'))edits.push([node.getStart(root),node.end,'']);
 }
 ts.forEachChild(node,visit);
}visit(root);
let result=code;
for(const [a,b,text] of edits.sort((a,b)=>b[0]-a[0]))result=result.slice(0,a)+text+result.slice(b);
const tags={svg:'Svg',defs:'Defs',radialGradient:'RadialGradient',linearGradient:'LinearGradient',stop:'Stop',marker:'Marker',path:'Path',ellipse:'Ellipse',g:'G',circle:'Circle',text:'SvgText',rect:'Rect',line:'Line'};
for(const [tag,name] of Object.entries(tags))result=result.replace(new RegExp('<(/?)'+tag+'(?=[\\s>])','g'),'<$1'+name);
result=result.replace('export function EcgHeartModel','export function NativeEcgHeartModel').replace(/<Svg\s+/, '<Svg width="100%" height={340} color="#e1e6ed" ');
const used=Object.values(tags).filter(name=>name!=='Svg'&&new RegExp('<'+name+'(?=[\\s/>])').test(result)).map(name=>name==='SvgText'?'Text as SvgText':name);
result=result.replace("import React, { useId } from 'react';","import React, { useId } from 'react';\nimport Svg,{"+used.join(',')+"} from 'react-native-svg';");
fs.writeFileSync(out+'/NativeEcgHeartModel.tsx',result);
console.log('Native source lessons and exact heart vector generated.');

// Keep the calibrated source drawing intact. Native SVG records its Canvas
// operations; no DOM, canvas element or WebView is included in the APK.
const ecgFile='src/simulator/instruments/Ecg12LeadCanvas.tsx';
const ecgCode=fs.readFileSync(ecgFile,'utf8');
const ecgRoot=ts.createSourceFile(ecgFile,ecgCode,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let drawing;
function findDrawing(node){
 if(ts.isCallExpression(node)&&node.expression.getText(ecgRoot)==='useEffect'){
  const callback=node.arguments[0];
  if(callback&&ts.isArrowFunction(callback)&&ts.isBlock(callback.body)&&callback.body.getText(ecgRoot).includes('const canvas = canvasRef.current'))drawing=callback.body;
 }
 ts.forEachChild(node,findDrawing);
}
findDrawing(ecgRoot);
if(!drawing)throw Error('Missing calibrated ECG source drawing');
const statements=drawing.statements;
const start=statements.findIndex(n=>n.getText(ecgRoot).startsWith("ctx.fillStyle = '#fff5f5'"));
if(start<0)throw Error('Missing ECG grid origin');
const body=statements.slice(start).map(n=>n.getText(ecgRoot)).join('\n');
fs.writeFileSync(out+'/ecgDrawing.ts',`// Generated from ${ecgFile}; do not edit.\nimport {ECG_SEGMENTS as SEGMENTS} from './lessonCatalog';\nimport type {VectorContext} from './vectorContext';\nexport function drawEcg(ctx:VectorContext,rhythm:string,heartRate:number,activeSegment:string,leadGroup:number){\nconst w=leadGroup===4?840:420,h=480;\n${body}\n}\n`);
console.log('Native calibrated 12-lead drawing generated from shared source.');
