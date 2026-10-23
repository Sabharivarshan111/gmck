import { secureEndpoint } from '../_shared/endpointSecurity.ts';
import { json, PLANS, planFor, signedInUser, provider } from '../_shared/razorpaySecurity.ts';
Deno.serve(secureEndpoint(async (req: Request) => {
  const user = await signedInUser(req);
  if (!user) return json({ error: 'Please sign in on the checkout website before paying.' }, 401);
  const body = await req.json().catch(() => null);
  const key = planFor(body?.plan);
  if (!Object.hasOwn(PLANS, key)) return json({ error: 'Unknown plan.' }, 400);
  // Retired plans remain verifiable/restorable, but cannot be sold again.
  if (!['adfree_6m', 'adfree_1y'].includes(key)) return json({ error: 'This plan is no longer available. Choose the six-month or one-year plan.' }, 400);
  if (Date.now() > new Date('2026-11-30T23:59:59+05:30').getTime()) return json({ error: 'The launch offer has ended. Existing paid access remains valid.' }, 409);
  const plan = PLANS[key];
  const order = await provider('orders', { amount: plan.amount, currency: 'INR',
    receipt: `${key.slice(0, 12)}_${Date.now()}`, notes: { user_id: user.id, purpose: key } });
  if (!/^order_[A-Za-z0-9]+$/.test(order.id) || order.amount !== plan.amount || order.currency !== 'INR') return json({ error: 'Payment provider returned an invalid order.' }, 502);
  return json({ order_id: order.id, amount: order.amount, currency: order.currency,
    key_id: Deno.env.get('RAZORPAY_KEY_ID'), plan: key, label: plan.label, email: user.email ?? '' });
}, { maxBytes: 16 * 1024 }));
