#!/usr/bin/env node
/** Trace reachable application imports, rather than merely checking a hold flag. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const ts=createRequire(import.meta.url)('../mobile/node_modules/typescript');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Owner requested the existing labelled MedMCQA compact practice bank again.
// Raw source packs and unaudited recall catalogues remain outside runtime imports.
const forbidden=/\/pgPacks\/|\/(?:pgResearchSources|pgIniResearchSources|pgFmgeResearchSources|pgFirstRankerSources|pgHistoricalClaims|pgQuarantine)\.[tj]sx?$/;
const seen=new Set();
function resolveImport(spec,file) {
 const base=spec.startsWith('@/')?path.join(root,'mobile/src',spec.slice(2)):
  spec.startsWith('.')?path.resolve(path.dirname(file),spec):null;
 if(!base)return null;
 return ['', '.ts','.tsx','.js','.jsx','/index.ts','/index.tsx'].map(ext=>base+ext).find(p=>fs.existsSync(p)&&fs.statSync(p).isFile())??null;
}
function visit(file) {
 if(seen.has(file))return;seen.add(file);
 assert.ok(!forbidden.test(file),'Legacy/unapproved PG module reachable: '+path.relative(root,file));
 if(!/\.[tj]sx?$/.test(file))return;
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const follow=specifier=>{const target=resolveImport(specifier,file);if(target)visit(target);};
 function walk(node) {
  if(ts.isImportDeclaration(node)&&!node.importClause?.isTypeOnly&&ts.isStringLiteral(node.moduleSpecifier))follow(node.moduleSpecifier.text);
  if(ts.isExportDeclaration(node)&&!node.isTypeOnly&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))follow(node.moduleSpecifier.text);
  if(ts.isCallExpression(node)&&node.arguments.length===1&&ts.isStringLiteral(node.arguments[0])&&
    (node.expression.kind===ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression)&&node.expression.text==='require')))follow(node.arguments[0].text);
  ts.forEachChild(node,walk);
 }
 walk(source);
}
for(const entry of ['mobile/index.js','mobile/App.tsx','mobile/preview/main.tsx'])visit(path.join(root,entry));
assert.ok(seen.has(path.join(root,'mobile/src/lib/neetPgBundledBank.ts')));
assert.ok(seen.has(path.join(root,'mobile/src/lib/pgLocalBank.ts')));
// A populated manifest alone is not enough: the Android reader opens native
// assets/pg/sXX-<hash>.zst, and these must survive AAPT packaging.
const gradle=fs.readFileSync(path.join(root,'mobile/android/app/build.gradle'),'utf8');
assert.ok(!/ignoreAssetsPattern\s*=\s*"[^"]*<dir>pg/.test(gradle),'Gradle is excluding native MedMCQA PG asset directory');
const pgManifest=JSON.parse(fs.readFileSync(path.join(root,'public/pg/manifest.json'),'utf8'));
const androidPg=path.join(root,'mobile/android/app/src/main/assets/pg');
assert.ok(fs.existsSync(androidPg),'Generated Android MedMCQA asset directory missing');
for(const pack of pgManifest.packs) {
 const file=path.join(androidPg,pack.id+'-'+pack.sha256.slice(0,12)+'.zst');
 assert.ok(fs.existsSync(file)&&fs.statSync(file).size>0,'Android MedMCQA pack absent: '+pack.id);
}
console.log('PASS: '+pgManifest.packs.length+' compressed MedMCQA packs are generated and not excluded by Android asset packaging.');

console.log(`PG release import graph: ${seen.size} modules checked; compact practice and reviewed exam readers reachable; raw packs and unaudited recall catalogues excluded.`);
