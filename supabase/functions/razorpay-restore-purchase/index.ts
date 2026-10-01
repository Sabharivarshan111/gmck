import { secureEndpoint } from '../_shared/endpointSecurity.ts';
import { json, signedInUser, provider, verifiedPurchase, grantPurchase } from '../_shared/razorpaySecurity.ts';
Deno.serve(secureEndpoint(async (req: Request) => {
  const user = await signedInUser(req);
  if (!user) return json({ error: 'Sign in to restore your purchases.' }, 401);
  // Email narrows candidates only; the verified order owner is decisive.
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
