// Guards the parts of the purchase flow that must never move to the client.
//
// A payment is the one place in this app where a bug costs somebody money, and
// every safe property of it lives on the server:
//
//   • the price is in razorpay-create-order's PLANS table, not in the app
//   • the order is created server-side against Razorpay's API
//   • razorpay-verify-payment checks the HMAC signature before it writes a row
//
// The client's whole job is to relay. This fails if it starts doing more than
// that — building an order, naming an amount, or writing a subscription row
// directly — and if the app ever claims a purchase succeeded on a response
// that did not include a signature.
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
const code = text =>
  text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

const client = code(await fs.readFile(path.join(root, 'src/lib/razorpay.ts'), 'utf8'));

// The client must go through the edge functions, both of them.
check(
  client.includes("invoke<CreatedOrder>('razorpay-create-order'"),
  'the app does not create its order through razorpay-create-order',
);
check(
  client.includes("invoke('razorpay-verify-payment'"),
  'the app never calls razorpay-verify-payment — an unverified payment would be trusted',
);

// It must not touch Razorpay's API or the subscriptions table itself.
check(
  !client.includes('api.razorpay.com'),
  'the app calls Razorpay\'s API directly; order creation belongs to the edge function, which holds the key secret',
);
check(
  !/from\(['"]premium_subscriptions['"]\)/.test(client),
  'the app writes premium_subscriptions directly — only the verified server path may grant ad-free',
);
check(
  !/key_secret|RAZORPAY_KEY_SECRET/.test(client),
  'a Razorpay secret is referenced in client code',
);

// Success must require the fields the server verifies against.
check(
  /razorpay_payment_id\s*\|\|\s*!result\.razorpay_signature/.test(client) ||
    (client.includes('razorpay_signature') && client.includes('razorpay_payment_id')),
  'the app does not require a payment id and signature before treating a checkout as paid',
);
check(
  client.includes("status: 'cancelled'"),
  'a cancelled checkout is not distinguished from a failure — backing out would show an error nobody caused',
);

// The amount shown must be a label, never the charge.
check(
  !/amount:\s*\d/.test(client),
  'the app hardcodes an amount; the price lives in razorpay-create-order so it cannot be edited by a client',
);

// The server side must still be the one holding the price and the signature.
const fnRoot = path.join(root, '..', 'supabase/functions');
const createOrder = await fs
  .readFile(path.join(fnRoot, 'razorpay-create-order/index.ts'), 'utf8')
  .catch(() => null);
const verify = await fs
  .readFile(path.join(fnRoot, 'razorpay-verify-payment/index.ts'), 'utf8')
  .catch(() => null);
check(createOrder !== null, 'razorpay-create-order is missing');
check(verify !== null, 'razorpay-verify-payment is missing');
if (createOrder) {
  check(
    /adfree_monthly:\s*\{\s*amount:\s*\d+/.test(createOrder),
    'razorpay-create-order no longer fixes the adfree_monthly amount server-side',
  );
}
if (verify) {
  check(
    verify.includes('constantTimeEqual'),
    'razorpay-verify-payment no longer compares the signature in constant time',
  );
}

// The preview must not be able to fake a success.
const shim = await fs
  .readFile(path.join(root, 'preview/shims/razorpay.ts'), 'utf8')
  .catch(() => null);
check(shim !== null, 'the preview has no Razorpay shim, so the preview build breaks');
if (shim) {
  check(
    code(shim).includes('reject'),
    'the preview shim resolves instead of rejecting — it would simulate a payment that never happened',
  );
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stdout.write(`  FAIL  ${failure}\n`);
  }
  process.stdout.write(`\n${failures.length} problem(s) in the payment path.\n`);
  process.exit(1);
}
process.stdout.write('OK  price, order and signature all stay server-side\n');
