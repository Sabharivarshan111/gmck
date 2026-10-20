// Browser preflight must accept both custom-domain hosts while rejecting strangers.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
const { Request, Response } = globalThis;
const source = fs.readFileSync(new URL('../../supabase/functions/_shared/endpointSecurity.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source.replace('export function secureEndpoint', 'function secureEndpoint'), {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
const secure = vm.runInNewContext(`${js}; secureEndpoint;`, {
  Deno: {env: {get: () => ''}},
  Headers: globalThis.Headers, Request, Response, Uint8Array,
});
let calls = 0;
const endpoint = secure(() => { calls++; return Response.json({ok:true}); });
for (const origin of ['https://orbitmbbs.site', 'https://www.orbitmbbs.site', 'https://orbitmbbs.vercel.app']) {
  const preflight = await endpoint(new Request('https://example.test', {method:'OPTIONS', headers:{origin}}));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  const post = await endpoint(new Request('https://example.test', {method:'POST', headers:{origin}}));
  assert.equal(post.status, 200);
  assert.equal(post.headers.get('access-control-allow-origin'), origin);
}
const denied = await endpoint(new Request('https://example.test', {method:'OPTIONS', headers:{origin:'https://untrusted.invalid'}}));
assert.equal(denied.status, 403);
assert.equal(denied.headers.get('access-control-allow-origin'), null);
assert.equal(calls, 3);
console.log('PASS: custom domains and Vercel pass preflight and POST; unknown origins remain blocked.');
