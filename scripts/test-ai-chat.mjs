/** Regression for tablet chat follow-ups and the deployed function's limits. */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundled = await build({
  entryPoints: ['mobile/src/lib/askAi.ts'], bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{name: 'service-fixture', setup(b) {
    b.onResolve({filter: /^@\/lib\/supabase$/}, () => ({path: 'service', namespace: 'fixture'}));
    b.onLoad({filter: /.*/, namespace: 'fixture'}, () => ({contents: 'export const supabase = {functions: {invoke: (...args) => globalThis.__chatInvoke(...args)}};'}));
  }}],
});
const {askAi, boundedAiHistory} = await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const requests = [];
globalThis.__chatInvoke = async (name, options) => { requests.push({name, ...options}); return {data: {response: 'A contextual reply.'}, error: null}; };
await askAi('Plasma proteins', []);
assert.equal(requests.at(-1).body.isNeedingClarification, false);
const history = [{role:'user', content:'Plasma proteins'}, {role:'assistant', content:'Albumin maintains oncotic pressure.'}];
await askAi('Why?', history);
assert.equal(requests.at(-1).body.isNeedingClarification, true);
assert.deepEqual(requests.at(-1).body.conversationHistory, history);
assert.equal(requests.at(-1).timeout, 90000);
const many = Array.from({length:100}, (_, i) => ({role: i % 2 ? 'assistant' : 'user', content: String(i)+'x'.repeat(20000)}));
const copy = JSON.stringify(many);
const bounded = boundedAiHistory(many);
assert.ok(bounded.length <= 10);
assert.ok(bounded.every(x => x.content.length <= 15000));
assert.ok(bounded.reduce((n,x)=>n+x.content.length,4000) <= 52000);
assert.ok(bounded.at(-1).content.startsWith('99'));
assert.equal(JSON.stringify(many), copy);
await askAi('Double-tapped: Blood', history);
assert.equal(requests.at(-1).body.isMCQRequest, true);
globalThis.__chatInvoke = async () => ({data:null, error:{name:'FunctionsHttpError', message:'non-2xx', context:{json:async()=>({error:'AI usage limit reached. Try again later.'})}}});
await assert.rejects(askAi('Why?', history), /AI usage limit/);
globalThis.__chatInvoke = async () => ({data:null, error:{name:'FunctionsHttpError', message:'non-2xx', context:{json:async()=>{throw new SyntaxError('HTML')}}}});
await assert.rejects(askAi('Why?', history), /non-2xx/);
globalThis.__chatInvoke = async () => ({data:{error:'Please try again', isRateLimit:true, retryAfter:12}, error:null});
await assert.rejects(askAi('Why?', history), /12 seconds/);
globalThis.__chatInvoke = async () => ({data:{response:'Recovered.'},error:null});
assert.equal((await askAi('Why?', history)).text, 'Recovered.');
console.log('PASS context for short follow-ups, long-chat budget, MCQ mode, timeout, service errors and recovery');
