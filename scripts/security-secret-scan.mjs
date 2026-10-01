import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const files = execFileSync('git',['ls-files','-z']).toString().split('\0').filter(Boolean);
const patterns = [new RegExp('gh'+'p_[A-Za-z0-9]{36}'), /github_pat_[A-Za-z0-9_]{60,}/, /sb_secret_[A-Za-z0-9_-]{20,}/, /sk-proj-[A-Za-z0-9_-]{20,}/];
const failures=[];
for(const path of files) {
  if (!fs.existsSync(path) || fs.statSync(path).size > 5 * 1024 * 1024) continue;
  const text=fs.readFileSync(path,'utf8');
  if(text.includes('\0')) continue;
  if(patterns.some(pattern=>pattern.test(text))) failures.push(path);
  for(const token of text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)??[]) {
    try {if(JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).role==='service_role') failures.push(path);} catch {}
  }
}
if(failures.length) {console.error('Possible privileged credentials in: '+[...new Set(failures)].join(', '));process.exitCode=1;}
else console.log('Tracked current source: no matching privileged key/token literals. Public anon configuration remains allowed.');
