// Exercise the actual auth module with mocked native services in both bundle modes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const modeSource = fs.readFileSync(new URL('../src/lib/authMode.ts', import.meta.url), 'utf8');
const authSource = fs.readFileSync(new URL('../src/lib/googleAuth.ts', import.meta.url), 'utf8');
const debugApk = process.argv.includes('--debug-apk');

// Regression: on a fresh installation the saved Supabase session may take
// seconds to hydrate from Android secure storage. It must not eat the first
// press of "Continue with Google". The button launches sign-in immediately,
// while any account check completes independently.
const firstRun = fs.readFileSync(new URL('../src/components/FirstRun.tsx', import.meta.url), 'utf8');
const vault = fs.readFileSync(new URL('../src/screens/NotesScreen.tsx', import.meta.url), 'utf8');
assert.match(vault, /title: 'NEET PG Practice Questions'/, 'Vault should use user-facing NEET PG name');
assert.doesNotMatch(vault, /title: 'MedMCQA Practice'/, 'Do not expose MedMCQA provider name on the Vault tile');
assert.match(firstRun, /testID="first-run-google-sign-in"[\s\S]{0,500}disabled=\{googling\s*\|\|\s*googleAuthenticated\}/,
  'Google sign-in must be enabled while the saved-account lookup runs, and stop after success');
assert.match(firstRun, /<Touchable[\s\S]{0,100}testID="first-run-google-sign-in"/,
  'Restore v27 native sign-in Touchable used by the known-working one-tap flow');
assert.doesNotMatch(firstRun, /disabled=\{googling\s*\|\|\s*checkingAccount\}/,
  'Background account hydration must not disable the Google button');
assert.match(firstRun, /if \(googleSignInInFlight\.current\) return;/,
  'Repeated taps during the same render must not launch competing Google pickers');
assert.match(firstRun, /googleSignInInFlight\.current = true;/,
  'The native account chooser needs a synchronous in-flight guard');
assert.doesNotMatch(firstRun, /if \(isNative\) configureGoogleSignIn\(\);/,
  'Never eagerly configure native Google SDK during onboarding mount; v27 did so on tap');
assert.match(firstRun, /Opening Google account chooser/,
  'Show immediate progress so a delayed native account picker never looks unresponsive');
assert.match(firstRun, /<ScrollView[\s\S]*testID="first-run-google-sign-in"[\s\S]*<UniversityChoice[\s\S]*testID="first-run-start-studying"[\s\S]*<\/ScrollView>/,
  'Google, university, name and year must stay together on one scrollable setup screen');
assert.doesNotMatch(firstRun, /setStage\('you'\)|stage === 'splash'|STEP 1 OF 2|STEP 2 OF 2/,
  'Do not restore the separate Google-first screen; v27 used one combined setup screen');


function evaluate(source, dev, modules = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    {
      exports,
      __DEV__: dev,
      require: name => {
        assert.ok(name in modules, `Unmocked import: ${name}`);
        return modules[name];
      },
    },
  );
  return exports;
}

