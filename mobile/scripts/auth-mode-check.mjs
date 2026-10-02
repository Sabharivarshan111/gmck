// Exercise the actual auth module with mocked native services in both bundle modes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const modeSource = fs.readFileSync(new URL('../src/lib/authMode.ts', import.meta.url), 'utf8');
const authSource = fs.readFileSync(new URL('../src/lib/googleAuth.ts', import.meta.url), 'utf8');
const debugApk = process.argv.includes('--debug-apk');
function evaluate(source, dev, modules = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { exports, __DEV__: dev, require: name => { assert.ok(name in modules, `Unmocked import: ${name}`); return modules[name]; } });
  return exports;
}
for (const dev of [false, true]) {
  const mode = evaluate(modeSource, dev);
  assert.equal(mode.GOOGLE_SIGN_IN_ENABLED, !debugApk && !dev,
    'Internal/release must enable Google; optimized debug APK must explicitly disable it.');
  let nativeCalls = 0;
  let writes = 0;
  let guestProofCalls = 0;
  let signInResult = { type: 'cancelled' };
  const sessionEvents = [];
  const auth = evaluate(authSource, dev, {
    './guestMerge': { rememberGuestSession: async () => { guestProofCalls++; sessionEvents.push('remember-guest'); } },
    './authMode': mode,
    'react-native': { Platform: { OS: 'android' } },
    '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async () => null, setItem: async () => { writes++; } } },
    '@react-native-google-signin/google-signin': {
      GoogleSignin: { configure: () => { nativeCalls++; }, hasPlayServices: async () => { nativeCalls++; }, signIn: async () => { nativeCalls++; return signInResult; } },
      statusCodes: {}, isErrorWithCode: () => false,
    },
    './supabase': { supabase: { auth: {
      getSession: async () => ({ data: { session: null } }),
      signInWithIdToken: async () => { sessionEvents.push('replace-session'); return { error: null }; },
    } } },
  });
  assert.equal(await auth.hasAuthenticatedGoogleOnce(), !mode.GOOGLE_SIGN_IN_ENABLED);
  await assert.rejects(auth.signInWithGoogle(), e => e.name === 'GoogleSignInCancelled');
  assert.equal(nativeCalls, mode.GOOGLE_SIGN_IN_ENABLED ? 3 : 0);
  assert.equal(guestProofCalls, 0, 'Cancelled or bypassed sign-in must not prepare a guest transfer.');
  assert.equal(writes, 0, 'Debug bypass must not persist a fake authenticated flag.');
  if (mode.GOOGLE_SIGN_IN_ENABLED) {
    signInResult = { type: 'success', data: { idToken: 'fixture-id-token', user: {} } };
    await auth.signInWithGoogle();
    assert.deepEqual(sessionEvents, ['remember-guest', 'replace-session'],
      'Save guest proof before replacing the anonymous session.');
    assert.equal(guestProofCalls, 1);
    assert.equal(writes, 1, 'Only successful sign-in persists the authenticated flag.');
  }
}
console.log(`Auth mode verified: ${debugApk ? 'debug APK disabled' : 'internal/release enabled; local Metro debug disabled'}.`);
