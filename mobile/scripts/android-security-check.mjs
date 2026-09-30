import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const mobile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function load(relative, mocks = {}) {
  const exports = {};
  const source = fs.readFileSync(path.join(mobile, relative), 'utf8').replace(/^import[\s\S]*?;\s*$/gm, '');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  } }).outputText, { exports, ...mocks });
  return exports;
}
const { createSecureStorage } = load('src/lib/secureStorageAdapter.ts');
function fixture(oldValue = null) {
  const plain = new Map(oldValue === null ? [] : [['session', oldValue]]);
  const encrypted = new Map();
  const faults = { read: false, write: false, mismatch: false, cleanup: false };
  const legacy = {
    getItem: async key => plain.get(key) ?? null,
    setItem: async (key, value) => { plain.set(key, value); },
    removeItem: async key => { if (faults.cleanup) throw new Error('cleanup'); plain.delete(key); },
  };
  const secure = {
    getItem: async key => { if (faults.read) throw new Error('read'); return encrypted.get(key) ?? null; },
    setItem: async (key, value) => { if (faults.write) throw new Error('write'); encrypted.set(key, faults.mismatch ? 'wrong' : value); },
    removeItem: async key => { encrypted.delete(key); },
  };
  return { storage: createSecureStorage(secure, legacy), plain, encrypted, faults };
}
let checks = 0;
{
  const f = fixture('existing-session');
  assert.equal(await f.storage.getItem('session'), 'existing-session');
  assert.equal(f.encrypted.get('session'), 'existing-session');
  assert.equal(f.plain.has('session'), false); checks++;
}
{
  const f = fixture('existing-session'); f.faults.write = true;
  assert.equal(await f.storage.getItem('session'), 'existing-session');
  assert.equal(f.plain.get('session'), 'existing-session');
  f.faults.write = false;
  await f.storage.getItem('session');
  assert.equal(f.plain.has('session'), false); checks++;
}
{
  const f = fixture('existing-session'); f.faults.mismatch = true;
  assert.equal(await f.storage.getItem('session'), 'existing-session');
  assert.equal(f.plain.get('session'), 'existing-session'); checks++;
  f.faults.mismatch = false;
  assert.equal(await f.storage.getItem('session'), 'existing-session');
  assert.equal(f.encrypted.get('session'), 'existing-session');
}
{
  const f = fixture(); f.faults.write = true;
  await assert.rejects(f.storage.setItem('session', 'new-session'));
  assert.equal(f.plain.size, 0); checks++;
}
{
  const f = fixture('old'); f.encrypted.set('session', 'current');
  assert.equal(await f.storage.getItem('session'), 'current');
  assert.equal(f.plain.size, 0); checks++;
}
{
  const f = fixture('old'); f.faults.read = true;
  await assert.rejects(f.storage.getItem('session'));
  assert.equal(f.plain.get('session'), 'old'); checks++;
}
{
  const f = fixture('old');
  const reading = f.storage.getItem('session');
  const writing = f.storage.setItem('session', 'new');
  const removing = f.storage.removeItem('session');
  await Promise.all([reading, writing, removing]);
  assert.equal(await f.storage.getItem('session'), null);
  assert.equal(f.plain.size, 0); checks++;
}
{
  const f = fixture('old'); f.faults.cleanup = true;
  assert.equal(await f.storage.getItem('session'), 'old');
  f.faults.cleanup = false;
  assert.equal(await f.storage.getItem('session'), 'old');
  assert.equal(f.plain.size, 0); checks++;
}
{
  const values = new Map([['@orbit:google_authenticated_v1', 'true'], ['@orbit:google_authenticated_email', 'old@example.invalid']]);
  let signedOut = false;
  const auth = load('src/lib/googleAuth.ts', {
    GOOGLE_SIGN_IN_ENABLED: true, Platform: { OS: 'android' },
    GoogleSignin: { configure() {}, signOut: async () => {} },
    AsyncStorage: { removeItem: async key => { values.delete(key); } },
    supabase: { auth: { signOut: async () => { signedOut = true; return { error: null }; } } },
  });
  await auth.signOutGoogle(); assert.equal(signedOut, true); assert.equal(values.size, 0); checks++;
}
{
  const values = new Map([['@orbit:google_authenticated_v1', 'true']]);
  const auth = load('src/lib/googleAuth.ts', {
    GOOGLE_SIGN_IN_ENABLED: true, GoogleSignin: { configure() {}, signOut: async () => {} },
    AsyncStorage: { removeItem: async key => { values.delete(key); } },
    supabase: { auth: { signOut: async () => ({ error: new Error('sign-out failed') }) } },
  });
  await assert.rejects(auth.signOutGoogle()); assert.equal(values.size, 1); checks++;
}
for (const mode of ['same-owner', 'different-owner', 'unbound-legacy']) {
  const expiry = new Date(Date.now() + 86400000).toISOString();
  const values = new Map([['orbit:premium-until', expiry]]);
  if (mode !== 'unbound-legacy') values.set('orbit:premium-owner-v1', 'user-a');
  const premium = load('src/lib/premium.ts', {
    secureStorage: { getItem: async key => values.get(key) ?? null },
    supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: mode === 'different-owner' ? 'user-b' : 'user-a' } } } }) } },
  });
  await premium.hydratePremium();
  assert.equal(premium.isPremiumCached(), mode === 'same-owner'); checks++;
}
// Wiring is security-critical: a plain ReactPackage disappears under New Architecture.
const kt = 'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd/';
assert.match(fs.readFileSync(path.join(mobile, kt + 'SecureStorageModule.kt'), 'utf8'), /NativeOrbitSecureStorageSpec/);
assert.match(fs.readFileSync(path.join(mobile, kt + 'SecureStoragePackage.kt'), 'utf8'), /BaseReactPackage/);
assert.match(fs.readFileSync(path.join(mobile, kt + 'MainApplication.kt'), 'utf8'), /add\(SecureStoragePackage\(\)\)/);
const gradle = fs.readFileSync(path.join(mobile, 'android/app/build.gradle'), 'utf8');
assert.match(gradle, /Release signing credentials are required/);
const release = gradle.slice(gradle.lastIndexOf('        release {'), gradle.indexOf('gradle.taskGraph'));
assert.doesNotMatch(release, /signingConfigs\.debug/);
console.log(`${checks} Android storage/sign-out cases passed; native wiring and release signing guards present.`);
