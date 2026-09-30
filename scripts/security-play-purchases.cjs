const fs = require('fs'), vm = require('vm'), assert = require('assert/strict'), ts = require('typescript');
async function scenario(mode) {
  let handler, providerCalls = 0, acknowledgements = 0, saves = [];
  const token = 'fixture-purchase-token';
  const purchasedAt = Date.now() - 80 * 86400000;
  const subscription = mode.startsWith('sub-');
  const expiry = new Date(Date.now() + (mode === 'sub-expired' ? -1 : 1) * 86400000).toISOString();
  const user = mode === 'invalid' ? null : { id: 'user-a', email: 'a@example.invalid', is_anonymous: mode === 'anonymous' };
  const product = { purchaseState: 0, purchaseTimeMillis: String(purchasedAt), obfuscatedExternalAccountId: mode === 'mismatch' ? 'user-b' : mode === 'unbound' ? '' : 'user-a', acknowledgementState: 0 };
  const sub = { subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE', acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING', externalAccountIdentifiers: { obfuscatedExternalAccountId: 'user-a' }, lineItems: [{ productId: mode === 'sub-unknown' ? 'other-app-product' : 'orbit_adfree', expiryTime: expiry, offerDetails: { basePlanId: 'adfree-monthly' } }] };
  const context = { Request, Response, console: { log() {}, error() {}, warn() {} },
    Deno: { serve: fn => { handler = fn; }, env: { get: k => k === 'SUPABASE_URL' ? 'https://fixture.invalid' : 'fixture-key' } },
    playAccessToken: async () => 'play-bearer',
    fetch: async (url) => { providerCalls++; if (url.endsWith(':acknowledge')) { acknowledgements++; return new Response('{}'); } return new Response(JSON.stringify(subscription ? sub : product)); },
    createClient: () => ({ auth: { getUser: async () => ({ data: { user } }) },
      rpc: async (name, args) => { assert.equal(name, 'save_verified_play_purchase'); saves.push(args);
        if (mode === 'unbound' || mode === 'db-failure') return { error: { code: mode === 'unbound' ? '42501' : 'XX000' } };
        return { data: args._rows.map(row => ({ plan: row.plan, expires_at: row.expires_at })), error: null };
      },
      from: () => ({ select: () => { const chain = { eq: () => chain, contains: () => chain, limit: () => chain, maybeSingle: async () => ({ data: { id: 'already-notified' } }) }; return chain; } }),
    }),
  };
  const source = fs.readFileSync('supabase/functions/play-verify-purchase/index.ts', 'utf8').replace(/^import .*;\s*$/gm, '');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  const res = await handler(new Request('https://fixture.invalid', { method: 'POST', headers: { authorization: 'Bearer fixture', 'content-type': 'application/json' }, body: JSON.stringify({ purchase_token: token, product_id: subscription ? 'orbit_adfree' : 'notes_pharmac', kind: subscription ? 'subs' : 'inapp' }) }));
  const data = await res.json();
  if (mode === 'invalid' || mode === 'anonymous') { assert.equal(res.status, mode === 'invalid' ? 401 : 403); assert.equal(providerCalls, 0); }
  else if (mode === 'mismatch') { assert.equal(res.status, 403); assert.equal(saves.length, 0); assert.equal(acknowledgements, 0); }
  else if (mode === 'unbound' || mode === 'db-failure') { assert.equal(res.status, mode === 'unbound' ? 403 : 503); assert.equal(acknowledgements, 0); }
  else if (mode === 'sub-expired' || mode === 'sub-unknown') { assert.equal(res.status, 500); assert.equal(saves.length, 0); }
  else { assert.equal(res.status, 200); assert.equal(saves.length, 1); assert.equal(saves[0]._rows.length, 2); assert.equal(saves[0]._account_bound, true); assert.equal(acknowledgements, 1);
    if (mode === 'notes') assert.equal(Date.parse(data.adfree_until), purchasedAt + 30 * 86400000);
    else assert.equal(Date.parse(data.expires_at), Date.parse(expiry));
  }
}
(async () => { for (const mode of ['invalid', 'anonymous', 'mismatch', 'unbound', 'db-failure', 'notes', 'sub-active', 'sub-expired', 'sub-unknown']) await scenario(mode); console.log('9 Play purchase cases passed: user binding, atomic save failures, original-date bonus, subscription/product validation, grant before acknowledgement.'); })().catch(err => { console.error(err); process.exitCode = 1; });
