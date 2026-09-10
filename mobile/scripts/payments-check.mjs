// Nothing in this app may take a payment.
//
// This check used to guard the Razorpay flow — that the price stayed on the
// server, that the HMAC was verified before a row was written. That flow is
// gone, and this now enforces its absence, which is a stronger rule than the
// one it replaces.
//
// ## Why it was removed rather than tidied
//
// Google Play's Payments policy requires Google Play Billing for digital
// content or features consumed inside the app. Removing ads and unlocking
// notes are both exactly that. Taking that money through Razorpay is grounds
// for removal of the app — and for a one-app developer account, removal is the
// end of the listing, the reviews and the install base. The amounts involved
// are ₹50 to ₹300. That is not a trade anybody should make, so the SDK, the
// plan table, the checkout call and the preview shim are all deleted rather
// than left switched off where a later change could switch them back on.
//
// The replacement, Google Play Billing, is written and is deliberately inert:
// `PLAY_BILLING_ENABLED` is false and `check:billing` fails if it is not. So
// the app currently sells nothing at all, on purpose, and says so.
//
// ## What must stay
//
// Reading an entitlement. Somebody who paid through Razorpay before it was
// removed keeps what they paid for until it expires, so `premium.ts`, the
// `premium_subscriptions` table and the admin panel's history are untouched.
// Removing the ability to BUY is not the same as removing what was bought, and
// confusing the two would take ad-free away from people who paid for it.
//
//   node scripts/payments-check.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};
const read = file => fs.readFile(path.join(root, file), 'utf8').catch(() => null);
/** Comments stripped: this file's own prose names everything it forbids. */
const code = text =>
  (text ?? '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

// ---------------------------------------------------------------------------
// 1. The Razorpay SDK is not in the app at all.
//
//    Not unused, not shimmed, not behind a flag — absent. A payment SDK that
//    is merely unreferenced is one import away from being live again, and it
//    is also bytes and a native module in a shipped APK for nothing.
// ---------------------------------------------------------------------------
const pkg = JSON.parse((await read('package.json')) ?? '{}');
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
check(
  !Object.keys(deps).some(name => /razorpay/i.test(name)),
  'react-native-razorpay is back in package.json — Play removes apps that bill outside Play Billing',
);

for (const gone of [
  'src/lib/razorpay.ts',
  'src/types/react-native-razorpay.d.ts',
  'preview/shims/razorpay.ts',
]) {
  check((await read(gone)) === null, `${gone} is back; the Razorpay client was deleted deliberately`);
}

// ---------------------------------------------------------------------------
// 2. Nothing imports it, and nothing starts a purchase.
// ---------------------------------------------------------------------------
async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(path.join(root, dir), { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await walk(rel)));
    else if (/\.tsx?$/.test(entry.name)) out.push(rel);
  }
  return out;
}
const sources = [...(await walk('src')), ...(await walk('preview'))];

for (const file of sources) {
  const body = code(await read(file));
  check(
    !/from ['"]react-native-razorpay['"]/.test(body),
    `${file} imports react-native-razorpay`,
  );
  check(
    !/from ['"]@\/lib\/razorpay['"]/.test(body),
    `${file} imports the deleted Razorpay client`,
  );
  check(
    !/invoke\(\s*['"]razorpay-(create-order|verify-payment|restore-purchase)['"]/.test(body),
    `${file} still calls a Razorpay edge function`,
  );
}

// ---------------------------------------------------------------------------
// 3. Play Billing is written and switched off.
//
//    "The app sells nothing" is only true while BOTH halves hold: Razorpay
//    gone, and Play Billing not yet enabled. check:billing owns the second
//    half in detail; this asserts the one bit that matters here.
// ---------------------------------------------------------------------------
const play = await read('src/lib/playBilling.ts');
check(play !== null, 'src/lib/playBilling.ts is missing — there is no payment path at all, even a future one');
check(
  /export const PLAY_BILLING_ENABLED = false/.test(play ?? ''),
  'PLAY_BILLING_ENABLED is true, but no Play Console product exists and no test purchase has ever been taken',
);

// ---------------------------------------------------------------------------
// 4. Where a purchase used to be offered, there is an explanation.
//
//    A dialog that silently loses its offer reads as a bug. The reader is told
//    ad-free is coming and that nothing is for sale yet.
// ---------------------------------------------------------------------------
const consent = await read('src/components/DailyAdConsent.tsx');
check(consent !== null, 'DailyAdConsent.tsx is missing');
check(
  /coming soon/i.test(consent ?? ''),
  'the ad prompt no longer says ad-free is coming — a vanished offer reads as a broken screen',
);

// ---------------------------------------------------------------------------
// 5. The entitlement still works.
//
//    This is the half that must NOT be removed with the buying. Anyone who
//    paid before Razorpay was taken out keeps their ad-free until it expires.
// ---------------------------------------------------------------------------
const premium = await read('src/lib/premium.ts');
check(premium !== null, 'src/lib/premium.ts is gone — everyone who already paid would start seeing ads');
check(
  /premium_subscriptions/.test(premium ?? ''),
  'premium.ts no longer reads premium_subscriptions; an existing purchase would be invisible',
);
check(
  /isPremiumCached/.test(consent ?? ''),
  'the ad prompt no longer checks whether the reader is premium, so a paying reader is asked to buy again',
);

if (failures.length > 0) {
  console.error('payments check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  'OK  no payment SDK ships, nothing can start a purchase, Play Billing is off, ' +
    'and an entitlement bought earlier still reads',
);
