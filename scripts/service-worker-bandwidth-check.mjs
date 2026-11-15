// Exercise the real worker: count network calls across updates and repeat visits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

const origin = 'https://orbit.test';
const key = request => new URL(typeof request === 'string' ? request : request.url, origin).href;
const stores = new Map();
const caches = {
  keys: async () => [...stores.keys()],
  delete: async name => stores.delete(name),
  open: async name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const data = stores.get(name);
    return {
      match: async request => data.get(key(request))?.clone(),
      put: async (request, response) => { data.set(key(request), response.clone()); },
      add: async request => { data.set(key(request), await fetchFixture(request)); },
      keys: async () => [...data.keys()].map(url => ({ url })),
      delete: async request => data.delete(key(request)),
    };
  },
};
const calls = [];
const unchanged = '/assets/art-AbC123_-.png';
const changed = '/assets/app-ZyX987_-.js';
const deferred = '/assets/stage24-AbC123_-.png';
const savedDecoration = '/assets/panda-soft-AbC123_-.png';
const pack = '/pg/s00-012345abcdef.zst';
async function fetchFixture(request) {
  const url = key(request);
  calls.push(url);
  return new Response(url.endsWith('/orbit-offline-assets.json')
    ? JSON.stringify(['/index.html', unchanged, changed, deferred, savedDecoration, pack, '/pg/current.json'])
    : 'fresh:' + url);
}
await (await caches.open('mbbs-qb-old')).put(unchanged, new Response('old-identical-art'));
await (await caches.open('mbbs-qb-old')).put(savedDecoration, new Response('saved-pet'));
await (await caches.open('mbbs-qb-old')).put(pack, new Response('saved-pack'));
await (await caches.open('other-app')).put('/other', new Response('unrelated'));
const listeners = {};
function boot(modelRevision = 'revision-one') {
vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
  .replace('const STATIC_REVISIONS = {};', `const STATIC_REVISIONS = ${JSON.stringify({'/models/body-0.bin.gz':modelRevision})};`), {
  URL, Response, caches, fetch: fetchFixture,
  self: { location: { origin }, addEventListener: (name, callback) => { listeners[name] = callback; },
    skipWaiting: async () => {}, clients: { claim: async () => {} } },
});
}
boot();
async function lifecycle(name) {
  const pending = [];
  listeners[name]({ waitUntil: promise => pending.push(promise) });
  await Promise.all(pending);
}
async function request(path, options = {}) {
  const pending = [];
  let response;
  listeners.fetch({
    request: { url: new URL(path, origin).href, method: 'GET', mode: 'cors', headers: new Headers(), ...options },
    respondWith: promise => { response = promise; }, waitUntil: promise => pending.push(promise),
  });
  const result = await response;
  await Promise.all(pending);
  return result;
}
await lifecycle('install');
assert.equal(calls.filter(url => url.endsWith(unchanged)).length, 0, 'unchanged art must migrate without downloading');
assert.equal(calls.filter(url => url.endsWith(changed)).length, 1, 'new asset must download');
assert.equal(calls.filter(url => url.endsWith('/pg/current.json')).length, 1, 'unversioned study pack must refresh');
assert.equal(calls.filter(url => url.endsWith(pack)).length, 0, 'unchanged content-hashed packs migrate without downloads');
assert.equal(calls.filter(url => url.endsWith(deferred)).length, 0, 'unused decorations must not pre-download');
await lifecycle('activate');
assert.equal(stores.has('mbbs-qb-old'), false);
assert.equal(stores.has('other-app'), true, 'activation must preserve unrelated caches');
assert.equal(await (await request(savedDecoration)).text(), 'saved-pet', 'existing decorative offline copies survive updates');
calls.length = 0;
for (let index = 0; index < 5; index++) assert.equal(await (await request(unchanged)).text(), 'old-identical-art');
assert.equal(calls.length, 0, 'repeat asset use must make ZERO network requests');
assert.equal(await (await request(pack)).text(), 'saved-pack');
assert.equal(calls.length, 0, 'content-hashed study packs must not background-download');
await request('/assets/new-AbC123_-.js');
await request('/assets/new-AbC123_-.js');
assert.equal(calls.length, 1, 'uncached hashed asset downloads only once');
await request('/pg/current.json');
assert.equal(calls.length, 2, 'mutable pack still revalidates');
await request('/progress', { mode: 'navigate' });
assert.equal(calls.length, 3, 'HTML still checks for current deployment');
await request(deferred); await request(deferred);
assert.equal(calls.filter(url => url.endsWith(deferred)).length, 1, 'decorations load once on demand and work from cache');
await request('/models/body-0.bin.gz'); await request('/models/body-0.bin.gz');
assert.equal(calls.filter(url => url.endsWith('/models/body-0.bin.gz')).length, 1, 'large anatomy models download once');
boot(); await lifecycle('activate'); await request('/models/body-0.bin.gz');
assert.equal(calls.filter(url => url.endsWith('/models/body-0.bin.gz')).length, 1, 'unchanged models survive app updates');
boot('revision-two'); await lifecycle('activate'); await request('/models/body-0.bin.gz');
assert.equal(calls.filter(url => url.endsWith('/models/body-0.bin.gz')).length, 2, 'changed model bytes must refresh');
assert.equal(await request('/models/body-0.bin.gz', {headers:new Headers({range:'bytes=0-50'})}), undefined);
assert.equal(await request('https://supabase.test/auth/v1/token'), undefined);
assert.equal(await request('/~oauth/callback'), undefined);
assert.equal(await request('/checkout', { method: 'POST' }), undefined);
assert.equal(await request('/installation/install.mp4'), undefined);
const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
assert.ok(config.headers.find(rule => rule.source === '/assets/:path*').headers.some(header => header.value.includes('immutable')));
assert.ok(!config.headers.some(rule => /checkout|auth|manifest/.test(rule.source)), 'no long-lived headers on mutable/private routes');
const packRule=config.headers.find(rule=>rule.source.startsWith('/pg/'));
const pattern=new RegExp('^/pg/'+packRule.source.slice('/pg/:pack('.length,-1)+'$');
assert.ok(pattern.test(pack));
assert.ok(!pattern.test('/pg/manifest.json'));
assert.ok(!pattern.test('/pg/s00.zst'));
// Exercise the actual build's revision injection with nested public assets.
const buildSource=fs.readFileSync(new URL('./build-vercel-native.mjs',import.meta.url),'utf8');
const injection=buildSource.slice(buildSource.indexOf("const workerPath ="),buildSource.indexOf("for (const directory of ['dist/assets'"));
const originalDirectory=process.cwd();
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'orbit-public-revisions-'));
try {
  process.chdir(fixture);
  fs.mkdirSync('dist/models/nested',{recursive:true});
  fs.mkdirSync('dist/clinical-reference',{recursive:true});
  fs.writeFileSync('dist/models/nested/body.bin.gz','model-bytes');
  fs.writeFileSync('dist/clinical-reference/brain.pack','radiology-bytes');
  fs.writeFileSync('dist/sw.js',"const SW_VERSION = 'fixture';\nconst STATIC_REVISIONS = {};");
  vm.runInNewContext(injection,{fs,path,createHash,cacheRevision:'build-fixture'});
  const emitted=fs.readFileSync('dist/sw.js','utf8');
  const revisions=JSON.parse(emitted.match(/const STATIC_REVISIONS = (\{.*\});/)[1]);
  assert.equal(revisions['/models/nested/body.bin.gz'],createHash('sha256').update('model-bytes').digest('hex').slice(0,20));
  assert.equal(revisions['/clinical-reference/brain.pack'],createHash('sha256').update('radiology-bytes').digest('hex').slice(0,20));
  assert.ok(emitted.includes('fixture-assets-build-fixture'));
} finally { process.chdir(originalDirectory); fs.rmSync(fixture,{recursive:true,force:true}); }
console.log('PASS: offline migration, deferred decorative downloads, unchanged PG packs, versioned anatomy cache, changed-model invalidation, range/auth/payment bypass, current HTML and immutable hosting headers.');