for (const dev of [false, true]) {
  const mode = evaluate(modeSource, dev);
  assert.equal(
    mode.GOOGLE_SIGN_IN_ENABLED,
    !debugApk && !dev,
    'Internal/release must enable Google; optimized debug APK must explicitly disable it.',
  );

  let nativeCalls = 0;
  let writes = 0;
  let guestProofCalls = 0;
  let mergeRetryCalls = 0;
  let linkShouldFail = false;
  let signInResult = { type: 'cancelled' };
  let currentAnonymous = true;
  const sessionEvents = [];

  const auth = evaluate(authSource, dev, {
    './guestMerge': {
      rememberGuestSession: async () => {
        guestProofCalls++;
        sessionEvents.push('remember-guest');
      },
      retryGuestMerge: async () => {
        mergeRetryCalls++;
        sessionEvents.push('merge-guest');
      },
    },
    './authMode': mode,
    'react-native': { Platform: { OS: 'android' } },
    '@react-native-async-storage/async-storage': {
      __esModule: true,
      default: {
        getItem: async () => null,
        setItem: async () => {
          writes++;
        },
        removeItem: async () => {},
      },
    },
    '@react-native-google-signin/google-signin': {
      GoogleSignin: {
        configure: () => {
          nativeCalls++;
        },
        hasPlayServices: async () => {
          nativeCalls++;
        },
        signIn: async () => {
          nativeCalls++;
          return signInResult;
        },
        getTokens: async () => ({ accessToken: 'fixture-access-token' }),
        signOut: async () => {},
      },
      statusCodes: {},
      isErrorWithCode: () => false,
    },
    './supabase': {
      supabase: {
        auth: {
          getSession: async () => ({
            data: {
              session: mode.GOOGLE_SIGN_IN_ENABLED
                ? { user: { id: 'guest-1', is_anonymous: currentAnonymous } }
                : null,
            },
          }),
          linkIdentity: async () => {
            sessionEvents.push('link-identity');
            if (linkShouldFail) return { error: new Error('identity already linked') };
            currentAnonymous = false;
            return { error: null };
          },
          refreshSession: async () => {
            sessionEvents.push('refresh-session');
            return { error: null };
          },
          getUser: async () => ({
            data: { user: { id: 'guest-1', is_anonymous: currentAnonymous, email: null } },
            error: null,
          }),
          signInWithIdToken: async () => {
            sessionEvents.push('replace-session');
            currentAnonymous = false;
            return { error: null };
          },
          signOut: async () => ({ error: null }),
        },
      },
    },
  });

  assert.equal(await auth.hasAuthenticatedGoogleOnce(), !mode.GOOGLE_SIGN_IN_ENABLED);
  await assert.rejects(auth.signInWithGoogle(), e => e.name === 'GoogleSignInCancelled');
  assert.equal(nativeCalls, mode.GOOGLE_SIGN_IN_ENABLED ? 3 : 0);
  assert.equal(guestProofCalls, 0, 'Cancelled or bypassed sign-in must not prepare a guest transfer.');
  assert.equal(writes, 0, 'Debug bypass must not persist a fake authenticated flag.');

  if (mode.GOOGLE_SIGN_IN_ENABLED) {
    // Preferred path: anonymous account is upgraded in place. No account
    // replacement and no data transfer should occur.
    signInResult = { type: 'success', data: { idToken: 'fixture-id-token', user: {} } };
    currentAnonymous = true;
    sessionEvents.length = 0;
    await auth.signInWithGoogle();
    assert.deepEqual(
      sessionEvents,
      ['remember-guest', 'link-identity', 'refresh-session'],
      'Prepare guest proof, then link Google in place without replacing the Supabase user.',
    );
    assert.equal(guestProofCalls, 1);
    assert.equal(mergeRetryCalls, 0, 'In-place linking must not run the guest transfer.');
    assert.equal(writes, 1, 'Successful in-place upgrade persists the authenticated flag.');

    // Conflict/fallback path: if that Google identity already belongs to an
    // existing Orbit account, preserve the guest proof before replacing the
    // session and immediately invoke the verified merge.
    linkShouldFail = true;
    currentAnonymous = true;
    sessionEvents.length = 0;
    await auth.signInWithGoogle();
    assert.deepEqual(
      sessionEvents,
      ['remember-guest', 'link-identity', 'replace-session', 'merge-guest'],
      'Save guest proof before account replacement, then merge only after Google sign-in succeeds.',
    );
    assert.equal(guestProofCalls, 2);
    assert.equal(mergeRetryCalls, 1);
    assert.equal(writes, 2, 'Successful fallback sign-in also persists the authenticated flag.');
  }
}

console.log(
  `Auth mode verified: ${debugApk ? 'debug APK disabled' : 'internal/release enabled; local Metro debug disabled; guest upgrade link+merge fallback covered'}.`,
);
