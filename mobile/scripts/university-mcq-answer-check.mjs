/* global Response, AbortSignal, Request */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
const root = path.resolve(import.meta.dirname, '../..');
const source = fs.readFileSync(path.join(root, 'supabase/functions/university-mcq-answer/index.ts'), 'utf8').replace(/^import .*\n/gm, '');
const code = stripTypeScriptTypes(source);
const input = { id: 'knruhs-c6066ec7370d-p1-q1', subject: 'forensic-medicine', topic: 'toxicology', question: 'Danbury tremors are due to', options: [{label:'a',text:'Cyanide'}, {label:'b',text:'Phenol'}, {label:'c',text:'Phosphorous'}, {label:'d',text:'Mercury'}] };
async function scenario({ context = '', responses = [], fail = false } = {}) {
  let handler;
  let calls = 0;
  const sandbox = { Response, AbortSignal, console,
    buildTextbookContext: async () => context,
    Deno: { env: { get: () => 'server-only-test-key' }, serve: fn => { handler = fn; } },
    fetch: async () => {
      calls++;
      if (fail) throw Error('network unavailable');
      const value = responses.shift();
      assert.ok(value, 'unexpected extra network call');
      return new Response(typeof value === 'string' ? value : JSON.stringify(value));
    },
  };
  vm.runInNewContext(code, sandbox);
  return { handler, calls: () => calls };
}
const model = value => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] });
const evidence = 'Chronic exposure to mercury produces Danbury tremors.';
const supported = { supported: true, label: 'd', explanation: 'Mercury is supported by the retrieved evidence.', sourceIndex: 0, quote: evidence };
const request = body => new Request('https://example.test', {method:'POST',body:JSON.stringify(body)});
const first = await scenario({ context: evidence, responses: [model(supported)] });
let response = await first.handler(request(input));
let data = await response.json();
assert.equal(data.basis, 'textbook'); assert.equal(data.option, 'Mercury'); assert.equal(first.calls(), 1);
const missing = await scenario({context:evidence,responses:[model({...supported,quote:'Invented quotation that is absent.'}),model({query:'mercury tremor'}),{esearchresult:{idlist:[]}}]});
data = await (await missing.handler(request(input))).json(); assert.equal(data.status,'unresolved');
const web = await scenario({responses:[model({query:'mercury tremor'}),{esearchresult:{idlist:['123']}},`<PubmedArticle><PMID>123</PMID><ArticleTitle>Tremor evidence</ArticleTitle><Abstract>${evidence}</Abstract></PubmedArticle>`,model(supported)]});
data = await (await web.handler(request(input))).json(); assert.equal(data.basis,'web'); assert.equal(data.sources[0].url,'https://pubmed.ncbi.nlm.nih.gov/123/');
const invalid = await scenario(); response = await invalid.handler(request({...input,options:input.options.slice(1)})); assert.equal(response.status,400); assert.equal(invalid.calls(),0);
const failure = await scenario({context:evidence,fail:true}); response = await failure.handler(request(input)); assert.equal(response.status,503);
console.log('PASS: textbook first, exact evidence validation, cited web fallback, unresolved evidence, malformed choices and network error.');
