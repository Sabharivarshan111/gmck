// Google Play Billing is money, and nothing here can run it.
//
// There is no Play account, no card and no emulator with Play services in these
// sandboxes. Billing answers nothing at all for a build Play did not install —
// every APK this repo's CI produces — so `isBillingAvailable()` is false in the
// preview, false in CI, and false on any sideloaded phone. The Buy button
// therefore cannot appear in `check:smoke`, and "no button" looks exactly like
// "the whole thing is broken", which is the sound module's failure shape.
//
// So the contract is asserted here instead: the four TurboModule pieces, the
// Gradle dependency, and — the part that actually matters — that nothing on the
// client can grant an entitlement, name a price, or tell Play a purchase was
// honoured.
//
//   node scripts/billing-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');
const read = file => fs.readFile(path.join(root, file), 'utf8').catch(() => null);
const readRepo = file => fs.readFile(path.join(repo, file), 'utf8').catch(() => null);

/**
 * Comments stripped.
 *
 * Every negative check below names the thing it forbids, and this file's own
 * prose names all of them — two assertions in `check:native-update` passed on
 * deliberately broken files for exactly that reason, because the doc comment
 * explaining a rule satisfied the search for the rule.
 */
const code = text =>
  (text ?? '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ---------------------------------------------------------------------------
// 1. The four TurboModule pieces. Miss one and the module is undefined on every
//    phone, silently — which for a payments module is a Buy button that does
//    nothing, for money.
// ---------------------------------------------------------------------------
const spec = await read('src/native/NativeOrbitBilling.ts');
check(spec !== null, 'src/native/NativeOrbitBilling.ts is missing — there is no spec to generate from');
if (spec) {
  check(
    /TurboModuleRegistry\.get</.test(spec) && !/getEnforcing/.test(code(spec)),
    'the spec uses getEnforcing — a device with no Play services would crash rather than hide the button',
  );
  for (const method of ['available(', 'products(', 'buy(', 'restore(']) {
    check(spec.includes(method), `the spec no longer declares ${method})`);
  }
  // `acknowledged` is a FIELD on BillingPurchase and belongs there — it says
  // whether Play has already been told. What may never exist is a method the
  // client can call to tell it, so this looks for the call shape, not the word.
  check(
    !/\backnowledge\s*\(/.test(code(spec)),
    'the spec declares an acknowledge() method; acknowledgement is the server\'s, after verification',
  );
}

const pkgJson = JSON.parse((await read('package.json')) ?? '{}');
check(
  pkgJson.codegenConfig?.jsSrcsDir === 'src/native',
  'codegenConfig no longer points at src/native, so no spec generates a Kotlin base class',
);

const kt = 'android/app/src/main/java/com/aistudio/mbbsqbank/aycxvd';
const module_ = await read(`${kt}/BillingModule.kt`);
check(module_ !== null, 'BillingModule.kt is missing');
if (module_) {
  check(
    /class BillingModule\([\s\S]{0,200}NativeOrbitBillingSpec/.test(module_),
    'BillingModule no longer extends the generated NativeOrbitBillingSpec',
  );
  check(
    /const val NAME = "OrbitBilling"/.test(module_),
    'BillingModule.NAME is not "OrbitBilling"; the spec would never find it',
  );
}

const pkg = await read(`${kt}/BillingPackage.kt`);
check(pkg !== null, 'BillingPackage.kt is missing');
if (pkg) {
  check(
    /BaseReactPackage/.test(pkg),
    'BillingPackage is not a BaseReactPackage — the TurboModule manager never reads a plain one',
  );
  check(
    /isTurboModule = \*\/ true|isTurboModule = true/.test(pkg.replace(/\s+/g, ' ')),
    'BillingPackage does not declare isTurboModule = true; the module would be silently absent',
  );
}

const app = await read(`${kt}/MainApplication.kt`);
check(
  /add\(BillingPackage\(\)\)/.test(app ?? ''),
  'BillingPackage is not registered in MainApplication',
);

// ---------------------------------------------------------------------------
// 2. The dependency, and its floor.
//
//    Google made Billing Library 8+ mandatory for new apps and updates from
//    31 August 2026 — 7 and below stop working rather than merely being
//    discouraged. `enableAutoServiceReconnection`, which BillingModule relies
//    on, arrived in 8 as well.
// ---------------------------------------------------------------------------
const gradle = await read('android/app/build.gradle');
const billingDep = /com\.android\.billingclient:billing:(\d+)\.(\d+)\.(\d+)/.exec(gradle ?? '');
check(billingDep !== null, 'the Play Billing dependency is missing from build.gradle');
if (billingDep) {
  check(
    Number(billingDep[1]) >= 8,
    `billing:${billingDep[0].split(':').pop()} is below 8; Google stopped accepting 7 and below on 31 Aug 2026`,
  );
}

// ---------------------------------------------------------------------------
// 3. The client grants nothing, prices nothing, and acknowledges nothing.
//
//    Each of these is a way to lose real money rather than a style rule.
// ---------------------------------------------------------------------------
const client = await read('src/lib/playBilling.ts');
check(client !== null, 'src/lib/playBilling.ts is missing');
if (client) {
  const body = code(client);
  check(
    /invoke\(\s*['"]play-verify-purchase['"]/.test(body),
    'the client no longer posts to play-verify-purchase; an entitlement would come from nowhere',
  );
  check(
    !/premium_subscriptions/.test(body),
    'the client touches premium_subscriptions directly — only a verified server may write an entitlement',
  );
  check(
    !/₹|Rs\.?\s*\d|\bINR\b/.test(body),
    'a price is written into the client; every amount must come from Play\'s own ProductDetails',
  );
  check(
    /export async function loadProducts/.test(client),
    'the client no longer exposes loadProducts, so a screen has nowhere to get Play\'s prices from',
  );
  check(
    /formattedPrice/.test(spec ?? ''),
    'BillingProduct no longer carries formattedPrice — Play\'s own localised price is the only one ' +
      'that may be shown, and there would be nothing to show it from',
  );
  check(
    /status:\s*'pending'/.test(body),
    'a PENDING purchase is not handled; a deferred payment would be granted before it settled',
  );
  check(
    /export const PLAY_BILLING_ENABLED/.test(client),
    'the PLAY_BILLING_ENABLED flag is gone — Razorpay must stay the live path until a real purchase has been taken',
  );
  check(
    /export const PLAY_BILLING_ENABLED = false/.test(client),
    'PLAY_BILLING_ENABLED is true: this path has never taken a real payment on a phone. ' +
      'Turn it on only after a licence tester has bought something and a source=play row appeared.',
  );
}

// ---------------------------------------------------------------------------
// 4. The base plans the client offers are the ones the server can grant.
//
//    A base plan Play would happily sell and the server does not recognise is a
//    purchase that takes somebody's money and grants the wrong tier.
// ---------------------------------------------------------------------------
const verify = await readRepo('supabase/functions/play-verify-purchase/index.ts');
check(verify !== null, 'supabase/functions/play-verify-purchase/index.ts is missing');
if (client && verify) {
  const plansIn = text => {
    const block = /BASE_PLAN_TO_KEY[^{]*\{([\s\S]*?)\}/.exec(text);
    return block ? [...block[1].matchAll(/['"]([\w-]+)['"]\s*:\s*['"]([\w]+)['"]/g)]
      .map(m => `${m[1]}=${m[2]}`).sort().join(',') : '';
  };
  const a = plansIn(client);
  const b = plansIn(verify);
  check(a !== '', 'the client has no BASE_PLAN_TO_KEY map to compare');
  check(
    a === b,
    `the client and the server disagree about the base plans:\n      client: ${a}\n      server: ${b}`,
  );
}

// ---------------------------------------------------------------------------
// 5. The server verifies against Play, and acknowledges only after granting.
// ---------------------------------------------------------------------------
if (verify) {
  const body = code(verify);
  check(
    /androidpublisher\.googleapis\.com/.test(body),
    'the verification function never asks the Play Developer API what the token is',
  );
  check(
    /subscriptionsv2/.test(body),
    'the function does not use purchases.subscriptionsv2; v1 does not report subscriptionState',
  );
  check(
    /onConflict:\s*['"]play_purchase_token['"]/.test(body),
    'the row is not upserted on play_purchase_token — a subscription reuses one token for life, ' +
      'so an insert collides on the second call and a renewal never extends anything',
  );
  // The CALL site, not the function definition — the definition sits above the
  // handler, so comparing against it would compare against the wrong thing and
  // pass whatever the order really was.
  check(
    body.indexOf('upsert(') < body.indexOf('await acknowledge(verified'),
    'acknowledgement happens before the grant is written; if the grant then fails the reader has ' +
      'paid, cannot be auto-refunded, and has nothing',
  );
  check(
    /accountId && verified\.accountId !== user\.id/.test(body),
    'the function no longer checks the obfuscated account id — a purchase token that has been on a ' +
      'device is not a secret, and any session could post somebody else\'s',
  );
}

const rtdn = await readRepo('supabase/functions/play-rtdn/index.ts');
check(rtdn !== null, 'supabase/functions/play-rtdn/index.ts is missing — renewals and refunds would never land');
if (rtdn) {
  const body = code(rtdn);
  check(
    /PLAY_RTDN_SECRET/.test(body) && /constantTimeEqual/.test(body),
    'the RTDN endpoint is unauthenticated; it runs with verify_jwt false and must guard itself',
  );
  check(
    /androidpublisher\.googleapis\.com/.test(body),
    'the RTDN handler trusts the notification instead of asking Play what the token is now',
  );
  check(
    !/SUBSCRIPTION_STATE_CANCELED/.test(
      (/const ended =[\s\S]*?;/.exec(body) ?? [''])[0],
    ),
    'a cancelled subscription is being expired immediately — cancelling stops the next charge, ' +
      'it does not end the month already paid for',
  );
}

// ---------------------------------------------------------------------------
// 6. The two copies of the Google auth helper have not drifted.
//
//    Supabase deploys each function as a self-contained bundle, so neither can
//    import a module outside its own folder. A diverged copy means one function
//    silently stops being able to talk to Play while the other keeps working.
// ---------------------------------------------------------------------------
const authA = await readRepo('supabase/functions/play-verify-purchase/googlePlayAuth.ts');
const authB = await readRepo('supabase/functions/play-rtdn/googlePlayAuth.ts');
check(authA !== null && authB !== null, 'one of the two googlePlayAuth.ts copies is missing');
check(
  authA !== null && authA === authB,
  'the two googlePlayAuth.ts copies have diverged; they must be byte-identical',
);

// ---------------------------------------------------------------------------
// 7. The preview shim is ABSENT, not a fake.
//
//    A shim that resolved a purchase would post an invented token to the
//    verification function. The only two outcomes are a rejected request that
//    looks like a bug, or — if anybody ever loosened the server to be helpful —
//    an entitlement granted for money nobody paid.
// ---------------------------------------------------------------------------
const shim = await read('preview/shims/orbit-billing.ts');
check(shim !== null, 'preview/shims/orbit-billing.ts is missing; the preview build would not resolve the spec');
if (shim) {
  check(
    /export default null/.test(code(shim)),
    'the preview shim does not export null — it is pretending Play Billing exists in a browser',
  );
}
const vite = await read('preview/vite.config.ts');
check(
  /NativeOrbitBilling/.test(vite ?? ''),
  'preview/vite.config.ts has no alias for NativeOrbitBilling',
);

// ---------------------------------------------------------------------------
// 8. Razorpay is still here.
//
//    The migration replaces it one release AFTER Play has taken a real payment,
//    so an existing entitlement is never orphaned. Deleting it early is how
//    somebody who paid last week stops being ad-free.
// ---------------------------------------------------------------------------
check(
  (await read('src/lib/razorpay.ts')) !== null,
  'src/lib/razorpay.ts is gone; leave it for one release after Play Billing goes live',
);

// ---------------------------------------------------------------------------
// 9. Run the spec through React Native's real codegen.
//
//    Otherwise a typo in a type fails inside a Gradle step nobody runs locally,
//    twenty minutes into a release build.
// ---------------------------------------------------------------------------
const cli = path.join(
  root,
  'node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
);
if (await fs.stat(cli).then(() => true, () => false)) {
  const outFile = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), 'orbit-billing-codegen-')),
    'schema.json',
  );
  try {
    execFileSync('node', [cli, '--platform', 'android', outFile, 'src/native'], { cwd: root });
    const schema = JSON.parse(await fs.readFile(outFile, 'utf8'));
    const moduleName = schema.modules?.NativeOrbitBilling?.moduleName;
    check(
      moduleName === 'OrbitBilling',
      `codegen read the spec as "${moduleName}", not "OrbitBilling" — the Kotlin would never be found`,
    );
    const methods = (schema.modules?.NativeOrbitBilling?.spec?.methods ?? []).map(m => m.name);
    for (const name of ['available', 'products', 'buy', 'restore']) {
      check(methods.includes(name), `codegen found no ${name}() on the spec; it has ${methods.join(', ')}`);
    }
  } catch (error) {
    check(false, `codegen could not parse the spec: ${String(error.message).split('\n')[0]}`);
  }
}

if (failures.length > 0) {
  console.error('billing check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'OK  OrbitBilling is a TurboModule; the client grants nothing and prices nothing; the server ' +
    'verifies against Play, upserts on the token and acknowledges after granting; RTDN is guarded; ' +
    'the preview shim is absent and Razorpay is still the live path',
);
