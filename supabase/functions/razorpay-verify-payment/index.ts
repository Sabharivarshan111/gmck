import { secureEndpoint } from '../_shared/endpointSecurity.ts';
import { json, signedInUser, provider, verifiedPurchase, grantPurchase } from '../_shared/razorpaySecurity.ts';
Deno.serve(secureEndpoint(async (req: Request) => {
  const body = await req.json().catch(() => null);
  const orderId = body?.razorpay_order_id, paymentId = body?.razorpay_payment_id, signature = body?.razorpay_signature;
  if (typeof orderId !== 'string' || !/^order_[A-Za-z0-9]{1,100}$/.test(orderId) ||
      typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]{1,100}$/.test(paymentId) ||
      typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return json({ error: 'Invalid payment fields.' }, 400);
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!secret) return json({ error: 'Payment provider unavailable.' }, 503);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = Uint8Array.from(signature.match(/../g)!, (hex: string) => parseInt(hex, 16));
  if (!await crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(`${orderId}|${paymentId}`))) return json({ error: 'Payment signature could not be verified.' }, 400);
  const user = await signedInUser(req);
  if (!user) return json({ error: 'Sign in to verify or restore your payment.' }, 401);
  const [order, payment] = await Promise.all([provider('orders/' + orderId), provider('payments/' + paymentId)]);
  const proof = verifiedPurchase(order, payment, user.id);
  if (!proof) return json({ error: 'The completed payment does not match this account and order.' }, 403);
  return grantPurchase(user, order, payment, proof);
}, { maxBytes: 16 * 1024 }));
