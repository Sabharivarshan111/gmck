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
fs.writeFileSync(out+'/lessonCatalog.ts',catalog);
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
