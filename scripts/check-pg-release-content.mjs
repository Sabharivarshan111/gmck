#!/usr/bin/env node
/** Trace reachable application imports, rather than merely checking a hold flag. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const ts=createRequire(import.meta.url)('../mobile/node_modules/typescript');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const forbidden=/\/pgLocalBank\.[tj]sx?$|\/pgCompact\/|\/pgPacks\/|\/(?:pgResearchSources|pgIniResearchSources|pgFmgeResearchSources|pgFirstRankerSources|pgHistoricalClaims|pgQuarantine)\.[tj]sx?$/;
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
console.log(`PG release import graph: ${seen.size} reachable modules checked; no legacy raw packs, recall catalog or historical attribution module; only the replacement NEET PG bank is reachable.`);
