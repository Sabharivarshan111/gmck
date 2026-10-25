import { secureEndpoint } from '../_shared/endpointSecurity.ts';
import { json, signedInUser, provider, verifiedPurchase, grantPurchase } from '../_shared/razorpaySecurity.ts';
Deno.serve(secureEndpoint(async (req: Request) => {
  const user = await signedInUser(req);
  if (!user) return json({ error: 'Sign in to restore your purchases.' }, 401);
  const body = await req.json().catch(() => ({}));
  // An interrupted checkout can restore its exact order without scanning the account.
  if (body?.order_id !== undefined) {
    if (typeof body.order_id !== 'string' || !/^order_[A-Za-z0-9]{1,100}$/.test(body.order_id)) return json({ error: 'Invalid order.' }, 400);
    const order = await provider('orders/' + body.order_id);
    if (order?.notes?.user_id !== user.id) return json({ error: 'This order belongs to another account.' }, 403);
    const page = await provider('orders/' + body.order_id + '/payments');
    for (const payment of Array.isArray(page.items) ? page.items : []) {
      const proof = verifiedPurchase(order, payment, user.id);
      if (proof) return grantPurchase(user, order, payment, proof);
    }
    return json({ success: false, restored: false, pending: true, error: 'Payment is not captured yet. Please wait and restore again before paying.' }, 409);
  }
  // Fallback for older checkouts: email narrows candidates, never grants access.
  const from = Math.floor((Date.now() - 60 * 86400000) / 1000);
  for (let skip = 0; skip < 300; skip += 100) {
    const page = await provider(`payments?count=100&skip=${skip}&from=${from}`);
    const items = Array.isArray(page.items) ? page.items : [];
    for (const payment of items) {
      if (payment.status !== 'captured' || payment.captured !== true || payment.currency !== 'INR' ||
          !/^order_[A-Za-z0-9]{1,100}$/.test(payment.order_id ?? '') ||
          String(payment.email ?? '').toLowerCase() !== (user.email ?? '').toLowerCase()) continue;
      const order = await provider('orders/' + payment.order_id);
      const proof = verifiedPurchase(order, payment, user.id);
      if (proof) return grantPurchase(user, order, payment, proof);
    }
    if (items.length < 100) break;
  }
  return json({ success: false, restored: false, error: 'No completed order for this account was found. Contact support for older purchases.' }, 404);
}, { maxBytes: 16 * 1024 }));
