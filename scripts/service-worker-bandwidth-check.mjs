// Exercise the real worker: count network calls across updates and repeat visits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

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
    };
  },
};
const calls = [];
const unchanged = '/assets/art-AbC123_-.png';
const changed = '/assets/app-ZyX987_-.js';
async function fetchFixture(request) {
  const url = key(request);
  calls.push(url);
  return new Response(url.endsWith('/orbit-offline-assets.json')
    ? JSON.stringify(['/index.html', unchanged, changed, '/pg/current.json'])
    : 'fresh:' + url);
}
await (await caches.open('mbbs-qb-old')).put(unchanged, new Response('old-identical-art'));
await (await caches.open('other-app')).put('/other', new Response('unrelated'));
const listeners = {};
vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
  URL, Response, caches, fetch: fetchFixture,
  self: { location: { origin }, addEventListener: (name, callback) => { listeners[name] = callback; },
    skipWaiting: async () => {}, clients: { claim: async () => {} } },
});
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
await lifecycle('activate');
assert.equal(stores.has('mbbs-qb-old'), false);
assert.equal(stores.has('other-app'), true, 'activation must preserve unrelated caches');
calls.length = 0;
for (let index = 0; index < 5; index++) assert.equal(await (await request(unchanged)).text(), 'old-identical-art');
assert.equal(calls.length, 0, 'repeat asset use must make ZERO network requests');
await request('/assets/new-AbC123_-.js');
await request('/assets/new-AbC123_-.js');
assert.equal(calls.length, 1, 'uncached hashed asset downloads only once');
await request('/pg/current.json');
assert.equal(calls.length, 2, 'mutable pack still revalidates');
await request('/progress', { mode: 'navigate' });
assert.equal(calls.length, 3, 'HTML still checks for current deployment');
assert.equal(await request('https://supabase.test/auth/v1/token'), undefined);
assert.equal(await request('/~oauth/callback'), undefined);
assert.equal(await request('/checkout', { method: 'POST' }), undefined);
assert.equal(await request('/installation/install.mp4'), undefined);
const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
assert.ok(config.headers.find(rule => rule.source === '/assets/:path*').headers.some(header => header.value.includes('immutable')));
assert.ok(!config.headers.some(rule => /checkout|auth|pg/.test(rule.source)), 'no long-lived headers on mutable/private routes');
console.log('PASS: update migration, zero repeated immutable downloads, new-asset fetch, mutable refresh, current HTML, auth/payment/range bypass, cache isolation and hosting headers.');
